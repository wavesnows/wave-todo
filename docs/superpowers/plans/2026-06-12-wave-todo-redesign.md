# wave-todo Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wave-todo 从单一 TaskForm 重构为三大类任务的首页导航 + 四个子页面（Home、WritingForm、PublishForm、AdhocForm）。

**Architecture:** 新增 Home.vue 作为首页卡片导航，原 TaskForm.vue 拆分为 WritingForm.vue（写作：改写/mini/头条/小说占位）、PublishForm.vue（发布）、AdhocForm.vue（临时任务一键触发）。路由新增 /writing、/publish、/adhoc 三条，全部 requiresAuth。composables 不变。

**Tech Stack:** Vue 3、Vue Router 4（Hash History）、localStorage、GitHub Contents API

---

## 文件结构

```
wave-todo/src/
├── router/index.js              # 修改：新增三条路由，/ 指向 Home
├── views/
│   ├── Setup.vue                # 不变
│   ├── Home.vue                 # 新建：首页三卡片
│   ├── WritingForm.vue          # 新建：写作任务（改写/mini/头条/小说）
│   ├── PublishForm.vue          # 新建：发布任务
│   ├── AdhocForm.vue            # 新建：临时任务
│   └── TaskForm.vue             # 删除：逻辑已拆分
└── composables/                 # 不变
```

---

## Task 1: Router 更新

**Files:**
- Modify: `wave-todo/src/router/index.js`

- [ ] **Step 1: 替换 router/index.js**

```javascript
// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'

const routes = [
  {
    path: '/setup',
    component: () => import('../views/Setup.vue'),
  },
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/writing',
    component: () => import('../views/WritingForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/publish',
    component: () => import('../views/PublishForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/adhoc',
    component: () => import('../views/AdhocForm.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const { getToken, getRepo } = useStorage()
  if (to.meta.requiresAuth) {
    if (!getToken()) return '/setup'
    if (!getRepo()) return '/setup'
  }
})

export default router
```

- [ ] **Step 2: 创建临时占位 Home.vue（让 build 不报错）**

```bash
cat > /Users/fusong/wavesnow/wave-todo/src/views/Home.vue <<'EOF'
<template><div>Home placeholder</div></template>
EOF
```

- [ ] **Step 3: 创建临时占位页（WritingForm、PublishForm、AdhocForm）**

```bash
for f in WritingForm PublishForm AdhocForm; do
  echo "<template><div>${f} placeholder</div></template>" > /Users/fusong/wavesnow/wave-todo/src/views/${f}.vue
done
```

- [ ] **Step 4: 验证 build 通过**

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run build 2>&1 | tail -3
```

预期：`✓ built in ...ms`

- [ ] **Step 5: Commit**

```bash
cd /Users/fusong/wavesnow/wave-todo
git add src/router/index.js src/views/Home.vue src/views/WritingForm.vue src/views/PublishForm.vue src/views/AdhocForm.vue
git commit -m "feat: add routes for home/writing/publish/adhoc"
```

---

## Task 2: Home.vue — 首页三卡片

**Files:**
- Modify: `wave-todo/src/views/Home.vue`

- [ ] **Step 1: 实现 Home.vue**

```vue
<template>
  <div class="home-page">
    <header class="header">
      <h1>wave-todo</h1>
      <button class="icon-btn" @click="router.push('/setup')" title="设置">⚙</button>
    </header>

    <div class="card-list">
      <div class="card" @click="router.push('/writing')">
        <div class="card-icon">✍️</div>
        <div class="card-body">
          <div class="card-title">写作任务</div>
          <div class="card-desc">改写 / mini 图文 / 头条</div>
        </div>
        <div class="card-arrow">›</div>
      </div>

      <div class="card" @click="router.push('/publish')">
        <div class="card-icon">📤</div>
        <div class="card-body">
          <div class="card-title">发布任务</div>
          <div class="card-desc">发布已有文章到草稿箱</div>
        </div>
        <div class="card-arrow">›</div>
      </div>

      <div class="card" @click="router.push('/adhoc')">
        <div class="card-icon">🔧</div>
        <div class="card-body">
          <div class="card-title">临时任务</div>
          <div class="card-desc">手动触发日报等</div>
        </div>
        <div class="card-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.header h1 { font-size: 20px; font-weight: 700; }

.icon-btn {
  background: none;
  border: none;
  font-size: 20px;
  padding: 4px 8px;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
}
.icon-btn:hover { background: #f0f0f0; }

.card-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: white;
  border-radius: 12px;
  padding: 18px 16px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.15s;
}
.card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.card:active { background: #f6f8fa; }

.card-icon { font-size: 28px; flex-shrink: 0; }

.card-body { flex: 1; }
.card-title { font-size: 16px; font-weight: 600; color: #1a1a1a; }
.card-desc  { font-size: 13px; color: #888; margin-top: 2px; }

.card-arrow { font-size: 20px; color: #ccc; font-weight: 300; }
</style>
```

- [ ] **Step 2: 验证 build**

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
cd /Users/fusong/wavesnow/wave-todo
git add src/views/Home.vue
git commit -m "feat: Home page with three task category cards"
```

---

## Task 3: WritingForm.vue — 写作任务

**Files:**
- Modify: `wave-todo/src/views/WritingForm.vue`

写作任务包含四个 Tab：改写/创作、mini 图文、头条、小说（占位）。

- [ ] **Step 1: 实现 WritingForm.vue**

```vue
<template>
  <div class="form-page">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">←</button>
      <h1>写作任务</h1>
      <div style="width:36px"></div>
    </header>

    <div class="form-body">
      <!-- Tabs -->
      <div class="tabs">
        <button :class="['tab', activeTab==='rewrite'&&'active']" @click="activeTab='rewrite'">改写/创作</button>
        <button :class="['tab', activeTab==='mini'&&'active']"    @click="activeTab='mini'">mini 图文</button>
        <button :class="['tab', activeTab==='toutiao'&&'active']" @click="activeTab='toutiao'">头条</button>
        <button :class="['tab', activeTab==='novel'&&'active']"   @click="activeTab='novel'">小说</button>
      </div>

      <!-- 改写/创作 -->
      <template v-if="activeTab==='rewrite'">
        <div class="type-badge" :class="contentType">
          {{ contentType==='url' ? '改写文章' : '自由创作' }}
        </div>
        <textarea v-model="rw.body" class="body-input" placeholder="粘贴 URL 或写想法..." rows="6" @input="detectContentType"/>
        <div class="field">
          <label class="field-label">目标公众号</label>
          <div class="radio-group">
            <button v-for="t in rwTargets" :key="t"
              :class="['radio-btn', rw.target===t&&'active']"
              @click="rw.target=t">{{ t==='auto'?'自动':t }}</button>
          </div>
        </div>
        <div class="field">
          <label class="field-label">选项</label>
          <div class="checkbox-list">
            <label class="checkbox-row">
              <input type="checkbox" v-model="rw.autoPublish"/>
              <span>自动发布到草稿箱</span>
            </label>
            <label class="checkbox-row">
              <input type="checkbox" v-model="rw.withCover"/>
              <span>生成头图</span>
            </label>
          </div>
        </div>
      </template>

      <!-- mini 图文 -->
      <template v-if="activeTab==='mini'">
        <div class="field">
          <label class="field-label">系列</label>
          <div class="radio-group">
            <button v-for="s in miniSeries" :key="s.value"
              :class="['radio-btn', mini.series===s.value&&'active']"
              @click="mini.series=s.value">{{ s.label }}</button>
          </div>
        </div>
        <div class="field">
          <label class="field-label">指定条目 <span class="optional">（可选，不填则自动选题）</span></label>
          <input v-model="mini.entry" class="text-input" placeholder="例：伽利略"/>
        </div>
      </template>

      <!-- 头条 -->
      <template v-if="activeTab==='toutiao'">
        <div class="field">
          <label class="field-label">素材 <span class="optional">（可选，不填则自动从近期文章挑选）</span></label>
          <textarea v-model="tt.body" class="body-input" placeholder="粘贴 URL 或写文字素材..." rows="5"/>
        </div>
        <div v-if="!tt.body.trim()" class="field">
          <label class="field-label">扫描最近</label>
          <div class="radio-group">
            <button v-for="d in [7,14,30]" :key="d"
              :class="['radio-btn', tt.days===d&&'active']"
              @click="tt.days=d">{{ d }}天</button>
          </div>
        </div>
      </template>

      <!-- 小说（占位） -->
      <template v-if="activeTab==='novel'">
        <div class="coming-soon">🚧 暂未开放</div>
      </template>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">✅ 任务已提交</p>

      <button v-if="activeTab!=='novel'"
        class="submit-btn"
        :disabled="submitDisabled || submitting"
        @click="handleSubmit">
        {{ submitting ? '提交中...' : '提交任务' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'
import { useGitHub } from '../composables/useGitHub.js'

const router = useRouter()
const storage = useStorage()

const activeTab = ref('rewrite')
const submitting = ref(false)
const error = ref('')
const success = ref(false)

// ── 改写/创作 ──────────────────────────────────────────────
const rw = ref({ body: '', target: 'auto', autoPublish: false, withCover: true })
const contentType = ref('create')
const rwTargets = ['auto', 'once', 'snow', 'system']

function detectContentType() {
  const firstLine = rw.value.body.split('\n')[0].trim()
  contentType.value = /^https?:\/\//.test(firstLine) ? 'url' : 'create'
}

// ── mini 图文 ──────────────────────────────────────────────
const mini = ref({ series: '起源', entry: '' })
const miniSeries = [
  { value: '起源',    label: '起源',    account: 'once' },
  { value: '一事一悟', label: '一事一悟', account: 'once' },
]

// ── 头条 ────────────────────────────────────────────────────
const tt = ref({ body: '', days: 7 })

// ── 提交禁用 ─────────────────────────────────────────────────
const submitDisabled = computed(() => {
  if (activeTab.value === 'rewrite') return !rw.value.body.trim()
  if (activeTab.value === 'mini')    return !mini.value.series
  if (activeTab.value === 'toutiao') return false  // 无素材也可提交
  return true
})

// ── 公共工具 ─────────────────────────────────────────────────
function nowStr() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return {
    date: `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`,
    time: `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    created: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  }
}

// ── 生成文件 ─────────────────────────────────────────────────
function buildFile() {
  const { date, time, created } = nowStr()

  if (activeTab.value === 'rewrite') {
    const filename = `${date}-${time}.article-rewrite.md`
    const lines = ['---', `created: ${created}`]
    if (rw.value.target !== 'auto') lines.push(`target: ${rw.value.target}`)
    lines.push(`no_publish: ${!rw.value.autoPublish}`)
    lines.push(`no_cover: ${!rw.value.withCover}`)
    lines.push('', '---', '', rw.value.body.trim(), '')
    return { filename, content: lines.join('\n') }
  }

  if (activeTab.value === 'mini') {
    const filename = `${date}-${time}.article-mini.md`
    const seriesCfg = miniSeries.find(s => s.value === mini.value.series)
    const account = seriesCfg ? seriesCfg.account : 'once'
    const lines = ['---', `created: ${created}`, `series: ${mini.value.series}`, `account: ${account}`]
    if (mini.value.entry.trim()) lines.push(`entry: ${mini.value.entry.trim()}`)
    lines.push('', '---', '')
    return { filename, content: lines.join('\n') }
  }

  if (activeTab.value === 'toutiao') {
    const filename = `${date}-${time}.article-toutiao.md`
    const lines = ['---', `created: ${created}`]
    if (tt.value.body.trim()) {
      const firstLine = tt.value.body.trim().split('\n')[0].trim()
      if (/^https?:\/\//.test(firstLine)) {
        lines.push(`url: ${firstLine}`)
      } else {
        lines.push(`text: ${tt.value.body.trim()}`)
      }
    } else {
      lines.push(`days: ${tt.value.days}`)
    }
    lines.push('', '---', '')
    return { filename, content: lines.join('\n') }
  }

  throw new Error('unknown tab')
}

// ── 提交 ─────────────────────────────────────────────────────
async function handleSubmit() {
  error.value = ''
  success.value = false
  submitting.value = true
  const token = storage.getToken()
  const repo = storage.getRepo()
  try {
    const gh = useGitHub(token)
    const { filename, content } = buildFile()
    await gh.putFile(repo.owner, repo.repo, `pending/${filename}`, content, `task: ${filename}`)
    success.value = true
    setTimeout(() => {
      success.value = false
      if (activeTab.value === 'rewrite') {
        rw.value = { body: '', target: 'auto', autoPublish: false, withCover: true }
        contentType.value = 'create'
      } else if (activeTab.value === 'mini') {
        mini.value = { series: '起源', entry: '' }
      } else if (activeTab.value === 'toutiao') {
        tt.value = { body: '', days: 7 }
      }
    }, 3000)
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') { storage.clearToken(); router.push('/setup') }
    else if (e.message.startsWith('RATE_LIMIT:')) {
      const reset = parseInt(e.message.split(':')[1])
      error.value = reset ? `GitHub API 限流，约 ${Math.ceil((reset*1000-Date.now())/60000)} 分钟后恢复` : 'GitHub API 限流，请稍后重试'
    } else {
      error.value = `提交失败：${e.message}`
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-page { min-height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }

.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; background: white; border-bottom: 1px solid #e8e8e8;
}
.header h1 { font-size: 18px; font-weight: 700; }

.back-btn {
  background: none; border: none; font-size: 20px;
  padding: 4px 8px; color: #444; border-radius: 6px; cursor: pointer;
}
.back-btn:hover { background: #f0f0f0; }

.form-body {
  padding: 16px; display: flex; flex-direction: column; gap: 14px;
  max-width: 500px; margin: 0 auto; width: 100%;
}

.tabs { display: flex; border: 1px solid #d0d7de; border-radius: 8px; overflow: hidden; }
.tab {
  flex: 1; padding: 9px 4px; border: none; background: #f6f8fa;
  font-size: 13px; font-weight: 500; color: #666; cursor: pointer;
}
.tab.active { background: white; color: #0969da; font-weight: 600; }

.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 12px;
  font-size: 13px; font-weight: 500; align-self: flex-start;
}
.type-badge.url    { background: #ddf4ff; color: #0550ae; }
.type-badge.create { background: #dafbe1; color: #116329; }

.body-input {
  width: 100%; padding: 12px; border: 1px solid #d0d7de; border-radius: 8px;
  font-size: 15px; line-height: 1.6; resize: vertical; outline: none;
  font-family: inherit; background: white;
}
.body-input:focus { border-color: #0969da; box-shadow: 0 0 0 3px rgba(9,105,218,0.1); }

.text-input {
  width: 100%; padding: 10px 12px; border: 1px solid #d0d7de;
  border-radius: 8px; font-size: 15px; outline: none; background: white;
}
.text-input:focus { border-color: #0969da; box-shadow: 0 0 0 3px rgba(9,105,218,0.1); }

.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 14px; font-weight: 600; color: #444; }
.optional { font-size: 12px; font-weight: 400; color: #888; }

.radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
.radio-btn {
  padding: 8px 12px; border: 1px solid #d0d7de; border-radius: 8px;
  background: white; font-size: 14px; color: #444; flex: 1; cursor: pointer;
}
.radio-btn.active { background: #0969da; color: white; border-color: #0969da; }

.checkbox-list { display: flex; flex-direction: column; gap: 8px; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #444; cursor: pointer; }
.checkbox-row input { width: 16px; height: 16px; }

.coming-soon {
  text-align: center; padding: 40px 20px; color: #888; font-size: 16px;
}

.error  { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }

.submit-btn {
  width: 100%; padding: 14px; background: #0969da; color: white;
  border: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-top: 4px;
  cursor: pointer;
}
.submit-btn:disabled { opacity: 0.5; cursor: default; }
</style>
```

- [ ] **Step 2: 验证 build**

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run build 2>&1 | tail -3
```

预期：`✓ built in ...ms`

- [ ] **Step 3: Commit**

```bash
cd /Users/fusong/wavesnow/wave-todo
git add src/views/WritingForm.vue
git commit -m "feat: WritingForm with rewrite/mini/toutiao/novel tabs"
```

---

## Task 4: PublishForm.vue — 发布任务

**Files:**
- Modify: `wave-todo/src/views/PublishForm.vue`

从原 TaskForm.vue 的发布逻辑提取，加返回按钮。

- [ ] **Step 1: 实现 PublishForm.vue**

```vue
<template>
  <div class="form-page">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">←</button>
      <h1>发布任务</h1>
      <div style="width:36px"></div>
    </header>

    <div class="form-body">
      <div class="field">
        <label class="field-label">公众号</label>
        <div class="radio-group">
          <button v-for="t in pubTargets" :key="t"
            :class="['radio-btn', pub.target===t&&'active']"
            @click="pub.target=t">{{ t }}</button>
        </div>
      </div>

      <div class="field">
        <label class="field-label">文章类型</label>
        <div class="radio-group">
          <button :class="['radio-btn', pub.articleType==='mini'&&'active']" @click="pub.articleType='mini'">mini 图文</button>
          <button :class="['radio-btn', pub.articleType==='long'&&'active']" @click="pub.articleType='long'">长文</button>
        </div>
      </div>

      <div class="field">
        <label class="field-label">系列 <span class="optional">（可选，不填则随机）</span></label>
        <input v-model="pub.series" class="text-input" placeholder="例：成长的箴言"/>
      </div>

      <div class="field">
        <label class="field-label">指定文件路径 <span class="optional">（可选，不填则随机选一篇）</span></label>
        <input v-model="pub.source" class="text-input" placeholder="~/wavesnow/article-drafts/mini/once/..."/>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">✅ 任务已提交</p>

      <button class="submit-btn" :disabled="!pub.target || submitting" @click="handleSubmit">
        {{ submitting ? '提交中...' : '提交任务' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'
import { useGitHub } from '../composables/useGitHub.js'

const router = useRouter()
const storage = useStorage()

const pub = ref({ target: 'once', articleType: 'mini', series: '', source: '' })
const pubTargets = ['once', 'snow', 'system']
const submitting = ref(false)
const error = ref('')
const success = ref(false)

function nowStr() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return {
    date: `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`,
    time: `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    created: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  }
}

function buildFile() {
  const { date, time, created } = nowStr()
  const filename = `${date}-${time}.article-publish.md`
  const lines = ['---', `created: ${created}`, `target: ${pub.value.target}`, `article_type: ${pub.value.articleType}`]
  if (pub.value.series.trim())  lines.push(`series: ${pub.value.series.trim()}`)
  if (pub.value.source.trim())  lines.push(`source: ${pub.value.source.trim()}`)
  lines.push('', '---', '')
  return { filename, content: lines.join('\n') }
}

async function handleSubmit() {
  error.value = ''
  success.value = false
  submitting.value = true
  const token = storage.getToken()
  const repo = storage.getRepo()
  try {
    const gh = useGitHub(token)
    const { filename, content } = buildFile()
    await gh.putFile(repo.owner, repo.repo, `pending/${filename}`, content, `task: ${filename}`)
    success.value = true
    setTimeout(() => {
      success.value = false
      pub.value = { target: 'once', articleType: 'mini', series: '', source: '' }
    }, 3000)
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') { storage.clearToken(); router.push('/setup') }
    else if (e.message.startsWith('RATE_LIMIT:')) {
      const reset = parseInt(e.message.split(':')[1])
      error.value = reset ? `GitHub API 限流，约 ${Math.ceil((reset*1000-Date.now())/60000)} 分钟后恢复` : 'GitHub API 限流，请稍后重试'
    } else {
      error.value = `提交失败：${e.message}`
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-page { min-height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: white; border-bottom: 1px solid #e8e8e8; }
.header h1 { font-size: 18px; font-weight: 700; }
.back-btn { background: none; border: none; font-size: 20px; padding: 4px 8px; color: #444; border-radius: 6px; cursor: pointer; }
.back-btn:hover { background: #f0f0f0; }
.form-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; max-width: 500px; margin: 0 auto; width: 100%; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 14px; font-weight: 600; color: #444; }
.optional { font-size: 12px; font-weight: 400; color: #888; }
.radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
.radio-btn { padding: 8px 14px; border: 1px solid #d0d7de; border-radius: 8px; background: white; font-size: 14px; color: #444; flex: 1; cursor: pointer; }
.radio-btn.active { background: #0969da; color: white; border-color: #0969da; }
.text-input { width: 100%; padding: 10px 12px; border: 1px solid #d0d7de; border-radius: 8px; font-size: 15px; outline: none; background: white; }
.text-input:focus { border-color: #0969da; box-shadow: 0 0 0 3px rgba(9,105,218,0.1); }
.error  { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }
.submit-btn { width: 100%; padding: 14px; background: #0969da; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
.submit-btn:disabled { opacity: 0.5; cursor: default; }
</style>
```

- [ ] **Step 2: 验证 build**

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
cd /Users/fusong/wavesnow/wave-todo
git add src/views/PublishForm.vue
git commit -m "feat: PublishForm for article-publish tasks"
```

---

## Task 5: AdhocForm.vue — 临时任务

**Files:**
- Modify: `wave-todo/src/views/AdhocForm.vue`

- [ ] **Step 1: 实现 AdhocForm.vue**

```vue
<template>
  <div class="form-page">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">←</button>
      <h1>临时任务</h1>
      <div style="width:36px"></div>
    </header>

    <div class="form-body">
      <!-- 触发日报 -->
      <div class="action-card">
        <div class="action-info">
          <div class="action-title">📋 触发日报</div>
          <div class="action-desc">生成昨日工作日报</div>
        </div>
        <button class="action-btn"
          :disabled="journalSubmitting"
          @click="triggerJournal">
          {{ journalSubmitting ? '提交中...' : '触发' }}
        </button>
      </div>
      <p v-if="journalError" class="error">{{ journalError }}</p>
      <p v-if="journalSuccess" class="success">✅ 日报任务已提交</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'
import { useGitHub } from '../composables/useGitHub.js'

const router = useRouter()
const storage = useStorage()

const journalSubmitting = ref(false)
const journalError = ref('')
const journalSuccess = ref(false)

function nowStr() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return {
    date: `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`,
    time: `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    created: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  }
}

async function triggerJournal() {
  journalError.value = ''
  journalSuccess.value = false
  journalSubmitting.value = true
  const token = storage.getToken()
  const repo = storage.getRepo()
  try {
    const gh = useGitHub(token)
    const { date, time, created } = nowStr()
    const filename = `${date}-${time}.journal.md`
    const content = `---\ncreated: ${created}\n\n---\n\n生成昨日工作日报\n`
    await gh.putFile(repo.owner, repo.repo, `pending/${filename}`, content, `task: ${filename}`)
    journalSuccess.value = true
    setTimeout(() => { journalSuccess.value = false }, 3000)
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') { storage.clearToken(); router.push('/setup') }
    else if (e.message.startsWith('RATE_LIMIT:')) {
      const reset = parseInt(e.message.split(':')[1])
      journalError.value = reset ? `GitHub API 限流，约 ${Math.ceil((reset*1000-Date.now())/60000)} 分钟后恢复` : 'GitHub API 限流，请稍后重试'
    } else {
      journalError.value = `提交失败：${e.message}`
    }
  } finally {
    journalSubmitting.value = false
  }
}
</script>

<style scoped>
.form-page { min-height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: white; border-bottom: 1px solid #e8e8e8; }
.header h1 { font-size: 18px; font-weight: 700; }
.back-btn { background: none; border: none; font-size: 20px; padding: 4px 8px; color: #444; border-radius: 6px; cursor: pointer; }
.back-btn:hover { background: #f0f0f0; }
.form-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 500px; margin: 0 auto; width: 100%; }

.action-card {
  display: flex; align-items: center; justify-content: space-between;
  background: white; border-radius: 12px; padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.action-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.action-desc  { font-size: 13px; color: #888; margin-top: 2px; }
.action-btn {
  padding: 8px 18px; background: #0969da; color: white; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; flex-shrink: 0;
}
.action-btn:disabled { opacity: 0.5; cursor: default; }
.error  { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }
</style>
```

- [ ] **Step 2: 验证 build**

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
cd /Users/fusong/wavesnow/wave-todo
git add src/views/AdhocForm.vue
git commit -m "feat: AdhocForm with journal trigger"
```

---

## Task 6: 清理 + 部署

**Files:**
- Delete: `wave-todo/src/views/TaskForm.vue`

- [ ] **Step 1: 删除旧的 TaskForm.vue**

```bash
rm /Users/fusong/wavesnow/wave-todo/src/views/TaskForm.vue
```

- [ ] **Step 2: 确认 build 仍然通过**

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run build 2>&1 | tail -3
```

预期：`✓ built in ...ms`（无 TaskForm 引用报错）

- [ ] **Step 3: 端到端验证**

打开 `http://localhost:5173/wave-todo/`：
- 首页显示三张卡片
- 点"写作任务"进入 WritingForm，四个 Tab 均可切换
- 点"发布任务"进入 PublishForm
- 点"临时任务"进入 AdhocForm，有"触发日报"按钮
- 每个页面左上角"←"返回首页
- ⚙ 按钮（首页）进入 Setup

```bash
cd /Users/fusong/wavesnow/wave-todo
npm run dev
```

- [ ] **Step 4: Commit 并推送**

```bash
cd /Users/fusong/wavesnow/wave-todo
git add -A
git commit -m "feat: remove TaskForm, wave-todo redesign complete"
git push
```
