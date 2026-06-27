import { useState, useEffect, useRef } from 'react'
import { fetchFeed, diverseSection } from './utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from './config.js'

const CACHE_TTL = 15 * 60 * 1000
const cache = new Map()

function getCached(key) {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() - e.ts > CACHE_TTL) { cache.delete(key); return null }
  return e.data
}
function setCached(key, data) { cache.set(key, { ts: Date.now(), data }) }

export function useFeed(feeds, view, calmSources) {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [errors,   setErrors]   = useState([])
  const abortRef = useRef(null)

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setLoading(true)
    setArticles([])
    setErrors([])

    const allFeeds = Object.entries(feeds).flatMap(([section, list]) =>
      list.map(f => ({ ...f, section }))
    )

    let targets
    if (view === 'calm') {
      const s = new Set(calmSources)
      targets = allFeeds.filter(f => s.has(f.name))
    } else if (view === 'today' || view === 'all') {
      targets = allFeeds
    } else {
      targets = (feeds[view] || []).map(f => ({ ...f, section: view }))
    }

    if (targets.length === 0) { setLoading(false); return }

    const cacheKey = view + '|' + targets.map(f => f.url).sort().join('|')
    const cached = getCached(cacheKey)
    if (cached) { setArticles(cached); setLoading(false); return }

    let cancelled = false

    // Fetch all feeds in parallel, update UI as each comes in
    const errs = []
    let completed = 0

    const fetchAll = async () => {
      const results = await Promise.allSettled(
        targets.map(f => fetchFeed(f).then(articles => {
          if (cancelled) return []
          if (articles.length > 0) {
            console.log(`✓ ${f.name}: ${articles.length} articles`)
          } else {
            console.warn(`✗ ${f.name}: 0 articles`)
            errs.push(f.name)
          }
          completed++
          // Progressive update every 3 feeds
          if (completed % 3 === 0 || completed === targets.length) {
            setArticles(prev => {
              const all = [...prev, ...articles]
              const seen = new Set()
              return all
                .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })
                .sort((a, b) => (b.date || 0) - (a.date || 0))
            })
          }
          return articles
        }))
      )

      if (cancelled) return
      setErrors(errs)

      // Final dedup and sort
      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
      const seen = new Set()
      const deduped = all
        .filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })
        .sort((a, b) => (b.date || 0) - (a.date || 0))

      // Filter Today
      const final = view === 'today'
        ? deduped.filter(a => a.date && Date.now() - a.date.getTime() < 24 * 3600 * 1000)
        : deduped

      setArticles(final)
      setLoading(false)
      setCached(cacheKey, final)
      console.log(`Total: ${final.length} articles from ${targets.length} feeds`)
    }

    fetchAll()
    return () => { cancelled = true }
  }, [feeds, view, JSON.stringify(calmSources)])

  return { articles, loading, errors }
}

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
