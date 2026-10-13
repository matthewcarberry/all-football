import type { NewsItem, NewsResponse } from '../shared/types.js'

const feeds = [
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport Football' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN Soccer' },
]

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
}

function cleanText(value: string) {
  return decodeXml(value.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? cleanText(match[1]) : ''
}

function readAttribute(block: string, tag: string, attribute: string) {
  const match = block.match(new RegExp(`<${tag}\\b[^>]*\\b${attribute}="([^"]+)"`, 'i'))
  return match ? decodeXml(match[1]) : undefined
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  for (const [index, match] of [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].entries()) {
    const block = match[1]
    const title = readTag(block, 'title')
    const url = readTag(block, 'link')
    const publishedAt = readTag(block, 'pubDate')
    const publishedTimestamp = Date.parse(publishedAt)
    if (!title || !url || !Number.isFinite(publishedTimestamp)) continue
    items.push({
      id: readTag(block, 'guid') || `${source}-${index}-${url}`,
      title,
      summary: readTag(block, 'description'),
      url,
      source,
      publishedAt: new Date(publishedTimestamp).toISOString(),
      imageUrl: readAttribute(block, 'media:thumbnail', 'url') ?? readAttribute(block, 'media:content', 'url'),
    })
  }
  return items
}

export async function fetchFootballNews(): Promise<NewsResponse> {
  let lastError = 'News feeds unavailable'
  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
      if (!response.ok) throw new Error(`${feed.source} returned ${response.status}`)
      const items = parseFeed(await response.text(), feed.source).slice(0, 12)
      if (items.length) return { items, source: feed.source, lastUpdated: new Date().toISOString() }
      throw new Error(`${feed.source} returned no stories`)
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }
  return { items: [], source: 'News feeds', lastUpdated: new Date().toISOString(), message: lastError }
}
