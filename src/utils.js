import { ACCENTS, EXCLUDE_KEYWORDS, LOW_RES_SOURCES, MAX_PER_FEED, MAX_PER_FEED_OVERRIDES } from './config.js'

export function colorFor(name) {
  if (ACCENTS[name]) return ACCENTS[name]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return `hsl(${h % 360},52%,46%)`
}

export function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function relative(date) {
  if (!date) return ''
  const d = (Date.now() - new Date(date).getTime()) / 1000
  if (d < 60) return 'now'
  if (d < 3600) return Math.floor(d / 60) + 'm'
  if (d < 86400) return Math.floor(d / 3600) + 'h'
  if (d < 604800) return Math.floor(d / 86400) + 'd'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export async function fetchFeed(feed) {
  const cap = MAX_PER_FEED_OVERRIDES[feed.name] ?? MAX_PER_FEED
  const params = new URLSearchParams({
    url: feed.url,
    source: feed.name,
    section: feed.section,
  })

  try {
    const res = await fetch(`/api/feed?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    const items = (data.items || []).slice(0, cap)
    // Convert date strings back to Date objects
    return items.map(a => ({ ...a, date: a.date ? new Date(a.date) : null }))
  } catch (e) {
    console.error('fetchFeed error:', feed.name, e.message)
    return []
  }
}

export function canScrape() { return false } // scraping now done server-side

export function diverseSection(articles, n = 5, maxPer = 2) {
  const counts = {}
  const picked = []
  const rest = []
  for (const a of articles) {
    if ((counts[a.source] || 0) < maxPer) {
      counts[a.source] = (counts[a.source] || 0) + 1
      picked.push(a)
      if (picked.length === n) return picked
    } else rest.push(a)
  }
  for (const a of rest) {
    if (picked.length >= n) break
    picked.push(a)
  }
  return picked
}

export function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning,'
  if (h >= 12 && h < 18) return 'Good afternoon,'
  if (h >= 18 && h < 23) return 'Good evening,'
  return 'Still up,'
}

export function dateLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
