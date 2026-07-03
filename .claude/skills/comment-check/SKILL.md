---
name: comment-check
description: 注释检查 — 检查 Python 和 TypeScript 代码注释是否完整
---

# 注释检查技能

## 概述

检查 RAG 知识库问答系统代码中的注释完整度，确保代码可读性和可维护性。

## 注释标准

### 1. Python 函数注释（必须）

每个函数必须有 docstring：

```python
async def generate_session_title(db: AsyncSession, session: Session, first_question: str) -> str:
    """自动生成会话标题，基于首轮问题截取前20字"""
    title = first_question.strip()[:20]
    ...
```

复杂函数需要更详细的 docstring：
```python
async def stream_qa(db: AsyncSession, session_id: int, question: str) -> AsyncIterator[str]:
    """
    流式问答主流程。

    1. 获取对话历史
    2. 保存用户消息
    3. 检索知识库 + LLM 流式生成
    4. 保存 AI 回复和引用来源

    Args:
        db: 数据库会话
        session_id: 会话 ID
        question: 用户问题

    Yields:
        流式生成的文本片段
    """
```

### 2. TypeScript 函数注释（必须）

```tsx
/**
 * 发送消息并处理流式响应
 *
 * @param sessionId - 目标会话 ID，为 null 时自动创建
 * @param message - 用户输入的消息文本
 * @returns AI 助手的完整回复内容
 */
const handleSend = async (sessionId: number | null, message: string): Promise<string> => {
  // ...
}
```

### 3. 核心逻辑注释（必须）

```python
# SQLite 默认不开启外键约束，需要手动执行 PRAGMA
# 否则 CASCADE DELETE 不会生效，导致消息残留
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()
```

### 4. 组件注释（建议）

```tsx
/**
 * 知识库问答聊天界面
 *
 * 左侧：会话列表（SessionList）
 * 右侧：消息区 + 输入框
 * 支持流式打字效果、引用来源展示、消息反馈
 */
export default function Chat() {
```

---

## 检查流程

1. **扫描文件** — 找到所有 `.py` / `.ts` / `.tsx` 文件（排除 `node_modules`、`venv`、`dist`、`__pycache__`）
2. **逐函数检查** — 每个函数是否有 docstring/JSDoc
3. **核心逻辑检查** — 复杂逻辑是否有说明性注释
4. **生成报告** — 输出缺失注释的位置

---

## 输出格式

```
## 注释检查报告

### Python 后端
✅ app/services/chat_service.py — stream_qa、generate_session_title
⚠️  app/routers/knowledge.py — rebuild_index 缺少核心逻辑说明

### TypeScript 前端
✅ src/stores/chatStore.ts — sendMessage 有 JSDoc
⚠️  src/components/ChatMessage.tsx — handleFeedback 缺注释

### 汇总
- 检查文件：18 个
- 函数总数：67 个
- 注释完整：52 个 (78%)
- 缺少注释：15 个 (22%)
```
