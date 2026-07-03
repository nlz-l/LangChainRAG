"""测试 fixtures - 必须在导入 app 模块之前设置环境变量"""
import os

# 必须在 IMPORT 任何 app 模块之前设置环境变量
os.environ["DASHSCOPE_API_KEY"] = "test-key"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing"
os.environ["CHROMA_PERSIST_DIR"] = "./chroma_db_test"  # 测试专用目录

# 现在才能安全地导入 app 模块
from app.config import settings
settings.DATABASE_URL = "sqlite+aiosqlite:///:memory:"
settings.SECRET_KEY = "test-secret-key-for-testing"
settings.CHROMA_PERSIST_DIR = "./chroma_db_test"

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import patch, MagicMock
import numpy as np


class FakeEmbeddings:
    """假 Embedding，返回随机向量，不调用 API"""
    def embed_documents(self, texts):
        return [np.random.randn(1024).tolist() for _ in texts]

    def embed_query(self, text):
        return np.random.randn(1024).tolist()


@pytest.fixture(autouse=True)
def mock_embeddings():
    """自动 mock 所有测试的 embedding 和 LLM 调用"""
    # Patch DashScopeEmbeddings 类，阻止真实 API 调用
    with patch("langchain_community.embeddings.dashscope.DashScopeEmbeddings", FakeEmbeddings):
        # 同时 patch ChatTongyi 防止聊天测试触发真实 LLM 调用
        with patch("langchain_community.chat_models.tongyi.ChatTongyi"):
            # Patch 全局实例
            import app.rag.embeddings as emb_module
            emb_module._embedding_instance = FakeEmbeddings()
            yield


@pytest.fixture(autouse=True)
def mock_chat_tongyi():
    """自动 mock LLM 调用"""
    with patch("app.rag.chain.ChatTongyi") as mock:
        yield mock


@pytest.fixture
async def client():
    """创建测试 HTTP 客户端（无独立数据库重置）"""
    from app.main import app
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
async def client_with_db():
    """创建带数据库的测试客户端（每次测试独立数据库）"""
    import shutil
    from app.database import engine, Base
    from app.main import app as fastapi_app
    from app.services.auth_service import init_admin_user
    from app.rag.vectorstore import reset_vectorstore

    # 重置 vectorstore 单例
    reset_vectorstore()

    # 清理旧测试 ChromaDB
    test_chroma = settings.CHROMA_PERSIST_DIR
    if os.path.exists(test_chroma):
        try:
            shutil.rmtree(test_chroma)
        except PermissionError:
            pass

    # 重建数据库表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await init_admin_user()

    # 确保上传目录存在
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app),
        base_url="http://test"
    ) as ac:
        yield ac

    # 清理
    reset_vectorstore()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    if os.path.exists(test_chroma):
        try:
            shutil.rmtree(test_chroma, ignore_errors=True)
        except PermissionError:
            pass
