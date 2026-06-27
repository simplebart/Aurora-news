import { useState, useEffect } from 'react'
import { fetchFeed, diverseSection } from './utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from './config.js'

export function useFeed(feeds, view, calmSources) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setArticles([])

    // Build list of feeds to fetch
    const allFeeds = Object.entries(feeds).flatMap(([section, list]) =>
      list.map(f => ({ ...f, section }))
    )

    const targets =
      view === 'calm' ? allFeeds.filter(f => (calmSources || []).includes(f.name)) :
      view === 'today' || view === 'all' ? allFeeds :
      (feeds[view] || []).map(f => ({ ...f, section: view }))

    if (!targets.length) { setLoading(false); return }

    let alive = true

    Promise.all(targets.map(f => fetchFeed(f).catch(() => [])))
      .then(results => {
        if (!alive) return
        const all = results.flat()
        console.log('Total articles fetched:', all.length, 'from', targets.length, 'feeds')

        // Deduplicate
        const seen = new Set()
        const deduped = all.filter(a => {
          if (seen.has(a.id)) return false
          seen.add(a.id)
          return true
        })

        // Sort newest first
        deduped.sort((a, b) => (b.date || 0) - (a.date || 0))

        // For Today: last 48 hours, or include if no date
        const final = view === 'today'
          ? deduped.filter(a => !a.date || (Date.now() - a.date) < 48 * 3600 * 1000)
          : deduped

        console.log('Articles after filter:', final.length, 'view:', view)
        setArticles(final)
        setLoading(false)
      })

    return () => { alive = false }
  }, [JSON.stringify(feeds), view, JSON.stringify(calmSources)])

  return { articles, loading }
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
  return diverseSection(articles.filter(a => a.section === section), SECTION_SIZE, MAX_PER_SOURCE)
}
