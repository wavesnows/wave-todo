import { submitGitHub } from '../shared/task-builder.mjs'
// src/composables/useGitHub.js
const BASE = 'https://api.github.com'

export function useGitHub(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }

  async function request(url, options = {}) {
    const res = await fetch(url, { headers, ...options })
    if (res.status === 401) throw new Error('UNAUTHORIZED')
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get('X-RateLimit-Reset')
      throw new Error(`RATE_LIMIT:${reset || 0}`)
    }
    return res
  }

  async function validateToken() {
    const res = await request(`${BASE}/user`)
    if (!res.ok) throw new Error('Invalid token')
    return await res.json()
  }

  async function searchRepos(query) {
    const res = await request(
      `${BASE}/search/repositories?q=${encodeURIComponent(query)}&per_page=10`
    )
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    return (data.items || []).map(r => ({
      full_name: r.full_name,
      description: r.description,
      private: r.private,
    }))
  }

  async function putFile(owner, repo, path, content, message) {
    const base64 = btoa(unescape(encodeURIComponent(content)))
    const res = await request(
      `${BASE}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({ message, content: base64 }),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Write failed: ${res.status}`)
    }
    return await res.json()
  }

  async function queueTask(owner, repo, task) {
    const key = 'wavetodo_pending_submission'
    const saved = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (saved) {
      if (saved.repo !== `${owner}/${repo}` || saved.task.receipt.fingerprint !== task.receipt.fingerprint)
        throw new Error('有待确认提交，请先使用上方“待确认任务”重试或核查。')
      task = saved.task
    }
    sessionStorage.setItem(key, JSON.stringify({repo:`${owner}/${repo}`,task}))
    window.dispatchEvent(new Event('wave-pending-changed'))
    const result = await submitGitHub(async (method, path, body) => {
      const response = await request(`${BASE}${path}`, {method,
        ...(body === undefined ? {} : {body:JSON.stringify(body)}),
        signal:AbortSignal.timeout(15000)})
      if (!response.ok) {
        const error = new Error(`队列服务返回 ${response.status}，请用原请求重试`)
        error.status = response.status
        throw error
      }
      return response.json()
    }, `${owner}/${repo}`, task)
    sessionStorage.removeItem(key)
    window.dispatchEvent(new Event('wave-pending-changed'))
    return result
  }

  return { validateToken, searchRepos, putFile, queueTask }
}
