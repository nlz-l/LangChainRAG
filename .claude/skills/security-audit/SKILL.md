---
name: security-audit
description: 安全审计 — 检查 FastAPI + React 项目中的敏感信息泄露、Web 安全漏洞和配置风险
---

# 安全审计技能

## 概述

对 RAG 知识库问答系统（FastAPI + React + TypeScript + SQLite/ChromaDB）进行安全审计。

---

## 检查清单

### 1. 🔑 敏感信息泄露

| 检测项 | 匹配模式 | 风险 |
|------|------|:--:|
| 百炼 API Key | `sk-ws-` 开头的真实 Key | 🔴 严重 |
| JWT Secret | `SECRET_KEY` = 默认/示例值 | 🔴 严重 |
| 数据库密码 | `DATABASE_URL` 包含明文密码 | 🔴 严重 |
| 其他 API Key | 字面量字符串形式的 key/token | 🔴 严重 |
| 内网地址 | `192.168.` / `10.0.` 等 | 🟡 注意 |

**排除规则：**
- `.env.example` 中的示例值
- 文档中的示例值
- 空字符串或占位符

### 2. 🌐 Web API 安全（FastAPI）

| 检测项 | 安全配置 | 风险 |
|------|------|:--:|
| CORS `allow_origins=["*"]` | 不应与 `allow_credentials=True` 同时使用 | 🔴 严重 |
| CORS `allow_origins` 范围 | 是否过于宽松 | 🟠 高危 |
| JWT `access_token` 过期时间 | 是否过长（建议 ≤ 2h） | 🟠 高危 |
| 密码存储 | 是否使用 bcrypt（不可逆加密） | 🔴 严重 |
| 速率限制 | 是否配置了 slowapi/限流 | 🟠 高危 |
| 错误信息泄露 | 500 错误是否暴露了内部细节 | 🟡 注意 |
| HTTPS | 生产环境是否强制 HTTPS | 🟡 注意 |
| 请求体大小限制 | 上传接口是否有大小限制 | 🟡 注意 |

### 3. 💉 SQL 注入（Python + SQLAlchemy）

| 检测项 | 说明 | 风险 |
|------|------|:--:|
| 字符串拼接 SQL | `f"SELECT * FROM users WHERE name = '{input}'"` | 🔴 严重 |
| 参数化查询 | 应使用 `select().where(column == value)` | ✅ 安全 |
| 原始 SQL | `text()` 查询是否使用了参数绑定 | 🟠 高危 |

### 4. 🖥️ 前端安全（React）

| 检测项 | 风险 |
|------|:--:|
| `dangerouslySetInnerHTML` | 🔴 严重 |
| `eval()` / `new Function()` | 🔴 严重 |
| localStorage 存储 JWT token | 🟠 高危（建议 httpOnly cookie） |
| 未转义的用户输入渲染 | 🟠 高危 |
| `console.log` 中输出敏感数据 | 🟡 注意 |

### 5. 📁 配置文件安全

| 文件 | 检查内容 |
|------|------|
| `.env` | 是否在 `.gitignore` 中 |
| `backend/.env` | 是否包含真实 API Key |
| `.claude/settings.local.json` | 是否包含敏感路径/凭证 |
| `start.bat` | 是否暴露了环境变量 |

---

## 审计流程

1. **扫描文件** — `.py`、`.ts`、`.tsx`、`.json`、`.env`、`.bat`
   - 排除：`node_modules/`、`venv/`、`__pycache__/`、`.git/`
2. **模式匹配** — 按规则逐项检查
3. **人工确认** — 排除已知安全的用法
4. **生成报告** — 分级输出

---

## 输出格式

```
## 🛡️ 安全审计报告

### 🔴 严重（需立即修复）
| 文件:行号 | 问题 | 详情 |
|------|------|------|
| backend/.env:2 | 真实 API Key | 百炼 API Key 不应提交到仓库 |

### 🟠 高危（建议尽快修复）
| 文件:行号 | 问题 | 详情 |
|------|------|------|
| backend/app/config.py | JWT SECRET_KEY | 使用默认值，生产环境需更换 |

### 🟡 注意
- localStorage 存储 JWT token（HTTP-only cookie 更安全）
- 前端 Console 无敏感数据 ✅

### ✅ 已确认安全
- 密码使用 bcrypt 加密 ✅
- SQL 查询全部参数化 ✅
- CORS 配置了具体 origin ✅
- 上传接口有大小限制 ✅

### 汇总
- 严重：X 个 | 高危：X 个 | 注意：X 个
```
