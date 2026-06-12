# wave-todo 重设计文档

**日期**：2026-06-12  
**状态**：已确认，待实现

---

## 概述

将 wave-todo 从单一表单改为三大类任务的导航入口：写作任务、发布任务、临时任务。首页卡片列表，点击进入对应子表单。

---

## Section 1：整体页面结构

**路由：**

| 路径 | 页面 |
|------|------|
| `/setup` | 配置页（Token + 仓库，不变） |
| `/#/` | 首页（Home.vue，三张卡片） |
| `/#/writing` | 写作任务表单（WritingForm.vue） |
| `/#/publish` | 发布任务表单（PublishForm.vue） |
| `/#/adhoc` | 临时任务表单（AdhocForm.vue） |

**首页（Home.vue）**：

```
┌──────────────────────┐
│  wave-todo      ⚙    │
├──────────────────────┤
│  ✍️  写作任务          │
│  改写 / mini / 头条   │  →
├──────────────────────┤
│  📤  发布任务          │
│  发布已有文章         │  →
├──────────────────────┤
│  🔧  临时任务          │
│  手动触发日报等       │  →
└──────────────────────┘
```

各子页面顶部有 `←` 返回首页按钮。

---

## Section 2：写作任务（WritingForm.vue）

Tab 切换写作类型，将来加新类型只加 Tab：

```
[改写/创作] [mini 图文] [头条] [小说→占位]
```

### 改写/创作 Tab

- 正文输入框（自动检测：URL → "改写文章"，文字 → "自由创作"）
- 目标公众号：`[自动][once][snow][system]`，默认"自动"
- 选项：`□ 自动发布到草稿箱`、`□ 生成头图`（默认勾）
- 生成文件：`YYYYMMDD-HHMMSS.article-rewrite.md`

frontmatter 字段：
```yaml
target: once        # 自动时不写此字段
no_publish: true    # 未勾"自动发布"
no_cover: false     # 勾了"生成头图"
```

### mini 图文 Tab

- 系列选择：`[起源][一事一悟]`（account 由系列自动决定，不显示）
- 指定条目（可选，不填则自动选题）
- 生成文件：`YYYYMMDD-HHMMSS.article-mini.md`

frontmatter 字段：
```yaml
series: 起源
account: once       # 由系列配置自动写入
entry: 伽利略       # 可选
```

### 头条 Tab

- 素材输入框（可选，URL 或文字；不填则自动从近期 snow/system 文章挑选）
- 扫描天数（无素材时生效）：`[7天][14天][30天]`，默认 7 天
- 不显示发布选项（头条不支持 API 发布，固定 no_publish: true）
- 生成文件：`YYYYMMDD-HHMMSS.article-toutiao.md`

frontmatter 字段：
```yaml
url: https://...    # 有素材时
days: 7             # 无素材时
```

### 小说 Tab（占位）

显示"暂未开放"，不可提交。

---

## Section 3：发布任务（PublishForm.vue）

与现有逻辑一致：

- 公众号：`[once][snow][system]`（必选，默认 once）
- 文章类型：`[mini 图文][长文]`（必选）
- 系列（可选）：文本框
- 文件路径（可选）：文本框，不填则随机选
- 生成文件：`YYYYMMDD-HHMMSS.article-publish.md`

frontmatter 字段：
```yaml
target: once
article_type: mini
series: 成长的箴言   # 可选
source: ~/...        # 可选
```

---

## Section 4：临时任务（AdhocForm.vue）

一键触发按钮列表，无需填表单：

- **触发日报**：生成昨日工作日报
  - 生成文件：`YYYYMMDD-HHMMSS.journal.md`
  - frontmatter：`created: ...`，正文：`生成昨日工作日报`

将来可扩展更多一键按钮。

---

## 文件结构变化

```
wave-todo/src/views/
├── Setup.vue          # 不变
├── Home.vue           # 新建：首页三卡片
├── WritingForm.vue    # 新建：写作任务（替代原 TaskForm.vue）
├── PublishForm.vue    # 新建：发布任务（从 TaskForm 拆出）
└── AdhocForm.vue      # 新建：临时任务
```

原 `TaskForm.vue` 删除，逻辑拆分到三个新组件。

---

## 错误处理 & 公共逻辑

- Token/仓库未配置 → 跳转 `/setup`
- 401 → clearToken + 跳转 `/setup`
- 限流 → 显示重置时间
- 提交成功 → "✅ 任务已提交"，3 秒后重置
- 提交失败 → 显示错误，保留表单内容可重试
- `useGitHub.js` 和 `useStorage.js` 不变，供各页面复用
