import { FeatureTile, PanelTile, SmallCard, MobileHero, MobilePairCard, MobileListCard } from './Cards.jsx'
import { diverseSection } from '../utils.js'
import { SECTION_SIZE, MAX_PER_SOURCE } from '../config.js'
import './Section.css'

export default function Section({ title, articles, starred, read, onRead, onStar, onNav, isMobile, isFirst, showAll }) {
  const items = showAll
    ? articles  // show all articles without cap when in single section view
    : diverseSection(articles, SECTION_SIZE, MAX_PER_SOURCE)
  if (!items.length) return null

  return (
    <section className="section fade-in">
      {/* Section header */}
      <div className="section-head">
        <button className="section-label" onClick={() => onNav(title)}>{title}</button>
        <div className="section-line" />
        {!isMobile && (
          <button className="section-nav-btn" onClick={() => onNav(title)}>→</button>
        )}
      </div>

      {isMobile ? (
        <MobileSection items={items} starred={starred} read={read} onRead={onRead} onStar={onStar} />
      ) : (
        <DesktopSection items={items} starred={starred} read={read} onRead={onRead} onStar={onStar} isFirst={isFirst} />
      )}
    </section>
  )
}

// ─── Desktop layout: cover | pair | small row ─────────────────────────────
function DesktopSection({ items, starred, read, onRead, onStar, isFirst }) {
  const [cover, ...rest] = items
  const size = isFirst ? 'cover' : 'mid'
  const BigTile = ({ a, sz = 'mid' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {a.image
        ? <FeatureTile article={a} size={sz} starred={starred.has(a.id)} read={read.has(a.id)} onRead={onRead} />
        : <PanelTile   article={a} size={sz} starred={starred.has(a.id)} read={read.has(a.id)} onRead={onRead} />
      }
      <button className="save-btn" onClick={() => onStar(a.id)}>
        {starred.has(a.id) ? '★ Saved' : '☆ Save'}
      </button>
    </div>
  )

  return (
    <div className="desktop-section">
      <BigTile a={cover} sz={size} />

      {rest.length >= 2 && (
        <div className="desktop-pair">
          <BigTile a={rest[0]} sz="mid" />
          <BigTile a={rest[1]} sz="mid" />
        </div>
      )}

      {rest.length > 2 && (
        <div className="desktop-smalls" style={{ gridTemplateColumns: `repeat(${rest.slice(2).length}, 1fr)` }}>
          {rest.slice(2).map(a => (
            <SmallCard key={a.id} article={a}
              starred={starred.has(a.id)} read={read.has(a.id)}
              onRead={onRead} onStar={onStar} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile layout: hero | pair | list rows ───────────────────────────────
function MobileSection({ items, starred, read, onRead, onStar }) {
  const [hero, p1, p2, ...rest] = items
  return (
    <div className="mobile-section">
      <MobileHero article={hero}
        starred={starred.has(hero.id)} read={read.has(hero.id)}
        onRead={onRead} onStar={onStar} />

      {p1 && p2 && (
        <div className="mobile-pair">
          <MobilePairCard article={p1} starred={starred.has(p1.id)} read={read.has(p1.id)} onRead={onRead} onStar={onStar} />
          <MobilePairCard article={p2} starred={starred.has(p2.id)} read={read.has(p2.id)} onRead={onRead} onStar={onStar} />
        </div>
      )}
      {p1 && !p2 && (
        <MobileListCard article={p1} starred={starred.has(p1.id)} read={read.has(p1.id)} onRead={onRead} onStar={onStar} />
      )}

      {rest.map(a => (
        <MobileListCard key={a.id} article={a}
          starred={starred.has(a.id)} read={read.has(a.id)}
          onRead={onRead} onStar={onStar} />
      ))}
    </div>
  )
}
