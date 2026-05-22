# 团队内部 UI 组件库 & 提示词报告工具 · 设计规格文档

> 版本: v1.0 | 2026-05-22 | iframe 方案
> 后续需求迭代在此文档追加

---

## 一、整体架构

```
AIProject/
├── UI-lib/                    ← 组件库系统（浏览、预览、复制）
│   ├── index.html             ← 根页面：左右布局，菜单+预览+主题切换
│   ├── manifest.json          ← 组件注册表（菜单树、路径、分类、meta）
│   ├── tokens/                ← 3 套 Design Token CSS
│   ├── components/            ← 业务组件（每个是独立 HTML，可双击打开）
│   ├── charts/                ← 图表组件（ECharts 封装）
│   ├── layouts/               ← 版式骨架
│   ├── templates/             ← 完整案例（组合模版）
│   └── previews/              ← Token 色块预览页
│
├── report/                    ← 提示词工具系统（勾选组件 → 组装提示词）
│   ├── index.html             ← 提示词工具主页面
│   └── reference/             ← 参考素材（原始 HTML，只读）
│
└── my-design.md               ← 本文件
```

---

## 二、UI-lib 组件库 · 规格

### 2.1 index.html 根页面

#### 布局

```
┌──────────────────────────────────────────────────────┐
│ 顶部栏：Logo | 主题切换 [商务蓝白] [RC浅蓝] [暗黑科技]    │
├────────────────┬─────────────────────────────────────┤
│ 左侧菜单（260px）│ 右侧内容区                            │
│ 可折叠 ← →     │                                     │
│                │  ┌─ iframe 预览区 ────────────────┐  │
│ ▸ 基础组件     │  │  组件 HTML 实时渲染              │  │
│   ├ 数据卡片   │  │  带当前主题参数                  │  │
│   ├ 时间线     │  │                                 │  │
│   ├ 流程步骤   │  └─────────────────────────────────┘  │
│   ├ 圆形编号   │                                     │
│   └ 标签徽章   │  ┌─ 代码面板（可折叠）──────────────┐  │
│                │  │ Tab: 完整代码 | 元信息 JSON        │  │
│ ▸ 图表         │  │ [一键复制] [加入提示词篮]          │  │
│   ├ 柱状图     │  │ <pre><code>...</code></pre>      │  │
│   └ 时间线图   │  └─────────────────────────────────┘  │
│                │                                     │
│ ▸ 版式         │                                     │
│   ├ A4 横版    │                                     │
│   ├ Slide 翻页 │                                     │
│   └ 自由滚动   │                                     │
│                │                                     │
│ ▸ Token 预览   │                                     │
│ ├─ 商务蓝白    │                                     │
│ ├─ RC 浅蓝     │                                     │
│ └─ 暗黑科技    │                                     │
│                │                                     │
│ ▸ 完整案例     │                                     │
│ ├─ A4+蓝白     │                                     │
│ ├─ Slide+浅蓝  │                                     │
│ └─ 滚动+暗黑   │                                     │
└────────────────┴─────────────────────────────────────┘
```

#### 功能清单

| 功能 | 实现方式 |
|------|---------|
| 左侧菜单 | Vue 响应式树形菜单，一级默认展开，二级点击切换组件 |
| 菜单折叠 | 左侧边缘拖拽或按钮，260px ↔ 40px |
| iframe 预览 | 选中菜单项 → 设置 `iframe.src = 组件路径?theme=当前主题` |
| 主题切换 | 顶部按钮 → 更新 `currentTheme` → 通知当前 iframe（postMessage）+ 切换主页 token |
| 一键复制 | `fetch(组件路径)` → `navigator.clipboard.writeText()` |
| 复制元信息 | `fetch(组件路径.replace('.html','.meta.json'))` → 复制 JSON |
| 代码面板 | 可折叠，默认展开；复制操作在此面板的 tab 内 |
| 加入提示词篮 | `localStorage['prompt-basket']` 追加组件 ID |

#### 技术栈（全部 CDN，零构建）

```
Vue 3          → unpkg CDN
Tailwind CSS   → cdn.tailwindcss.com
Prism.js       → CDN（代码高亮）
ECharts 5      → CDN（图表组件内用）
```

#### 主题切换机制（iframe 方案）

```
┌─ 用户点击「暗黑科技」────────────────────────────┐
│                                                 │
│ 1. 主页 currentTheme = 'dark-tech'              │
│ 2. 主页 <link> 切到 tokens/dark-tech.css        │
│ 3. 当前 iframe 存在 → postMessage({             │
│      type: 'theme-change',                      │
│      theme: 'dark-tech'                         │
│    })                                           │
│ 4. 组件 HTML 内监听 message → 切 <link>         │
│ 5. 后续打开新组件 → src 直接带 ?theme=dark-tech  │
│                                                 │
│ Token 预览页、完整案例页不接收/不响应主题切换      │
│ （iframe src 不带 theme 参数，忽略 postMessage） │
└─────────────────────────────────────────────────┘
```

每个组件 HTML 需要包含的主题切换协议（约 8 行）：

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

### 2.2 manifest.json 组件注册表

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
        },
        {
          "id": "timeline",
          "label": "时间线",
          "path": "components/timeline/timeline.html",
          "meta": "components/timeline/timeline.meta.json",
          "theme": "follow"
        }
      ]
    },
    {
      "id": "charts",
      "label": "图表",
      "icon": "chart",
      "defaultOpen": false,
      "children": []
    },
    {
      "id": "layouts",
      "label": "版式",
      "icon": "layout",
      "defaultOpen": true,
      "children": []
    },
    {
      "id": "token-preview",
      "label": "Token 预览",
      "icon": "palette",
      "defaultOpen": false,
      "children": [
        {
          "id": "token-business",
          "label": "商务蓝白",
          "path": "previews/token-preview.html",
          "meta": null,
          "theme": "fixed",
          "params": { "token": "business-bluewhite" }
        }
      ]
    },
    {
      "id": "templates",
      "label": "完整案例",
      "icon": "file",
      "defaultOpen": false,
      "children": []
    }
  ]
}
```

字段说明：

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，用于 localStorage 提示词篮 |
| `label` | 菜单显示名称 |
| `path` | 组件 HTML 相对路径 |
| `meta` | 组件元信息 JSON 路径（null = 无元信息，不显示复制元信息按钮） |
| `theme` | `"follow"` = 跟随主题切换；`"fixed"` = 不受影响（token页/案例页） |
| `params` | 可选，传给 iframe 的额外 URL 参数 |
| `defaultOpen` | 一级菜单是否默认展开 |

---

### 2.3 组件文件结构

```
UI-lib/
├── index.html                    ← 根页面
├── manifest.json                 ← 注册表
│
├── tokens/
│   ├── business-bluewhite.css
│   ├── rc-lightblue.css
│   └── dark-tech.css
│
├── components/
│   ├── stat-card/
│   │   ├── stat-card.html        ← 组件本身（独立可运行）
│   │   └── stat-card.meta.json   ← 元信息（props/slots/usage）
│   ├── timeline/
│   │   ├── timeline.html
│   │   └── timeline.meta.json
│   ├── process-step/
│   │   ├── process-step.html
│   │   └── process-step.meta.json
│   ├── circle-number/
│   │   ├── circle-number.html
│   │   └── circle-number.meta.json
│   ├── badge-tag/
│   │   ├── badge-tag.html
│   │   └── badge-tag.meta.json
│   ├── data-table/
│   │   ├── data-table.html
│   │   └── data-table.meta.json
│   └── hero-card/
│       ├── hero-card.html
│       └── hero-card.meta.json
│
├── charts/
│   ├── bar-chart/
│   │   ├── bar-chart.html
│   │   └── bar-chart.meta.json
│   └── timeline-chart/
│       ├── timeline-chart.html
│       └── timeline-chart.meta.json
│
├── layouts/
│   ├── a4-landscape.html         ← A4横版骨架（带 URL 参数主题切换）
│   ├── slide-deck.html           ← Slide翻页骨架
│   └── scroll-page.html          ← 自由滚动骨架
│
├── templates/
│   ├── combo-a4-bluewhite.html   ← 完整案例：A4 + 商务蓝白
│   ├── combo-slide-rc.html       ← 完整案例：Slide + RC浅蓝
│   └── combo-scroll-dark.html    ← 完整案例：滚动 + 暗黑科技
│
└── previews/
    └── token-preview.html        ← Token 色块预览（3 套并排展示）
```

---

### 2.4 meta.json 规范

每个支持「复制元信息」的组件必须提供，格式：

```json
{
  "name": "stat-card",
  "label": "数据卡片",
  "category": "基础组件",
  "description": "单指标数据卡片，支持标题、数值、趋势箭头",
  "props": {
    "title":    { "type": "string", "required": true,  "desc": "卡片标题" },
    "value":    { "type": "string|number", "required": true, "desc": "核心数值" },
    "trend":    { "type": "enum", "values": ["up","down","flat"], "desc": "趋势方向" },
    "colorVar": { "type": "string", "desc": "主题色 CSS 变量名，如 --primary-500" }
  },
  "slots": ["header", "footer"],
  "cssPath": "../tokens/business-bluewhite.css",
  "echarts": false,
  "usage": "<stat-card title='营收' value='1.2亿' trend='up' color-var='--primary-500'></stat-card>",
  "promptHint": "适用于展示 KPI 指标、业绩数据、统计概览等场景"
}
```

字段说明：

| 字段 | 用途 |
|------|------|
| `name` / `label` | 组件标识和中文名 |
| `props` | 可配置参数 → 提示词工具据此生成「你可以调整以下参数」 |
| `slots` | 插槽区域 → 提示词工具据此生成「你可以在以下区域填充内容」 |
| `cssPath` | 关联 Token 文件路径 → 提示词工具知道引哪个 CSS |
| `echarts` | 是否需要 ECharts → 提示词工具判断是否加 CDN 引用 |
| `usage` | 示例代码片段 |
| `promptHint` | 给 AI 的场景提示 → 直接进 prompt 上下文 |

---

### 2.5 组件需要遵守的约定

每个可主题切换的组件 HTML 必须：

```
1. <link id="token-css" rel="stylesheet" href="../../tokens/business-bluewhite.css">
   （id 固定为 token-css，setTheme 通过它切换）

2. 所有颜色用 CSS 变量：
   color: var(--primary-500);
   background: var(--surface);
   border-color: var(--border);

3. 监听 postMessage 主题切换（8 行代码，见 2.1 最后一段）

4. 独立可运行：双击 HTML 文件 → 浏览器正常打开 → 默认主题显示
```

Token 预览页和完整案例页**不需要**遵守 1-3，它们固定主题。

---

## 三、report 提示词工具 · 规格

### 3.1 概述

独立入口页面，与 UI-lib 通过 localStorage 共享「提示词篮」数据。

### 3.2 index.html 功能页面

```
┌──────────────────────────────────────────────────┐
│ 提示词工具 · 生成 AI 报告                          │
│                                                  │
│ ┌─ 步骤 1：选择版式 ─────────────────────────┐    │
│ │ [A4横版+商务蓝白] [Slide+RC浅蓝] [滚动+暗黑]  │    │
│ └────────────────────────────────────────────┘    │
│                                                  │
│ ┌─ 步骤 2：提示词篮（从 UI-lib 加入的组件）────┐   │
│ │ 组件          操作                            │   │
│ │ ✓ stat-card   [移除]   数据卡片，KPI展示       │   │
│ │ ✓ bar-chart   [移除]   柱状图，需ECharts       │   │
│ │ ✓ process-step [移除]  流程步骤，蓝色左边框     │   │
│ │                                    [清空全部]  │   │
│ └────────────────────────────────────────────┘    │
│                                                  │
│ ┌─ 步骤 3：补充内容要求 ─────────────────────┐    │
│ │ 报告主题：[____________________________]      │   │
│ │ 内容要点：[____________________________]      │   │
│ │          [____________________________]      │   │
│ │ 风格要求：[____________________________]      │   │
│ └────────────────────────────────────────────┘    │
│                                                  │
│ ┌─ 步骤 4：生成结果 ─────────────────────────┐    │
│ │ ┌──────────────────────────────────────┐      │   │
│ │ │ 生成的完整提示词（可编辑+复制）         │      │   │
│ │ │                                      │      │   │
│ │ │ 请使用以下组件生成一份A4横版HTML报告：  │      │   │
│ │ │                                      │      │   │
│ │ │ ## 版式要求                          │      │   │
│ │ │ - A4横版打印，每页297mm×210mm        │      │   │
│ │ │                                      │      │   │
│ │ │ ## 使用的组件                        │      │   │
│ │ │ ### stat-card                      │      │   │
│ │ │ - 路径: components/stat-card/...    │      │   │
│ │ │ - Props: title, value, trend       │      │   │
│ │ │                                      │      │   │
│ │ │ ## 内容要求                          │      │   │
│ │ │ - 报告主题：XXX                     │      │   │
│ │ │                                      │      │   │
│ │ └──────────────────────────────────────┘      │   │
│ │ [复制提示词]  [在 Claude 中打开]               │   │
│ └────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### 3.3 提示词生成逻辑

```
用户填完表单 → 点「生成」
  → 读取选中的版式 meta → 拼入"版式要求"段
  → 遍历提示词篮组件 → 读取 meta.json → 拼入每个组件的 props/slots/usage/cssPath
  → 拼入用户填写的内容要求
  → 拼入全局规范（@page, print-color-adjust, 相对路径引用规则）
  → 输出完整提示词到文本框 → 用户可编辑 → 复制到 Claude
```

### 3.4 提示词模板示例

```markdown
请使用以下组件生成一份HTML报告页面：

## 全局约束
- 纯静态HTML，CDN引入Vue3+Tailwind，零构建
- 通过相对路径引用 UI-lib 的 CSS token：`<link href="../UI-lib/tokens/business-bluewhite.css">`
- @media print 中设置 print-color-adjust: exact 保留颜色
- 所有颜色使用CSS变量：`color: var(--primary-500)`

## 版式要求
- 版式：A4横版打印
- 页面尺寸：297mm × 210mm
- 每页结构：section.a4-page + 页脚页码

## 使用的组件
{% for item in basket %}
### {{ item.label }}
- 文件路径：`{{ item.path }}`
- 可配置参数：
{% for prop in item.props %}
  - `{{ prop.name }}` ({{ prop.type }})：{{ prop.desc }}
{% endfor %}
- 使用示例：`{{ item.usage }}`
- 场景提示：{{ item.promptHint }}
{% endfor %}

## 内容要求
{{ userContent }}

## 输出要求
- 生成完整的 index.html 文件
- 代码高亮使用 Prism.js CDN
- 保留 print-color-adjust: exact 确保打印不丢色
```

---

### 3.5 文件结构

```
report/
├── index.html              ← 提示词工具主页面
├── reference/              ← 原始素材（只读，不再修改）
│   ├── A4.html
│   ├── ppt.html
│   └── web.html
└── meta/                   ← 版式相关的 meta 信息
    └── layout-meta.json    ← 3 套版式的元描述
```

---

## 四、localStorage 协议

### 4.1 提示词篮数据结构

```json
{
  "prompt-basket": [
    {
      "id": "stat-card",
      "label": "数据卡片",
      "path": "components/stat-card/stat-card.html",
      "metaPath": "components/stat-card/stat-card.meta.json",
      "addedAt": "2026-05-22T10:30:00Z"
    }
  ]
}
```

### 4.2 操作流程

```
UI-lib 主页：
  点「加入提示词篮」→ 读取 manifest 中对应项 → push 到 localStorage['prompt-basket']
  点「移除」→ 从数组 splice

report 主页：
  打开时 → 读取 localStorage['prompt-basket'] → 渲染已选列表
  点「清空全部」→ localStorage.removeItem('prompt-basket')
```

---

## 五、实施计划

| 阶段 | 内容 | 依赖 |
|------|------|------|
| **P1** | 拆解现有 3 份完整页面 → 提取业务组件（stat-card, timeline, process-step, badge, table, hero-card） | 现有 components/ 下的 HTML |
| **P2** | 为每个组件写 meta.json + 添加主题切换协议（postMessage + URL param） | P1 |
| **P3** | 写 manifest.json 注册表 | P2 |
| **P4** | 写 token-preview.html（3 套色块并排展示） | 现有 tokens/ |
| **P5** | 写 UI-lib/index.html（左右布局 + 菜单 + iframe 预览 + 主题切换 + 复制 + 提示词篮） | P1-P4 |
| **P6** | 写 report/index.html（版式选择 + 提示词篮 + 内容填写 + 提示词生成） | P2 |
| **P7** | 图表组件（bar-chart, timeline-chart） | P1 |

---

## 六、变更记录

| 日期 | 变更 |
|------|------|
| 2026-05-22 | v1.0 初始版本，确立 iframe 方案 + localStorage 联动 |
