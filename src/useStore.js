import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_FEEDS, DEFAULT_CALM } from './config.js'
import { gistLoad, gistSave, hasGist } from './gist.js'

// ─── Local storage helpers ────────────────────────────────────────────────
function ls(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// ─── Main store hook ───────────────────────────────────────────────────────
export function useStore() {
  const [feeds,   setFeedsRaw]   = useState(() => ls('aurora_feeds',   DEFAULT_FEEDS))
  const [calm,    setCalmRaw]    = useState(() => ls('aurora_calm',    DEFAULT_CALM))
  const [starred, setStarredRaw] = useState(() => new Set(ls('aurora_starred', [])))
  const [read,    setReadRaw]    = useState(() => new Set(ls('aurora_read',    [])))
  const syncTimeout = useRef(null)

  // Debounced Gist sync
  const syncGist = useCallback((payload) => {
    clearTimeout(syncTimeout.current)
    syncTimeout.current = setTimeout(() => gistSave(payload), 2000)
  }, [])

  // Load from Gist on mount (if configured)
  useEffect(() => {
    if (!hasGist()) return
    gistLoad().then(d => {
      if (!d) return
      if (d.feeds)   { setFeedsRaw(d.feeds);   lsSet('aurora_feeds',   d.feeds) }
      if (d.calm)    { setCalmRaw(d.calm);      lsSet('aurora_calm',    d.calm) }
      if (d.starred) { setStarredRaw(new Set(d.starred)); lsSet('aurora_starred', d.starred) }
      if (d.read)    { setReadRaw(new Set(d.read));       lsSet('aurora_read',    d.read) }
    })
  }, [])

  const setFeeds = useCallback((val) => {
    const v = typeof val === 'function' ? val(feeds) : val
    setFeedsRaw(v); lsSet('aurora_feeds', v)
    syncGist({ feeds: v, calm, starred: [...starred], read: [...read] })
  }, [feeds, calm, starred, read, syncGist])

  const setCalm = useCallback((val) => {
    const v = typeof val === 'function' ? val(calm) : val
    setCalmRaw(v); lsSet('aurora_calm', v)
    syncGist({ feeds, calm: v, starred: [...starred], read: [...read] })
  }, [feeds, calm, starred, read, syncGist])

  const toggleStar = useCallback((id) => {
    setStarredRaw(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      lsSet('aurora_starred', [...next])
      syncGist({ feeds, calm, starred: [...next], read: [...read] })
      return next
    })
  }, [feeds, calm, read, syncGist])

  const markRead = useCallback((id) => {
    setReadRaw(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      lsSet('aurora_read', [...next])
      return next
    })
  }, [])

  const addFeed = useCallback((section, name, url) => {
    setFeeds(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), { name, url }],
    }))
  }, [setFeeds])

  const removeFeed = useCallback((section, name) => {
    setFeeds(prev => {
      const next = { ...prev }
      next[section] = next[section].filter(f => f.name !== name)
      if (!next[section].length) delete next[section]
      return next
    })
  }, [setFeeds])

  return { feeds, calm, starred, read, setCalm, toggleStar, markRead, addFeed, removeFeed }
}
