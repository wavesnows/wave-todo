<template>
  <div class="setup-page">
    <div class="setup-card">
      <h1>wave-todo</h1>
      <p class="subtitle">配置 GitHub 访问权限</p>

      <!-- Step 1: Token -->
      <div class="section">
        <label class="label">GitHub Token</label>
        <div class="form-group">
          <input
            v-model="token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxx"
            :disabled="tokenSaved"
          />
          <p class="hint">
            需要 <code>repo</code> 权限。
            <a href="https://github.com/settings/tokens/new" target="_blank">生成 Token</a>
          </p>
        </div>
        <p v-if="tokenError" class="error">{{ tokenError }}</p>
        <button
          v-if="!tokenSaved"
          @click="handleSaveToken"
          :disabled="tokenLoading || !token.trim()"
        >
          {{ tokenLoading ? '验证中...' : '验证并保存' }}
        </button>
        <div v-else class="saved-row">
          <span class="check">✓ Token 已保存</span>
          <button class="link-btn" @click="handleResetToken">重置</button>
        </div>
      </div>

      <!-- Step 2: 仓库选择（Token 验证后才显示） -->
      <div v-if="tokenSaved" class="section">
        <label class="label">wave-tasks 仓库</label>
        <div v-if="savedRepo" class="saved-row">
          <span class="check">✓ {{ savedRepo.owner }}/{{ savedRepo.repo }}</span>
          <button class="link-btn" @click="savedRepo = null; searchQuery = ''">更换</button>
        </div>
        <template v-else>
          <div class="search-group">
            <input
              v-model="searchQuery"
              placeholder="搜索仓库名..."
              @input="handleSearch"
            />
          </div>
          <div v-if="searching" class="hint">搜索中...</div>
          <div v-if="searchError" class="error">{{ searchError }}</div>
          <ul v-if="searchResults.length" class="repo-list">
            <li
              v-for="r in searchResults"
              :key="r.full_name"
              @click="handleSelectRepo(r)"
              class="repo-item"
            >
              <span class="repo-name">{{ r.full_name }}</span>
              <span v-if="r.private" class="badge">私有</span>
              <p v-if="r.description" class="repo-desc">{{ r.description }}</p>
            </li>
          </ul>
        </template>
      </div>

      <!-- Step 3: 草稿目录 -->
      <div v-if="tokenSaved && savedRepo" class="section">
        <label class="label">草稿目录 <span style="font-size:12px;font-weight:400;color:#888">（article_drafts_dir）</span></label>
        <input v-model="draftsDir" class="input" placeholder="~/wavesnow/article-drafts" @blur="handleSaveDraftsDir" />
        <p class="hint">与 ~/.wave-engine/config.yaml 里的 article_drafts_dir 保持一致</p>
      </div>

      <button
        class="start-btn"
        :disabled="!tokenSaved || !savedRepo"
        @click="handleStart"
      >
        开始使用
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStorage } from '../composables/useStorage.js'
import { useGitHub } from '../composables/useGitHub.js'

const router = useRouter()
const storage = useStorage()

const token = ref('')
const tokenSaved = ref(false)
const tokenLoading = ref(false)
const tokenError = ref('')

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const searchError = ref('')
const savedRepo = ref(null)
const draftsDir = ref('')

let searchTimer = null

onMounted(() => {
  const t = storage.getToken()
  if (t) {
    token.value = t
    tokenSaved.value = true
  }
  draftsDir.value = storage.getDraftsDir()
  const r = storage.getRepo()
  if (r) savedRepo.value = r
})

async function handleSaveToken() {
  tokenLoading.value = true
  tokenError.value = ''
  try {
    const gh = useGitHub(token.value.trim())
    await gh.validateToken()
    storage.setToken(token.value.trim())
    tokenSaved.value = true
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      tokenError.value = 'Token 无效，请检查后重试'
    } else {
      tokenError.value = '验证失败，请稍后重试'
    }
  } finally {
    tokenLoading.value = false
  }
}

function handleResetToken() {
  storage.clearToken()
  token.value = ''
  tokenSaved.value = false
  savedRepo.value = null
}

function handleSearch() {
  clearTimeout(searchTimer)
  searchError.value = ''
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      const gh = useGitHub(storage.getToken())
      searchResults.value = await gh.searchRepos(searchQuery.value.trim())
    } catch {
      searchError.value = '搜索失败，请重试'
    } finally {
      searching.value = false
    }
  }, 400)
}

function handleSelectRepo(r) {
  const [owner, repo] = r.full_name.split('/')
  storage.setRepo(owner, repo)
  savedRepo.value = { owner, repo }
  searchResults.value = []
}

function handleSaveDraftsDir() {
  const dir = draftsDir.value.trim() || '~/wavesnow/article-drafts'
  draftsDir.value = dir
  storage.setDraftsDir(dir)
}

function handleStart() {
  router.push('/')
}
</script>

<style scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px 16px;
  padding-top: 40px;
}

.setup-card {
  background: white;
  border-radius: 12px;
  padding: 28px 20px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h1 { font-size: 26px; font-weight: 700; }
.subtitle { color: #666; font-size: 14px; margin-top: -12px; }

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: #444;
}

.form-group, .search-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
}

input:focus {
  border-color: #0969da;
  box-shadow: 0 0 0 3px rgba(9,105,218,0.1);
}

.hint { font-size: 12px; color: #666; }
.error { color: #d1242f; font-size: 14px; }

button {
  width: 100%;
  padding: 12px;
  background: #0969da;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
}

button:disabled { opacity: 0.5; cursor: default; }

.saved-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check { color: #1a7f37; font-size: 14px; font-weight: 500; }

.link-btn {
  width: auto;
  padding: 2px 8px;
  background: none;
  color: #0969da;
  font-size: 13px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
}

.repo-list {
  list-style: none;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
}

.repo-item {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.repo-item:last-child { border-bottom: none; }
.repo-item:hover { background: #f6f8fa; }

.repo-name { font-size: 14px; font-weight: 500; }

.badge {
  margin-left: 6px;
  font-size: 11px;
  padding: 1px 6px;
  background: #fff3cd;
  color: #856404;
  border-radius: 4px;
}

.repo-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.start-btn {
  background: #1a7f37;
  margin-top: 4px;
}
</style>
