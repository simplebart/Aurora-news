import { colorFor, initials, relative } from '../utils.js'
import './Cards.css'

// ─── Image with colour-plate fallback ─────────────────────────────────────
function Plate({ source, img, className }) {
  const color = colorFor(source)
  const ini   = initials(source)
  return (
    <div className={`plate-wrap ${className || ''}`} style={{ '--c': color }}>
      <div className="plate-ph">{ini}</div>
      {img && (
        <img
          className="plate-img"
          src={img}
          alt=""
          loading="lazy"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
    </div>
  )
}

// ─── Source kicker ────────────────────────────────────────────────────────
function Kicker({ article, starred }) {
  const color = colorFor(article.source)
  return (
    <div className="kicker">
      <span className="kicker-ico" style={{ background: color }}>{initials(article.source)}</span>
      <span className="kicker-src">{article.source}</span>
      <span className="kicker-dot">·</span>
      <span className="kicker-ago">{relative(article.date)}</span>
      {starred && <span className="kicker-star">★</span>}
    </div>
  )
}

// ─── Feature tile (photo overlay, desktop cover/mid) ──────────────────────
export function FeatureTile({ article, size = 'mid', starred, read, onRead }) {
  const img = article.image || ''
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`feature feature-${size}${read ? ' read' : ''}`}
      onClick={() => onRead(article.id)}
    >
      <Plate source={article.source} img={img} className="feature-bg" />
      <div className="feature-plate">
        <Kicker article={article} starred={starred} />
        <div className="feature-title">{article.title}</div>
        {size === 'cover' && article.summary && (
          <p className="feature-dek">{article.summary.slice(0, 200)}</p>
        )}
      </div>
    </a>
  )
}

// ─── Panel tile (no photo, colour-washed) ────────────────────────────────
export function PanelTile({ article, size = 'mid', starred, read, onRead }) {
  const color = colorFor(article.source)
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`panel panel-${size}${read ? ' read' : ''}`}
      style={{ '--c': color }}
      onClick={() => onRead(article.id)}
    >
      <Kicker article={article} starred={starred} />
      <div className="panel-title">{article.title}</div>
      {article.summary && <p className="panel-dek">{article.summary.slice(0, 240)}</p>}
    </a>
  )
}

// ─── Small card (desktop grid) ────────────────────────────────────────────
export function SmallCard({ article, starred, read, onRead, onStar }) {
  const hasImg = !!article.image
  const color  = colorFor(article.source)
  return (
    <div className={`card${read ? ' read' : ''}`}>
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="card-link"
        onClick={() => onRead(article.id)}
      >
        {hasImg
          ? <Plate source={article.source} img={article.image} className="card-img" />
          : <div className="card-accent" style={{ background: color }} />
        }
        <div className="card-title">{article.title}</div>
        <Kicker article={article} starred={starred} />
      </a>
      <button className="card-star" onClick={() => onStar(article.id)} aria-label="Save">
        {starred ? '★' : '☆'}
      </button>
    </div>
  )
}

// ─── Mobile hero card ─────────────────────────────────────────────────────
export function MobileHero({ article, starred, read, onRead, onStar }) {
  const color = colorFor(article.source)
  const ini   = initials(article.source)
  return (
    <div className={`m-hero${read ? ' read' : ''}`}>
      <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={() => onRead(article.id)}>
        <div className="m-hero-img" style={{ '--c': color }}>
          <div className="m-hero-ph">{ini}</div>
          {article.image && (
            <img className="m-hero-over" src={article.image} alt="" loading="lazy"
                 onError={e => { e.target.style.display = 'none' }} />
          )}
          <div className="m-hero-scrim" />
        </div>
        <div className="m-hero-body">
          <div className="m-src-row">
            <span className="m-src-name" style={{ color }}>{article.source}</span>
            <span className="m-src-dot">·</span>
            <span className="m-src-ago">{relative(article.date)}</span>
          </div>
          <div className="m-hero-title">{article.title}</div>
        </div>
      </a>
      <button className="m-star" onClick={() => onStar(article.id)}>{starred ? '★' : '☆'}</button>
    </div>
  )
}

// ─── Mobile pair card ─────────────────────────────────────────────────────
export function MobilePairCard({ article, starred, read, onRead, onStar }) {
  const color = colorFor(article.source)
  const ini   = initials(article.source)
  return (
    <div className={`m-pair-card${read ? ' read' : ''}`}>
      <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={() => onRead(article.id)}>
        <div className="m-pair-img" style={{ '--c': color }}>
          <div className="m-pair-ph">{ini}</div>
          {article.image && (
            <img className="m-pair-over" src={article.image} alt="" loading="lazy"
                 onError={e => { e.target.style.display = 'none' }} />
          )}
        </div>
        <div className="m-pair-body">
          <div className="m-pair-src" style={{ color }}>{article.source}</div>
          <div className="m-pair-title">{article.title}</div>
        </div>
      </a>
      <button className="m-star" onClick={() => onStar(article.id)}>{starred ? '★' : '☆'}</button>
    </div>
  )
}

// ─── Mobile list card ─────────────────────────────────────────────────────
export function MobileListCard({ article, starred, read, onRead, onStar }) {
  const color = colorFor(article.source)
  const ini   = initials(article.source)
  return (
    <div className={`m-list-card${read ? ' read' : ''}`}>
      <a href={article.link} target="_blank" rel="noopener noreferrer"
         className="m-list-link" onClick={() => onRead(article.id)}>
        <div className="m-list-body">
          <div className="m-list-src" style={{ color }}>{article.source}</div>
          <div className="m-list-title">{article.title}</div>
          <div className="m-list-ago">{relative(article.date)}</div>
        </div>
        <div className="m-list-thumb" style={{ '--c': color }}>
          <div className="m-list-ph">{ini}</div>
          {article.image && (
            <img className="m-list-over" src={article.image} alt="" loading="lazy"
                 onError={e => { e.target.style.display = 'none' }} />
          )}
        </div>
      </a>
      <button className="m-star m-star-list" onClick={() => onStar(article.id)}>{starred ? '★' : '☆'}</button>
    </div>
  )
}
