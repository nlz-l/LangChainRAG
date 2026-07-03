"""知识库相关 Pydantic 模型"""
from pydantic import BaseModel, Field
from typing import Optional


class DocumentInfo(BaseModel):
    id: str  # ChromaDB 中的 document_id
    filename: str
    chunk_count: int
    uploaded_at: Optional[str] = None
    file_size_kb: Optional[float] = None


class DocumentSearchResult(BaseModel):
    doc_name: str
    chunk: str
    score: float


class KnowledgeStats(BaseModel):
    total_documents: int
    total_chunks: int
    collection_name: str
