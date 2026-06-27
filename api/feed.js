export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return new Response('Missing url', { status: 400 })

  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Feedfetcher-Google; (+http://www.google.com/feedfetcher.html; 1 subscribers; feed-id=1234)',
    'Mozilla/5.0 (compatible; RSS reader)',
  ]

  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        redirect: 'follow',
      })

      const text = await res.text()

      // Must contain RSS/Atom markers to be valid
      const isXml = text.includes('<rss') || text.includes('<feed') || text.includes('<channel') || text.includes('<?xml')
      if (!isXml) continue

      return new Response(text, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 's-maxage=600, stale-while-revalidate=300',
          'X-Aurora-Status': 'ok',
        },
      })
    } catch (e) {
      continue
    }
  }

  return new Response('<error>Could not fetch feed</error>', {
    status: 502,
    headers: {
      'Content-Type': 'application/xml',
      'Access-Control-Allow-Origin': '*',
      'X-Aurora-Status': 'error',
    },
  })
}
