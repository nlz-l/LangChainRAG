"""ChromaDB 向量存储管理"""
import os
from typing import List, Optional
from langchain_chroma import Chroma
from langchain_core.documents import Document
from app.config import settings
from app.rag.embeddings import get_embeddings

# 全局单例
_vectorstore_instance = None


def get_vectorstore() -> Chroma:
    """获取 ChromaDB 向量存储（单例）"""
    global _vectorstore_instance
    if _vectorstore_instance is None:
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        _vectorstore_instance = Chroma(
            collection_name=settings.CHROMA_COLLECTION_NAME,
            embedding_function=get_embeddings(),
            persist_directory=settings.CHROMA_PERSIST_DIR,
        )
    return _vectorstore_instance


def reset_vectorstore():
    """重置向量存储（用于重建索引）"""
    global _vectorstore_instance
    _vectorstore_instance = None


def add_documents(documents: List[Document], doc_id_prefix: str) -> int:
    """批量添加文档到向量库，返回添加的 chunk 数量"""
    vectorstore = get_vectorstore()
    # 为每个 document 设置唯一 ID，方便后续按文档删除
    ids = [f"{doc_id_prefix}_{i}" for i in range(len(documents))]
    vectorstore.add_documents(documents, ids=ids)
    return len(documents)


def delete_by_doc_prefix(doc_id_prefix: str) -> int:
    """根据文档 ID 前缀删除向量"""
    vectorstore = get_vectorstore()
    collection = vectorstore._collection
    # 获取该文档前缀下的所有 ID
    result = collection.get(where={"doc_id_prefix": doc_id_prefix})
    ids_to_delete = result.get("ids", [])
    if ids_to_delete:
        collection.delete(ids=ids_to_delete)
    return len(ids_to_delete)


def get_collection_stats() -> dict:
    """获取 collection 统计信息"""
    vectorstore = get_vectorstore()
    collection = vectorstore._collection
    count = collection.count()
    # 统计不同文档数
    result = collection.get()
    metadatas = result.get("metadatas", [])
    unique_sources = set()
    for meta in metadatas:
        if meta and "source" in meta:
            unique_sources.add(meta["source"])
    return {
        "total_chunks": count,
        "total_documents": len(unique_sources),
        "documents": sorted(unique_sources),
    }
