import { useState } from 'react'
import './AddFeed.css'

export default function AddFeed({ feeds, onAdd, onRemove, onClose }) {
  const [tab,     setTab]     = useState('add')
  const [name,    setName]    = useState('')
  const [url,     setUrl]     = useState('')
  const [section, setSection] = useState(Object.keys(feeds)[0] || '')
  const [newSec,  setNewSec]  = useState('')
  const [useNew,  setUseNew]  = useState(false)
  const [msg,     setMsg]     = useState('')

  function handleAdd(e) {
    e.preventDefault()
    const sec = useNew ? newSec.trim() : section
    if (!name.trim() || !url.trim() || !sec) { setMsg('Fill in all fields.'); return }
    onAdd(sec, name.trim(), url.trim())
    setName(''); setUrl(''); setMsg('Added ✓')
    setTimeout(() => setMsg(''), 2000)
  }

  const allFeeds = Object.entries(feeds).flatMap(([s, list]) => list.map(f => ({ section: s, ...f })))

  return (
    <div className="add-feed-panel fade-in">
      <div className="add-feed-header">
        <div className="add-feed-tabs">
          <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>Add feed</button>
          <button className={tab === 'remove' ? 'active' : ''} onClick={() => setTab('remove')}>Remove feed</button>
        </div>
        <button className="add-feed-close" onClick={onClose}>✕</button>
      </div>

      {tab === 'add' && (
        <form className="add-feed-form" onSubmit={handleAdd}>
          <input placeholder="Source name (e.g. Tortoise)" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="RSS URL (https://…/feed)" value={url} onChange={e => setUrl(e.target.value)} type="url" />
          <div className="add-feed-section-row">
            <select value={useNew ? '__new__' : section} onChange={e => {
              if (e.target.value === '__new__') { setUseNew(true) }
              else { setUseNew(false); setSection(e.target.value) }
            }}>
              {Object.keys(feeds).map(s => <option key={s} value={s}>{s}</option>)}
              <option value="__new__">➕ New section…</option>
            </select>
            {useNew && (
              <input placeholder="New section name" value={newSec} onChange={e => setNewSec(e.target.value)} />
            )}
          </div>
          <button type="submit" className="add-feed-submit">Add feed</button>
          {msg && <p className="add-feed-msg">{msg}</p>}
        </form>
      )}

      {tab === 'remove' && (
        <div className="remove-feed-list">
          {allFeeds.map(f => (
            <div key={`${f.section}-${f.name}`} className="remove-feed-row">
              <div>
                <span className="remove-feed-section">{f.section}</span>
                <span className="remove-feed-name">{f.name}</span>
              </div>
              <button onClick={() => onRemove(f.section, f.name)}>Remove</button>
            </div>
          ))}
          {allFeeds.length === 0 && <p className="empty-msg">No feeds yet.</p>}
        </div>
      )}
    </div>
  )
}
