# 报告生成流程

```mermaid
flowchart TD
    %% 模式 B 前置：用户配置阶段
    PRE1["step1<br/>浏览组件库，了解可用组件"] --> PRE2["step2<br/>创建 / 导入项目"]
    PRE2 --> PRE3["step3<br/>填写配置 + 内容大纲"]
    PRE3 --> PRE4["step4<br/>保存 config.json"]

    %% 后续对话触发
    START(["后续对话触发"]) --> STEP1{"用户怎么操作？"}

    %% 模式 A
    STEP1 -->|"直接描述需求"| STEP2A["step5A<br/>模式 A：自由对话"]
    STEP2A --> STEP3A["step6A<br/>AI 推断意图，推荐骨架、主题、组件"]
    STEP3A --> STEP4A["step7A<br/>用户确认方案"]
    STEP4A --> STEP5A["step8A<br/>生成 HTML 文件"]

    %% 模式 B
    STEP1 -->|说「继续生成」或指定项目名| STEP2B["step5B<br/>模式 B：项目驱动"]
    STEP2B --> STEP3B["step6B<br/>读取 config.json"]
    STEP3B --> STEP4B["step7B<br/>按配置逐章生成"]
    STEP4B --> STEP5B{"所有章节 done？"}
    STEP5B -->|"继续下一章"| STEP4B
    STEP5B -->|"全部完成"| STEP6B["step8B<br/>组装，输出完整报告"]

    PRE4 -.-> START

    style STEP2A fill:#2196F3,color:#fff
    style STEP2B fill:#FF9800,color:#fff
```

| | 模式 A（自由对话） | 模式 B（项目驱动） |
|---|---|---|
| **前置操作** | 无，直接开始 | step1-4：浏览组件库 → 创建项目 → 填写配置 → 保存 |
| **怎么触发** | 直接描述需求 | 说"继续生成"或指定项目名 |
| **配置来源** | AI 根据描述推断推荐 | 从 config.json 读取 |
| **适用场景** | 快速原型、单页需求 | 多章节正式报告 |
