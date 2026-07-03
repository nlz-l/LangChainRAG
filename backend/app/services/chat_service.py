"""问答业务逻辑"""
from typing import List, Dict, AsyncIterator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message import Message
from app.models.session import Session
from app.rag.chain import stream_rag_response, get_source_info
from app.rag.vectorstore import get_vectorstore
from app.config import settings


async def get_chat_history(db: AsyncSession, session_id: int) -> List[Dict]:
    """获取会话历史消息"""
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]


async def save_message(db: AsyncSession, session_id: int, role: str, content: str, sources: List[Dict] = None):
    """保存消息到数据库"""
    message = Message(
        session_id=session_id,
        role=role,
        content=content,
        sources=sources,
    )
    db.add(message)
    await db.flush()
    return message


async def generate_session_title(db: AsyncSession, session: Session, first_question: str) -> str:
    """自动生成会话标题（基于首轮问题，直接用问题前段，即时可靠）"""
    # 直接取问题前20字作为标题，简洁高效
    title = first_question.strip()
    # 去掉常见问句开头
    for prefix in ["请问", "我想问", "我想知道", "帮我", "能不能", "可以"]:
        if title.startswith(prefix):
            title = title[len(prefix):]
    title = title[:20].strip()
    if not title:
        title = "新对话"

    session.title = title
    await db.flush()
    return title


async def stream_qa(
    db: AsyncSession,
    session_id: int,
    question: str,
) -> AsyncIterator[str]:
    """流式问答主流程"""
    # 1. 获取历史
    history = await get_chat_history(db, session_id)

    # 2. 保存用户消息
    await save_message(db, session_id, "user", question)

    # 3. 检查是否是会话第一条消息，自动生成标题
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session and session.title == "新对话" and len(history) == 0:
        await generate_session_title(db, session, question)

    # 4. 检索 + 流式生成
    full_answer = ""
    async for chunk in stream_rag_response(question, history):
        full_answer += chunk
        yield chunk

    # 5. 获取引用来源
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": settings.RETRIEVAL_TOP_K, "fetch_k": settings.RETRIEVAL_TOP_K * 3},
    )
    docs = retriever.invoke(question)
    sources = get_source_info(docs)

    # 6. 保存助手消息
    await save_message(db, session_id, "assistant", full_answer, sources)
