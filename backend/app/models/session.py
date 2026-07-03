"""会话模型"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base, now_cst


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False, default="新对话")
    created_at = Column(DateTime, default=now_cst)
    updated_at = Column(DateTime, default=now_cst, onupdate=now_cst)

    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, title={self.title})>"
