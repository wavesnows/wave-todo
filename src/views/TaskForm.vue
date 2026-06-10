<template>
  <div class="form-page">
    <!-- 顶部导航 -->
    <header class="header">
      <h1>wave-todo</h1>
      <button class="icon-btn" @click="router.push('/setup')" title="设置">⚙</button>
    </header>

    <div class="form-body">

      <!-- 任务类型 Tab -->
      <div class="tabs">
        <button
          :class="['tab', activeTab === 'rewrite' && 'active']"
          @click="activeTab = 'rewrite'"
        >改写 / 创作</button>
        <button
          :class="['tab', activeTab === 'mini' && 'active']"
          @click="activeTab = 'mini'"
        >mini 图文</button>
      </div>

      <!-- ── 改写 / 创作 表单 ── -->
      <template v-if="activeTab === 'rewrite'">
        <!-- 正文类型自动检测标签 -->
        <div class="type-badge" :class="contentType">
          {{ contentType === 'url' ? '改写文章' : '自由创作' }}
        </div>

        <textarea
          v-model="rw.body"
          class="body-input"
          placeholder="粘贴 URL 或写想法..."
          rows="6"
          @input="detectContentType"
        />

        <div class="field">
          <label class="field-label">目标公众号</label>
          <div class="radio-group">
            <button
              v-for="t in rwTargets"
              :key="t"
              :class="['radio-btn', rw.target === t && 'active']"
              @click="rw.target = t"
            >{{ t === 'auto' ? '自动' : t }}</button>
          </div>
        </div>

        <div class="field">
          <label class="field-label">选项</label>
          <div class="checkbox-list">
            <label class="checkbox-row">
              <input type="checkbox" v-model="rw.autoPublish" />
              <span>自动发布到草稿箱</span>
            </label>
            <label class="checkbox-row">
              <input type="checkbox" v-model="rw.withCover" />
              <span>生成头图</span>
            </label>
          </div>
        </div>
      </template>

      <!-- ── mini 图文 表单 ── -->
      <template v-if="activeTab === 'mini'">
        <div class="field">
          <label class="field-label">系列</label>
          <div class="radio-group">
            <button
              v-for="s in miniSeries"
              :key="s.value"
              :class="['radio-btn', mini.series === s.value && 'active']"
              @click="mini.series = s.value"
            >{{ s.label }}</button>
          </div>
        </div>

        <div class="field">
          <label class="field-label">指定条目 <span class="optional">（可选，不填则自动选题）</span></label>
          <label class="field-label">指定条目 <span class="optional">（可选，不填则自动选题）</span></label>
          <input
            v-model="mini.entry"
            class="text-input"
            placeholder="例：伽利略"
          />
        </div>
      </template>

      <!-- 错误 / 成功提示 -->
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">✅ 任务已提交</p>

      <!-- 提交按钮 -->
      <button
        class="submit-btn"
        :disabled="submitDisabled || submitting"
        @click="handleSubmit"
      >
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

// ── Tab ──────────────────────────────────────────────────────
const activeTab = ref('rewrite')

// ── 改写/创作 表单状态 ────────────────────────────────────────
const rw = ref({
  body: '',
  target: 'auto',
  autoPublish: false,
  withCover: true,
})
const contentType = ref('create')
const rwTargets = ['auto', 'once', 'snow', 'system']

function detectContentType() {
  const firstLine = rw.value.body.split('\n')[0].trim()
  contentType.value = /^https?:\/\//.test(firstLine) ? 'url' : 'create'
}

// ── mini 图文 表单状态 ─────────────────────────────────────────
const mini = ref({
  series: '起源',
  entry: '',
})
const miniSeries = [
  { value: '起源',   label: '起源',   account: 'once' },
  { value: '一事一悟', label: '一事一悟', account: 'once' },
]

// ── 提交按钮禁用逻辑 ──────────────────────────────────────────
const submitDisabled = computed(() => {
  if (activeTab.value === 'rewrite') return !rw.value.body.trim()
  if (activeTab.value === 'mini') return !mini.value.series
  return true
})

// ── 公共工具 ──────────────────────────────────────────────────
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

// ── 改写/创作：生成文件 ───────────────────────────────────────
function buildRewriteFile() {
  const { date, time, created } = nowStr()
  const filename = `${date}-${time}.article-rewrite.md`
  const lines = ['---', `created: ${created}`]
  if (rw.value.target !== 'auto') lines.push(`target: ${rw.value.target}`)
  lines.push(`auto_publish: ${rw.value.autoPublish}`)
  lines.push(`no_cover: ${!rw.value.withCover}`)
  lines.push('', '---', '', rw.value.body.trim(), '')
  return { filename, content: lines.join('\n') }
}

// ── mini 图文：生成文件 ───────────────────────────────────────
function buildMiniFile() {
  const { date, time, created } = nowStr()
  const filename = `${date}-${time}.article-mini.md`
  const seriesCfg = miniSeries.find(s => s.value === mini.value.series)
  const account = seriesCfg ? seriesCfg.account : 'once'
  const lines = ['---', `created: ${created}`, `series: ${mini.value.series}`, `account: ${account}`]
  if (mini.value.entry.trim()) lines.push(`entry: ${mini.value.entry.trim()}`)
  lines.push('', '---', '')
  return { filename, content: lines.join('\n') }
}

// ── 提交 ──────────────────────────────────────────────────────
async function handleSubmit() {
  error.value = ''
  success.value = false
  submitting.value = true

  const token = storage.getToken()
  const repo = storage.getRepo()

  try {
    const gh = useGitHub(token)
    const { filename, content } = activeTab.value === 'mini'
      ? buildMiniFile()
      : buildRewriteFile()

    await gh.putFile(repo.owner, repo.repo, `pending/${filename}`, content, `task: ${filename}`)

    success.value = true
    setTimeout(() => {
      success.value = false
      if (activeTab.value === 'rewrite') {
        rw.value = { body: '', target: 'auto', autoPublish: false, withCover: true }
        contentType.value = 'create'
      } else {
        mini.value = { series: '起源', entry: '' }
      }
    }, 3000)
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      storage.clearToken()
      router.push('/setup')
    } else if (e.message.startsWith('RATE_LIMIT:')) {
      const reset = parseInt(e.message.split(':')[1])
      error.value = reset
        ? `GitHub API 限流，约 ${Math.ceil((reset * 1000 - Date.now()) / 60000)} 分钟后恢复`
        : 'GitHub API 限流，请稍后重试'
    } else {
      error.value = `提交失败：${e.message}`
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.form-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
}
.icon-btn:hover { background: #f0f0f0; }

.form-body {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
}

/* ── Tabs ── */
.tabs {
  display: flex;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
}
.tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f6f8fa;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
}
.tab.active {
  background: white;
  color: #0969da;
  font-weight: 600;
}

/* ── 改写 type badge ── */
.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  align-self: flex-start;
}
.type-badge.url { background: #ddf4ff; color: #0550ae; }
.type-badge.create { background: #dafbe1; color: #116329; }

/* ── 输入框 ── */
.body-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  font-family: inherit;
  background: white;
}
.body-input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9,105,218,0.1);
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  background: white;
}
.text-input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9,105,218,0.1);
}

/* ── Fields ── */
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 14px; font-weight: 600; color: #444; }
.optional { font-size: 12px; font-weight: 400; color: #888; }

.radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
.radio-btn {
  padding: 8px 16px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  color: #444;
  flex: 1;
}
.radio-btn.active {
  background: #0969da;
  color: white;
  border-color: #0969da;
}

.checkbox-list { display: flex; flex-direction: column; gap: 8px; }
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #444;
  cursor: pointer;
}
.checkbox-row input { width: 16px; height: 16px; }

/* ── 状态 & 提交 ── */
.error { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #0969da;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 4px;
}
.submit-btn:disabled { opacity: 0.5; cursor: default; }
</style>
