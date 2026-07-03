"""会话管理 API 测试"""
import pytest


async def get_token(client) -> str:
    """获取管理员 token"""
    resp = await client.post("/api/auth/login", json={
        "username": "admin", "password": "123456",
    })
    return resp.json()["access_token"]


class TestSessions:
    """会话管理相关测试"""

    async def test_create_session(self, client_with_db):
        """创建会话"""
        token = await get_token(client_with_db)
        resp = await client_with_db.post("/api/sessions/", json={
            "title": "测试会话"
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "测试会话"
        assert data["id"] > 0
        assert data["message_count"] == 0

    async def test_create_session_default_title(self, client_with_db):
        """创建会话使用默认标题"""
        token = await get_token(client_with_db)
        resp = await client_with_db.post("/api/sessions/", json={},
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "新对话"

    async def test_list_sessions_empty(self, client_with_db):
        """空会话列表"""
        token = await get_token(client_with_db)
        resp = await client_with_db.get("/api/sessions/",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_sessions(self, client_with_db):
        """列出会话"""
        token = await get_token(client_with_db)
        # 创建两个会话
        await client_with_db.post("/api/sessions/", json={"title": "A"},
            headers={"Authorization": f"Bearer {token}"})
        await client_with_db.post("/api/sessions/", json={"title": "B"},
            headers={"Authorization": f"Bearer {token}"})

        resp = await client_with_db.get("/api/sessions/",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        titles = {s["title"] for s in data}
        assert titles == {"A", "B"}

    async def test_update_session(self, client_with_db):
        """重命名会话"""
        token = await get_token(client_with_db)
        create_resp = await client_with_db.post("/api/sessions/", json={"title": "旧标题"},
            headers={"Authorization": f"Bearer {token}"})
        session_id = create_resp.json()["id"]

        resp = await client_with_db.put(f"/api/sessions/{session_id}", json={
            "title": "新标题"
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    async def test_delete_session(self, client_with_db):
        """删除会话"""
        token = await get_token(client_with_db)
        create_resp = await client_with_db.post("/api/sessions/", json={"title": "待删除"},
            headers={"Authorization": f"Bearer {token}"})
        session_id = create_resp.json()["id"]

        resp = await client_with_db.delete(f"/api/sessions/{session_id}",
            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

        # 验证已删除
        list_resp = await client_with_db.get("/api/sessions/",
            headers={"Authorization": f"Bearer {token}"})
        assert len(list_resp.json()) == 0

    async def test_cannot_access_other_user_session(self, client_with_db):
        """用户隔离：不能访问其他用户的会话"""
        # 管理员创建会话
        admin_token = await get_token(client_with_db)
        create_resp = await client_with_db.post("/api/sessions/", json={"title": "admin的"},
            headers={"Authorization": f"Bearer {admin_token}"})
        session_id = create_resp.json()["id"]

        # 注册新用户
        await client_with_db.post("/api/auth/register", json={
            "username": "other", "password": "other123",
        })
        login_resp = await client_with_db.post("/api/auth/login", json={
            "username": "other", "password": "other123",
        })
        other_token = login_resp.json()["access_token"]

        # 尝试访问 admin 的会话
        resp = await client_with_db.get(f"/api/chat/messages/{session_id}",
            headers={"Authorization": f"Bearer {other_token}"})
        assert resp.status_code == 403

    async def test_session_unauthenticated(self, client_with_db):
        """未登录访问会话"""
        resp = await client_with_db.get("/api/sessions/")
        assert resp.status_code == 401
