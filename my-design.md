# UI 组件库 · 设计规格文档

> 版本: v2.0 | 2026-05-22 | Claude Code 原生方案
> v1.0（已废弃）基于 iframe + report 提示词工具双系统；v2.0 去掉 report 中转层，直接通过 CLAUDE.md 驱动 Claude Code 读取组件库生成页面。

---

## 一、核心理念

**组件库 = 乐高积木，CLAUDE.md = 说明书，用户需求 = 自然语言描述。**

用户只需在项目目录下打开 Claude Code，用自然语言描述需求（"我要一个A4横版商务蓝白主题的货币基金分析报告"），Claude 自动遵循 CLAUDE.md 的约束，从 UI-lib 中选取骨架、主题和组件，组装生成页面。无需任何中间工具页面。

```
用户在项目根目录打开 Claude Code
  → 自动读取 .claude/CLAUDE.md
    → 触发规则：涉及 HTML/PPT/报告时，必须读 UI-lib/.claude.md
      → UI-lib/.claude.md 定义完整的 选骨架→选主题→选组件→组装 流程
        → Claude 自动读取对应文件，生成页面
```

---

## 二、目录结构

```
AIProject/
├── .claude/
│   ├── CLAUDE.md                    # 项目根指令（触发 UI-lib 约束）
│   ├── settings.local.json          # 权限 + hooks 配置
│   └── hooks/                       # 对话保存系统
│       ├── save-conversation.cjs    # 保存对话到 chat_history/
│       ├── session-tracker.cjs      # 会话状态追踪
│       └── utils.cjs                # 工具函数
│
├── UI-lib/                          # 组件库核心
│   ├── .claude.md                   # ★ 组件库约束文档（Claude Code 自动读取）
│   ├── index.html                   # 组件预览页（开发用，人工浏览）
│   ├── manifest.json                # 组件注册表（菜单树、路径、meta 引用）
│   ├── tokens/                      # 3 套 Design Token CSS
│   │   ├── business-bluewhite.css
│   │   ├── rc-lightblue.css
│   │   └── dark-tech.css
│   ├── components/                  # 业务组件（每个目录含 .html + .meta.json）
│   │   ├── stat-card/               # 数据卡片
│   │   ├── timeline/                # 时间线
│   │   ├── process-step/            # 流程步骤
│   │   ├── circle-number/           # 圆形编号
│   │   ├── badge-tag/               # 标签徽章
│   │   ├── data-table/              # 数据表格
│   │   └── hero-card/               # 封面卡片
│   ├── charts/                      # 图表组件
│   │   ├── bar-chart/               # 柱状图（ECharts）
│   │   └── timeline-chart/          # 时间线图（ECharts）
│   ├── skeletons/                   # 版式骨架（页面结构框架）
│   │   ├── a4-landscape-skeleton.html
│   │   ├── slide-deck-skeleton.html
│   │   └── scroll-page-skeleton.html
│   ├── templates/                   # 完整案例（骨架 + 组件 + 主题的组装成品）
│   │   ├── combo-a4-bluewhite.html
│   │   ├── combo-slide-rc.html
│   │   ├── combo-scroll-dark.html
│   │   └── pe-training-a4-bluewhite.html
│   └── previews/
│       └── token-preview.html       # Token 色板预览
│
├── config.cjs                        # Hook 配置文件
├── my-design.md                      # 本文件
└── chat_history/                     # 对话历史（自动生成）
```

---

## 三、资源层级

```
tokens/        → 主题 CSS 变量（颜色、字体、间距、圆角、阴影）
components/    → 可复用的业务组件（自包含 HTML，独立可运行）
charts/        → 图表组件（基于 ECharts 5）
skeletons/     → 版式骨架（页面结构，含 @media print、@page 等打印控制）
templates/     → 完整案例（few-shot 参考，展示组装方式）
```

### 3.1 tokens/ — 主题层

每个主题 CSS 文件定义了一套 CSS 自定义属性：

- 色板：`--primary-50` ~ `--primary-900`，`--surface`，`--bg`，`--border` 等
- 字体：`--font`，`--font-display`
- 圆角：`--radius-card`，`--radius-tag`，`--radius-circle`
- 阴影：`--shadow-card`
- 语义色：`--accent-green`，`--accent-red`，`--accent-amber`
- 组件专用变量：`--big-number`，`--process-border`，`--table-th-bg` 等

主题切换通过替换 `<link id="token-css" href="...">` 的 href 实现。

### 3.2 components/ — 组件层

每个组件是独立目录：

```
stat-card/
├── stat-card.html        ← 完整组件（含 <style> 和 <script>）
└── stat-card.meta.json   ← 元信息（props/slots/usage/promptHint）
```

**组件必须遵守的约定：**
- 单文件自包含，可双击直接在浏览器打开
- 使用 CSS 变量引用颜色：`color: var(--primary-500)`
- 通过 `<link id="token-css" rel="stylesheet" href="../../tokens/xxx.css">` 引用主题
- 支持 URL 参数 `?theme=xxx` 切换主题（用于 index.html 预览）
- 支持 postMessage 主题切换（用于 index.html 预览时的实时切换）

### 3.3 meta.json 规范

```json
{
  "name": "stat-card",
  "label": "数据卡片",
  "category": "基础组件",
  "description": "单指标数据卡片，支持标题、数值、趋势箭头",
  "props": {
    "title":    { "type": "string", "required": true,  "desc": "卡片标题" },
    "value":    { "type": "string|number", "required": true, "desc": "核心数值" },
    "trend":    { "type": "enum", "values": ["up","down","flat"], "desc": "趋势方向" }
  },
  "slots": ["header", "footer"],
  "echarts": false,
  "usage": "<stat-card title='营收' value='1.2亿' trend='up'></stat-card>",
  "promptHint": "适用于展示 KPI 指标、业绩数据、统计概览等场景"
}
```

**字段说明：**

| 字段 | 用途 |
|------|------|
| `name` / `label` | 组件标识和中文名 |
| `description` | 一句话描述组件功能 |
| `props` | 可配置参数 → AI 据此调整组件行为 |
| `slots` | 可填充的内容区域 |
| `echarts` | 是否需要 ECharts → AI 判断是否引入 CDN |
| `usage` | 示例代码片段 → AI 了解组件用法 |
| `promptHint` | 场景提示 → AI 判断何时使用该组件 |

### 3.4 skeletons/ — 骨架层

骨架定义了页面的结构框架和打印控制。每个骨架是一个不完整但结构清晰的 HTML 文件：

- **A4 横版** — `@page { size: A4 landscape }`，固定页高 210mm，`page-break-after: always`
- **Slide 翻页** — 全屏 slide，position absolute + visibility 切换，键盘翻页
- **自由滚动** — max-width 居中布局，响应式，自由滚动

骨架中的占位内容用明显的注释标记，方便 AI 定位和替换。

### 3.5 templates/ — 案例层

完整案例展示了骨架 + 组件 + 主题的正确组装方式，作为 AI 的 few-shot 参考：
- AI 可以完整读取一个模板，理解如何将组件嵌入骨架
- AI 生成新页面时，模仿模板的结构和组装方式
- 每个模板对应一种 骨架×主题 的典型组合

---

## 四、Claude Code 工作流程

### 4.1 触发链路

```
1. 用户在项目目录打开 Claude Code
2. Claude Code 自动读取 .claude/CLAUDE.md
3. .claude/CLAUDE.md 中的规则触发：
   "涉及 HTML/PPT/报告时，必须首先读取 UI-lib/.claude.md"
4. Claude 读取 UI-lib/.claude.md，了解完整的组件库约束
5. 根据用户需求，按"选骨架→选主题→选组件→组装"流程执行
```

### 4.2 AI 的执行步骤

```
用户："我要一个A4横版商务蓝白主题的基金分析报告"

Claude 自动执行：
  1. 读 manifest.json → 了解有哪些组件可用
  2. 读 skeletons/a4-landscape-skeleton.html → 了解 A4 横版结构
  3. 读 tokens/business-bluewhite.css → 了解主题变量
  4. 根据"基金分析"需求，从 manifest 中筛选相关组件：
     - stat-card（KPI 数据卡片）
     - data-table（数据表格）
     - process-step（分析流程）
     - bar-chart（收益对比图）
  5. 逐个读取选中组件的 meta.json（了解参数）和 HTML（了解结构）
  6. 读 templates/combo-a4-bluewhite.html → 了解组装方式
  7. 生成最终 HTML，保存到项目目录
```

### 4.3 迭代对话

生成初版后，用户可以继续对话修改：
- "把第三页改成暗色背景"
- "数据卡片换成4列网格布局"
- "加一个时间线图展示收益率变化"

Claude 在已有对话上下文中，直接修改已生成的 HTML，无需重新开始。

---

## 五、UI-lib/index.html 预览页

### 5.1 定位

**开发预览工具**，用于人工浏览组件效果、查看代码、切换主题。不是用户生成页面的必经之路。

### 5.2 布局

```
┌──────────────────────────────────────────────────────┐
│ 顶部栏：Logo | 主题切换 [商务蓝白] [RC浅蓝] [暗黑科技]    │
├────────────────┬─────────────────────────────────────┤
│ 左侧菜单（260px）│ 右侧内容区                            │
│ 可折叠         │  ┌─ iframe 预览区 ────────────────┐  │
│               │  │  组件 HTML 实时渲染              │  │
│ ▸ 基础组件     │  │  带当前主题参数                  │  │
│ ▸ 图表        │  └─────────────────────────────────┘  │
│ ▸ 版式骨架     │  ┌─ 代码面板（可折叠）──────────────┐  │
│ ▸ Token 预览  │  │ Tab: 完整代码 | 元信息 JSON        │  │
│ ▸ 完整案例     │  │ [复制代码] [复制元信息]            │  │
│               │  └─────────────────────────────────┘  │
└───────────────┴──────────────────────────────────────┘
```

### 5.3 功能清单

| 功能 | 实现方式 |
|------|---------|
| 左侧菜单 | Vue 响应式树形菜单，一级可展开/收起，二级点击切换 |
| iframe 预览 | 选中菜单项 → `iframe.src = 路径?theme=当前主题` |
| 主题切换 | 顶部按钮 → 更新 currentTheme → postMessage 通知 iframe + 重载 |
| 复制代码 | `fetch(组件路径)` → `navigator.clipboard.writeText()` |
| 复制元信息 | 读取内联 `_meta` → 复制 JSON |
| 代码面板 | 可折叠，Prism.js 语法高亮 |

### 5.4 技术栈

```
Vue 3          → unpkg CDN
Tailwind CSS   → cdn.tailwindcss.com
Prism.js       → CDN（代码高亮）
ECharts 5      → CDN（图表组件预览用）
```

### 5.5 主题切换协议

每个组件 HTML 需包含 ~8 行 JS：

```js
// 1. URL 参数初始化
const urlTheme = new URLSearchParams(location.search).get('theme');
if (urlTheme) setTheme(urlTheme);

// 2. 响应父窗口主题切换
window.addEventListener('message', (e) => {
  if (e.data?.type === 'theme-change') setTheme(e.data.theme);
});

function setTheme(theme) {
  const link = document.querySelector('#token-css');
  if (link) link.href = `../tokens/${theme}.css`;
}
```

---

## 六、manifest.json 注册表

```json
{
  "menu": [
    {
      "id": "basic-components",
      "label": "基础组件",
      "icon": "component",
      "defaultOpen": true,
      "children": [
        {
          "id": "stat-card",
          "label": "数据卡片",
          "path": "components/stat-card/stat-card.html",
          "meta": "components/stat-card/stat-card.meta.json",
          "theme": "follow"
        }
      ]
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识 |
| `label` | 菜单显示名称 |
| `path` | 组件 HTML 相对路径 |
| `meta` | 元信息 JSON 路径（null = 无元信息） |
| `theme` | `"follow"` = 跟随主题切换；`"fixed"` = 固定主题不受影响 |
| `defaultOpen` | 一级菜单是否默认展开 |

**manifest.json 的双重用途：**
- **给 index.html 用** — 渲染左侧菜单树，驱动 iframe 预览
- **给 AI 用** — 快速了解有哪些组件、路径在哪、分类结构

---

## 七、与 v1.0 的变更对比

| | v1.0（废弃） | v2.0（当前） |
|---|---|---|
| 用户操作 | 先到 report 页组装提示词 → 复制 → 粘贴到 Claude | 直接在 Claude Code 描述需求 |
| 组件选择 | 在 UI-lib 页勾选 → localStorage 传递 → report 页读取 | AI 自动根据需求从 manifest 中筛选 |
| 迭代方式 | 重新组装提示词 → 重新粘贴 | 继续对话，上下文保持 |
| 文件结构 | UI-lib + report 双系统 | UI-lib 单一系统 |
| 组件预览 | UI-lib/index.html（保留） | UI-lib/index.html（保留，仅作预览） |

### 删除的内容

- `report/` 整个目录（提示词工具页面 + 原始参考文件）
- `UI-lib/index.html` 中的"提示词篮"相关功能（按钮、localStorage、basketCount）
- `.claude/worktrees/` 临时 git 数据

### 保留和强化的内容

- **meta.json** — 价值更大，AI 通过它快速了解组件参数而无需通读 HTML
- **templates/** — 价值更大，作为 few-shot 示例展示组装方式
- **CLAUDE.md** — 成为唯一的"说明书"，质量至关重要
- **UI-lib/index.html** — 开发预览工具，人工浏览组件效果

---

## 八、后续扩展方向

1. **子目录 CLAUDE.md** — 在 `templates/`、`components/` 下放置更细粒度的约束文件
2. **组件注释规范** — 在组件 HTML 顶部加结构化注释，标注可替换区域和变量
3. **更多骨架** — A4 竖版、16:9 演示、双栏报告等
4. **更多主题** — 政府公文、学术论文、科技蓝等
5. **自动化索引** — 脚本扫描组件目录自动生成 manifest.json，减少手工维护

---

## 九、变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-22 | v1.0 初始版本，iframe + report 双系统方案 |
| 2026-05-22 | v2.0 去掉 report 工具，改为 Claude Code 原生方案，精简 UI-lib/index.html |
