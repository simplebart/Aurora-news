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

export function isExcluded(title, source) {
  const kws = EXCLUDE_KEYWORDS[source]
  if (!kws) return false
  const t = title.toLowerCase()
  return kws.some(k => t.includes(k))
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getImage(item, source) {
  if (LOW_RES_SOURCES.has(source)) return null
  // media:thumbnail
  const mt = item.querySelector('thumbnail')
  if (mt && mt.getAttribute('url')) return mt.getAttribute('url')
  // media:content
  const mc = item.querySelector('content[medium="image"], content[type^="image"]')
  if (mc && mc.getAttribute('url')) return mc.getAttribute('url')
  // enclosure
  const enc = item.querySelector('enclosure[type^="image"]')
  if (enc && enc.getAttribute('url')) return enc.getAttribute('url')
  // img in description
  const desc = item.querySelector('description, summary')
  if (desc) {
    const m = desc.textContent.match(/<img[^>]+src=["']([^"']+)/i)
      || desc.innerHTML?.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i)
    if (m && m[1] && !m[1].includes('1x1')) return m[1]
  }
  return null
}

function makeId(str) {
  try { return btoa(unescape(encodeURIComponent(str))).slice(0, 12) } 
  catch { return Math.random().toString(36).slice(2, 14) }
}

export async function fetchFeed(feed) {
  const cap = MAX_PER_FEED_OVERRIDES[feed.name] ?? MAX_PER_FEED
  let text = null

  // Try own proxy first, then fallbacks
  for (const url of [
    `/api/feed?url=${encodeURIComponent(feed.url)}`,
    `https://corsproxy.io/?${encodeURIComponent(feed.url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(feed.url)}`,
  ]) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      let t = await res.text()
      // allorigins wraps in JSON
      if (url.includes('allorigins')) {
        try { t = JSON.parse(t).contents || t } catch {}
      }
      if (t.includes('<item') || t.includes('<entry')) {
        text = t
        break
      }
    } catch {}
  }

  if (!text) return []

  const xml = new DOMParser().parseFromString(text, 'text/xml')
  const items = [...xml.querySelectorAll('item, entry')]
  const out = []

  for (const item of items) {
    const title = (item.querySelector('title')?.textContent || '').trim()
    if (!title || isExcluded(title, feed.name)) continue

    // Link: try text content first (RSS), then href attribute (Atom)
    const linkEl = item.querySelector('link')
    const link = (linkEl?.textContent || '').trim() || linkEl?.getAttribute('href') || '#'

    const desc = item.querySelector('description, summary, content')?.textContent || ''
    const pub = item.querySelector('pubDate, published, updated')?.textContent || ''

    out.push({
      id:      makeId(link),
      source:  feed.name,
      section: feed.section,
      title,
      link,
      summary: stripHtml(desc).slice(0, 300),
      image:   getImage(item, feed.name),
      date:    pub ? new Date(pub) : null,
    })

    if (out.length >= cap) break
  }

  return out.sort((a, b) => (b.date || 0) - (a.date || 0))
}

export function canScrape(source) {
  return !['FT','FT Opinion','FT Alphaville','The Economist','The Economist Leaders','MarketWatch'].includes(source)
}

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
