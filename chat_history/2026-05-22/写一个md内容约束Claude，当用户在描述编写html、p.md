---
title: 任务: 写一个md内容约束Claude，当用户在描述编写html、p
date: 2026/05/22 16:52:08
sessionId: b9c9b050-74e3-48d9-8c17-e37efa5ac149
model: unknown
tags:
  - claude-code
  - conversation
---

# 任务: 写一个md内容约束Claude，当用户在描述编写html、p

**日期**: 2026/05/22 16:52:08
**会话 ID**: `b9c9b050-74e3-48d9-8c17-e37efa5ac149`
**模型**: unknown

---


## 👤 用户问题

**时间**: 2026/05/22 16:52:08

帮我写一个md内容约束Claude，当用户在描述编写html、ppt、报告文件时，就来到UI-lib文件夹并参考


---


## 🤖 Claude 回答

**时间**: 2026/05/22 16:54:09

让我先了解一下 UI-lib 文件夹的内容和现有的 CLAUDE.md 配置。

让我再了解一下关键文件的内容。

现在我对 UI-lib 的结构有了全面了解。让我为 UI-lib 编写 `.claude.md` 约束文件。

还需要在根目录的 CLAUDE.md 中添加路由规则，确保 Claude 在遇到 HTML/PPT/报告类请求时自动转到 UI-lib。

已完成。创建/更新了两个文件：

**1. [UI-lib/.claude.md](UI-lib/.claude.md)** — UI-lib 组件库的完整约束文件，包含：
- 触发场景定义（HTML、PPT、报告文件等）
- 资源层级说明（tokens → components → charts → skeletons → templates）
- 四步工作流程（选骨架 → 选主题 → 选组件 → 参考案例）
- 技术栈约束（Tailwind CSS + Vue 3 CDN、单文件 HTML、@page 打印控制）
- 禁止事项（不手写布局、不在 UI-lib 外新建文件等）

**2. [.claude/CLAUDE.md](.claude/CLAUDE.md)** — 根目录约束文件新增路由规则，当用户提到 HTML/PPT/报告时，要求 Claude 必须先读取 UI-lib 的约束并从中选取资源。

---

## 📋 会话总结

**结束时间**: 2026/05/22 16:54:09
**总问题数**: 1
**总回答数**: 1

---

