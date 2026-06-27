import { useState } from 'react'
import './AddFeed.css'

export default function AddFeed({ feeds, onAdd, onRemove, onClose }) {
  const [tab,     setTab]     = useState('add')
  const [gistId,  setGistId]  = useState(localStorage.getItem('aurora_gist_id') || '')
  const [token,   setToken]   = useState(localStorage.getItem('aurora_gist_token') || '')
  const [cSaved,  setCSaved]  = useState(false)
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
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>⚙ Settings</button>
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

      {tab === 'settings' && (
        <div className="settings-tab">
          <p className="settings-desc">Connect a GitHub Gist to sync feeds and saved articles across all your devices.</p>
          <div className="settings-form">
            <label>Gist ID</label>
            <input value={gistId} onChange={e => setGistId(e.target.value)} placeholder="c76dfae..." />
            <label>GitHub Token</label>
            <input value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_..." type="password" />
            <div className="settings-btns">
              <button className="settings-save" onClick={() => {
                if (gistId.trim()) localStorage.setItem('aurora_gist_id', gistId.trim())
                if (token.trim())  localStorage.setItem('aurora_gist_token', token.trim())
                setCSaved(true); setTimeout(() => setCSaved(false), 1500)
              }}>{cSaved ? 'Saved ✓' : 'Save'}</button>
              <button className="settings-clear" onClick={() => {
                localStorage.removeItem('aurora_gist_id')
                localStorage.removeItem('aurora_gist_token')
                setGistId(''); setToken('')
              }}>Clear</button>
            </div>
          </div>
        </div>
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
