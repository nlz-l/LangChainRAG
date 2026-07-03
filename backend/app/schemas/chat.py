"""聊天相关 Pydantic 模型"""
from pydantic import BaseModel, Field
from typing import Optional, List


class ChatRequest(BaseModel):
    session_id: int = Field(..., description="会话ID")
    message: str = Field(..., min_length=1, max_length=5000, description="用户问题")


class SourceInfo(BaseModel):
    doc_name: str
    chunk: str
    score: Optional[float] = None


class MessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    sources: Optional[List[SourceInfo]] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class SessionCreate(BaseModel):
    title: str = Field(default="新对话", max_length=200)


class SessionUpdate(BaseModel):
    title: str = Field(..., max_length=200)


class SessionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    message_count: Optional[int] = 0

    model_config = {"from_attributes": True}
