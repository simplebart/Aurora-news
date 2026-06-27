export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const source = searchParams.get('source') || ''
  const section = searchParams.get('section') || ''

  if (!url) return json({ error: 'Missing url', items: [] })

  const LOW_RES = ['BBC News','BBC Europe','BBC Sport Football','The Guardian','The Guardian Film']
  const NO_KW = {
    'The Verge': ['prime day','deal','deals','review','hands-on','best','discount','sale','unboxing','how to','versus',' vs ','giveaway','buy','price','cheap','gift guide'],
    'Wired': ['review','best','buying guide','how to','deal','deals','discount','sale','gear','tested','gift guide','coupon','promo'],
  }

  function isExcluded(title) {
    const kws = NO_KW[source]
    if (!kws) return false
    const t = title.toLowerCase()
    return kws.some(k => t.includes(k))
  }

  function getImage(item) {
    if (LOW_RES.includes(source)) return null
    const mt = item.querySelector('thumbnail')
    if (mt?.getAttribute('url')) return mt.getAttribute('url')
    const mc = item.querySelector('content[medium="image"]')
    if (mc?.getAttribute('url')) return mc.getAttribute('url')
    const enc = item.querySelector('enclosure[type^="image"]')
    if (enc?.getAttribute('url')) return enc.getAttribute('url')
    const desc = item.querySelector('description, summary')?.textContent || ''
    const m = desc.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp))/i)
    if (m && !m[1].includes('1x1')) return m[1]
    return null
  }

  function stripHtml(s) {
    return (s || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    const text = await res.text()

    // Parse XML server-side using regex (no DOMParser in edge)
    const items = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi
    let match

    while ((match = itemRegex.exec(text)) !== null && items.length < 10) {
      const block = match[1] || match[2]

      const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '').trim()
      if (!title || isExcluded(title)) continue

      // Link: try <link>url</link> and <link href="url"/>
      const linkText = block.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim()
      const linkHref = block.match(/<link[^/]*href=["']([^"']+)["']/i)?.[1]
      const link = linkText || linkHref || '#'

      const desc = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]
                || block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1] || ''

      const pub = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
               || block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
               || block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || ''

      // Image from media:thumbnail or enclosure
      const imgMatch = block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)
                    || block.match(/enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)
                    || block.match(/enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i)
      let image = imgMatch ? imgMatch[1] : null

      // Try og:image or img src from description if no image yet
      if (!image && !LOW_RES.includes(source)) {
        const descImg = desc.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i)
        if (descImg && !descImg[1].includes('1x1')) image = descImg[1]
      }

      // Generate stable unique id from full link
      let id
      try { 
        // Use last 20 chars of base64 of full link for uniqueness
        const encoded = btoa(unescape(encodeURIComponent(link)))
        id = encoded.replace(/[+/=]/g, '').slice(-16)
        if (id.length < 4) id = Math.random().toString(36).slice(2)
      } catch { id = Math.random().toString(36).slice(2) }

      items.push({
        id,
        source,
        section,
        title: stripHtml(title),
        link,
        summary: stripHtml(desc).slice(0, 300),
        image,
        date: pub ? new Date(pub).toISOString() : null,
      })
    }

    return json({ items })
  } catch (e) {
    return json({ error: e.message, items: [] })
  }
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=600',
    },
  })
}
