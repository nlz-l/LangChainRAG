"""
RAG 知识库问答系统 — 压力测试脚本
用法: STRESS_TEST_MODE=true locust -f tests/locustfile.py --host=http://localhost:8000
"""
import random
import string
import json
from locust import HttpUser, task, between, events


def random_username():
    return f"stress_{''.join(random.choices(string.ascii_lowercase, k=6))}"


class RAGUser(HttpUser):
    """模拟真实用户行为 — 登录 → 会话管理 → 问答"""
    wait_time = between(1, 5)  # 用户操作间隔 1-5 秒

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.token = None
        self.username = None
        self.session_id = None

    def on_start(self):
        """每个用户启动时：注册 + 登录"""
        self.username = random_username()
        password = "test123456"

        # 注册（忽略已存在的用户名）
        resp = self.client.post("/api/auth/register", json={
            "username": self.username,
            "password": password,
        })
        # 注册失败（用户名已存在），直接用 admin 登录
        if resp.status_code == 400:
            self.username = "admin"
            password = "123456"

        # 登录
        with self.client.post("/api/auth/login", json={
            "username": self.username,
            "password": password,
        }, catch_response=True) as resp:
            if resp.status_code == 200:
                self.token = resp.json()["access_token"]
            else:
                # 最终兜底：直接调 API 不需要 token（有些接口公开）
                self.token = None

        # 创建会话
        if self.token:
            resp = self.client.post("/api/sessions/", json={"title": "压测"},
                headers=self._auth_headers())
            if resp.status_code == 200:
                self.session_id = resp.json()["id"]

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    # ===== 认证场景 (权重 20) =====

    @task(10)
    def get_me(self):
        if not self.token:
            return
        self.client.get("/api/auth/me", headers=self._auth_headers())

    @task(5)
    def login_again(self):
        self.client.post("/api/auth/login", json={
            "username": self.username or "admin",
            "password": "test123456",
        })

    # ===== 会话场景 (权重 30) =====

    @task(15)
    def list_sessions(self):
        if not self.token:
            return
        with self.client.get("/api/sessions/", headers=self._auth_headers(),
            catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"List sessions failed: {resp.status_code}")

    @task(10)
    def get_messages(self):
        if not self.token or not self.session_id:
            return
        self.client.get(f"/api/chat/messages/{self.session_id}",
            headers=self._auth_headers())

    @task(5)
    def create_session(self):
        if not self.token:
            return
        with self.client.post("/api/sessions/", json={"title": "新对话"},
            headers=self._auth_headers(),
            catch_response=True) as resp:
            if resp.status_code == 200:
                self.session_id = resp.json().get("id")

    # ===== 问答场景 (权重 40) ⭐ =====

    @task(40)
    def ask_question(self):
        if not self.token or not self.session_id:
            return
        questions = [
            "这个商品的质量怎么样？",
            "请问有什么优惠活动吗？",
            "可以退换货吗？",
            "这个产品有没有保修？",
            "什么时候发货？",
            "有没有其他颜色可选？",
            "可以帮我对比一下这两款吗？",
            "支持哪些支付方式？",
        ]
        question = random.choice(questions)

        with self.client.post("/api/chat/stream", json={
            "session_id": self.session_id,
            "message": question,
        }, headers={**self._auth_headers(), "Accept": "text/event-stream"},
            catch_response=True, timeout=30) as resp:
            if resp.status_code == 200:
                # SSE 流式接口正常返回即算成功
                pass
            else:
                resp.failure(f"Chat stream failed: {resp.status_code}")

    # ===== 知识库场景 (权重 10) =====

    @task(8)
    def knowledge_stats(self):
        if not self.token:
            return
        # 403 是正常的（非管理员），不算失败
        with self.client.get("/api/knowledge/stats", headers=self._auth_headers(),
            catch_response=True) as resp:
            if resp.status_code == 403:
                resp.success()

    @task(2)
    def list_documents(self):
        if not self.token:
            return
        with self.client.get("/api/knowledge/documents", headers=self._auth_headers(),
            catch_response=True) as resp:
            if resp.status_code == 403:
                resp.success()


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("=" * 50)
    print("  RAG 知识库系统压力测试")
    print("  Mock 模式: 不调用真实 LLM API")
    print("=" * 50)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.stats
    print("=" * 50)
    print("  压力测试完成")
    print(f"  总请求数: {stats.total.num_requests}")
    print(f"  失败数: {stats.total.num_failures}")
    print(f"  平均响应时间: {stats.total.avg_response_time:.0f}ms")
    print(f"  P50: {stats.total.get_response_time_percentile(0.5):.0f}ms")
    print(f"  P95: {stats.total.get_response_time_percentile(0.95):.0f}ms")
    print(f"  P99: {stats.total.get_response_time_percentile(0.99):.0f}ms")
    print(f"  RPS: {stats.total.total_rps:.1f}")
    print("=" * 50)
