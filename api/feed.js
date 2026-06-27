export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return new Response('Missing url', { status: 400 })

  // Try multiple approaches
  const attempts = [
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    },
    {
      headers: {
        'User-Agent': 'Feedfetcher-Google; (+http://www.google.com/feedfetcher.html)',
        'Accept': '*/*',
      }
    },
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Aurora RSS Reader/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    }
  ]

  for (const attempt of attempts) {
    try {
      const res = await fetch(url, {
        headers: attempt.headers,
        redirect: 'follow',
      })
      if (!res.ok) continue
      const text = await res.text()
      if (!text.includes('<') ) continue  // not XML/HTML
      return new Response(text, {
        headers: {
          'Content-Type': res.headers.get('content-type') || 'application/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 's-maxage=600, stale-while-revalidate=300',
        },
      })
    } catch { continue }
  }

  return new Response('Failed to fetch feed', { status: 502 })
}
