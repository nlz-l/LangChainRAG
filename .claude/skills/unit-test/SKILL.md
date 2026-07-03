---
name: unit-test
description: 单元测试 — 为 RAG 知识库问答系统编写和运行自动化测试
---

# 单元测试技能

## 概述

为 RAG 企业知识库问答系统（FastAPI + React + TypeScript）编写和运行单元测试。

## 测试框架

| 端 | 框架 | 说明 |
|---|------|------|
| **后端** | pytest + httpx + pytest-asyncio | FastAPI 异步测试 |
| **前端** | vitest + @testing-library/react | React 组件测试 |

## 后端测试（pytest）

### 安装

```bash
cd backend
pip install pytest pytest-asyncio httpx pytest-cov
```

### 配置

`backend/pytest.ini`:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
asyncio_mode = auto
```

### 测试结构

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # fixtures (app client, test db)
│   ├── test_auth.py         # 认证 API 测试
│   ├── test_chat.py         # 问答 API 测试
│   ├── test_sessions.py     # 会话 API 测试
│   └── test_knowledge.py    # 知识库 API 测试
```

### 编写规范

```python
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

## 前端测试（vitest）

### 安装

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 配置

`frontend/vitest.config.ts`

### 测试结构

```
frontend/src/
├── pages/
│   ├── Login.tsx
│   └── Login.test.tsx
├── components/
│   ├── ChatMessage.tsx
│   └── ChatMessage.test.tsx
```

## 运行命令

```bash
# 后端
cd backend && pytest tests/ -v

# 前端
cd frontend && npx vitest run

# 覆盖率
cd backend && pytest tests/ --cov=app --cov-report=html
cd frontend && npx vitest run --coverage
```
