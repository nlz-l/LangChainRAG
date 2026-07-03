"""检索器"""
from typing import List, Tuple
from langchain_core.documents import Document
from app.config import settings
from app.rag.vectorstore import get_vectorstore


def retrieve(query: str, top_k: int = None) -> List[Tuple[Document, float]]:
    """检索相关文档片段，返回 (Document, score) 列表"""
    k = top_k or settings.RETRIEVAL_TOP_K
    vectorstore = get_vectorstore()

    # MMR（最大边际相关性）检索，兼顾相关性和多样性
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": k, "fetch_k": k * 3},
    )
    docs = retriever.invoke(query)

    # 获取相似度分数
    results_with_scores = []
    for doc in docs:
        # ChromaDB 的相似度分数通过 _collection.query 获取
        score = doc.metadata.get("score", None)
        results_with_scores.append((doc, score))

    return results_with_scores


def retrieve_with_scores(query: str, top_k: int = None) -> List[dict]:
    """检索并返回带分数的结果"""
    k = top_k or settings.RETRIEVAL_TOP_K
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": k, "score_threshold": 0.3},
    )
    docs = retriever.invoke(query)

    results = []
    for doc in docs:
        results.append({
            "doc_name": doc.metadata.get("source", "未知"),
            "chunk": doc.page_content,
            "score": doc.metadata.get("score", 0),
        })
    return results
