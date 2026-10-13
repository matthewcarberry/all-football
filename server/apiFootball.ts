import { getLeagueDashboard, leagueCatalog } from '../shared/leagueCatalog.js'
import type { DashboardData, LiveMatchSummary, Team, TeamRecord, UpcomingMatch } from '../shared/types.js'
import { getVenueTimeZone } from '../shared/timezones.js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io'
const apiKey = () => process.env.API_FOOTBALL_KEY?.trim()
const season = () => Number(process.env.API_FOOTBALL_SEASON ?? 2026)
const dashboardCacheTtlMs = Number(process.env.API_FOOTBALL_CACHE_TTL_MS ?? 60_000)
const squadCacheTtlMs = Number(process.env.API_FOOTBALL_SQUAD_CACHE_TTL_MS ?? 21_600_000)
const configuredDailyRequestLimit = Number(process.env.API_FOOTBALL_DAILY_LIMIT ?? 5_000)
const dailyRequestLimit = Number.isFinite(configuredDailyRequestLimit) ? Math.min(5_000, Math.max(0, configuredDailyRequestLimit)) : 5_000
const usageFile = process.env.API_FOOTBALL_USAGE_FILE ?? '/app/data/api-football-usage.json'

const apiFootballLeagueIds: Record<string, number> = {
  'premier-league': 39,
  'la-liga': 140,
  bundesliga: 78,
  'serie-a': 135,
  'ligue-1': 61,
  mls: 253,
  'liga-mx': 262,
  eredivisie: 88,
  'liga-portugal': 94,
  'saudi-pro-league': 307,
  'brasileirao-serie-a': 71,
  'j1-league': 98,
  'k-league-1': 292,
  nwsl: 254,
  wsl: 44,
  'uefa-nations-league': 5,
}

type ApiEnvelope<T> = {
  errors?: unknown
  results?: number
  response?: T[]
}

type ApiStanding = {
  rank?: number
  team?: { id?: number; name?: string; logo?: string }
  points?: number
  goalsDiff?: number
  form?: string
  all?: { played?: number; win?: number; draw?: number; lose?: number; goals?: { for?: number; against?: number } }
}

type ApiStandingsResponse = { league?: { standings?: ApiStanding[][] } }

type ApiLeague = { id?: number; name?: string; logo?: string; round?: string }

type ApiFixture = {
  fixture?: { id?: number; date?: string; timestamp?: number; status?: { short?: string; long?: string; elapsed?: number | null }; venue?: { name?: string } }
  league?: ApiLeague
  teams?: { home?: { id?: number; name?: string; logo?: string }; away?: { id?: number; name?: string; logo?: string } }
  goals?: { home?: number | null; away?: number | null }
}

type ApiSquadPlayer = {
  id?: number
  name?: string
  age?: number
  number?: number | null
  position?: string
  photo?: string
}

type ApiSquadResponse = { players?: ApiSquadPlayer[] }

const dashboardCache = new Map<string, { expiresAt: number; data: DashboardData }>()
const squadCache = new Map<string, { expiresAt: number; squad: NonNullable<Team['squad']> }>()

type ApiUsage = { date: string; used: number }

const teamAliases: Record<string, string> = {
  'afc bournemouth': 'Bournemouth',
  'd c united': 'DC United',
  'red bull new york': 'New York Red Bulls',
  'st louis city sc': 'St. Louis City SC',
  'orlando city sc': 'Orlando City',
  'atlanta united fc': 'Atlanta United',
  'inter miami cf': 'Inter Miami',
  'houston dynamo fc': 'Houston Dynamo',
  'seattle sounders fc': 'Seattle Sounders',
  'minnesota united fc': 'Minnesota United',
  'america': 'Club América',
  'club america': 'Club América',
  guadalajara: 'Chivas',
  santos: 'Santos Laguna',
  'fc juarez': 'Juárez',
  'as roma': 'Roma',
  'ac milan': 'Milan',
  'inter milan': 'Internazionale',
  'fc augsburg': 'Augsburg',
  mainz: 'Mainz 05',
  'tsg hoffenheim': 'Hoffenheim',
  '1 fc union berlin': 'Union Berlin',
  'fc cologne': 'Cologne',
  'sv elversberg': 'Elversberg',
  'sc paderborn 07': 'Paderborn',
  'schalke 04': 'Schalke',
  'hamburg sv': 'Hamburg',
  'aj auxerre': 'Auxerre',
  'as monaco': 'Monaco',
  'le havre ac': 'Le Havre',
  'stade rennais': 'Rennes',
  'paris saint germain': 'Paris Saint-Germain',
  'fc famalicao': 'Famalicão',
  'vitoria de guimaraes': 'Vitória Guimarães',
  'c d nacional': 'Nacional',
  'academico de viseu': 'Viseu',
  'go ahead eagles': 'Go Ahead',
  'fortuna sittard': 'Sittard',
  'ajax amsterdam': 'Ajax',
  'feyenoord rotterdam': 'Feyenoord',
  'sparta rotterdam': 'Sparta',
  'fc twente': 'FC Twente',
  'fc utrecht': 'FC Utrecht',
  'fc groningen': 'Groningen',
  'sc cambuur': 'Cambuur',
  'nec nijmegen': 'NEC Nijmegen',
  'p s v eindhoven': 'PSV Eindhoven',
  'neom sc': 'NEOM Sports Club',
  'al diriyah': 'Diriyah FC',
  'al faisaly': 'Al Faisaly',
  'red bull bragantino': 'Bragantino',
  'sanfrecce hiroshima': 'Hiroshima Sanfrecce',
  'jef united ichihara chiba': 'JEF United Chiba',
  'fagiano okayama': 'Okayama',
  'tokyo verdy 1969': 'Tokyo Verdy',
  'jeonbuk': 'Jeonbuk Hyundai Motors',
  sangmu: 'Gimcheon Sangmu',
  'jeju united': 'Jeju SK',
}

export async function hydrateDashboardWithApiFootball(baseDashboard: DashboardData): Promise<DashboardData> {
  const leagueId = apiFootballLeagueIds[baseDashboard.league.id]
  if (!apiKey() || !leagueId) return baseDashboard
  const cached = dashboardCache.get(baseDashboard.league.id)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  try {
    const [standings, fixtures] = await Promise.all([
      getApi<ApiStandingsResponse>(`/standings?league=${leagueId}&season=${season()}`),
      getApi<ApiFixture>(`/fixtures?league=${leagueId}&season=${season()}`),
    ])
    let leagueInfo: { league?: ApiLeague }[] = []
    try {
      leagueInfo = await getApi<{ league?: ApiLeague }>(`/leagues?id=${leagueId}&season=${season()}`)
    } catch (error) {
      console.warn(`API-Football league metadata unavailable for ${baseDashboard.league.id}:`, error)
    }
    const hydrated = applyApiData(baseDashboard, standings, fixtures, leagueInfo)
    dashboardCache.set(baseDashboard.league.id, { data: hydrated, expiresAt: Date.now() + dashboardCacheTtlMs })
    return hydrated
  } catch (error) {
    console.warn(`API-Football unavailable for ${baseDashboard.league.id}:`, error)
    return baseDashboard
  }
}

export async function getTeamSquad(leagueId: string, teamId: string) {
  const baseDashboard = getLeagueDashboard(leagueId)
  const dashboard = await hydrateDashboardWithApiFootball(baseDashboard)
  const team = dashboard.teams.find((candidate) => candidate.id === teamId)
  if (!team?.providerId) return []
  const cacheKey = `${leagueId}:${team.providerId}`
  const cached = squadCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.squad
  try {
    const response = await getApi<ApiSquadResponse>(`/players/squads?team=${team.providerId}`)
    const squad = (response ?? []).flatMap((entry) => entry.players ?? []).flatMap((player): NonNullable<Team['squad']> => player.id && player.name ? [{ id: String(player.id), name: player.name, position: player.position ?? 'Player', ...(typeof player.number === 'number' ? { number: player.number } : {}), status: 'available' as const }] : [])
    squadCache.set(cacheKey, { squad, expiresAt: Date.now() + squadCacheTtlMs })
    return squad
  } catch (error) {
    console.warn(`API-Football squad unavailable for ${team.name}:`, error)
    return []
  }
}

export async function fetchAllLiveMatchesFromApiFootball(): Promise<LiveMatchSummary[]> {
  const dashboards: DashboardData[] = []
  for (const league of leagueCatalog) dashboards.push(await hydrateDashboardWithApiFootball(getLeagueDashboard(league.id)))
  return dashboards.flatMap((dashboard) => dashboard.matches.filter((match) => match.status === 'in-progress').flatMap((match) => {
    const home = dashboard.teams.find((team) => team.id === match.home.teamId)
    const away = dashboard.teams.find((team) => team.id === match.away.teamId)
    if (!home || !away) return []
    return [{ id: `${dashboard.league.id}-${match.id}`, league: { id: dashboard.league.id, name: dashboard.league.name, shortName: dashboard.league.shortName, accent: dashboard.league.accent, logoUrl: dashboard.league.logoUrl }, kickoff: match.kickoff, competitionStage: match.competitionStage, venue: match.venue, broadcast: match.broadcast, home: { team: home, ...(match.home.score !== undefined ? { score: match.home.score } : {}) }, away: { team: away, ...(match.away.score !== undefined ? { score: match.away.score } : {}) }, status: 'in-progress' as const, ...(match.liveScore ? { liveScore: match.liveScore } : {}) } satisfies LiveMatchSummary]
  }))
}

export function getApiFootballUsage() {
  const usage = readUsage()
  return { provider: 'API-Football', date: usage.date, used: usage.used, limit: dailyRequestLimit, remaining: Math.max(0, dailyRequestLimit - usage.used) }
}

async function getApi<T>(path: string): Promise<T[]> {
  reserveApiRequest()
  const response = await fetch(`${API_FOOTBALL_BASE}${path}`, { headers: { Accept: 'application/json', 'x-apisports-key': apiKey() ?? '' }, signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`API-Football returned ${response.status}`)
  const payload = await response.json() as ApiEnvelope<T>
  if (payload.errors && Object.keys(payload.errors as object).length) throw new Error(`API-Football returned errors for ${path}`)
  return payload.response ?? []
}

function reserveApiRequest() {
  const usage = readUsage()
  if (usage.used >= dailyRequestLimit) throw new Error(`API-Football daily request budget exhausted (${dailyRequestLimit})`)
  usage.used += 1
  mkdirSync(dirname(usageFile), { recursive: true })
  writeFileSync(usageFile, JSON.stringify(usage), 'utf8')
}

function readUsage(): ApiUsage {
  const date = new Date().toISOString().slice(0, 10)
  try {
    const parsed = JSON.parse(readFileSync(usageFile, 'utf8')) as Partial<ApiUsage>
    if (parsed.date !== date) return { date, used: 0 }
    if (parsed.date === date && Number.isInteger(parsed.used) && Number(parsed.used) >= 0) return { date, used: Number(parsed.used) }
    throw new Error('Invalid API-Football usage file')
  } catch (error) {
    if (!existsSync(usageFile)) return { date, used: 0 }
    throw new Error(`Unable to safely read API-Football usage file: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

function applyApiData(baseDashboard: DashboardData, standings: ApiStandingsResponse[], fixtures: ApiFixture[], leagueInfo: { league?: ApiLeague }[]) {
  const teamsByName = new Map(baseDashboard.teams.map((team) => [normalizeTeamName(team.name), team]))
  const apiStandings = flattenStandings(standings)
  const records = new Map<string, TeamRecord>()
  const providerIds = new Map<string, number>()
  const logos = new Map<string, string>()
  for (const entry of apiStandings) {
    const team = findTeam(teamsByName, entry.team?.name ?? '')
    if (!team) continue
    const all = entry.all ?? {}
    const goalsFor = all.goals?.for ?? 0
    const goalsAgainst = all.goals?.against ?? 0
    records.set(team.id, { played: all.played ?? 0, wins: all.win ?? 0, draws: all.draw ?? 0, losses: all.lose ?? 0, goalsFor, goalsAgainst, goalDifference: entry.goalsDiff ?? goalsFor - goalsAgainst, points: entry.points ?? 0 })
    if (entry.team?.id) providerIds.set(team.id, entry.team.id)
    if (entry.team?.logo) logos.set(team.id, entry.team.logo)
  }
  const eventMatches = fixtures.flatMap((fixture) => buildMatch(baseDashboard, fixture, teamsByName)).filter((match): match is UpcomingMatch => Boolean(match))
  const currentWeek = deriveCurrentWeek(baseDashboard, records, eventMatches)
  const eventByPair = new Map(eventMatches.map((match) => [pairKey(match.home.teamId, match.away.teamId), match]))
  const mergedBase = baseDashboard.matches.map((match) => {
    const liveMatch = eventByPair.get(pairKey(match.home.teamId, match.away.teamId))
    if (!liveMatch) return match
    return { ...match, kickoff: liveMatch.kickoff, competitionStage: liveMatch.competitionStage, venue: liveMatch.venue !== 'Venue TBA' ? liveMatch.venue : match.venue, venueTimeZone: liveMatch.venueTimeZone ?? match.venueTimeZone, home: liveMatch.home, away: liveMatch.away, status: liveMatch.status, ...(liveMatch.liveScore ? { liveScore: liveMatch.liveScore } : {}) }
  })
  const knownPairs = new Set(mergedBase.map((match) => pairKey(match.home.teamId, match.away.teamId)))
  const matches = filterStale([...mergedBase, ...eventMatches.filter((match) => !knownPairs.has(pairKey(match.home.teamId, match.away.teamId)))])
  const league = leagueInfo[0]?.league
  const teams = baseDashboard.teams.map((team) => ({ ...team, ...(records.has(team.id) ? { record: records.get(team.id) } : {}), ...(providerIds.has(team.id) ? { providerId: providerIds.get(team.id) } : {}), ...(logos.has(team.id) ? { logoUrl: logos.get(team.id) } : {}) }))
  return { ...baseDashboard, league: { ...baseDashboard.league, currentWeek }, ...(league?.logo ? { league: { ...baseDashboard.league, currentWeek, logoUrl: league.logo } } : {}), provider: { ...baseDashboard.provider, mode: 'live' as const, name: 'API-Football', lastUpdated: new Date().toISOString(), message: 'Matches, standings, league metadata, and live status are updating from API-Football.' }, teams, matches }
}

function flattenStandings(payloads: ApiStandingsResponse[]) {
  return payloads.flatMap((payload) => payload.league?.standings?.flat() ?? [])
}

function buildMatch(dashboard: DashboardData, fixture: ApiFixture, teamsByName: Map<string, Team>): UpcomingMatch | undefined {
  const home = findTeam(teamsByName, fixture.teams?.home?.name ?? '')
  const away = findTeam(teamsByName, fixture.teams?.away?.name ?? '')
  const kickoff = fixture.fixture?.date
  if (!home || !away || !kickoff || !fixture.fixture?.id) return undefined
  const state = fixtureState(fixture.fixture.status?.short)
  const homeScore = fixture.goals?.home ?? undefined
  const awayScore = fixture.goals?.away ?? undefined
  const venueTimeZone = getVenueTimeZone(dashboard.league.id, home.name)
  const stage = fixture.league?.round ? roundLabel(fixture.league.round) : `Matchweek ${Math.max(1, Math.max(home.record.played, away.record.played) + (state === 'final' ? 0 : 1))}`
  const liveScore = state === 'in-progress' || state === 'final' ? { ...(homeScore !== undefined ? { homeScore } : {}), ...(awayScore !== undefined ? { awayScore } : {}), ...(fixture.fixture.status?.elapsed != null ? { clock: `${fixture.fixture.status.elapsed}'` } : {}), status: fixture.fixture.status?.long } : undefined
  return { id: `api-football-${fixture.fixture.id}`, kickoff, competitionStage: stage, venue: fixture.fixture.venue?.name ?? 'Venue TBA', venueTimeZone, home: { teamId: home.id, ...(homeScore !== undefined ? { score: homeScore } : {}) }, away: { teamId: away.id, ...(awayScore !== undefined ? { score: awayScore } : {}) }, status: state, ...(liveScore ? { liveScore } : {}) }
}

function deriveCurrentWeek(dashboard: DashboardData, records: Map<string, TeamRecord>, matches: UpcomingMatch[]) {
  const maxPlayed = Math.max(...[...records.values()].map((record) => record.played), 0)
  const target = maxPlayed > 0 ? maxPlayed + 1 : dashboard.league.currentWeek
  const upcomingRounds = matches.filter((match) => match.status !== 'final' && Date.parse(match.kickoff) > Date.now()).map((match) => Number(match.competitionStage.match(/(\d+)$/)?.[1])).filter((week) => Number.isFinite(week) && week >= target)
  return Math.min(dashboard.league.matchweekCount, upcomingRounds.length ? Math.min(...upcomingRounds) : target)
}

function fixtureState(status: string | undefined): UpcomingMatch['status'] {
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status ?? '')) return 'in-progress'
  if (['FT', 'AET', 'PEN'].includes(status ?? '')) return 'final'
  return 'upcoming'
}

function roundLabel(round: string) {
  const number = round.match(/(\d+)$/)?.[1]
  return number ? `Matchweek ${number}` : round
}

function findTeam(teamsByName: Map<string, Team>, name: string) {
  const normalized = normalizeTeamName(name)
  const alias = teamAliases[normalized]
  return teamsByName.get(normalized) ?? (alias ? teamsByName.get(normalizeTeamName(alias)) : undefined) ?? teamsByName.get(normalized.replace(/\b(fc|sc|cf|city|united|town)\b/g, '').replace(/\s+/g, ' ').trim())
}

function filterStale(matches: UpcomingMatch[]) {
  return matches.filter((match) => match.status !== 'upcoming' || Date.parse(match.kickoff) > Date.now())
}

function pairKey(homeId: string, awayId: string) {
  return `${homeId}|${awayId}`
}

function normalizeTeamName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}
