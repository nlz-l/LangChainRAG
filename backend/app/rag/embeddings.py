"""向量化 - 阿里云百炼 DashScope Embedding"""
from langchain_community.embeddings import DashScopeEmbeddings
from app.config import settings

# 全局单例，避免重复初始化
_embedding_instance = None


def get_embeddings() -> DashScopeEmbeddings:
    """获取 Embedding 实例（单例）"""
    global _embedding_instance
    if _embedding_instance is None:
        _embedding_instance = DashScopeEmbeddings(
            model=settings.EMBEDDING_MODEL,
            dashscope_api_key=settings.DASHSCOPE_API_KEY,
        )
    return _embedding_instance
