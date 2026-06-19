// src/composables/useStorage.js
const TOKEN_KEY      = 'wavetodo_token'
const REPO_KEY       = 'wavetodo_repo'
const DRAFTS_DIR_KEY = 'wavetodo_drafts_dir'

export function useStorage() {
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || ''
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REPO_KEY)
  }

  function getRepo() {
    // 返回 { owner, repo } 或 null
    const raw = localStorage.getItem(REPO_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  function setRepo(owner, repo) {
    localStorage.setItem(REPO_KEY, JSON.stringify({ owner, repo }))
  }

  function getDraftsDir() {
    return localStorage.getItem(DRAFTS_DIR_KEY) || '~/wavesnow/article-drafts'
  }

  function setDraftsDir(dir) {
    localStorage.setItem(DRAFTS_DIR_KEY, dir)
  }

  return { getToken, setToken, clearToken, getRepo, setRepo, getDraftsDir, setDraftsDir }
}
