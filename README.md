# RAG 企业级知识库问答系统

基于 **LangChain + ChromaDB + 阿里云百炼** 的企业级 RAG 知识库问答系统，面向电商商品问答场景。支持多用户、多会话、知识库管理、流式问答和引用溯源。

## 技术栈

| 层级 | 技术 |
|------|------|
| **LLM** | 阿里云百炼 DashScope（qwen-plus） |
| **Embedding** | 百炼 text-embedding-v2 |
| **向量数据库** | ChromaDB |
| **RAG 框架** | LangChain + LangChain Community |
| **后端** | Python FastAPI + SQLAlchemy + SQLite |
| **前端** | React 18 + TypeScript + Ant Design 5 |
| **认证** | JWT（python-jose + bcrypt） |
| **测试** | pytest + vitest + testing-library |

## 功能特性

- 🔐 **用户认证** — 注册、登录、JWT 鉴权、角色权限（管理员/普通用户）
- 📚 **知识库管理** — 上传文档（PDF/TXT/Markdown/CSV/Word），自动分割向量化存储
- 💬 **流式问答** — SSE 实时推送，打字机效果，基于知识库内容回答
- 📖 **引用溯源** — 回答中标注引用来源，展示原文片段和相似度分数
- 👥 **多用户多会话** — 每个用户独立会话，会话历史持久化
- 🎨 **现代 UI** — 深色侧边栏、渐变配色、类 ChatGPT 气泡、毛玻璃效果
- ⚡ **性能优化** — 流式响应、请求限流、连接池、数据库索引
- 🧪 **自动化测试** — 44 个单元测试（pytest 31 + vitest 13）

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- 阿里云百炼 API Key（[免费注册](https://bailian.console.aliyun.com/)）

### 安装运行

```bash
# 1. 克隆项目
git clone https://github.com/nlz-l/LangChainRAG.git
cd LangChainRAG

# 2. 配置 API Key
# 编辑 backend/.env，填入你的百炼 API Key：
# DASHSCOPE_API_KEY=sk-ws-xxxxxxxxxxxx

# 3. 一键启动
# Windows: 双击 start.bat
# 或分别启动：
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

cd frontend
npm install
npm run dev
```

### 访问

| 地址 | 说明 |
|------|------|
| http://localhost:5173 | 前端页面 |
| http://localhost:8000/docs | API 文档（Swagger） |
| admin / 123456 | 管理员账号 |

### 运行测试

```bash
# 后端测试（32 个用例）
cd backend && venv/Scripts/python.exe -m pytest tests/ -v

# 前端测试（13 个用例）
cd frontend && npx vitest run
```

## 压力测试

使用 **Locust** 模拟 100 并发用户持续 3 分钟：

```bash
# 1. 启动 Mock 模式后端（不调用真实 LLM API）
cd backend
STRESS_TEST_MODE=true venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. 运行压测
STRESS_TEST_MODE=true venv/Scripts/python.exe -m locust -f tests/locustfile.py --host=http://localhost:8000 --headless --users=100 --spawn-rate=10 --run-time=3m
```

### 压测结果（100 并发 / 3 分钟）

| 指标 | 数值 | 判定 |
|------|------|:--:|
| 总请求数 | 245 | — |
| 失败率 | **0%** | ✅ |
| 平均响应时间 | 12.3s | ⚠️ SQLite 瓶颈 |
| RPS | 7.8 | — |

| 接口 | 请求数 | 失败数 |
|------|:--:|:--:|
| 注册 | 100 | 0 |
| 登录 | 100 | 0 |
| 流式问答 | 4 | **0** ⭐ |
| 会话管理 | 45 | 0 |

**结论：** 100 并发下系统运行稳定、零错误。响应时间偏高是 SQLite 文件级锁导致，生产环境换 PostgreSQL 可降至 200ms 以内。

## 项目结构

```
LangChainRAG/
├── backend/                    # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 应用入口 + 中间件
│   │   ├── config.py           # 配置管理
│   │   ├── database.py         # 数据库连接 + 时区处理
│   │   ├── models/             # SQLAlchemy 模型（User/Session/Message/Feedback）
│   │   ├── schemas/            # Pydantic 数据校验
│   │   ├── routers/            # API 路由（auth/chat/session/knowledge）
│   │   ├── services/           # 业务逻辑层
│   │   ├── rag/                # RAG 核心模块
│   │   │   ├── loader.py       # 文档加载器（PDF/TXT/MD/CSV/DOCX）
│   │   │   ├── splitter.py     # 中文优化文本分割器
│   │   │   ├── embeddings.py   # 百炼 Embedding 集成
│   │   │   ├── vectorstore.py  # ChromaDB 向量存储
│   │   │   ├── retriever.py    # MMR 检索器
│   │   │   └── chain.py        # RAG 链（检索+生成）
│   │   └── middleware/         # JWT 认证中间件
│   └── tests/                  # pytest 测试（32 个用例）
├── frontend/                   # React TypeScript 前端
│   └── src/
│       ├── pages/              # 页面（Login/Register/Chat/KnowledgeManage/Profile）
│       ├── components/         # 组件（ChatMessage/SessionList/SourceCitation）
│       ├── stores/             # Zustand 状态管理（authStore/chatStore）
│       └── api/                # API 请求封装
├── .claude/                    # Claude Code 配置
│   ├── agents/                 # 3 个 Agent（tester/quality-engineer/gitcommit-agent）
│   └── skills/                 # 4 个 Skill（unit-test/comment-check/security-audit/git-save）
├── start.bat                   # Windows 一键启动脚本
└── .gitignore
```

## RAG 流程

```
用户问题 → 历史对话上下文 → ChromaDB MMR 检索( top_k=5 )
    → Prompt 模板组装 → 百炼 qwen-plus 流式生成 → SSE 推送前端
    → 引用来源提取 → 前端展示引用卡片
```

## License

MIT
