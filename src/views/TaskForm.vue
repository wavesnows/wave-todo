<template>
  <div class="form-page">
    <!-- 顶部导航 -->
    <header class="header">
      <h1>wave-todo</h1>
      <button class="icon-btn" @click="router.push('/setup')" title="设置">⚙</button>
    </header>

    <div class="form-body">
      <!-- 任务类型检测标签 -->
      <div class="type-badge" :class="taskType">
        {{ taskType === 'rewrite' ? '改写文章' : '自由创作' }}
      </div>

      <!-- 正文输入 -->
      <textarea
        v-model="body"
        class="body-input"
        placeholder="粘贴 URL 或写想法..."
        rows="6"
        @input="detectType"
      />

      <!-- 目标公众号 -->
      <div class="field">
        <label class="field-label">目标公众号</label>
        <div class="radio-group">
          <button
            v-for="t in targets"
            :key="t"
            :class="['radio-btn', target === t && 'active']"
            @click="target = t"
          >
            {{ t === 'auto' ? '自动' : t }}
          </button>
        </div>
      </div>

      <!-- 选项 -->
      <div class="field">
        <label class="field-label">选项</label>
        <div class="checkbox-list">
          <label class="checkbox-row">
            <input type="checkbox" v-model="autoPublish" />
            <span>自动发布到草稿箱</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" v-model="withCover" />
            <span>生成头图</span>
          </label>
        </div>
      </div>

      <!-- 错误 / 成功提示 -->
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">✅ 任务已提交</p>

      <!-- 提交按钮 -->
      <button
        class="submit-btn"
        :disabled="!body.trim() || submitting"
        @click="handleSubmit"
      >
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

const body = ref('')
const target = ref('auto')
const autoPublish = ref(false)
const withCover = ref(true)
const taskType = ref('create')
const submitting = ref(false)
const error = ref('')
const success = ref(false)

const targets = ['auto', 'once', 'snow', 'system']

function detectType() {
  const firstLine = body.value.split('\n')[0].trim()
  taskType.value = /^https?:\/\//.test(firstLine) ? 'rewrite' : 'create'
}

function buildFilename() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `${date}-${time}.article-rewrite.md`
}

function buildContent() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const created = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  const lines = [
    '---',
    `created: ${created}`,
  ]
  if (target.value !== 'auto') lines.push(`target: ${target.value}`)
  lines.push(`auto_publish: ${autoPublish.value}`)
  lines.push(`no_cover: ${!withCover.value}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(body.value.trim())
  lines.push('')
  return lines.join('\n')
}

async function handleSubmit() {
  error.value = ''
  success.value = false
  submitting.value = true

  const token = storage.getToken()
  const repo = storage.getRepo()

  try {
    const gh = useGitHub(token)
    const filename = buildFilename()
    const content = buildContent()
    const path = `pending/${filename}`
    const message = `task: ${filename}`

    await gh.putFile(repo.owner, repo.repo, path, content, message)

    success.value = true
    setTimeout(() => {
      success.value = false
      body.value = ''
      target.value = 'auto'
      autoPublish.value = false
      withCover.value = true
      taskType.value = 'create'
    }, 3000)
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      storage.clearToken()
      router.push('/setup')
    } else if (e.message.startsWith('RATE_LIMIT:')) {
      const reset = parseInt(e.message.split(':')[1])
      if (reset) {
        const mins = Math.ceil((reset * 1000 - Date.now()) / 60000)
        error.value = `GitHub API 限流，约 ${mins} 分钟后恢复`
      } else {
        error.value = 'GitHub API 限流，请稍后重试'
      }
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

.header h1 {
  font-size: 20px;
  font-weight: 700;
}

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

.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  align-self: flex-start;
}

.type-badge.rewrite {
  background: #ddf4ff;
  color: #0550ae;
}

.type-badge.create {
  background: #dafbe1;
  color: #116329;
}

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

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.radio-group {
  display: flex;
  gap: 8px;
}

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

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #444;
  cursor: pointer;
}

.checkbox-row input {
  width: 16px;
  height: 16px;
}

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
