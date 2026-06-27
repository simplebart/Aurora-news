import { useState, useEffect, useRef } from 'react'
import { fetchFeed, diverseSection } from './utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from './config.js'

export function useFeed(feeds, view, calmSources) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  // Stable keys to detect real changes
  const feedsKey = Object.entries(feeds)
    .flatMap(([s, list]) => list.map(f => f.url))
    .sort()
    .join('|')
  const calmKey = [...(calmSources || [])].sort().join('|')

  const prevKey = useRef('')
  const currentKey = `${view}||${feedsKey}||${calmKey}`

  useEffect(() => {
    // Skip if nothing changed
    if (prevKey.current === currentKey) return
    prevKey.current = currentKey

    setLoading(true)
    setArticles([])

    const allFeeds = Object.entries(feeds).flatMap(([section, list]) =>
      list.map(f => ({ ...f, section }))
    )

    const targets =
      view === 'calm' ? allFeeds.filter(f => (calmSources || []).includes(f.name)) :
      view === 'today' || view === 'all' ? allFeeds :
      (feeds[view] || []).map(f => ({ ...f, section: view }))

    if (!targets.length) { setLoading(false); return }

    let alive = true

    Promise.all(targets.map(f =>
      fetchFeed(f).catch(e => { console.error(f.name, e.message); return [] })
    )).then(results => {
      if (!alive) return

      const all = results.flat()
      console.log('Raw articles:', all.length, 'from', targets.length, 'feeds')

      // Deduplicate
      const seen = new Set()
      const deduped = all.filter(a => {
        if (!a.id || seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })

      deduped.sort((a, b) => (b.date || 0) - (a.date || 0))

      const final = view === 'today'
        ? deduped.filter(a => !a.date || (Date.now() - a.date.getTime()) < 48 * 3600 * 1000)
        : deduped

      console.log('Final articles:', final.length, 'for view:', view)
      setArticles(final)
      setLoading(false)
    })

    return () => { alive = false }
  }, [currentKey])

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
