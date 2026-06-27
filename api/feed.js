export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url).searchParams.get('url')
  if (!url) return new Response('Missing url', { status: 400 })
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(8000),
    })
    const text = await res.text()
    return new Response(text, {
      headers: { 'Content-Type': 'application/xml', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 's-maxage=600' },
    })
  } catch (e) {
    return new Response(`Error: ${e.message}`, { status: 500 })
  }
}
