.aurora-nav {
  display: none;
}

@media (max-width: 768px) {
  .aurora-nav {
    display: block;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 9999;
    padding: .6rem 1rem;
    padding-bottom: max(.75rem, env(safe-area-inset-bottom));
    background: transparent;
    pointer-events: none;
  }
}

/* Hide brand on bottom nav */
.aurora-brand { display: none; }

/* Floating pill */
.aurora-tabs {
  display: flex;
  align-items: center;
  gap: .22rem;
  padding: .38rem .42rem;
  background:
    linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.06)),
    rgba(12,15,26,.78);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.28),
    0 8px 32px rgba(0,0,0,.36),
    0 2px 8px rgba(0,0,0,.24);
  pointer-events: all;
}

@media (prefers-color-scheme: light) {
  .aurora-tabs {
    background:
      linear-gradient(135deg, rgba(255,255,255,.88), rgba(255,255,255,.72)),
      rgba(244,244,240,.7);
    border-color: rgba(0,0,0,.10);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.95), 0 8px 32px rgba(0,0,0,.12);
  }
}

/* Tab button */
.aurora-tab {
  flex: 1;
  border: 1px solid transparent;
  background: none;
  border-radius: 999px;
  padding: .45rem .1rem;
  font-family: var(--sans);
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .04em;
  color: rgba(200,200,220,.48);
  cursor: pointer;
  transition: color .15s, background .15s;
  text-align: center;
  white-space: nowrap;
}

.aurora-tab:active { transform: scale(.92); }

.aurora-tab.active {
  color: #fff;
  background: rgba(255,255,255,.18);
  border-color: rgba(255,255,255,.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.28), 0 2px 8px rgba(0,0,0,.2);
}

@media (prefers-color-scheme: light) {
  .aurora-tab        { color: rgba(60,60,80,.42); }
  .aurora-tab.active { color: #111; background: rgba(255,255,255,.9); border-color: rgba(0,0,0,.1); }
}

/* FAB */
.aurora-fab {
  flex: 0 0 auto;
  width: 36px; height: 32px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #5b6fff, #c44eba);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 300;
  cursor: pointer;
  display: grid; place-items: center;
  box-shadow: 0 3px 12px rgba(91,111,255,.6), inset 0 1px 0 rgba(255,255,255,.28);
  transition: transform .14s;
}
.aurora-fab:active { transform: scale(.88); }

/* Inline search */
.aurora-search-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.aurora-search-input {
  width: 100%;
  background: rgba(255,255,255,.14);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  color: #fff;
  font-family: var(--sans);
  font-size: .72rem;
  font-weight: 500;
  padding: .24rem .7rem;
  outline: none;
}
.aurora-search-input::placeholder { color: rgba(255,255,255,.36); }

@media (prefers-color-scheme: light) {
  .aurora-search-input { background: rgba(0,0,0,.07); border-color: rgba(0,0,0,.14); color: #111; }
  .aurora-search-input::placeholder { color: rgba(0,0,0,.3); }
}
