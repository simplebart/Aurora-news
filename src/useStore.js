import { useState, useEffect, useCallback, useRef } from 'react'
import { DEFAULT_FEEDS, DEFAULT_CALM } from './config.js'
import { gistLoad, gistSave, hasGist } from './gist.js'

function ls(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

export function useStore() {
  const [feeds,   setFeedsRaw]   = useState(() => ls('aurora_feeds', DEFAULT_FEEDS))
  const [calm,    setCalmRaw]    = useState(() => ls('aurora_calm',  DEFAULT_CALM))
  const [starred, setStarredRaw] = useState(() => new Set(ls('aurora_starred', [])))
  const [read,    setReadRaw]    = useState(() => new Set(ls('aurora_read',    [])))
  const [ready,   setReady]      = useState(false)
  const syncTimeout = useRef(null)

  // Load from Gist once on mount
  useEffect(() => {
    if (!hasGist()) { setReady(true); return }
    gistLoad().then(d => {
      if (d) {
        if (d.feeds && Object.keys(d.feeds).length > 0) {
          setFeedsRaw(d.feeds)
          lsSet('aurora_feeds', d.feeds)
        }
        if (d.calm)    { setCalmRaw(d.calm);      lsSet('aurora_calm',    d.calm) }
        if (d.starred) { setStarredRaw(new Set(d.starred)); lsSet('aurora_starred', d.starred) }
        if (d.read)    { setReadRaw(new Set(d.read));       lsSet('aurora_read',    d.read) }
      }
      setReady(true)
    }).catch(() => setReady(true))
  }, [])

  // Debounced Gist sync — only save, never overwrite local with Gist
  const syncGist = useCallback((payload) => {
    clearTimeout(syncTimeout.current)
    syncTimeout.current = setTimeout(() => gistSave(payload), 2000)
  }, [])

  const setFeeds = useCallback((val) => {
    setFeedsRaw(prev => {
      const v = typeof val === 'function' ? val(prev) : val
      lsSet('aurora_feeds', v)
      // Sync to gist with current calm/starred/read
      clearTimeout(syncTimeout.current)
      syncTimeout.current = setTimeout(() => {
        gistSave({ feeds: v, calm: ls('aurora_calm', DEFAULT_CALM), starred: ls('aurora_starred', []), read: ls('aurora_read', []) })
      }, 1000)
      return v
    })
  }, [])

  const setCalm = useCallback((val) => {
    setCalmRaw(prev => {
      const v = typeof val === 'function' ? val(prev) : val
      lsSet('aurora_calm', v)
      clearTimeout(syncTimeout.current)
      syncTimeout.current = setTimeout(() => {
        gistSave({ feeds: ls('aurora_feeds', DEFAULT_FEEDS), calm: v, starred: ls('aurora_starred', []), read: ls('aurora_read', []) })
      }, 1000)
      return v
    })
  }, [])

  const toggleStar = useCallback((id) => {
    setStarredRaw(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      lsSet('aurora_starred', [...next])
      return next
    })
  }, [])

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
      next[section] = (next[section] || []).filter(f => f.name !== name)
      if (!next[section].length) delete next[section]
      return next
    })
  }, [setFeeds])

  return { feeds, calm, starred, read, ready, setCalm, toggleStar, markRead, addFeed, removeFeed }
}
