import { useState, useEffect, useRef } from 'react'
import { fetchFeed, diverseSection } from './utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from './config.js'

export function useFeed(feeds, view, calmSources, refreshKey = 0) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  // Stable keys to detect real changes
  const feedsKey = Object.entries(feeds)
    .flatMap(([s, list]) => list.map(f => f.url))
    .sort()
    .join('|')
  const calmKey = [...(calmSources || [])].sort().join('|')

  const prevKey = useRef('')
  const currentKey = `${view}||${feedsKey}||${calmKey}||${refreshKey}`

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

      // Deduplicate by link (more reliable than id)
      const seen = new Set()
      const deduped = all.filter(a => {
        const key = a.link || a.id
        if (!key || key === '#' || seen.has(key)) return false
        seen.add(key)
        return true
      })
      console.log('After dedup:', deduped.length)

      deduped.sort((a, b) => (b.date || 0) - (a.date || 0))

      const final = deduped

      console.log('Final articles:', final.length, 'for view:', view)
      setArticles(final)
      setLoading(false)

      // Scrape og:image for articles without images (background, max 20)
      const NO_SCRAPE = new Set(['FT','FT Opinion','FT Alphaville','The Economist','The Economist Leaders','MarketWatch'])
      const needsImg = final.filter(a => !a.image && !NO_SCRAPE.has(a.source)).slice(0, 20)
      if (needsImg.length > 0) {
        needsImg.forEach(async (a) => {
          if (!alive) return
          try {
            const res = await fetch(`/api/og?url=${encodeURIComponent(a.link)}`)
            const data = await res.json()
            if (data.image) {
              a.image = data.image
              setArticles(prev => [...prev]) // trigger re-render
            }
          } catch {}
        })
      }
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
