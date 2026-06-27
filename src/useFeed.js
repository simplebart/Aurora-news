import { useState, useEffect, useRef } from 'react'
import { fetchFeed, diverseSection } from './utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from './config.js'

export function useFeed(feeds, view, calmSources) {
  const [articles, setArticles] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    setArticles([])

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

    let cancelled = false

    const run = async () => {
      // Fetch all in parallel
      const results = await Promise.allSettled(targets.map(f => fetchFeed(f)))
      if (cancelled) return

      const all = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)

      console.log(`Fetched ${all.length} total articles from ${targets.length} feeds`)

      // Deduplicate by id
      const seen = new Set()
      const deduped = all.filter(a => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })

      // Sort by date
      deduped.sort((a, b) => (b.date || 0) - (a.date || 0))

      // Filter Today: last 48h (relaxed from 24h)
      const final = view === 'today'
        ? deduped.filter(a => {
            if (!a.date) return true // include if no date
            const age = Date.now() - a.date.getTime()
            return age < 48 * 3600 * 1000
          })
        : deduped

      console.log(`After filter: ${final.length} articles for view "${view}"`)
      setArticles(final)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
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
  return diverseSection(
    articles.filter(a => a.section === section),
    SECTION_SIZE,
    MAX_PER_SOURCE,
  )
}
