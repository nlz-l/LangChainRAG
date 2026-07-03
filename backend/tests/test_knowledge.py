"""知识库管理 API 测试"""
import pytest
import os


async def get_token(client, username="admin", password="123456") -> str:
    resp = await client.post("/api/auth/login", json={
        "username": username, "password": password,
    })
    return resp.json()["access_token"]


class TestKnowledge:
    """知识库管理相关测试"""

    async def test_get_stats_empty(self, client_with_db):
        """空知识库统计"""
        token = await get_token(client_with_db)
        resp = await client_with_db.get("/api/knowledge/stats",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_documents"] == 0
        assert data["total_chunks"] == 0

    async def test_list_documents_empty(self, client_with_db):
        """空文档列表"""
        token = await get_token(client_with_db)
        resp = await client_with_db.get("/api/knowledge/documents",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["documents"] == []
        assert data["total"] == 0

    async def test_normal_user_cannot_upload(self, client_with_db):
        """普通用户无法上传文档"""
        await client_with_db.post("/api/auth/register", json={
            "username": "normal", "password": "normal123",
        })
        token = await get_token(client_with_db, "normal", "normal123")

        # 创建测试文件
        test_content = "这是一个测试文档内容，用于验证知识库上传功能。"
        files = {"file": ("test.txt", test_content.encode("utf-8"), "text/plain")}
        resp = await client_with_db.post("/api/knowledge/upload",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
        assert resp.status_code == 403

    async def test_admin_can_upload_txt(self, client_with_db):
        """管理员上传 TXT 文档"""
        token = await get_token(client_with_db)

        test_content = "商品信息：iPhone 15 Pro Max，价格9999元，存储容量256GB，颜色深空黑色。"
        files = {"file": ("product.txt", test_content.encode("utf-8"), "text/plain")}
        resp = await client_with_db.post("/api/knowledge/upload",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "doc_id" in data
        assert data["filename"] == "product.txt"
        assert data["chunk_count"] > 0

    async def test_admin_can_upload_md(self, client_with_db):
        """管理员上传 Markdown 文档"""
        token = await get_token(client_with_db)

        md_content = """# 商品说明
## 规格参数
- 品牌: Apple
- 型号: MacBook Pro 14
- 处理器: M4 Pro
- 内存: 24GB
"""
        files = {"file": ("spec.md", md_content.encode("utf-8"), "text/markdown")}
        resp = await client_with_db.post("/api/knowledge/upload",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["filename"] == "spec.md"
        assert data["chunk_count"] > 0

    async def test_upload_unsupported_format(self, client_with_db):
        """上传不支持的文件格式"""
        token = await get_token(client_with_db)

        files = {"file": ("image.png", b"fakeimage", "image/png")}
        resp = await client_with_db.post("/api/knowledge/upload",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
        assert resp.status_code == 400

    async def test_stats_after_upload(self, client_with_db):
        """上传后统计更新"""
        token = await get_token(client_with_db)

        # 上传文档
        files = {"file": ("stats_test.txt", "hello world " * 100, "text/plain")}
        upload_resp = await client_with_db.post("/api/knowledge/upload",
            headers={"Authorization": f"Bearer {token}"}, files=files)
        assert upload_resp.status_code == 200

        # 上传后统计应包含该文档
        stats = await client_with_db.get("/api/knowledge/stats",
            headers={"Authorization": f"Bearer {token}"})
        assert stats.json()["total_documents"] >= 1
        assert stats.json()["total_chunks"] >= 1

    async def test_rebuild_index(self, client_with_db):
        """重建索引"""
        import sys
        if sys.platform == "win32":
            pytest.skip("Windows 下 ChromaDB 文件锁导致跳过")
        token = await get_token(client_with_db)

        resp = await client_with_db.post("/api/knowledge/rebuild",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    async def test_delete_document(self, client_with_db):
        """删除文档"""
        token = await get_token(client_with_db)

        # 上传文档
        files = {"file": ("to_delete.txt", "临时文档内容用于测试删除功能", "text/plain")}
        upload_resp = await client_with_db.post("/api/knowledge/upload",
            headers={"Authorization": f"Bearer {token}"}, files=files)
        assert upload_resp.status_code == 200

        # 删除
        resp = await client_with_db.delete("/api/knowledge/documents/to_delete.txt",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    async def test_knowledge_no_auth(self, client_with_db):
        """未登录访问知识库"""
        resp = await client_with_db.get("/api/knowledge/stats")
        assert resp.status_code == 401
