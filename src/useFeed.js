import { useState, useEffect, useRef } from 'react'
import { fetchFeed, scrapeOg, canScrape, diverseSection } from './utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from './config.js'

const CACHE_TTL = 15 * 60 * 1000 // 15 minutes
const cache = new Map()

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null }
  return entry.data
}
function setCached(key, data) {
  cache.set(key, { ts: Date.now(), data })
}

export function useFeed(feeds, view, calmSources) {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const abortRef = useRef(null)

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setArticles([])

    // Build targets based on view
    const allFeeds = Object.entries(feeds).flatMap(([section, list]) =>
      list.map(f => ({ ...f, section }))
    )
    let targets
    if (view === 'calm') {
      const calmSet = new Set(calmSources)
      targets = allFeeds.filter(f => calmSet.has(f.name))
    } else if (view === 'today' || view === 'all') {
      targets = allFeeds
    } else {
      // specific section
      targets = (feeds[view] || []).map(f => ({ ...f, section: view }))
    }

    const cacheKey = targets.map(f => f.url).sort().join('|')
    const cached = getCached(cacheKey)
    if (cached) {
      setArticles(cached)
      setLoading(false)
      return
    }

    let done = false
    Promise.all(targets.map(f => fetchFeed(f))).then(async results => {
      if (done) return
      let all = results.flat().sort((a, b) => (b.date || 0) - (a.date || 0))

      // Deduplicate
      const seen = new Set()
      all = all.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })

      // Filter Today: last 24h
      if (view === 'today') {
        const cutoff = Date.now() - 24 * 3600 * 1000
        all = all.filter(a => a.date && a.date.getTime() > cutoff)
      }

      setArticles(all)
      setLoading(false)

      // Scrape og:image for articles without one (background, max 15)
      const needsImg = all.filter(a => !a.image && canScrape(a.source)).slice(0, 15)
      for (const a of needsImg) {
        if (done) break
        const img = await scrapeOg(a.link)
        if (img) {
          a.image = img
          setArticles(prev => [...prev]) // trigger re-render
        }
      }

      setCached(cacheKey, all)
    }).catch(() => setLoading(false))

    return () => { done = true }
  }, [feeds, view, calmSources?.join?.(',')])

  return { articles, loading }
}

// ─── Organise articles into sections for grouped views ────────────────────
export function groupBySection(articles) {
  const map = new Map()
  for (const a of articles) {
    if (!map.has(a.section)) map.set(a.section, [])
    map.get(a.section).push(a)
  }
  return map
}

export function getSectionArticles(articles, section) {
  return diverseSection(
    articles.filter(a => a.section === section),
    SECTION_SIZE,
    MAX_PER_SOURCE,
  )
}
