import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getLeagueDashboard } from '../shared/leagueCatalog.js'
import { sampleDashboard } from '../shared/sampleData.js'
import type { DashboardData } from '../shared/types.js'
import { fetchAllLiveMatchesFromApiFootball, getApiFootballUsage, getTeamSquad, hydrateDashboardWithApiFootball } from './apiFootball.js'
import { fetchFootballNews } from './news.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 8787)
const cacheTtlMs = Number(process.env.CACHE_TTL_MS ?? 60_000)
const liveCacheTtlMs = Number(process.env.LIVE_CACHE_TTL_MS ?? 15_000)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDist = path.resolve(__dirname, '../../dist')
let cachedDashboard: { expiresAt: number; data: DashboardData } | undefined
let cachedLiveMatches: { expiresAt: number; data: Awaited<ReturnType<typeof fetchAllLiveMatchesFromApiFootball>> } | undefined
let cachedNews: { expiresAt: number; data: Awaited<ReturnType<typeof fetchFootballNews>> } | undefined

app.use(cors())
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (_request, response) => response.json({ ok: true, provider: 'premier-league-match-shell', timestamp: new Date().toISOString() }))

app.get('/api/provider-usage', (_request, response) => response.json(getApiFootballUsage()))

app.get('/api/news', async (_request, response) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    const now = Date.now()
    if (cachedNews && cachedNews.expiresAt > now) {
      response.json(cachedNews.data)
      return
    }
    const data = await fetchFootballNews()
    cachedNews = { data, expiresAt: now + 60_000 }
    response.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'News provider error'
    response.status(200).json({ items: [], source: 'News feeds', lastUpdated: new Date().toISOString(), message })
  }
})

app.get('/api/live-matches', async (_request, response) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    const now = Date.now()
    if (cachedLiveMatches && cachedLiveMatches.expiresAt > now) {
      response.json({ matches: cachedLiveMatches.data, lastUpdated: new Date().toISOString(), source: 'API-Football' })
      return
    }
    const matches = await fetchAllLiveMatchesFromApiFootball()
    cachedLiveMatches = { data: matches, expiresAt: now + liveCacheTtlMs }
    response.json({ matches, lastUpdated: new Date().toISOString(), source: 'API-Football' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live match provider error'
    response.status(200).json({ matches: [], lastUpdated: new Date().toISOString(), source: 'API-Football', message })
  }
})

app.get('/api/team-squad', async (request, response) => {
  const leagueId = typeof request.query.league === 'string' ? request.query.league : ''
  const teamId = typeof request.query.team === 'string' ? request.query.team : ''
  if (!leagueId || !teamId) {
    response.status(400).json({ squad: [], message: 'Both league and team are required.' })
    return
  }
  const squad = await getTeamSquad(leagueId, teamId)
  response.setHeader('Cache-Control', 'public, max-age=21600')
  response.json({ league: leagueId, teamId, squad, source: 'API-Football', lastUpdated: new Date().toISOString() })
})

app.get('/api/dashboard', async (_request, response) => {
  try {
    response.setHeader('Cache-Control', 'no-store')
    const requestedLeague = typeof _request.query.league === 'string' ? _request.query.league : 'premier-league'
    const baseDashboard = getLeagueDashboard(requestedLeague)
    const now = Date.now()
    if (cachedDashboard && cachedDashboard.expiresAt > now && cachedDashboard.data.league.id === baseDashboard.league.id) {
      response.json(cachedDashboard.data)
      return
    }
    const dashboard = await hydrateDashboardWithApiFootball(baseDashboard)
    const ttl = dashboard.matches.some((match) => match.status === 'in-progress') ? liveCacheTtlMs : cacheTtlMs
    cachedDashboard = { data: dashboard, expiresAt: now + ttl }
    response.json(dashboard)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provider error'
    response.status(200).json({ ...sampleDashboard, provider: { ...sampleDashboard.provider, mode: 'offline', name: 'Local match shell', lastUpdated: new Date().toISOString(), message } })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist))
  app.get(/.*/, (_request, response) => response.sendFile(path.join(clientDist, 'index.html')))
}

app.listen(port, '0.0.0.0', () => console.log(`Premier League dashboard listening on ${port}`))
