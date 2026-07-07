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
        <div class="badge-row">
          <div :class="['type-badge', contentType==='url' ? 'url' : 'create', 'clickable', contentType!=='material' ? 'active-badge' : '']"
               @click="contentType === 'material' ? contentType = 'create' : toggleContentType()">
            {{ contentType==='url' ? '改写文章' : '自由创作' }}
          </div>
          <div :class="['type-badge', 'material', contentType==='material' ? 'active' : '', 'clickable']"
               @click="contentType = contentType==='material' ? 'create' : 'material'">
            素材创作
          </div>
        </div>
        <textarea v-if="contentType !== 'material'" v-model="rw.body" class="body-input" placeholder="粘贴 URL 或写想法..." rows="6" @input="detectContentType"/>

        <!-- 素材创作：选系列 -->
        <template v-if="contentType === 'material'">
          <div class="field">
            <label class="field-label">系列 <span class="optional">（服务端本地素材库）</span></label>
            <select v-model="materialLib" class="text-input">
              <option value="once_hist">历史故事（once）</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">指定标题 <span class="optional">（可选，不填则自动选题）</span></label>
            <input v-model="materialTitle" class="text-input" placeholder="例：孙膑" />
          </div>
        </template>
        <div v-if="contentType !== 'material'" class="field">
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
          <label class="field-label">once 系列</label>
          <div class="radio-group">
            <button v-for="s in miniSeriesOnce" :key="s.value"
              :class="['radio-btn', mini.series===s.value&&'active']"
              @click="mini.series=s.value; mini.account=s.account">{{ s.label }}</button>
          </div>
        </div>
        <div class="field">
          <label class="field-label">从长文提取</label>
          <div class="radio-group">
            <button :class="['radio-btn', mini.series==='snow'&&'active']"
              @click="mini.series='snow'; mini.account='snow'">snow 图文</button>
            <button :class="['radio-btn', mini.series==='system'&&'active']"
              @click="mini.series='system'; mini.account='system'">system 图文</button>
          </div>
        </div>
        <div class="field">
          <label class="field-label">指定条目 <span class="optional">（可选）</span></label>
          <input v-model="mini.entry" class="text-input" placeholder="条目名，如：伽利略"/>
        </div>
        <div class="field">
          <label class="field-label">或指定 md 文件路径 <span class="optional">（可选，直接用已有文章）</span></label>
          <input v-model="mini.source" class="text-input" placeholder="article-wx 下的 md 文件路径"/>
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

      <!-- 小说写作 -->
      <template v-if="activeTab==='novel'">
        <div class="field">
          <label class="field-label">选择小说</label>
          <select v-model="nw.novel" class="text-input">
            <option value="西游：我看穿了所有大佬的底牌">西游：我看穿了所有大佬的底牌</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">指定章节 <span class="optional">（可选，不填则自动写下一张，指定则重写）</span></label>
          <input v-model.number="nw.chapter" type="number" min="1" class="text-input" placeholder="不填 = 自动写下一章"/>
        </div>
      </template>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">✅ 任务已提交</p>

      <button
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
const rw = ref({ body: '', target: 'auto', autoPublish: false, withCover: false })
const contentType = ref('create')  // 'url' | 'create' | 'material'
const materialLib = ref('once_hist')
const materialTitle = ref('')

// 在 url/create 之间切换（点击 badge 时）
function toggleContentType() {
  if (contentType.value === 'url') contentType.value = 'create'
  else if (contentType.value === 'create') contentType.value = 'url'
}
const rwTargets = ['auto', 'once', 'snow', 'system']

function detectContentType() {
  const firstLine = rw.value.body.split('\n')[0].trim()
  contentType.value = /^https?:\/\//.test(firstLine) ? 'url' : 'create'
}

// ── mini 图文 ──────────────────────────────────────────────
const mini = ref({ series: '起源', entry: '', source: '', account: 'once' })
const miniSeriesOnce = [
  { value: '起源',    label: '起源',    account: 'once' },
  { value: '一事一悟', label: '一事一悟', account: 'once' },
]

// ── 头条 ────────────────────────────────────────────────────
const tt = ref({ body: '', days: 7 })

// ── 小说写作 ──────────────────────────────────────────────
const nw = ref({ novel: '西游：我看穿了所有大佬的底牌', chapter: null })

// ── 提交禁用 ─────────────────────────────────────────────────
const submitDisabled = computed(() => {
  if (activeTab.value === 'rewrite') {
    if (contentType.value === 'material') return !materialLib.value
    return !rw.value.body.trim()
  }
  if (activeTab.value === 'mini')    return !mini.value.series
  if (activeTab.value === 'toutiao') return false
  if (activeTab.value === 'novel')   return !nw.value.novel
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
    // 素材创作：生成 article-long 任务
    if (contentType.value === 'material') {
      const filename = `${date}-${time}.article-long.md`
      const lines = ['---', `created: ${created}`]
      // source_lib 对应 config/series/*.yaml，target 从系列名推断
      const libTargetMap = {
        'once_hist': 'once',
      }
      const libTarget = libTargetMap[materialLib.value] || 'once'
      lines.push(`target: ${libTarget}`)
      lines.push(`source_lib: ${materialLib.value}`)
      if (materialTitle.value.trim()) lines.push(`title: ${materialTitle.value.trim()}`)
      lines.push(`no_publish: ${!rw.value.autoPublish}`)
      lines.push(`no_cover: ${!rw.value.withCover}`)
      lines.push('', '---', '')
      return { filename, content: lines.join('\n') }
    }
    // 普通改写/创作
    const filename = `${date}-${time}.article-rewrite.md`
    const lines = ['---', `created: ${created}`]
    if (rw.value.target !== 'auto') lines.push(`target: ${rw.value.target}`)
    lines.push(`no_publish: ${!rw.value.autoPublish}`)
    lines.push(`no_cover: ${!rw.value.withCover}`)
    lines.push('', '---', '', rw.value.body.trim(), '')
    return { filename, content: lines.join('\n') }
  }

  if (activeTab.value === 'mini') {
    const series = mini.value.series
    // once 系列用 article-mini，snow/system 用 article-diagram
    if (series === 'snow' || series === 'system') {
      const filename = `${date}-${time}.article-diagram.md`
      const lines = ['---', `created: ${created}`, 'auto: true', 'days: 30']
      lines.push('', '---', '')
      return { filename, content: lines.join('\n') }
    } else {
      const filename = `${date}-${time}.article-mini.md`
      const account = mini.value.account || 'once'
      const lines = ['---', `created: ${created}`, `series: ${series}`, `account: ${account}`]
      if (mini.value.entry.trim()) lines.push(`entry: ${mini.value.entry.trim()}`)
      if (mini.value.source.trim()) lines.push(`source: ${mini.value.source.trim()}`)
      lines.push('', '---', '')
      return { filename, content: lines.join('\n') }
    }
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

  if (activeTab.value === 'novel') {
    const filename = `${date}-${time}.novel-write.md`
    const lines = ['---', `created: ${created}`, `novel: ${nw.value.novel}`]
    if (nw.value.chapter) lines.push(`chapter: ${nw.value.chapter}`)
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
        rw.value = { body: '', target: 'auto', autoPublish: false, withCover: false }
        contentType.value = 'create'
        materialTitle.value = ''
      } else if (activeTab.value === 'mini') {
        mini.value = { series: '起源', entry: '' }
      } else if (activeTab.value === 'toutiao') {
        tt.value = { body: '', days: 7 }
      } else if (activeTab.value === 'novel') {
        nw.value = { novel: '西游：我看穿了所有大佬的底牌', chapter: null }
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
.header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: white; border-bottom: 1px solid #e8e8e8; }
.header h1 { font-size: 18px; font-weight: 700; }
.back-btn { background: none; border: none; font-size: 20px; padding: 4px 8px; color: #444; border-radius: 6px; cursor: pointer; }
.back-btn:hover { background: #f0f0f0; }
.form-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; max-width: 500px; margin: 0 auto; width: 100%; }
.tabs { display: flex; border: 1px solid #d0d7de; border-radius: 8px; overflow: hidden; }
.tab { flex: 1; padding: 9px 4px; border: none; background: #f6f8fa; font-size: 13px; font-weight: 500; color: #666; cursor: pointer; }
.tab.active { background: white; color: #0969da; font-weight: 600; }
.badge-row { display: flex; gap: 6px; align-items: center; }
.type-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 500; }
.type-badge.clickable { cursor: pointer; }
.type-badge.url    { background: #f0f0f0; color: #888; }
.type-badge.create { background: #f0f0f0; color: #888; }
.type-badge.url.active-badge    { background: #ddf4ff; color: #0550ae; }
.type-badge.create.active-badge { background: #dafbe1; color: #116329; }
.type-badge.material { background: #f0f0f0; color: #888; cursor: pointer; }
.type-badge.material.active { background: #fff3cd; color: #856404; }
.body-input { width: 100%; padding: 12px; border: 1px solid #d0d7de; border-radius: 8px; font-size: 15px; line-height: 1.6; resize: vertical; outline: none; font-family: inherit; background: white; }
.body-input:focus { border-color: #0969da; box-shadow: 0 0 0 3px rgba(9,105,218,0.1); }
.text-input { width: 100%; padding: 10px 12px; border: 1px solid #d0d7de; border-radius: 8px; font-size: 15px; outline: none; background: white; }
.text-input:focus { border-color: #0969da; box-shadow: 0 0 0 3px rgba(9,105,218,0.1); }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 14px; font-weight: 600; color: #444; }
.optional { font-size: 12px; font-weight: 400; color: #888; }
.radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
.radio-btn { padding: 8px 12px; border: 1px solid #d0d7de; border-radius: 8px; background: white; font-size: 14px; color: #444; flex: 1; cursor: pointer; }
.radio-btn.active { background: #0969da; color: white; border-color: #0969da; }
.checkbox-list { display: flex; flex-direction: column; gap: 8px; }
.checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #444; cursor: pointer; }
.checkbox-row input { width: 16px; height: 16px; }
.coming-soon { text-align: center; padding: 40px 20px; color: #888; font-size: 16px; }
.error  { color: #d1242f; font-size: 14px; }
.success { color: #1a7f37; font-size: 14px; font-weight: 500; }
.submit-btn { width: 100%; padding: 14px; background: #0969da; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; margin-top: 4px; cursor: pointer; }
.submit-btn:disabled { opacity: 0.5; cursor: default; }
</style>
