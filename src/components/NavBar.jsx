import { useState, useRef, useEffect } from 'react'
import './NavBar.css'

const TABS = [
  { id: 'today',  label: 'Today'  },
  { id: 'calm',   label: 'Calm'   },
  { id: 'fab',    label: '+',     fab: true },
  { id: 'search', label: 'Search' },
  { id: 'saved',  label: 'Saved'  },
]

export default function NavBar({ view, onNav, onAdd, searchQuery, onSearch }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef(null)

  // Derive active tab
  const active = view === 'today' ? 'today'
               : view === 'calm'  ? 'calm'
               : view === 'saved' ? 'saved'
               : searchOpen       ? 'search'
               : 'today'

  useEffect(() => {
    if (searchOpen && inputRef.current) inputRef.current.focus()
  }, [searchOpen])

  function handleTab(tab) {
    if (tab.fab) { onAdd(); return }
    if (tab.id === 'search') {
      const next = !searchOpen
      setSearchOpen(next)
      if (!next) onSearch('')
      return
    }
    setSearchOpen(false)
    onSearch('')
    onNav(tab.id)
  }

  return (
    <nav className="aurora-nav">
      <div className="aurora-tabs">
          {TABS.map(tab => {
            if (tab.fab) {
              return (
                <button key="fab" className="aurora-fab" onClick={() => handleTab(tab)} aria-label="Add feed">
                  +
                </button>
              )
            }
            if (tab.id === 'search' && searchOpen) {
              return (
                <div key="search" className="aurora-search-wrap">
                  <input
                    ref={inputRef}
                    className="aurora-search-input"
                    type="search"
                    placeholder="Search…"
                    value={searchQuery}
                    onChange={e => onSearch(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); onSearch('') } }}
                  />
                </div>
              )
            }
            return (
              <button
                key={tab.id}
                className={`aurora-tab${active === tab.id ? ' active' : ''}`}
                onClick={() => handleTab(tab)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
    </nav>
  )
}
