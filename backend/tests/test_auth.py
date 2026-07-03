"""认证 API 测试"""
import pytest


class TestAuth:
    """用户认证相关测试"""

    async def test_health_check(self, client):
        """健康检查"""
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_login_admin(self, client_with_db):
        """管理员登录成功"""
        resp = await client_with_db.post("/api/auth/login", json={
            "username": "admin",
            "password": "123456",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["username"] == "admin"
        assert data["role"] == "admin"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 50

    async def test_login_wrong_password(self, client_with_db):
        """密码错误"""
        resp = await client_with_db.post("/api/auth/login", json={
            "username": "admin",
            "password": "wrong",
        })
        assert resp.status_code == 401

    async def test_login_nonexistent_user(self, client_with_db):
        """用户不存在"""
        resp = await client_with_db.post("/api/auth/login", json={
            "username": "nobody",
            "password": "123456",
        })
        assert resp.status_code == 401

    async def test_register(self, client_with_db):
        """注册新用户"""
        resp = await client_with_db.post("/api/auth/register", json={
            "username": "newuser",
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "newuser"
        assert data["role"] == "user"
        assert data["is_active"] is True

    async def test_register_duplicate(self, client_with_db):
        """重复注册"""
        await client_with_db.post("/api/auth/register", json={
            "username": "dupuser",
            "password": "pass12345",
        })
        resp = await client_with_db.post("/api/auth/register", json={
            "username": "dupuser",
            "password": "pass12345",
        })
        assert resp.status_code == 400

    async def test_register_short_password(self, client_with_db):
        """密码太短"""
        resp = await client_with_db.post("/api/auth/register", json={
            "username": "shortpw",
            "password": "12345",
        })
        assert resp.status_code == 422  # Pydantic validation

    async def test_get_me(self, client_with_db):
        """获取当前用户信息"""
        login_resp = await client_with_db.post("/api/auth/login", json={
            "username": "admin", "password": "123456",
        })
        token = login_resp.json()["access_token"]

        resp = await client_with_db.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "admin"
        assert data["role"] == "admin"

    async def test_get_me_no_token(self, client_with_db):
        """未带 token 获取用户信息"""
        resp = await client_with_db.get("/api/auth/me")
        assert resp.status_code == 401  # 或 403

    async def test_get_me_invalid_token(self, client_with_db):
        """无效 token"""
        resp = await client_with_db.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid-token-here"
        })
        assert resp.status_code == 401

    async def test_change_password(self, client_with_db):
        """修改密码成功"""
        login_resp = await client_with_db.post("/api/auth/login", json={
            "username": "admin", "password": "123456",
        })
        token = login_resp.json()["access_token"]

        resp = await client_with_db.post("/api/auth/change-password", json={
            "old_password": "123456",
            "new_password": "newpass123",
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

        # 用新密码登录
        resp2 = await client_with_db.post("/api/auth/login", json={
            "username": "admin", "password": "newpass123",
        })
        assert resp2.status_code == 200

    async def test_change_password_wrong_old(self, client_with_db):
        """旧密码错误"""
        login_resp = await client_with_db.post("/api/auth/login", json={
            "username": "admin", "password": "123456",
        })
        token = login_resp.json()["access_token"]

        resp = await client_with_db.post("/api/auth/change-password", json={
            "old_password": "wrongpassword",
            "new_password": "newpass123",
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 400

    async def test_register_and_login(self, client_with_db):
        """注册后立即登录"""
        await client_with_db.post("/api/auth/register", json={
            "username": "reglogin",
            "password": "mypassword",
        })
        resp = await client_with_db.post("/api/auth/login", json={
            "username": "reglogin",
            "password": "mypassword",
        })
        assert resp.status_code == 200
        assert resp.json()["username"] == "reglogin"
        assert resp.json()["role"] == "user"

    async def test_normal_user_cannot_access_admin(self, client_with_db):
        """普通用户无法访问管理接口"""
        # 注册并登录普通用户
        await client_with_db.post("/api/auth/register", json={
            "username": "norole", "password": "mypassword",
        })
        login_resp = await client_with_db.post("/api/auth/login", json={
            "username": "norole", "password": "mypassword",
        })
        token = login_resp.json()["access_token"]

        # 尝试访问知识库管理
        resp = await client_with_db.get("/api/knowledge/stats", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 403
