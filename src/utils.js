import { ACCENTS, EXCLUDE_KEYWORDS, LOW_RES_SOURCES, MAX_PER_FEED, MAX_PER_FEED_OVERRIDES } from './config.js'

// ─── Source identity ──────────────────────────────────────────────────────
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

// ─── Time formatting ──────────────────────────────────────────────────────
export function relative(date) {
  if (!date) return ''
  const d = (Date.now() - new Date(date).getTime()) / 1000
  if (d < 60)        return 'now'
  if (d < 3600)      return `${Math.floor(d / 60)}m`
  if (d < 86400)     return `${Math.floor(d / 3600)}h`
  if (d < 7 * 86400) return `${Math.floor(d / 86400)}d`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Keyword filter ───────────────────────────────────────────────────────
export function isExcluded(title, source) {
  const kws = EXCLUDE_KEYWORDS[source]
  if (!kws) return false
  const t = title.toLowerCase()
  return kws.some(k => t.includes(k))
}

// ─── RSS fetch via allorigins CORS proxy ─────────────────────────────────
const PROXY = 'https://api.allorigins.win/get?url='

export async function fetchFeed(feed) {
  const cap = MAX_PER_FEED_OVERRIDES[feed.name] ?? MAX_PER_FEED
  try {
    const res  = await fetch(PROXY + encodeURIComponent(feed.url), { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const xml  = new DOMParser().parseFromString(data.contents, 'text/xml')
    const items = [...xml.querySelectorAll('item, entry')]
    const out = []
    for (const item of items) {
      const title = item.querySelector('title')?.textContent?.trim() || 'Untitled'
      if (isExcluded(title, feed.name)) continue
      const link    = item.querySelector('link')?.textContent?.trim()
                   || item.querySelector('link')?.getAttribute('href')
                   || '#'
      const summary = item.querySelector('description, summary, content')?.textContent?.trim() || ''
      const pubDate = item.querySelector('pubDate, published, updated')?.textContent?.trim()
      const image   = extractImage(item, feed.name)
      out.push({
        id:      btoa(link).slice(0, 12),
        source:  feed.name,
        section: feed.section,
        title,
        link,
        summary: stripHtml(summary).slice(0, 300),
        image,
        date:    pubDate ? new Date(pubDate) : null,
      })
      if (out.length >= cap) break
    }
    return out.sort((a, b) => (b.date || 0) - (a.date || 0))
  } catch {
    return []
  }
}

function extractImage(item, source) {
  if (LOW_RES_SOURCES.has(source)) return null
  // media:thumbnail / media:content
  const mt = item.querySelector('thumbnail, content[medium="image"]')
  if (mt?.getAttribute('url')) return mt.getAttribute('url')
  // enclosure
  const enc = item.querySelector('enclosure[type^="image"]')
  if (enc?.getAttribute('url')) return enc.getAttribute('url')
  // og:image in description
  const desc = item.querySelector('description, summary')?.textContent || ''
  const m = desc.match(/<img[^>]+src=["']([^"']+)/i)
  return m ? m[1] : null
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ─── og:image scraper (best-effort, not all sites allow it) ───────────────
const NO_SCRAPE = new Set(['FT','FT Opinion','FT Alphaville','The Economist','The Economist Leaders','MarketWatch'])
const OG_PROXY  = 'https://api.allorigins.win/get?url='

export async function scrapeOg(url) {
  try {
    const res  = await fetch(OG_PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(4000) })
    const data = await res.json()
    const m    = data.contents?.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
              || data.contents?.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image/i)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export function canScrape(source) {
  return !NO_SCRAPE.has(source)
}

// ─── Diversity selection ──────────────────────────────────────────────────
export function diverseSection(articles, n = 5, maxPer = 2) {
  const counts = {}
  const picked = []
  const leftover = []
  for (const a of articles) {
    if ((counts[a.source] || 0) < maxPer) {
      counts[a.source] = (counts[a.source] || 0) + 1
      picked.push(a)
      if (picked.length === n) return picked
    } else {
      leftover.push(a)
    }
  }
  for (const a of leftover) {
    if (picked.length >= n) break
    picked.push(a)
  }
  return picked
}

// ─── Greeting ─────────────────────────────────────────────────────────────
export function greeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning,'
  if (h >= 12 && h < 18) return 'Good afternoon,'
  if (h >= 18 && h < 23) return 'Good evening,'
  return 'Still up,'
}

export function dateLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}
