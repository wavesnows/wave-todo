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
.action-card { display: flex; align-items: center; justify-content: space-between; background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.action-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.action-desc  { font-size: 13px; color: #888; margin-top: 2px; }
.action-btn { padding: 8px 18px; background: #0969da; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; flex-shrink: 0; }
.action-btn:disabled { opacity: 0.5; cursor: default; }
.error  { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }
</style>
