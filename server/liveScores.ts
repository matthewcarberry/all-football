import { getLeagueDashboard, leagueCatalog } from '../shared/leagueCatalog.js'
import type { DashboardData, LiveMatchSummary, Team, UpcomingMatch } from '../shared/types.js'
import { getVenueTimeZone } from '../shared/timezones.js'

const ESPN_SCOREBOARD_BASE = 'https://site.web.api.espn.com/apis/site/v2/sports/soccer'

const espnLeagueSlugs: Record<string, string> = {
  'premier-league': 'eng.1',
  'la-liga': 'esp.1',
  bundesliga: 'ger.1',
  'serie-a': 'ita.1',
  'ligue-1': 'fra.1',
  mls: 'usa.1',
  'liga-mx': 'mex.1',
  eredivisie: 'ned.1',
  'liga-portugal': 'por.1',
  'saudi-pro-league': 'ksa.1',
  'brasileirao-serie-a': 'bra.1',
  'j1-league': 'jpn.1',
  nwsl: 'usa.nwsl',
  wsl: 'eng.w.1',
}

// ESPN uses fuller or alternate club names than the local catalog. Keep this
// map normalized so live events can be matched to the same club records used
// by standings, crests, and the live-match card.
const scoreboardTeamAliases: Record<string, string> = {
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

// The scoreboard feed does not expose a reliable round number. These are the
// maximum calendar spans used by the current matchweek in each competition;
// the next round is separated by a larger gap in the provider schedule. This
// matters most for MLS, where teams can have different games played totals.
const currentMatchweekWindowDays: Record<string, number> = {
  'premier-league': 2,
  'la-liga': 4,
  bundesliga: 2,
  'serie-a': 3,
  'ligue-1': 3,
  mls: 2,
  'liga-mx': 2,
  eredivisie: 2,
  'liga-portugal': 3,
  'saudi-pro-league': 4,
  'brasileirao-serie-a': 5,
  'j1-league': 4,
  nwsl: 3,
  wsl: 2,
}

type ScoreboardEvent = {
  id?: string
  date?: string
  competitions?: Array<{
    venue?: { fullName?: string }
    status?: { displayClock?: string; type?: { state?: string; shortDetail?: string; detail?: string } }
    competitors?: Array<{
      homeAway?: 'home' | 'away'
      score?: string
      team?: { displayName?: string; shortDisplayName?: string; abbreviation?: string }
    }>
  }>
}

type ScoreboardResponse = { events?: ScoreboardEvent[] }

export async function hydrateDashboardWithLiveScores(baseDashboard: DashboardData): Promise<DashboardData> {
  const slug = espnLeagueSlugs[baseDashboard.league.id]
  if (!slug) return { ...baseDashboard, matches: filterStaleUpcomingMatches(baseDashboard.matches) }

  try {
    const response = await fetch(`${ESPN_SCOREBOARD_BASE}/${slug}/scoreboard?dates=${scoreboardDate(-3)}-${scoreboardDate(7)}&limit=200`, {
      headers: { Accept: 'application/json', 'User-Agent': 'all-football-dashboard/1.0' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) throw new Error(`ESPN scoreboard returned ${response.status}`)
    const payload = await response.json() as ScoreboardResponse
    const events = (payload.events ?? []).map(parseScoreboardEvent).filter((event): event is ParsedScoreboardEvent => Boolean(event))
    const matches = filterStaleUpcomingMatches(mergeScoreboardEvents(baseDashboard, events))
    const dashboardWithStandings = applyCompletedMatchStats(baseDashboard, matches)
    const hasProviderData = events.length > 0
    const hasLiveMatch = matches.some((match) => match.status === 'in-progress')

    return {
      ...dashboardWithStandings,
      provider: {
        ...baseDashboard.provider,
        mode: hasProviderData ? 'live' : baseDashboard.provider.mode,
        name: hasProviderData ? 'ESPN live scoreboard' : baseDashboard.provider.name,
        lastUpdated: new Date().toISOString(),
        message: hasLiveMatch
          ? 'Live scores and match status are updating from ESPN.'
          : hasProviderData
            ? 'The latest ESPN match status has been applied.'
            : baseDashboard.provider.message,
      },
      matches,
    }
  } catch (error) {
    console.warn(`Live scoreboard unavailable for ${baseDashboard.league.id}:`, error)
    return {
      ...baseDashboard,
      provider: { ...baseDashboard.provider, lastUpdated: new Date().toISOString(), message: 'Live scoreboard is temporarily unavailable; showing the scheduled match data.' },
    }
  }
}

function filterStaleUpcomingMatches(matches: UpcomingMatch[]) {
  return matches.filter((match) => match.status !== 'upcoming' || Date.parse(match.kickoff) > Date.now())
}

export async function fetchAllLiveMatches(): Promise<LiveMatchSummary[]> {
  const dashboards = await Promise.all(leagueCatalog.map((league) => hydrateDashboardWithLiveScores(getLeagueDashboard(league.id))))
  return dashboards.flatMap((dashboard) => dashboard.matches
    .filter((match) => match.status === 'in-progress')
    .flatMap((match) => {
      const home = dashboard.teams.find((team) => team.id === match.home.teamId)
      const away = dashboard.teams.find((team) => team.id === match.away.teamId)
      if (!home || !away) return []
      return [{
        id: `${dashboard.league.id}-${match.id}`,
        league: {
          id: dashboard.league.id,
          name: dashboard.league.name,
          shortName: dashboard.league.shortName,
          accent: dashboard.league.accent,
          logoUrl: dashboard.league.logoUrl,
        },
        kickoff: match.kickoff,
        competitionStage: match.competitionStage,
        venue: match.venue,
        broadcast: match.broadcast,
        home: { team: home, ...(match.home.score !== undefined ? { score: match.home.score } : {}) },
        away: { team: away, ...(match.away.score !== undefined ? { score: match.away.score } : {}) },
        status: 'in-progress' as const,
        ...(match.liveScore ? { liveScore: match.liveScore } : {}),
      } satisfies LiveMatchSummary]
    }))
}

function applyCompletedMatchStats(dashboard: DashboardData, matches: UpcomingMatch[]) {
  // Static current-season standings already contain the historical record for
  // leagues that are in progress. Only derive a table from final scores when
  // the dashboard is still in its pre-season, zeroed state.
  if (dashboard.teams.some((team) => team.record.played > 0)) return dashboard

  const records = new Map<string, Team['record']>(dashboard.teams.map((team) => [team.id, { ...team.record }]))
  let completedMatches = 0
  for (const match of matches) {
    const homeScore = match.home.score
    const awayScore = match.away.score
    if (match.status !== 'final' || typeof homeScore !== 'number' || typeof awayScore !== 'number') continue
    const home = records.get(match.home.teamId)
    const away = records.get(match.away.teamId)
    if (!home || !away) continue
    completedMatches += 1
    home.played += 1
    away.played += 1
    home.goalsFor += homeScore
    home.goalsAgainst += awayScore
    away.goalsFor += awayScore
    away.goalsAgainst += homeScore
    if (homeScore > awayScore) {
      home.wins += 1
      home.points += 3
      away.losses += 1
    } else if (homeScore < awayScore) {
      away.wins += 1
      away.points += 3
      home.losses += 1
    } else {
      home.draws += 1
      away.draws += 1
      home.points += 1
      away.points += 1
    }
    home.goalDifference = home.goalsFor - home.goalsAgainst
    away.goalDifference = away.goalsFor - away.goalsAgainst
  }

  if (!completedMatches) return dashboard
  return {
    ...dashboard,
    teams: dashboard.teams.map((team) => ({ ...team, record: records.get(team.id) ?? team.record })),
  }
}

type ParsedScoreboardEvent = {
  id: string
  kickoff: string
  homeName: string
  awayName: string
  homeScore?: number
  awayScore?: number
  state: 'pre' | 'in' | 'post'
  status?: string
  clock?: string
  venue: string
}

function parseScoreboardEvent(event: ScoreboardEvent): ParsedScoreboardEvent | undefined {
  const competition = event.competitions?.[0]
  const competitors = competition?.competitors ?? []
  const home = competitors.find((competitor) => competitor.homeAway === 'home') ?? competitors[0]
  const away = competitors.find((competitor) => competitor.homeAway === 'away') ?? competitors[1]
  const state = competition?.status?.type?.state
  if (!event.id || !event.date || !home?.team || !away?.team || (state !== 'pre' && state !== 'in' && state !== 'post')) return undefined

  return {
    id: event.id,
    kickoff: event.date,
    homeName: home.team.displayName ?? home.team.shortDisplayName ?? home.team.abbreviation ?? '',
    awayName: away.team.displayName ?? away.team.shortDisplayName ?? away.team.abbreviation ?? '',
    homeScore: scoreNumber(home.score),
    awayScore: scoreNumber(away.score),
    state,
    status: competition?.status?.type?.shortDetail ?? competition?.status?.type?.detail,
    clock: competition?.status?.displayClock,
    venue: competition?.venue?.fullName ?? 'Venue TBA',
  }
}

function mergeScoreboardEvents(dashboard: DashboardData, events: ParsedScoreboardEvent[]): UpcomingMatch[] {
  const teamsByName = new Map<string, Team>()
  dashboard.teams.forEach((team) => {
    for (const name of [team.name, team.shortName, team.abbreviation]) teamsByName.set(normalizeTeamName(name), team)
  })

  const currentWeekWindowStart = findCurrentWeekWindowStart(events)

  const eventMatches = events.flatMap((event) => {
    const home = findTeam(teamsByName, event.homeName)
    const away = findTeam(teamsByName, event.awayName)
    if (!home || !away) return []
    const venueTimeZone = getVenueTimeZone(dashboard.league.id, home.name)
    const postMatchUntil = event.state === 'post' ? estimatePostMatchUntil(event.kickoff, venueTimeZone) : undefined
    const liveScore = event.homeScore !== undefined || event.awayScore !== undefined
      ? { homeScore: event.homeScore, awayScore: event.awayScore, clock: event.clock ?? event.status, status: event.status, ...(postMatchUntil ? { postMatchUntil } : {}) }
      : event.state === 'in' ? { clock: event.clock ?? event.status, status: event.status } : undefined
    const status = event.state === 'in' ? 'in-progress' as const : event.state === 'post' ? 'final' as const : 'upcoming' as const
    return [{
      id: `espn-${event.id}`,
      kickoff: event.kickoff,
      competitionStage: `Matchweek ${inferEventMatchweek(dashboard, home, away, event.state, event.kickoff, currentWeekWindowStart)}`,
      venue: event.venue,
      venueTimeZone,
      home: { teamId: home.id, ...(event.homeScore !== undefined ? { score: event.homeScore } : {}) },
      away: { teamId: away.id, ...(event.awayScore !== undefined ? { score: event.awayScore } : {}) },
      status,
      ...(liveScore ? { liveScore } : {}),
    } satisfies UpcomingMatch]
  })

  const eventByPair = new Map(eventMatches.map((match) => [pairKey(match.home.teamId, match.away.teamId), match]))
  const mergedBase = dashboard.matches.map((match) => {
    const liveMatch = eventByPair.get(pairKey(match.home.teamId, match.away.teamId))
    if (!liveMatch) return match
    return { ...match, kickoff: liveMatch.kickoff, competitionStage: liveMatch.competitionStage, venue: liveMatch.venue !== 'Venue TBA' ? liveMatch.venue : match.venue, venueTimeZone: liveMatch.venueTimeZone ?? match.venueTimeZone, home: liveMatch.home, away: liveMatch.away, status: liveMatch.status, ...(liveMatch.liveScore ? { liveScore: liveMatch.liveScore } : {}) }
  })
  const knownPairs = new Set(mergedBase.map((match) => pairKey(match.home.teamId, match.away.teamId)))
  return [...mergedBase, ...eventMatches.filter((match) => !knownPairs.has(pairKey(match.home.teamId, match.away.teamId)))]
}

function inferEventMatchweek(dashboard: DashboardData, home: Team, away: Team, state: ParsedScoreboardEvent['state'], kickoff: string, currentWeekWindowStart?: number) {
  if (state !== 'post' && currentWeekWindowStart !== undefined) {
    const eventDay = Date.parse(kickoff)
    const maxWindowDays = currentMatchweekWindowDays[dashboard.league.id] ?? 2
    if (eventDay >= currentWeekWindowStart && eventDay <= currentWeekWindowStart + maxWindowDays * 86_400_000) return dashboard.league.currentWeek
  }
  const maxPlayed = Math.max(home.record.played, away.record.played)
  const week = state === 'post' ? Math.max(1, maxPlayed) : Math.max(1, maxPlayed + 1)
  return Math.min(dashboard.league.matchweekCount, week)
}

function findCurrentWeekWindowStart(events: ParsedScoreboardEvent[]) {
  const tomorrow = Date.now() + 18 * 60 * 60 * 1000
  const futureKickoffs = events
    .filter((event) => event.state !== 'post' && Date.parse(event.kickoff) >= tomorrow)
    .map((event) => Date.parse(event.kickoff))
    .filter((kickoff) => Number.isFinite(kickoff))
  return futureKickoffs.length ? Math.min(...futureKickoffs) : undefined
}

function scoreboardDate(dayOffset: number) {
  const date = new Date(Date.now() + dayOffset * 86_400_000)
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
}

function estimatePostMatchUntil(kickoff: string, timeZone: string) {
  const kickoffDate = new Date(kickoff)
  if (!Number.isFinite(kickoffDate.getTime())) return undefined
  const localParts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(kickoffDate)
  const values = new Map(localParts.map((part) => [part.type, Number(part.value)]))
  const localDayEndAtUtcGuess = Date.UTC(values.get('year') ?? 0, (values.get('month') ?? 1) - 1, values.get('day') ?? 1, 23, 59, 59, 999)
  const offsetText = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(new Date(localDayEndAtUtcGuess)).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'
  const offsetMatch = offsetText.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  const offsetMinutes = offsetMatch ? (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3])) * (offsetMatch[1] === '+' ? 1 : -1) : 0
  // Keep a finished result featured through 11:59:59 PM in the venue's local
  // timezone on the day the match was played.
  return new Date(localDayEndAtUtcGuess - offsetMinutes * 60 * 1000).toISOString()
}

function findTeam(teamsByName: Map<string, Team>, name: string) {
  const normalized = normalizeTeamName(name)
  const alias = scoreboardTeamAliases[normalized]
  return teamsByName.get(normalized) ?? (alias ? teamsByName.get(normalizeTeamName(alias)) : undefined) ?? teamsByName.get(normalized.replace(/\b(fc|sc|cf|city|united|town)\b/g, '').replace(/\s+/g, ' ').trim())
}

function pairKey(homeId: string, awayId: string) {
  return `${homeId}|${awayId}`
}

function normalizeTeamName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

function scoreNumber(value: string | undefined) {
  if (value === undefined || value.trim() === '') return undefined
  const score = Number(value)
  return Number.isFinite(score) ? score : undefined
}
