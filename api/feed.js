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
    const kws = NO_KW[source]; if (!kws) return false
    return kws.some(k => title.toLowerCase().includes(k))
  }

  function stripHtml(s) {
    return (s||'').replace(/<[^>]+>/g,' ')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"')
      .replace(/&#x([0-9a-fA-F]+);/g,(_,h)=>String.fromCodePoint(parseInt(h,16)))
      .replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(parseInt(d,10)))
      .replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim()
  }

  function extractText(block, tag) {
    // Handles both CDATA and plain content
    const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
    return m ? m[1].trim() : ''
  }

  function extractImage(block, descContent) {
    if (LOW_RES.includes(source)) return null

    // 1. media:thumbnail
    const mt = block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)
    if (mt?.[1] && !mt[1].includes('1x1')) return mt[1]

    // 2. media:content with image type or medium
    const mc = block.match(/media:content[^>]+url=["']([^"']+)["'][^>]*(?:medium=["']image["']|type=["']image)/i)
            || block.match(/media:content[^>]*(?:medium=["']image["']|type=["']image)[^>]+url=["']([^"']+)["']/i)
    if (mc?.[1] && !mc[1].includes('1x1')) return mc[1]

    // 3. media:content with image extension URL
    const mcExt = block.match(/media:content[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*?)["']/i)
    if (mcExt?.[1] && !mcExt[1].includes('1x1')) return mcExt[1]

    // 4. enclosure with image type
    const enc = block.match(/enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image/i)
             || block.match(/enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)
    if (enc?.[1]) return enc[1]

    // 5. img tag in description/content (including CDATA)
    const imgInDesc = descContent.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgInDesc?.[1] && !imgInDesc[1].includes('1x1') && !imgInDesc[1].includes('pixel')) return imgInDesc[1]

    // 6. Any URL with image extension in the whole block
    const anyImg = block.match(/https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)(?:[^"'\s<>]*)?/i)
    if (anyImg?.[0] && !anyImg[0].includes('1x1') && anyImg[0].length > 20) return anyImg[0]

    return null
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    const text = await res.text()

    const items = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>|<entry[^>]*>([\s\S]*?)<\/entry>/gi
    let match

    while ((match = itemRegex.exec(text)) !== null && items.length < 10) {
      const block = match[1] || match[2]
      const title = stripHtml(extractText(block, 'title'))
      if (!title || isExcluded(title)) continue

      const linkText = block.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim()
      const linkHref = block.match(/<link[^/]*href=["']([^"']+)["']/i)?.[1]
      const link = linkText || linkHref || '#'

      // Get full description content including CDATA
      const descRaw = extractText(block, 'description') || extractText(block, 'summary') || extractText(block, 'content')
      const image = extractImage(block, descRaw)

      const pub = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]
               || block.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]
               || block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || ''

      let id
      try { id = btoa(unescape(encodeURIComponent(link))).replace(/[+/=]/g,'').slice(-16) }
      catch { id = Math.random().toString(36).slice(2) }

      items.push({
        id, source, section, title,
        link,
        summary: stripHtml(descRaw).slice(0, 300),
        image,
        date: pub ? new Date(pub).toISOString() : null,
      })
    }

    // For articles without images, try microlink.io to get og:image
    const NO_SCRAPE = ['FT','FT Opinion','FT Alphaville','The Economist','The Economist Leaders','MarketWatch']
    if (!NO_SCRAPE.includes(source)) {
      const needsImg = items.filter(a => !a.image && a.link !== '#')
      if (needsImg.length > 0) {
        await Promise.allSettled(needsImg.map(async (a) => {
          try {
            const r = await fetch(`https://api.microlink.io?url=${encodeURIComponent(a.link)}&meta=false&screenshot=false`, {
              signal: AbortSignal.timeout(4000),
            })
            const d = await r.json()
            if (d?.data?.image?.url) a.image = d.data.image.url
            else if (d?.data?.logo?.url) a.image = d.data.logo.url
          } catch {}
        }))
      }
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
      'Cache-Control': 's-maxage=600, stale-while-revalidate=300',
    },
  })
}
