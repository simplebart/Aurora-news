// Vercel serverless function — Node.js runtime voor betere compatibiliteit
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300')

  const { url, source = '', section = '' } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url', items: [] })

  const LOW_RES = ['BBC News','BBC Europe','BBC Sport Football','The Guardian','The Guardian Film']
  const NO_SCRAPE = ['FT','FT Opinion','FT Alphaville','The Economist','The Economist Leaders','MarketWatch']
  const NO_KW = {
    'The Verge': ['prime day','deal','deals','review','hands-on','best','discount','sale','unboxing','how to','versus',' vs ','giveaway','buy','price','cheap','gift guide'],
    'Wired': ['review','best','buying guide','how to','deal','deals','discount','sale','gear','tested','gift guide','coupon','promo'],
  }

  function isExcluded(title) {
    const kws = NO_KW[source]; if (!kws) return false
    return kws.some(k => title.toLowerCase().includes(k))
  }

  function stripHtml(s) {
    return (s||'').replace(/<[^>]+>/g,' ')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"').replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCodePoint(parseInt(h,16)))
      .replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(parseInt(d,10)))
      .replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim()
  }

  async function getOgImage(articleUrl) {
    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 4000)
      const r = await fetch(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      })
      const html = await r.text()
      const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
             || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
             || html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i)
             || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image/i)
      return m ? m[1] : null
    } catch { return null }
  }

  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 8000)
    const feedRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
    const text = await feedRes.text()

    const items = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi
    let match

    while ((match = itemRegex.exec(text)) !== null && items.length < 10) {
      const block = match[1] || match[2]
      const title = stripHtml(block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '')
      if (!title || isExcluded(title)) continue

      const linkText = block.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim()
      const linkHref = block.match(/<link[^/]*href=["']([^"']+)["']/i)?.[1]
      const link = linkText || linkHref || '#'

      const desc = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]
                || block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1] || ''

      const pub = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
               || block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
               || block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || ''

      let image = null
      if (!LOW_RES.includes(source)) {
        const patterns = [
          block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i),
          block.match(/media:content[^>]+url=["']([^"']+)["'][^>]*medium=["']image["']/i),
          block.match(/media:content[^>]*medium=["']image["'][^>]+url=["']([^"']+)["']/i),
          block.match(/media:content[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*?)["']/i),
          block.match(/enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i),
          block.match(/enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i),
          desc.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i),
        ]
        for (const p of patterns) {
          if (p?.[1] && !p[1].includes('1x1') && !p[1].includes('placeholder')) {
            image = p[1]; break
          }
        }
      }

      let id
      try { id = btoa(unescape(encodeURIComponent(link))).replace(/[+/=]/g,'').slice(-16) }
      catch { id = Math.random().toString(36).slice(2) }

      items.push({ id, source, section, title, link, summary: stripHtml(desc).slice(0,300), image, date: pub ? new Date(pub).toISOString() : null })
    }

    // Scrape og:image in parallel for articles without images
    if (!NO_SCRAPE.includes(source)) {
      const needsImg = items.filter(a => !a.image && a.link !== '#')
      if (needsImg.length > 0) {
        const scraped = await Promise.allSettled(needsImg.map(a => getOgImage(a.link)))
        scraped.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value) needsImg[i].image = r.value
        })
      }
    }

    return res.json({ items })
  } catch (e) {
    return res.status(500).json({ error: e.message, items: [] })
  }
}
