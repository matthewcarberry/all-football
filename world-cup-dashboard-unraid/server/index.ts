import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sampleDashboard } from '../shared/sampleData.js'
import type { DashboardData } from '../shared/types.js'
import { buildOpenfootballDashboard } from './openfootballDashboard.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 8787)
const cacheTtlMs = Number(process.env.CACHE_TTL_MS ?? 60_000)
const liveCacheTtlMs = Number(process.env.LIVE_CACHE_TTL_MS ?? 15_000)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDist = path.resolve(__dirname, '../../dist')

let cachedDashboard: { expiresAt: number; data: DashboardData } | undefined
const headshotCache = new Map<string, { expiresAt: number; thumbnailUrl?: string }>()

app.use(cors())
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    provider: 'openfootball-wikipedia',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/headshot', async (request, response) => {
  const name = String(request.query.name ?? '').trim()
  const color = String(request.query.color ?? '#667484')
  const source = String(request.query.source ?? 'foxsports').trim()

  if (!name) {
    response.status(400).send('Missing player name')
    return
  }

  try {
    const thumbnailUrl = await resolveHeadshotUrl(name, source)
    if (thumbnailUrl) {
      response.setHeader('Cache-Control', 'public, max-age=86400')
      response.setHeader('X-Headshot-Provider', thumbnailUrl.includes('b.fssta.com') ? 'foxsports' : 'fallback')
      response.redirect(302, thumbnailUrl)
      return
    }
  } catch (error) {
    console.warn(`Headshot lookup failed for ${name}:`, error)
  }

  response.setHeader('Cache-Control', 'public, max-age=3600')
  response.setHeader('X-Headshot-Provider', 'generated')
  response.type('image/svg+xml').send(buildFallbackHeadshot(name, color))
})

app.get('/api/dashboard', async (_request, response) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    const now = Date.now()
    if (cachedDashboard && cachedDashboard.expiresAt > now) {
      response.json(cachedDashboard.data)
      return
    }

    const dashboard = await buildOpenfootballDashboard()
    const ttlMs = dashboard.matches.some((match) => match.status === 'in-progress') ? liveCacheTtlMs : cacheTtlMs
    cachedDashboard = {
      data: dashboard,
      expiresAt: now + ttlMs,
    }

    response.json(dashboard)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provider error'
    response.status(200).json({
      ...sampleDashboard,
      provider: {
        ...sampleDashboard.provider,
        mode: 'offline',
        lastUpdated: new Date().toISOString(),
        message: `OpenFootball/Wikipedia provider failed. Fallback shell remains available, but sourced standings, squads, and bracket placements should be treated as unavailable. ${message}`,
      },
    })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist))
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(port, '0.0.0.0', () => {
  console.log(`World Cup dashboard listening on ${port}`)
})

async function resolveHeadshotUrl(name: string, source: string): Promise<string | undefined> {
  const cacheKey = `${source}:${name.toLowerCase()}`
  const cached = headshotCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.thumbnailUrl
  }

  const foxSportsThumbnail = await fetchFoxSportsHeadshot(name)
  if (foxSportsThumbnail) {
    cacheHeadshot(cacheKey, foxSportsThumbnail)
    return foxSportsThumbnail
  }

  const directThumbnail = await fetchWikipediaThumbnail(name)
  if (directThumbnail) {
    cacheHeadshot(cacheKey, directThumbnail)
    return directThumbnail
  }

  const searchThumbnail = await searchWikipediaThumbnail(name)
  cacheHeadshot(cacheKey, searchThumbnail)
  return searchThumbnail
}

async function fetchFoxSportsHeadshot(name: string): Promise<string | undefined> {
  const slug = slugifyFoxSportsPlayerName(name)
  if (!slug) {
    return undefined
  }

  const response = await fetch(`https://www.foxsports.com/soccer/${slug}-player`, {
    headers: {
      'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
    },
  })

  if (!response.ok) {
    return undefined
  }

  const html = await response.text()
  const matches = [...html.matchAll(/https:\/\/b\.fssta\.com\/uploads\/application\/soccer\/headshots\/[^"'<>\s)]+/g)].map(
    (match) => match[0].replace(/&amp;/g, '&'),
  )

  return (
    matches.find((url) => url.includes('.vresize.350.350.')) ??
    matches.find((url) => url.includes('.vresize.220.220.')) ??
    matches.find((url) => url.includes('.vresize.112.112.')) ??
    matches[0]
  )
}

function slugifyFoxSportsPlayerName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cacheHeadshot(cacheKey: string, thumbnailUrl: string | undefined) {
  headshotCache.set(cacheKey, {
    expiresAt: Date.now() + (thumbnailUrl ? 1000 * 60 * 60 * 24 : 1000 * 60 * 5),
    thumbnailUrl,
  })
}

async function fetchWikipediaThumbnail(title: string): Promise<string | undefined> {
  const normalizedTitle = title.replaceAll(' ', '_')
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
    },
  })

  if (!response.ok) {
    return undefined
  }

  const payload = (await response.json()) as { thumbnail?: { source?: string } }
  return payload.thumbnail?.source
}

async function searchWikipediaThumbnail(name: string): Promise<string | undefined> {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('list', 'search')
  url.searchParams.set('srsearch', `${name} footballer`)
  url.searchParams.set('srlimit', '5')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
    },
  })

  if (!response.ok) {
    return undefined
  }

  const payload = (await response.json()) as { query?: { search?: Array<{ title: string }> } }
  const candidates = payload.query?.search ?? []

  for (const candidate of candidates) {
    const thumbnail = await fetchWikipediaThumbnail(candidate.title)
    if (thumbnail) {
      return thumbnail
    }
  }

  return undefined
}

function buildFallbackHeadshot(name: string, color: string) {
  const initials = name
    .split(/\s+/)
    .map((part) => part.at(0) ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : '#667484'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${safeColor}"/><circle cx="48" cy="35" r="18" fill="rgba(255,255,255,.82)"/><path d="M18 88c4-21 17-33 30-33s26 12 30 33" fill="rgba(255,255,255,.82)"/><text x="48" y="83" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#111820">${initials}</text></svg>`
}
