"""RAG 核心链 - 检索增强生成"""
from typing import List, AsyncIterator, Dict
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_models import ChatTongyi
from app.config import settings
from app.rag.vectorstore import get_vectorstore

# RAG Prompt - 电商客服场景
RAG_SYSTEM_PROMPT = """你是一个专业的电商客服助手，专门回答关于商品的问题。

请严格根据以下知识库参考内容回答用户问题：
- 如果知识库中有相关信息，请详细准确地回答，并在引用知识库内容时使用 [来源: 文档名] 标记
- 如果知识库中没有相关信息，请如实告知用户"抱歉，当前知识库中暂无该商品的相关信息"，不要编造任何答案
- 回答时保持专业、礼貌、简洁

知识库参考内容：
{context}"""


def format_docs(docs) -> str:
    """将检索到的文档格式化为上下文"""
    formatted = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "未知")
        formatted.append(f"[参考{i} - {source}]\n{doc.page_content}")
    return "\n\n".join(formatted)


def get_rag_chain():
    """构建 RAG 链（用于同步调用）"""
    llm = ChatTongyi(
        model=settings.LLM_MODEL,
        dashscope_api_key=settings.DASHSCOPE_API_KEY,
        temperature=0.3,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", RAG_SYSTEM_PROMPT),
        ("human", "{question}"),
    ])

    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": settings.RETRIEVAL_TOP_K, "fetch_k": settings.RETRIEVAL_TOP_K * 3},
    )

    # 构建链
    chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain, retriever


async def stream_rag_response(
    question: str,
    chat_history: List[Dict] = None,
) -> AsyncIterator[str]:
    """流式 RAG 响应生成器"""
    # 1. 检索相关文档
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": settings.RETRIEVAL_TOP_K, "fetch_k": settings.RETRIEVAL_TOP_K * 3},
    )
    docs = retriever.invoke(question)
    context = format_docs(docs)

    # 2. 构建消息列表
    llm = ChatTongyi(
        model=settings.LLM_MODEL,
        dashscope_api_key=settings.DASHSCOPE_API_KEY,
        temperature=0.3,
        streaming=True,
    )

    messages = [
        ("system", RAG_SYSTEM_PROMPT.format(context=context)),
    ]

    # 添加最近 6 轮历史（12条消息）
    if chat_history:
        recent = chat_history[-12:]
        for msg in recent:
            if msg.get("role") == "user":
                messages.append(("human", msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(("ai", msg["content"]))

    messages.append(("human", question))

    prompt = ChatPromptTemplate.from_messages(messages)
    chain = prompt | llm | StrOutputParser()

    # 3. 流式生成
    full_response = ""
    async for chunk in chain.astream({}):
        full_response += chunk
        yield chunk

    # 在日志中记录完整响应与来源
    # 这里通过最后一个 chunk 后发送来源信息
    # 前端通过单独的 sources 字段获取


def get_source_info(docs) -> List[dict]:
    """从检索到的文档中提取引用来源信息"""
    sources = []
    seen = set()
    for doc in docs:
        source = doc.metadata.get("source", "未知")
        chunk_preview = doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
        key = f"{source}_{chunk_preview[:50]}"
        if key not in seen:
            seen.add(key)
            sources.append({
                "doc_name": source,
                "chunk": chunk_preview,
                "score": doc.metadata.get("score", None),
            })
    return sources[:5]  # 最多 5 个引用
