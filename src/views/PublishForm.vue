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
