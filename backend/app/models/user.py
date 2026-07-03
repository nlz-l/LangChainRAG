"""用户模型"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base, now_cst


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    role = Column(String(20), nullable=False, default="user")  # admin / user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_cst)
    updated_at = Column(DateTime, default=now_cst, onupdate=now_cst)

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
