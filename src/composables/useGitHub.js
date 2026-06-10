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

  return { validateToken, searchRepos, putFile }
}
