"""应用配置管理"""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # 阿里云百炼 DashScope
    DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")
    LLM_MODEL: str = "qwen-plus"           # qwen-plus / qwen-max / qwen-turbo
    EMBEDDING_MODEL: str = "text-embedding-v2"

    # 数据库
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./rag_system.db")
    DATABASE_URL_SYNC: str = os.getenv("DATABASE_URL_SYNC", "sqlite:///./rag_system.db")

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CHROMA_COLLECTION_NAME: str = "knowledge_base"

    # 文档
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    # 检索
    RETRIEVAL_TOP_K: int = 5

    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120    # 2小时
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7         # 7天

    # Redis (可选)
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # 压力测试 Mock 模式（不调用真实 LLM/Embedding API）
    STRESS_TEST_MODE: bool = os.getenv("STRESS_TEST_MODE", "").lower() in ("true", "1", "yes")

    # 限流
    RATE_LIMIT_GLOBAL: str = "30/minute"
    RATE_LIMIT_CHAT: str = "10/minute"

    # 管理员预设
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "123456"

    # 服务
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
