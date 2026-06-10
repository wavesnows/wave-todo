# wave-todo 设计文档

**日期**：2026-06-09  
**状态**：已确认，待实现

---

## 概述

wave-todo 是一个移动端 PWA，用于向 wave-tasks 仓库提交任务。核心场景：粘贴 URL 触发文章改写，或写想法触发自由创作。只做发任务，查看任务状态通过 mnote 浏览 wave-tasks 仓库。

---

## Section 1：总体架构

**技术栈**：Vue 3 + Vite，Hash History 路由，localStorage，无后端，部署到 GitHub Pages。与 mnote 完全一致。

**两个页面：**
- `/setup` — 配置 Token + 选择 wave-tasks 仓库
- `/#/` — 发任务表单（主界面）

**核心流程：**
```
填表单 → 生成任务文件内容
→ GitHub API PUT /contents/pending/{filename}
→ 写入 wave-tasks 仓库 pending/ 目录
```

不需要本地 git，直接用 GitHub API 写文件。

**localStorage：**
```
wavetodo_token   # GitHub Token
wavetodo_repo    # wave-tasks 仓库（格式：owner/repo）
```

---

## Section 2：页面设计

### Setup 页面

1. 输入 GitHub Token（同 mnote）
2. 搜索选择 wave-tasks 仓库（输入关键词搜索用户仓库，选择后保存）
3. 保存后跳转主界面

### 主界面（发任务表单）

```
┌─────────────────────────────┐
│  wave-todo          ⚙       │
│─────────────────────────────│
│                             │
│  ┌───────────────────────┐  │
│  │ 粘贴 URL 或写想法...  │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  目标公众号                  │
│  [once] [snow] [system]     │
│                             │
│  □ 自动发布到草稿箱          │
│                             │
│  [提交任务]                  │
│                             │
└─────────────────────────────┘
```

- 顶部右上角 ⚙ 进入 Setup 修改配置
- 正文区域自动检测：第一行是 `http://` 或 `https://` 开头 → 副标题显示"改写文章"；否则显示"自由创作"
- 目标公众号单选按钮，默认 `once`
- 提交成功后显示"✅ 任务已提交"，3 秒后清空表单

### 生成的任务文件

文件名：`YYYYMMDD-HHMMSS.article-rewrite.md`  
写入路径：`wave-tasks/pending/{filename}`

内容格式：
```markdown
---
created: 2026-06-09 10:05
target: snow
auto_publish: false

---

https://mp.weixin.qq.com/s/xxx
```

注：frontmatter 最后一行字段与 `---` 之间空一行，方便 markdown 渲染。

---

## Section 3：错误处理

| 场景 | 处理方式 |
|------|----------|
| Token 未配置 | 跳转 Setup 页面 |
| Token 失效（401）| 跳转 Setup，提示重新配置 |
| wave-tasks 仓库未配置 | 跳转 Setup，提示选择仓库 |
| 正文为空 | 提交按钮禁用 |
| 目标公众号未选 | 默认 once |
| GitHub API 限流 | 显示限流提示和重置时间 |
| 提交失败（网络等）| 显示错误信息，不清空表单，可重试 |
| 提交成功 | 显示"✅ 任务已提交"，3 秒后清空表单 |

---

## Section 4：目录结构

```
wave-todo/
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   │   └── index.js
│   ├── composables/
│   │   ├── useStorage.js      # Token + repo 存取
│   │   └── useGitHub.js       # GitHub API（validateToken / searchRepos / putFile）
│   ├── views/
│   │   ├── Setup.vue          # Token + 仓库配置
│   │   └── TaskForm.vue       # 发任务主界面
│   └── assets/
│       └── main.css
├── public/
│   ├── manifest.json
│   └── favicon.svg
├── index.html
├── vite.config.js
└── package.json
```

**useGitHub.js 三个方法：**
- `validateToken()` — 验证 Token 有效性
- `searchRepos(query)` — 搜索仓库（Setup 页用）
- `putFile(owner, repo, path, content, message)` — 写文件到 pending/

---

## 部署

- GitHub Pages，base path `/wave-todo/`
- GitHub Actions 自动部署（push to main 触发）
