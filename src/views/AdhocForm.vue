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
        <button class="action-btn" :disabled="journalSubmitting" @click="triggerJournal">
          {{ journalSubmitting ? '提交中...' : '触发' }}
        </button>
      </div>
      <p v-if="journalError" class="error">{{ journalError }}</p>
      <p v-if="journalSuccess" class="success">✅ 日报任务已提交</p>

      <!-- 同步仓库 -->
      <div class="action-card">
        <div class="action-info">
          <div class="action-title">☁️ 同步仓库</div>
          <div class="action-desc">推送文章仓库到 GitHub</div>
        </div>
        <button class="action-btn" :disabled="syncSubmitting" @click="showSyncPanel = !showSyncPanel">
          选择
        </button>
      </div>

      <!-- 同步选项面板 -->
      <div v-if="showSyncPanel" class="sync-panel">
        <div class="field-label">选择仓库（不选则同步全部）</div>
        <div class="checkbox-list">
          <label v-for="r in syncRepoOptions" :key="r.value" class="checkbox-row">
            <input type="checkbox" :value="r.value" v-model="selectedRepos"/>
            <span>{{ r.label }}</span>
          </label>
        </div>
        <button class="submit-btn" :disabled="syncSubmitting" @click="triggerSync">
          {{ syncSubmitting ? '提交中...' : '立即同步' }}
        </button>
      </div>
      <p v-if="syncError" class="error">{{ syncError }}</p>
      <p v-if="syncSuccess" class="success">✅ 同步任务已提交</p>
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

// ── 日报 ──────────────────────────────────────────────────
const journalSubmitting = ref(false)
const journalError = ref('')
const journalSuccess = ref(false)

// ── 同步仓库 ──────────────────────────────────────────────
const showSyncPanel = ref(false)
const syncSubmitting = ref(false)
const syncError = ref('')
const syncSuccess = ref(false)
const selectedRepos = ref([])
const syncRepoOptions = [
  { value: 'article-drafts', label: 'article-drafts（文章草稿）' },
  { value: 'article-wx',     label: 'article-wx（微信已发布）' },
  { value: 'article-tt',     label: 'article-tt（头条已发布）' },
  { value: 'article-txt',    label: 'article-txt（素材库）' },
]

function nowStr() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return {
    date: `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`,
    time: `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
    created: `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  }
}

async function submitTask(filename, content) {
  const token = storage.getToken()
  const repo = storage.getRepo()
  const gh = useGitHub(token)
  await gh.putFile(repo.owner, repo.repo, `pending/${filename}`, content, `task: ${filename}`)
}

function handleError(e, errorRef) {
  if (e.message === 'UNAUTHORIZED') { storage.clearToken(); router.push('/setup') }
  else if (e.message.startsWith('RATE_LIMIT:')) {
    const reset = parseInt(e.message.split(':')[1])
    errorRef.value = reset ? `GitHub API 限流，约 ${Math.ceil((reset*1000-Date.now())/60000)} 分钟后恢复` : 'GitHub API 限流，请稍后重试'
  } else {
    errorRef.value = `提交失败：${e.message}`
  }
}

async function triggerJournal() {
  journalError.value = ''
  journalSuccess.value = false
  journalSubmitting.value = true
  try {
    const { date, time, created } = nowStr()
    const filename = `${date}-${time}.journal.md`
    const content = `---\ncreated: ${created}\n\n---\n\n生成昨日工作日报\n`
    await submitTask(filename, content)
    journalSuccess.value = true
    setTimeout(() => { journalSuccess.value = false }, 3000)
  } catch (e) {
    handleError(e, journalError)
  } finally {
    journalSubmitting.value = false
  }
}

async function triggerSync() {
  syncError.value = ''
  syncSuccess.value = false
  syncSubmitting.value = true
  try {
    const { date, time, created } = nowStr()
    const filename = `${date}-${time}.sync-repos.md`
    const repos = selectedRepos.value.join(',')
    const reposLine = repos ? `repos: ${repos}\n` : ''
    const content = `---\ncreated: ${created}\n${reposLine}\n---\n\n同步文章仓库到 GitHub\n`
    await submitTask(filename, content)
    syncSuccess.value = true
    showSyncPanel.value = false
    selectedRepos.value = []
    setTimeout(() => { syncSuccess.value = false }, 3000)
  } catch (e) {
    handleError(e, syncError)
  } finally {
    syncSubmitting.value = false
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
.action-card { display: flex; align-items: center; justify-content: space-between; background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.action-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.action-desc  { font-size: 13px; color: #888; margin-top: 2px; }
.action-btn { padding: 8px 18px; background: #0969da; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; flex-shrink: 0; }
.action-btn:disabled { opacity: 0.5; cursor: default; }
.sync-panel { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 12px; }
.field-label { font-size: 14px; font-weight: 600; color: #444; }
.checkbox-list { display: flex; flex-direction: column; gap: 8px; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #444; cursor: pointer; }
.checkbox-row input { width: 16px; height: 16px; }
.submit-btn { width: 100%; padding: 12px; background: #1a7f37; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
.submit-btn:disabled { opacity: 0.5; cursor: default; }
.error  { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }
</style>
