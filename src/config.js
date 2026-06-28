// ─── Feed configuration ───────────────────────────────────────────────────
export const DEFAULT_FEEDS = {
  'Daily news': [
    { name: 'BBC News',        url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    { name: 'BBC Europe',      url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml' },
    { name: 'The Guardian',    url: 'https://www.theguardian.com/world/rss' },
    { name: 'Politico Europe', url: 'https://www.politico.eu/feed/' },
    { name: 'NYT World',       url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  ],
  Finance: [
    { name: 'FT',            url: 'https://www.ft.com/rss/home' },
    { name: 'FT Opinion',    url: 'https://www.ft.com/rss/opinion' },
    { name: 'FT Alphaville', url: 'https://www.ft.com/alphaville?format=rss' },
    { name: 'The Economist', url: 'https://www.economist.com/finance-and-economics/rss.xml' },
    { name: 'MarketWatch',   url: 'https://feeds.marketwatch.com/marketwatch/topstories/' },
  ],
  Tech: [
    { name: 'The Verge',       url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'Wired',           url: 'https://www.wired.com/feed/rss' },
    { name: 'Ars Technica',    url: 'https://feeds.arstechnica.com/arstechnica/index' },
    { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  ],
  Cultuur: [
    { name: "The Guardian Film", url: 'https://www.theguardian.com/film/rss' },
    { name: 'Pitchfork',         url: 'https://pitchfork.com/rss/news/' },
    { name: 'Dezeen',            url: 'https://www.dezeen.com/feed/' },
    { name: "It's Nice That",    url: 'https://www.itsnicethat.com/rss' },
    { name: 'Bon Appétit',       url: 'https://www.bonappetit.com/feed/rss' },
  ],
  'Long reads': [
    { name: 'The Economist Leaders', url: 'https://www.economist.com/leaders/rss.xml' },
    { name: 'Aeon',                  url: 'https://aeon.co/feed.rss' },
    { name: 'The Atlantic',          url: 'https://www.theatlantic.com/feed/all/' },
  ],
  Sport: [
    { name: 'BBC Sport Football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
    { name: 'The Race F1',        url: 'https://the-race.com/feed/' },
  ],
}

export const DEFAULT_CALM = [
  'Aeon', 'The Atlantic', 'The Economist Leaders', 'FT Opinion',
]

// ─── Source accent colours ────────────────────────────────────────────────
export const ACCENTS = {
  'BBC News':               '#B80000',
  'BBC Europe':             '#B80000',
  'BBC Sport Football':     '#D13900',
  'The Guardian':           '#0084C6',
  'The Guardian Film':      '#0084C6',
  'Politico Europe':        '#C8141A',
  'NYT World':              '#111111',
  'FT':                     '#0F5499',
  'FT Opinion':             '#0F5499',
  'FT Alphaville':          '#0F5499',
  'The Economist':          '#E3120B',
  'The Economist Leaders':  '#E3120B',
  'MarketWatch':            '#007F5F',
  'The Verge':              '#7C3AED',
  'Ars Technica':           '#FF4E00',
  'Wired':                  '#1A1A1A',
  'MIT Tech Review':        '#111111',
  'Pitchfork':              '#1A1A1A',
  'Dezeen':                 '#111111',
  "It's Nice That":         '#FF3B2F',
  'Bon Appétit':            '#C8322B',
  'Aeon':                   '#2E5FAB',
  'The Atlantic':           '#8B1A1A',
  'The Race F1':            '#E10600',
}

// ─── Keyword filters (case-insensitive, matched against title) ────────────
export const EXCLUDE_KEYWORDS = {
  'The Verge': [
    'prime day','deal','deals','review','hands-on','hands on','best',
    'discount','sale','unboxing','how to','versus',' vs ','giveaway',
    'buy','price','cheap','gift guide',
  ],
  'Wired': [
    'review','best','buying guide','how to','deal','deals','discount',
    'sale','gear','tested','gift guide','coupon','promo',
  ],
}

// ─── Sources whose images are low-res — skip, use colour plate ───────────
export const LOW_RES_SOURCES = new Set([
  'BBC News','BBC Europe','BBC Sport Football','The Guardian','The Guardian Film',
])

// ─── Max articles fetched per feed ───────────────────────────────────────
export const MAX_PER_FEED = 8
export const MAX_PER_FEED_OVERRIDES = { 'The Verge': 4, 'Wired': 4 }

// ─── Section display config ───────────────────────────────────────────────
export const SECTION_SIZE      = 5   // articles shown per section on Today
export const MAX_PER_SOURCE    = 2   // diversity cap per section
export const PAGE_SIZE         = 6   // sections loaded per "page"

// ─── User ─────────────────────────────────────────────────────────────────
export const USER_NAME = 'Bart'
