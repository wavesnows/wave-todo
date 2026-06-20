<template>
  <div class="form-page">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">←</button>
      <h1>发布任务</h1>
      <div style="width:36px"></div>
    </header>

    <div class="form-body">
      <div class="field">
        <label class="field-label">平台</label>
        <div class="radio-group">
          <button v-for="t in pubTargets" :key="t"
            :class="['radio-btn', pub.target===t&&'active']"
            @click="pub.target=t">{{ t }}</button>
        </div>
      </div>

      <div v-if="pub.target !== 'toutiao'" class="field">
        <label class="field-label">文章类型</label>
        <div class="radio-group">
          <button :class="['radio-btn', pub.articleType==='mini'&&'active']" @click="pub.articleType='mini'">mini 图文</button>
          <button :class="['radio-btn', pub.articleType==='long'&&'active']" @click="pub.articleType='long'">长文</button>
          <button :class="['radio-btn', pub.articleType==='novel'&&'active']" @click="pub.articleType='novel'">小说</button>
        </div>
      </div>

      <!-- 小说专属字段 -->
      <template v-if="pub.articleType==='novel' && pub.target !== 'toutiao'">
        <div class="field">
          <label class="field-label">选择小说</label>
          <select v-model="pub.novel" class="text-input">
            <option value="AI学走我的代码，学不走我的判断">AI学走我的代码，学不走我的判断</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">指定章节 <span class="optional">（可选，不填则自动发下一章）</span></label>
          <input v-model="pub.chapter" class="text-input" placeholder="不填 = 自动顺序发布"/>
        </div>
      </template>

      <!-- 非小说类型显示系列/文件路径 -->
      <template v-if="pub.articleType!=='novel' && pub.target !== 'toutiao'">
        <div class="field">
          <label class="field-label">系列 <span class="optional">（可选，不填则随机）</span></label>
          <input v-model="pub.series" class="text-input" placeholder="例：成长的箴言"/>
        </div>

        <div class="field">
          <label class="field-label">指定文件路径 <span class="optional">（可选，不填则随机选一篇）</span></label>
          <input v-model="pub.source" class="text-input" placeholder="起源/伽利略 或 ~/完整路径"/>
        </div>
      </template>

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

const pub = ref({ target: 'once', articleType: 'mini', series: '', source: '', novel: '', chapter: '' })
const pubTargets = ['once', 'snow', 'system', 'toutiao']
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
  const isToutiao = pub.value.target === 'toutiao'
  const isNovel = pub.value.articleType === 'novel' && !isToutiao

  // 小说发布 → novel-publish 任务
  if (isNovel) {
    const filename = `${date}-${time}.novel-publish.md`
    const lines = ['---', `created: ${created}`, `target: ${pub.value.target}`, `novel: ${pub.value.novel}`]
    if (pub.value.chapter.trim()) lines.push(`chapter: ${pub.value.chapter.trim()}`)
    lines.push('', '---', '')
    return { filename, content: lines.join('\n') }
  }

  // 原有 article-publish / article-toutiao-publish 逻辑
  const taskType = isToutiao ? 'article-toutiao-publish' : 'article-publish'
  const filename = `${date}-${time}.${taskType}.md`
  const lines = ['---', `created: ${created}`]
  if (!isToutiao) {
    lines.push(`target: ${pub.value.target}`)
    lines.push(`article_type: ${pub.value.articleType}`)
  } else {
    lines.push(`article_type: long`)
  }
  if (pub.value.series.trim())  lines.push(`series: ${pub.value.series.trim()}`)
  if (pub.value.source.trim()) {
    const src = pub.value.source.trim()
    // 全路径直接用，否则拼接 {draftsDir}/{articleType}/{target}/ 前缀
    const effectiveType = isToutiao ? 'long' : pub.value.articleType
    const draftsDir = storage.getDraftsDir().replace(/\/$/, '')
    const fullSrc = (src.startsWith('/') || src.startsWith('~'))
      ? src
      : `${draftsDir}/${effectiveType}/${pub.value.target}/${src}`
    lines.push(`source: ${fullSrc}`)
  }
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
      pub.value = { target: 'once', articleType: 'mini', series: '', source: '', novel: '', chapter: '' }
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
