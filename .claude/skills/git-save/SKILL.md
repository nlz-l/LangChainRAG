---
name: git-save
description: Git 保存 — 将代码变更暂存并提交到本地仓库
---

# Git Save 技能

## 概述

将当前工作区的代码变更 `git add` 并 `git commit` 到本地仓库。

## 执行流程

### 1. 检查工作区状态

```bash
git status --short
```

- 无变更 → 提示退出
- 有变更 → 列出文件清单

### 2. 暂存文件

```bash
git add -A
```

### 3. 生成 Commit Message

根据变更文件自动推断 commit 类型：

| 变更特征 | 类型 | 示例 |
|------|:--:|------|
| 新增功能/文件 | `新增` | `新增：知识库文档搜索功能` |
| 修改/优化 | `更新` | `更新：优化 RAG 检索性能` |
| 修复 bug | `修复` | `修复：JWT sub 字段类型错误` |
| 美化/样式 | `美化` | `美化：登录页玻璃拟态效果` |
| 测试相关 | `测试` | `测试：添加后端 API 单元测试` |
| 仅文档/注释 | `文档` | `文档：更新 CLAUDE.md` |

格式：
```
<类型>：<简要描述>

- 具体变更 1
- 具体变更 2

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 4. 提交

```bash
git commit -m "<生成的 commit message>"
```

## 注意事项

- 不要提交敏感文件（`.env` 中的真实 API Key、`settings.local.json` 中的 token）
- commit message 使用中文
