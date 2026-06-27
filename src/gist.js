// useGist — reads and writes aurora_feeds.json in a GitHub Gist
// Credentials come from localStorage (set in Settings panel)

const GIST_FILE = 'aurora_feeds.json'

function headers(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

export async function gistLoad() {
  const id    = localStorage.getItem('aurora_gist_id')
  const token = localStorage.getItem('aurora_gist_token')
  if (!id || !token) return null
  try {
    const res  = await fetch(`https://api.github.com/gists/${id}`, { headers: headers(token) })
    const data = await res.json()
    const raw  = data.files?.[GIST_FILE]?.content
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function gistSave(payload) {
  const id    = localStorage.getItem('aurora_gist_id')
  const token = localStorage.getItem('aurora_gist_token')
  if (!id || !token) return false
  try {
    await fetch(`https://api.github.com/gists/${id}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } } }),
    })
    return true
  } catch {
    return false
  }
}

export function hasGist() {
  return !!(localStorage.getItem('aurora_gist_id') && localStorage.getItem('aurora_gist_token'))
}
