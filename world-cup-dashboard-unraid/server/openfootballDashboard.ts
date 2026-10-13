import type {
  BracketMatch,
  BracketRound,
  BracketSlot,
  DashboardData,
  Player,
  QualificationStatus,
  Team,
  TeamLineup,
  TeamRecord,
  UpcomingMatch,
} from '../shared/types.js'

const OPENFOOTBALL_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
const ESPN_SUMMARY_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary'
const ESPN_SCOREBOARD_PAGE = 'https://www.espn.com/soccer/scoreboard/_/league/fifa.world'
const WIKI_SQUADS_URL =
  'https://en.wikipedia.org/w/api.php?action=parse&page=2026_FIFA_World_Cup_squads&prop=text&format=json&origin=*'
const WIKI_SQUADS_PAGE = 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads'

const GROUPS: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  B: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

const FIFA_RANKINGS: Record<string, number> = {
  Algeria: 28,
  Argentina: 1,
  Australia: 27,
  Austria: 24,
  Belgium: 9,
  'Bosnia & Herzegovina': 64,
  Brazil: 6,
  Canada: 30,
  'Cape Verde': 67,
  Colombia: 13,
  Croatia: 11,
  Curacao: 82,
  'Czech Republic': 40,
  'DR Congo': 46,
  Ecuador: 23,
  Egypt: 29,
  England: 4,
  France: 3,
  Germany: 10,
  Ghana: 73,
  Haiti: 83,
  Iran: 20,
  Iraq: 57,
  'Ivory Coast': 33,
  Japan: 18,
  Jordan: 63,
  Mexico: 14,
  Morocco: 7,
  Netherlands: 8,
  'New Zealand': 85,
  Norway: 31,
  Panama: 34,
  Paraguay: 41,
  Portugal: 5,
  Qatar: 56,
  'Saudi Arabia': 61,
  Scotland: 42,
  Senegal: 15,
  'South Africa': 60,
  'South Korea': 25,
  Spain: 2,
  Sweden: 38,
  Switzerland: 19,
  Tunisia: 45,
  Turkey: 22,
  'United States': 17,
  Uruguay: 16,
  Uzbekistan: 50,
}

type TeamMeta = Omit<
  Team,
  'id' | 'name' | 'record' | 'fifaRank' | 'standingSourceLabel' | 'standingSourceUrl' | 'standingUpdatedAt' | 'form'
>

const TEAM_META: Record<string, TeamMeta> = {
  Algeria: teamMeta('ALG', 'Algeria', 'DZ', 'CAF', '#0f8f4f'),
  Argentina: teamMeta('ARG', 'Argentina', 'AR', 'CONMEBOL', '#48a7d8'),
  Australia: teamMeta('AUS', 'Australia', 'AU', 'AFC', '#1b7f3a'),
  Austria: teamMeta('AUT', 'Austria', 'AT', 'UEFA', '#d52b1e'),
  Belgium: teamMeta('BEL', 'Belgium', 'BE', 'UEFA', '#f2c230'),
  'Bosnia & Herzegovina': teamMeta('BIH', 'Bosnia', 'BA', 'UEFA', '#1d5fbf'),
  Brazil: teamMeta('BRA', 'Brazil', 'BR', 'CONMEBOL', '#198754'),
  Canada: teamMeta('CAN', 'Canada', 'CA', 'CONCACAF', '#d62828'),
  'Cape Verde': teamMeta('CPV', 'Cape Verde', 'CV', 'CAF', '#2446a0'),
  Colombia: teamMeta('COL', 'Colombia', 'CO', 'CONMEBOL', '#f4d03f'),
  Croatia: teamMeta('CRO', 'Croatia', 'HR', 'UEFA', '#d22f27'),
  Curacao: teamMeta('CUW', 'Curacao', 'CW', 'CONCACAF', '#2453a6'),
  'Czech Republic': teamMeta('CZE', 'Czechia', 'CZ', 'UEFA', '#11457e'),
  'DR Congo': teamMeta('COD', 'DR Congo', 'CD', 'CAF', '#1f66cc'),
  Ecuador: teamMeta('ECU', 'Ecuador', 'EC', 'CONMEBOL', '#f0c400'),
  Egypt: teamMeta('EGY', 'Egypt', 'EG', 'CAF', '#bf1e2e'),
  England: teamMeta('ENG', 'England', 'GB-ENG', 'UEFA', '#7a8aa0'),
  France: teamMeta('FRA', 'France', 'FR', 'UEFA', '#2446a0'),
  Germany: teamMeta('GER', 'Germany', 'DE', 'UEFA', '#dd0000'),
  Ghana: teamMeta('GHA', 'Ghana', 'GH', 'CAF', '#d6a313'),
  Haiti: teamMeta('HAI', 'Haiti', 'HT', 'CONCACAF', '#1f5fbf'),
  Iran: teamMeta('IRN', 'Iran', 'IR', 'AFC', '#239f40'),
  Iraq: teamMeta('IRQ', 'Iraq', 'IQ', 'AFC', '#c8102e'),
  'Ivory Coast': teamMeta('CIV', 'Ivory Coast', 'CI', 'CAF', '#f77f00'),
  Japan: teamMeta('JPN', 'Japan', 'JP', 'AFC', '#d43d51'),
  Jordan: teamMeta('JOR', 'Jordan', 'JO', 'AFC', '#c8102e'),
  Mexico: teamMeta('MEX', 'Mexico', 'MX', 'CONCACAF', '#0b8f61'),
  Morocco: teamMeta('MAR', 'Morocco', 'MA', 'CAF', '#b00020'),
  Netherlands: teamMeta('NED', 'Netherlands', 'NL', 'UEFA', '#f58220'),
  'New Zealand': teamMeta('NZL', 'New Zealand', 'NZ', 'OFC', '#111820'),
  Norway: teamMeta('NOR', 'Norway', 'NO', 'UEFA', '#ba0c2f'),
  Panama: teamMeta('PAN', 'Panama', 'PA', 'CONCACAF', '#005aa7'),
  Paraguay: teamMeta('PAR', 'Paraguay', 'PY', 'CONMEBOL', '#d52b1e'),
  Portugal: teamMeta('POR', 'Portugal', 'PT', 'UEFA', '#006f4e'),
  Qatar: teamMeta('QAT', 'Qatar', 'QA', 'AFC', '#8a1538'),
  'Saudi Arabia': teamMeta('KSA', 'Saudi Arabia', 'SA', 'AFC', '#128c45'),
  Scotland: teamMeta('SCO', 'Scotland', 'GB-SCT', 'UEFA', '#005eb8'),
  Senegal: teamMeta('SEN', 'Senegal', 'SN', 'CAF', '#f0a500'),
  'South Africa': teamMeta('RSA', 'South Africa', 'ZA', 'CAF', '#007a4d'),
  'South Korea': teamMeta('KOR', 'South Korea', 'KR', 'AFC', '#c1121f'),
  Spain: teamMeta('ESP', 'Spain', 'ES', 'UEFA', '#b21f2d'),
  Sweden: teamMeta('SWE', 'Sweden', 'SE', 'UEFA', '#005293'),
  Switzerland: teamMeta('SUI', 'Switzerland', 'CH', 'UEFA', '#d52b1e'),
  Tunisia: teamMeta('TUN', 'Tunisia', 'TN', 'CAF', '#e70013'),
  Turkey: teamMeta('TUR', 'Turkey', 'TR', 'UEFA', '#e30a17'),
  'United States': teamMeta('USA', 'USA', 'US', 'CONCACAF', '#1f5fbf'),
  Uruguay: teamMeta('URU', 'Uruguay', 'UY', 'CONMEBOL', '#5ab9ea'),
  Uzbekistan: teamMeta('UZB', 'Uzbekistan', 'UZ', 'AFC', '#1eb2e8'),
}

const ALIASES: Record<string, string> = {
  usa: 'United States',
  'united states': 'United States',
  'south korea': 'South Korea',
  'korea republic': 'South Korea',
  czechia: 'Czech Republic',
  'czech republic': 'Czech Republic',
  turkiye: 'Turkey',
  turkey: 'Turkey',
  'ivory coast': 'Ivory Coast',
  "cote d'ivoire": 'Ivory Coast',
  'cote divoire': 'Ivory Coast',
  curacao: 'Curacao',
  'cabo verde': 'Cape Verde',
  'cape verde': 'Cape Verde',
  'dr congo': 'DR Congo',
  'congo dr': 'DR Congo',
  'bosnia and herzegovina': 'Bosnia & Herzegovina',
  'bosnia & herzegovina': 'Bosnia & Herzegovina',
  'ir iran': 'Iran',
}

interface OpenfootballPayload {
  matches?: OpenfootballMatch[]
}

interface OpenfootballMatch {
  round?: string
  num?: number
  matchNumber?: number
  date?: string
  time?: string
  team1?: string
  team2?: string
  group?: string
  ground?: string
  city?: string
  score?: {
    ft?: [number, number] | string
    et?: [number, number] | string
    penalties?: [number, number] | string
    p?: [number, number] | string
  }
}

interface NormalizedMatch extends OpenfootballMatch {
  scheduleId: string
  sortDate: number
  team1: string
  team2: string
  group: string
}

interface EspnScoreboardPayload {
  events?: EspnEvent[]
}

interface EspnEvent {
  id?: string
  date?: string
  links?: EspnLink[]
  competitions?: EspnCompetition[]
}

interface EspnLink {
  href?: string
  rel?: string[]
}

interface EspnCompetition {
  competitors?: EspnCompetitor[]
  status?: EspnStatus
}

interface EspnCompetitor {
  homeAway?: string
  score?: string
  team?: EspnTeam
}

interface EspnTeam {
  abbreviation?: string
  displayName?: string
  name?: string
  shortDisplayName?: string
}

interface EspnStatus {
  displayClock?: string
  type?: {
    state?: string
    description?: string
    detail?: string
    shortDetail?: string
  }
}

interface EspnSummaryPayload {
  rosters?: EspnMatchRoster[]
}

interface EspnMatchRoster {
  formation?: string
  team?: EspnTeam
  roster?: EspnMatchRosterPlayer[]
}

interface EspnMatchRosterPlayer {
  active?: boolean
  starter?: boolean
  jersey?: string
  formationPlace?: number | string
  athlete?: {
    id?: string
    displayName?: string
    fullName?: string
    shortName?: string
    jersey?: string
  }
  position?: {
    abbreviation?: string
    displayName?: string
    name?: string
  }
  stats?: EspnPlayerStat[]
}

interface EspnPlayerStat {
  name?: string
  value?: number | string
  displayValue?: string
}

interface LiveScoreEvent {
  eventId: string
  sourceUrl: string
  status?: string
  statusState?: 'pre' | 'in' | 'post'
  clock?: string
  updatedAt: string
  scoresByTeam: Map<string, number>
}

interface StandingRow {
  team: string
  group: string
  p: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}

interface SquadPlayer {
  num: string
  pos: string
  age: string
  caps: string
  goals: string
  player: string
  club: string
  clubTitle: string
}

interface Squad {
  coach: string
  players: SquadPlayer[]
}

export async function buildOpenfootballDashboard(): Promise<DashboardData> {
  const sourcePayload = await fetchOpenfootballPayload()
  const matches = normalizeMatches(sourcePayload.matches ?? [])
  const standings = computeStandings(matches)
  const qualificationStatuses = computeQualificationStatuses(standings, matches)
  const teams = buildTeams(standings, matches, qualificationStatuses)
  const teamsByName = new Map(teams.map((team) => [team.name, team]))
  const liveScores = await loadEspnLiveScores(matches).catch((error) => {
    console.warn('ESPN live-score lookup failed:', error)
    return new Map<string, LiveScoreEvent>()
  })
  const squads = await loadWikipediaSquads().catch(() => new Map<string, Squad>())
  const squadLineups = new Map(teams.map((team) => [team.id, buildSquadLineup(team, squads.get(team.name))]))
  const liveLineups = await loadEspnLiveLineups(teams, liveScores).catch((error) => {
    console.warn('ESPN live-lineup lookup failed:', error)
    return new Map<string, TeamLineup>()
  })
  const lineups = teams.map((team) => liveLineups.get(team.id) ?? squadLineups.get(team.id) ?? buildSquadLineup(team, squads.get(team.name)))
  const updatedAt = new Date().toISOString()

  return {
    provider: {
      mode: 'live',
      name: 'OpenFootball + ESPN + Wikipedia',
      lastUpdated: updatedAt,
      message:
        'Matches, results, standings, and bracket placements are built from OpenFootball. Live score and match-lineup overlays come from ESPN when a matching World Cup event is available. Squad details fall back to the Wikipedia 2026 FIFA World Cup squads page.',
    },
    teams,
    lineups,
    matches: buildUpcomingMatches(matches, standings, teamsByName, liveScores),
    bracket: buildBracket(matches, standings, teamsByName),
  }
}

async function fetchOpenfootballPayload() {
  const response = await fetch(OPENFOOTBALL_URL, {
    headers: {
      'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
    },
  })

  if (!response.ok) {
    throw new Error(`OpenFootball returned ${response.status}`)
  }

  return (await response.json()) as OpenfootballPayload
}

async function loadEspnLiveScores(matches: NormalizedMatch[]) {
  const dateKeys = espnScoreboardDateKeys(matches)
  const events = new Map<string, LiveScoreEvent>()

  await Promise.all(
    dateKeys.map(async (dateKey) => {
      const url = new URL(ESPN_SCOREBOARD_URL)
      url.searchParams.set('dates', dateKey)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
        },
      })

      if (!response.ok) {
        throw new Error(`ESPN scoreboard returned ${response.status} for ${dateKey}`)
      }

      const payload = (await response.json()) as EspnScoreboardPayload
      for (const event of payload.events ?? []) {
        const liveEvent = espnLiveEvent(event)
        if (liveEvent) {
          events.set(liveScoreKey(...liveEvent.scoresByTeam.keys()), liveEvent)
        }
      }
    }),
  )

  return events
}

async function loadEspnLiveLineups(teams: Team[], liveScores: Map<string, LiveScoreEvent>) {
  const lineups = new Map<string, TeamLineup>()
  const teamsByName = new Map(teams.map((team) => [team.name, team]))
  const lineupEvents = [...liveScores.values()].filter((event) => event.statusState === 'in' || event.statusState === 'pre')

  await Promise.all(
    lineupEvents.map(async (event) => {
      try {
        const url = new URL(ESPN_SUMMARY_URL)
        url.searchParams.set('event', event.eventId)

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
          },
        })

        if (!response.ok) {
          throw new Error(`ESPN summary returned ${response.status} for ${event.eventId}`)
        }

        const payload = (await response.json()) as EspnSummaryPayload
        for (const roster of payload.rosters ?? []) {
          const canonicalName = teamNameFromEspnTeam(roster.team)
          const team = canonicalName ? teamsByName.get(canonicalName) : undefined

          if (team) {
            const lineup = buildEspnLineup(team, roster, event)
            if (!lineup) {
              continue
            }

            lineups.set(team.id, lineup)
          }
        }
      } catch (error) {
        console.warn(`ESPN summary lookup failed for ${event.eventId}:`, error)
      }
    }),
  )

  return lineups
}

function buildEspnLineup(team: Team, roster: EspnMatchRoster, event: LiveScoreEvent): TeamLineup | undefined {
  const players = (roster.roster ?? [])
    .map((entry, index) => buildEspnPlayer(team, entry, index, event))
    .filter((player): player is Player => Boolean(player))
  const starters = players.filter((player) => player.isStarter)

  if (!starters.length) {
    return undefined
  }

  return {
    teamId: team.id,
    formation: roster.formation?.trim() || `${starters.length}-player lineup`,
    status: 'confirmed',
    updatedAt: event.updatedAt,
    sourceLabel: 'ESPN match roster',
    sourceUrl: event.sourceUrl,
    players: players.sort(compareLineupPlayers),
  }
}

function buildEspnPlayer(
  team: Team,
  entry: EspnMatchRosterPlayer,
  index: number,
  event: LiveScoreEvent,
): Player | undefined {
  const name = entry.athlete?.displayName ?? entry.athlete?.fullName ?? entry.athlete?.shortName

  if (!name) {
    return undefined
  }

  const position = espnPositionLabel(entry)
  const jerseyNumber = numberValue(entry.jersey ?? entry.athlete?.jersey) ?? index + 1
  const lineupOrder = numberValue(entry.formationPlace) ?? (entry.starter ? index + 1 : 100 + index)

  return {
    id: `${team.id}-${entry.athlete?.id ?? jerseyNumber}-${slug(name)}`,
    teamId: team.id,
    name,
    number: jerseyNumber,
    position,
    line: positionLine(position),
    role: roleLabel(position),
    headshotUrl: `/api/headshot?${new URLSearchParams({
      name,
      color: team.color,
      source: 'foxsports',
      v: '4',
    }).toString()}`,
    isStarter: Boolean(entry.starter),
    lineupOrder,
    sourceLabel: 'ESPN match roster',
    sourceUrl: event.sourceUrl,
    stats: buildEspnPlayerStats(entry.stats),
  }
}

function espnPositionLabel(entry: EspnMatchRosterPlayer) {
  return (
    entry.position?.displayName?.trim() ||
    entry.position?.name?.trim() ||
    entry.position?.abbreviation?.trim() ||
    (entry.starter ? 'Player' : 'Substitute')
  )
}

function buildEspnPlayerStats(stats: EspnPlayerStat[] | undefined): Player['stats'] | undefined {
  if (!stats?.length) {
    return undefined
  }

  const values = new Map(stats.flatMap((stat) => {
    const value = numberValue(stat.value ?? stat.displayValue)
    return stat.name && value !== undefined ? [[stat.name, value] as const] : []
  }))

  return {
    goals: values.get('totalGoals'),
    assists: values.get('goalAssists'),
    shots: values.get('totalShots'),
    shotsOnTarget: values.get('shotsOnTarget'),
    yellowCards: values.get('yellowCards'),
    redCards: values.get('redCards'),
    saves: values.get('saves'),
  }
}

function espnScoreboardDateKeys(matches: NormalizedMatch[]) {
  const now = Date.now()
  const start = now - 4 * 60 * 60 * 1000
  const end = now + 36 * 60 * 60 * 1000
  const dateKeys = new Set<string>()

  for (const match of matches) {
    if (isPlayed(match) || matchDateValue(match) < start || matchDateValue(match) > end) {
      continue
    }

    const dateKey = String(match.date ?? '').replace(/\D/g, '').slice(0, 8)
    if (dateKey.length === 8) {
      dateKeys.add(dateKey)
    }
  }

  return [...dateKeys]
}

function espnLiveEvent(event: EspnEvent): LiveScoreEvent | undefined {
  const competition = event.competitions?.[0]
  const competitors = competition?.competitors ?? []
  if (competitors.length < 2 || !event.id) {
    return undefined
  }

  const scoresByTeam = new Map<string, number>()
  for (const competitor of competitors) {
    const team = teamNameFromEspnCompetitor(competitor)
    const score = scoreNumber(competitor.score)
    if (team && score !== undefined) {
      scoresByTeam.set(team, score)
    }
  }

  if (scoresByTeam.size < 2) {
    return undefined
  }

  return {
    eventId: event.id,
    sourceUrl: espnEventUrl(event),
    status: espnStatusLabel(competition?.status),
    statusState: espnStatusState(competition?.status?.type?.state),
    clock: espnClock(competition?.status),
    updatedAt: new Date().toISOString(),
    scoresByTeam,
  }
}

function teamNameFromEspnCompetitor(competitor: EspnCompetitor) {
  return teamNameFromEspnTeam(competitor.team)
}

function teamNameFromEspnTeam(team: EspnTeam | undefined) {
  const code = team?.abbreviation?.trim().toUpperCase()
  if (code) {
    const codeMatch = Object.entries(TEAM_META).find(([, meta]) => meta.fifaCode === code)
    if (codeMatch) {
      return codeMatch[0]
    }
  }

  return teamName(
    team?.displayName ??
      team?.shortDisplayName ??
      team?.name ??
      team?.abbreviation ??
      '',
  )
}

function espnEventUrl(event: EspnEvent) {
  const summaryLink = event.links?.find((link) => link.href && link.rel?.includes('summary'))?.href
  return summaryLink ?? (event.id ? `https://www.espn.com/soccer/match/_/gameId/${event.id}` : ESPN_SCOREBOARD_PAGE)
}

function espnStatusState(state: string | undefined): LiveScoreEvent['statusState'] {
  return state === 'pre' || state === 'in' || state === 'post' ? state : undefined
}

function espnStatusLabel(status: EspnStatus | undefined) {
  return status?.type?.shortDetail ?? status?.type?.detail ?? status?.type?.description
}

function espnClock(status: EspnStatus | undefined) {
  const clock = status?.displayClock?.trim()
  if (clock && clock !== "0'") {
    return clock
  }
  return undefined
}

function scoreNumber(score: string | undefined) {
  const value = Number(score)
  return Number.isFinite(value) ? value : undefined
}

function numberValue(value: number | string | undefined) {
  if (value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function liveScoreKey(...teams: string[]) {
  return teams.map((team) => teamId(teamName(team))).sort().join('__')
}

function liveScoreForMatch(match: NormalizedMatch, liveEvent: LiveScoreEvent | undefined): UpcomingMatch['liveScore'] {
  if (!liveEvent) {
    return undefined
  }

  const homeScore = liveEvent.scoresByTeam.get(teamName(match.team1))
  const awayScore = liveEvent.scoresByTeam.get(teamName(match.team2))

  return {
    homeScore,
    awayScore,
    clock: liveEvent.clock,
    status: liveEvent.status,
    statusState: liveEvent.statusState,
    sourceLabel: 'ESPN scoreboard',
    sourceUrl: liveEvent.sourceUrl,
    updatedAt: liveEvent.updatedAt,
  }
}

function isMatchComplete(liveEvent: LiveScoreEvent | undefined) {
  return liveEvent?.statusState === 'post'
}

function normalizeMatches(matches: OpenfootballMatch[]): NormalizedMatch[] {
  return matches
    .map((match, index) => ({
      ...match,
      scheduleId: `match-${index}`,
      sortDate: matchDateValue(match),
      team1: teamName(match.team1),
      team2: teamName(match.team2),
      group: groupCode(match),
      num: match.num ?? match.matchNumber,
    }))
    .sort((first, second) => first.sortDate - second.sortDate || matchNumber(first, 0) - matchNumber(second, 0))
}

function computeStandings(matches: NormalizedMatch[]) {
  const groups = new Map<string, StandingRow[]>()
  const tables = new Map<string, Map<string, StandingRow>>()

  Object.entries(GROUPS).forEach(([group, teams]) => {
    tables.set(group, new Map(teams.map((team) => [teamName(team), emptyRow(teamName(team), group)])))
  })

  matches.filter(isGroupMatch).forEach((match) => {
    const group = groupCode(match)
    if (!tables.has(group)) {
      tables.set(group, new Map())
    }

    const table = tables.get(group)
    if (!table) {
      return
    }

    for (const rawTeam of [match.team1, match.team2]) {
      const canonical = teamName(rawTeam)
      if (!table.has(canonical)) {
        table.set(canonical, emptyRow(canonical, group))
      }
    }

    const score = scoreValues(match.score?.ft)
    if (!score) {
      return
    }

    const home = table.get(teamName(match.team1))
    const away = table.get(teamName(match.team2))
    if (!home || !away) {
      return
    }

    const [homeGoals, awayGoals] = score
    home.p += 1
    away.p += 1
    home.gf += homeGoals
    home.ga += awayGoals
    away.gf += awayGoals
    away.ga += homeGoals
    home.gd = home.gf - home.ga
    away.gd = away.gf - away.ga

    if (homeGoals > awayGoals) {
      home.w += 1
      home.pts += 3
      away.l += 1
    } else if (awayGoals > homeGoals) {
      away.w += 1
      away.pts += 3
      home.l += 1
    } else {
      home.d += 1
      away.d += 1
      home.pts += 1
      away.pts += 1
    }
  })

  tables.forEach((table, group) => {
    groups.set(group, [...table.values()].sort(compareStandingRows))
  })

  return groups
}

function buildTeams(
  standings: Map<string, StandingRow[]>,
  matches: NormalizedMatch[],
  qualificationStatuses: Map<string, QualificationStatus>,
): Team[] {
  return Object.entries(GROUPS).flatMap(([group, groupTeams]) =>
    groupTeams.map((rawTeam) => {
      const name = teamName(rawTeam)
      const meta = TEAM_META[name] ?? teamMeta(name.slice(0, 3).toUpperCase(), name, '', 'TBD', '#667484')
      const row = standings.get(group)?.find((standing) => standing.team === name) ?? emptyRow(name, group)
      const record: TeamRecord = {
        played: row.p,
        wins: row.w,
        draws: row.d,
        losses: row.l,
        goalsFor: row.gf,
        goalsAgainst: row.ga,
        goalDifference: row.gd,
        points: row.pts,
      }

      return {
        id: teamId(name),
        ...meta,
        name,
        group,
        record,
        qualificationStatus: qualificationStatuses.get(name) ?? 'pending',
        fifaRank: FIFA_RANKINGS[name],
        standingSourceLabel: 'OpenFootball worldcup.json',
        standingSourceUrl: OPENFOOTBALL_URL,
        standingUpdatedAt: new Date().toISOString(),
        form: teamForm(name, matches),
      }
    }),
  )
}

function buildUpcomingMatches(
  matches: NormalizedMatch[],
  standings: Map<string, StandingRow[]>,
  teamsByName: Map<string, Team>,
  liveScores: Map<string, LiveScoreEvent>,
): UpcomingMatch[] {
  const now = Date.now()
  const recentWindow = now - 2 * 60 * 60 * 1000
  const inProgress = matches
    .filter((match) => isMatchInProgress(match, now, liveScores.get(liveScoreKey(match.team1, match.team2))))
    .sort((first, second) => matchDateValue(first) - matchDateValue(second) || matchNumber(first, 0) - matchNumber(second, 0))
  const upcoming = matches
    .filter((match) => {
      const liveEvent = liveScores.get(liveScoreKey(match.team1, match.team2))
      return (
        !isPlayed(match) &&
        !isMatchComplete(liveEvent) &&
        !isMatchInProgress(match, now, liveEvent) &&
        matchDateValue(match) >= recentWindow
      )
    })
    .sort((first, second) => matchDateValue(first) - matchDateValue(second) || matchNumber(first, 0) - matchNumber(second, 0))

  return [...inProgress, ...upcoming].flatMap((match) => {
    const home = teamsByName.get(teamName(match.team1))
    const away = teamsByName.get(teamName(match.team2))
    if (!home || !away) {
      return []
    }

    const group = groupCode(match)
    const remainingInGroup = group ? matches.filter((candidate) => groupCode(candidate) === group && !isPlayed(candidate)) : []
    const placementDecider = Boolean(group && remainingInGroup.length <= 2)
    const liveEvent = liveScores.get(liveScoreKey(match.team1, match.team2))
    const liveScore = liveScoreForMatch(match, liveEvent)
    const live = isMatchInProgress(match, now, liveEvent)

    return {
      id: match.scheduleId,
      kickoff: parseMatchDate(match).toISOString(),
      competitionStage: match.group ? `Group ${group}` : match.round ?? 'Match',
      venue: match.ground ?? 'Venue TBD',
      city: matchCity(match),
      home: matchTeam(home, standings),
      away: matchTeam(away, standings),
      isPlacementDecider: placementDecider,
      placementImpact: placementDecider
        ? `Group ${group} Round of 32 positions can move on this result.`
        : match.group
          ? `Group ${group} standings update from the OpenFootball fixture feed.`
          : `${match.round ?? 'Knockout'} fixture from the OpenFootball bracket feed.`,
      broadcastWindow: live ? 'Live window' : broadcastWindow(parseMatchDate(match)),
      status: live ? 'in-progress' : 'upcoming',
      statusText: live ? inProgressText(match, home, away, liveScore, now) : 'Upcoming',
      liveScore,
    }
  })
}

function matchTeam(team: Team, standings: Map<string, StandingRow[]>): UpcomingMatch['home'] {
  const rows = standings.get(team.group) ?? []
  const rank = rows.findIndex((row) => row.team === team.name) + 1
  const rankLabel =
    rank <= 2
      ? 'automatic Round of 32 place'
      : rank === 3
        ? 'best third-place race'
        : 'needs help to climb the group'

  return {
    teamId: team.id,
    projectedStanding: rank || 0,
    points: team.record.points,
    scenario: `${team.name} is currently ${standingLabel(rank)} in Group ${team.group}, ${rankLabel}.`,
  }
}

function buildSquadLineup(team: Team, squad: Squad | undefined): TeamLineup {
  if (!squad?.players.length) {
    return {
      teamId: team.id,
      formation: 'Squad unavailable',
      status: 'unavailable',
      updatedAt: new Date().toISOString(),
      sourceLabel: 'No roster found in the current Wikipedia squad source',
      sourceUrl: WIKI_SQUADS_PAGE,
      players: [],
    }
  }

  return {
    teamId: team.id,
    formation: `${squad.players.length}-player squad`,
    status: 'squad',
    updatedAt: new Date().toISOString(),
    sourceLabel: squad.coach ? `Wikipedia squad table - coach: ${squad.coach}` : 'Wikipedia 2026 FIFA World Cup squads',
    sourceUrl: WIKI_SQUADS_PAGE,
    players: squad.players
      .map((player, index) => buildPlayer(team, player, index))
      .sort((first, second) => roleOrder(first.role) - roleOrder(second.role) || first.number - second.number || first.name.localeCompare(second.name)),
  }
}

function buildPlayer(team: Team, player: SquadPlayer, index: number): Player {
  const number = Number(player.num)

  return {
    id: `${team.id}-${Number.isFinite(number) ? number : slug(player.player)}`,
    teamId: team.id,
    name: player.player,
    number: Number.isFinite(number) ? number : index + 1,
    position: player.pos,
    line: positionLine(player.pos),
    role: roleLabel(player.pos),
    headshotUrl: `/api/headshot?${new URLSearchParams({
      name: player.player,
      color: team.color,
      source: 'foxsports',
      v: '3',
    }).toString()}`,
    age: player.age,
    caps: player.caps,
    internationalGoals: player.goals,
    club: player.club,
    clubDivision: player.clubTitle && player.clubTitle !== player.club ? player.clubTitle : undefined,
    sourceLabel: 'Wikipedia squad table',
    sourceUrl: WIKI_SQUADS_PAGE,
  }
}

async function loadWikipediaSquads() {
  const response = await fetch(WIKI_SQUADS_URL, {
    headers: {
      'User-Agent': 'WorldCupDashboard/0.1 local dashboard',
    },
  })

  if (!response.ok) {
    throw new Error(`Wikipedia squads returned ${response.status}`)
  }

  const data = (await response.json()) as { parse?: { text?: { '*': string } } }
  const html = data.parse?.text?.['*']
  if (!html) {
    throw new Error('Wikipedia squads response did not include parsed HTML')
  }

  return parseWikipediaSquads(html)
}

function parseWikipediaSquads(html: string) {
  const squads = new Map<string, Squad>()
  const headings = [...html.matchAll(/<h3\b[\s\S]*?<\/h3>/g)]

  headings.forEach((heading, index) => {
    const rawName = stripTags(heading[0]).replace(/\[edit\]/g, '').trim()
    const canonical = teamName(rawName)
    if (!canonical || !TEAM_META[canonical]) {
      return
    }

    const start = heading.index ?? 0
    const end = headings[index + 1]?.index ?? html.length
    const section = html.slice(start, end)
    const table = section.match(/<table\b[^>]*wikitable[\s\S]*?<\/table>/)?.[0]
    if (!table) {
      return
    }

    const coachMatch = stripTags(section).match(/Coach:\s*([^]+?)(?:\n|No\.|Pos\.|Player)/)
    const rows = [...table.matchAll(/<tr\b[^>]*class="[^"]*nat-fs-player[^"]*"[\s\S]*?<\/tr>/g)]
    const players = rows.map((row) => parseSquadRow(row[0])).filter((player): player is SquadPlayer => Boolean(player))
    squads.set(canonical, {
      coach: coachMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? '',
      players,
    })
  })

  return squads
}

function parseSquadRow(row: string): SquadPlayer | undefined {
  const cells = [...row.matchAll(/<(?:td|th)\b[\s\S]*?<\/(?:td|th)>/g)].map((match) => match[0])
  if (cells.length < 7) {
    return undefined
  }

  const player = linkText(cells[2]) || stripTags(cells[2])
  const clubLink = linkTexts(cells[6]).at(-1)
  const club = clubLink?.text || stripTags(cells[6])

  if (!player) {
    return undefined
  }

  return {
    num: stripTags(cells[0]),
    pos: stripTags(cells[1]).replace(/\d+/g, '').trim(),
    player: player.replace(/\s*\(captain\)\s*/i, '').trim(),
    age: extractAge(stripTags(cells[3])),
    caps: stripTags(cells[4]),
    goals: stripTags(cells[5]),
    club,
    clubTitle: clubLink?.title ?? club,
  }
}

function buildBracket(
  matches: NormalizedMatch[],
  standings: Map<string, StandingRow[]>,
  teamsByName: Map<string, Team>,
): BracketMatch[] {
  const knockout = matches.filter((match) => !isGroupMatch(match) && roundForMatch(match))
  const rowByResult = new Map<string, number>()
  const roundOf32 = sortByMatchNumber(knockout.filter((match) => match.round === 'Round of 32'))
  const thirdContext = { thirdGroupsUsed: new Set<string>() }
  const bracket: BracketMatch[] = []

  roundOf32.forEach((match, index) => {
    const gridRow = 1 + index * 2
    registerResultRows(match, rowByResult, gridRow)
    bracket.push(toBracketMatch(match, index + 1, gridRow, standings, teamsByName, thirdContext))
  })

  const stageOrder: Array<{ round: BracketRound; matches: NormalizedMatch[]; fallbackRows: number[] }> = [
    { round: 'round-of-16', matches: sortByMatchNumber(knockout.filter((match) => match.round === 'Round of 16')), fallbackRows: [2, 6, 10, 14, 18, 22, 26, 30] },
    { round: 'quarterfinal', matches: sortByMatchNumber(knockout.filter((match) => /Quarter/.test(match.round ?? ''))), fallbackRows: [4, 12, 20, 28] },
    { round: 'semifinal', matches: sortByMatchNumber(knockout.filter((match) => /Semi/.test(match.round ?? ''))), fallbackRows: [8, 24] },
    {
      round: 'final',
      matches: sortByMatchNumber(knockout.filter((match) => match.round === 'Final' || /third/i.test(match.round ?? ''))),
      fallbackRows: [22, 16],
    },
  ]

  stageOrder.forEach((stage) => {
    stage.matches.forEach((match, index) => {
      const isThirdPlace = /third/i.test(match.round ?? '')
      const sourceRows = bracketSourceRows(match, rowByResult)
      const fallbackRow = stage.fallbackRows[index] ?? stage.fallbackRows.at(-1) ?? 1
      const gridRow =
        sourceRows.length >= 2 && !isThirdPlace
          ? Math.round(sourceRows.reduce((sum, row) => sum + row + 1, 0) / sourceRows.length - 1)
          : fallbackRow

      registerResultRows(match, rowByResult, gridRow)
      bracket.push(toBracketMatch(match, bracket.length + 1, gridRow, standings, teamsByName, thirdContext, stage.round))
    })
  })

  return alignBracketGridRows(bracket)
}

function alignBracketGridRows(bracket: BracketMatch[]) {
  const rows = new Map<string, number>()
  const visibleRounds = (['round-of-32', 'round-of-16', 'quarterfinal', 'semifinal'] as BracketRound[])
    .map((round) => ({
      round,
      matches: bracket.filter((match) => match.round === round).sort((first, second) => first.sortOrder - second.sortOrder),
    }))
  const maxRoundCount = Math.max(1, ...visibleRounds.map(({ matches }) => matches.length))
  const rowCount = Math.max(1, maxRoundCount * 2 - 1)

  visibleRounds.forEach(({ matches }) => {
    matches.forEach((match, index) => {
      rows.set(match.id, distributedBracketRow(index, matches.length, rowCount))
    })
  })

  const finalMatches = bracket
    .filter((match) => match.round === 'final')
    .sort((first, second) => first.sortOrder - second.sortOrder)
  const championship = finalMatches.find((match) => match.region.toLowerCase() === 'final') ?? finalMatches.at(-1)

  if (championship) {
    rows.set(championship.id, Math.ceil(rowCount / 2))
  }

  finalMatches
    .filter((match) => match.id !== championship?.id)
    .forEach((match, index) => {
      rows.set(match.id, Math.max(1, rowCount - index * 2))
    })

  return bracket.map((match) => ({
    ...match,
    gridRow: rows.get(match.id) ?? match.gridRow,
  }))
}

function distributedBracketRow(index: number, matchCount: number, rowCount: number) {
  if (matchCount <= 1) {
    return Math.ceil(rowCount / 2)
  }

  return Math.max(1, Math.min(rowCount, Math.round(1 + ((index + 0.5) * rowCount) / matchCount - 0.5)))
}

function toBracketMatch(
  match: NormalizedMatch,
  sortOrder: number,
  gridRow: number,
  standings: Map<string, StandingRow[]>,
  teamsByName: Map<string, Team>,
  context: { thirdGroupsUsed: Set<string> },
  forcedRound?: BracketRound,
): BracketMatch {
  const id = `ko-${match.num ?? sortOrder}`
  const round = forcedRound ?? roundForMatch(match) ?? 'round-of-32'

  return {
    id,
    round,
    region: bracketRegion(match),
    kickoff: parseMatchDate(match).toISOString(),
    location: matchCity(match),
    venue: match.ground,
    sortOrder,
    gridRow,
    slotA: bracketSlot(`${id}-a`, match.team1, standings, teamsByName, context),
    slotB: bracketSlot(`${id}-b`, match.team2, standings, teamsByName, context),
  }
}

function bracketSlot(
  id: string,
  value: string,
  standings: Map<string, StandingRow[]>,
  teamsByName: Map<string, Team>,
  context: { thirdGroupsUsed: Set<string> },
): BracketSlot {
  const placement = String(value || 'TBD')
  const ref = placementRef(placement)
  const actualTeam = !isPlacement(placement) ? teamsByName.get(teamName(placement)) : undefined
  const projectedTeam = resolvePlacementTeam(placement, standings, teamsByName, context)

  return {
    id,
    placement,
    teamId: actualTeam?.id,
    projectedTeamId: projectedTeam?.id,
    sourceMatchId: ref ? `ko-${ref.num}` : undefined,
    sourceLabel: ref ? `${ref.result === 'W' ? 'Winner' : 'Loser'} Match ${ref.num}` : undefined,
  }
}

function resolvePlacementTeam(
  value: string,
  standings: Map<string, StandingRow[]>,
  teamsByName: Map<string, Team>,
  context: { thirdGroupsUsed: Set<string> },
) {
  const direct = value.match(/^([12])([A-L])$/)
  if (direct) {
    const rows = standings.get(direct[2])
    const team = rows?.[Number(direct[1]) - 1]?.team
    return team ? teamsByName.get(team) : undefined
  }

  if (/^3/.test(value)) {
    const candidateGroups = new Set(value.slice(1).match(/[A-L]/g) ?? [])
    const thirdRows = thirdPlaceRows(standings).slice(0, 8)
    const row =
      thirdRows.find((candidate) => candidateGroups.has(candidate.group) && !context.thirdGroupsUsed.has(candidate.group)) ??
      thirdRows.find((candidate) => candidateGroups.has(candidate.group))
    if (!row) {
      return undefined
    }

    context.thirdGroupsUsed.add(row.group)
    return teamsByName.get(row.team)
  }

  return undefined
}

function bracketSourceRows(match: NormalizedMatch, rowByResult: Map<string, number>) {
  return [match.team1, match.team2]
    .map(placementRef)
    .flatMap((ref) => (ref ? [rowByResult.get(`${ref.result}${ref.num}`)] : []))
    .filter((row): row is number => Number.isFinite(row))
}

function registerResultRows(match: NormalizedMatch, rowByResult: Map<string, number>, row: number) {
  if (!match.num) {
    return
  }

  rowByResult.set(`W${match.num}`, row)
  rowByResult.set(`L${match.num}`, row)
}

function roundForMatch(match: OpenfootballMatch): BracketRound | undefined {
  if (match.round === 'Round of 32') {
    return 'round-of-32'
  }
  if (match.round === 'Round of 16') {
    return 'round-of-16'
  }
  if (/Quarter/.test(match.round ?? '')) {
    return 'quarterfinal'
  }
  if (/Semi/.test(match.round ?? '')) {
    return 'semifinal'
  }
  if (match.round === 'Final' || /third/i.test(match.round ?? '')) {
    return 'final'
  }
  return undefined
}

function bracketRegion(match: NormalizedMatch) {
  if (match.round === 'Final') {
    return 'Final'
  }
  if (/third/i.test(match.round ?? '')) {
    return 'Third Place'
  }
  return matchCity(match) || `Match ${match.num ?? ''}`.trim()
}

function placementRef(value: string) {
  const compact = String(value || '').trim().match(/^([WL])(\d+)$/i)
  if (compact) {
    return { result: compact[1].toUpperCase(), num: compact[2] }
  }

  const verbose = String(value || '').trim().match(/^(Winner|Loser) Match (\d+)$/i)
  return verbose ? { result: verbose[1][0].toUpperCase(), num: verbose[2] } : null
}

function isPlacement(value: string) {
  return /^(?:[123][A-L/]*|[WL]\d+|Winner |Loser )/i.test(String(value || '').trim())
}

function thirdPlaceRows(standings: Map<string, StandingRow[]>) {
  return [...standings.entries()]
    .map(([group, rows]) => (rows[2] ? { ...rows[2], group } : undefined))
    .filter((row): row is StandingRow => Boolean(row))
    .sort(compareStandingRows)
}

function computeQualificationStatuses(standings: Map<string, StandingRow[]>, matches: NormalizedMatch[]) {
  const statuses = new Map<string, QualificationStatus>()
  const groupOutcomes = new Map<string, Array<Map<string, number>>>()
  const thirdPointRanges = new Map<string, { min: number; max: number }>()

  for (const group of Object.keys(GROUPS)) {
    const outcomes = simulateGroupPointOutcomes(group, standings, matches)
    groupOutcomes.set(group, outcomes)
    thirdPointRanges.set(group, thirdPlacePointRange(outcomes))
  }

  const allGroupsComplete = Object.keys(GROUPS).every((group) => groupRemainingMatches(group, matches).length === 0)
  const qualifiedThirdPlaceTeams = new Set(allGroupsComplete ? thirdPlaceRows(standings).slice(0, 8).map((row) => row.team) : [])

  for (const group of Object.keys(GROUPS)) {
    const rows = standings.get(group) ?? []
    const remaining = groupRemainingMatches(group, matches)
    const outcomes = groupOutcomes.get(group) ?? []
    const groupComplete = remaining.length === 0

    for (const row of rows) {
      const rank = rows.findIndex((candidate) => candidate.team === row.team) + 1
      let status: QualificationStatus = 'pending'

      if (groupComplete) {
        if (rank <= 2) {
          status = 'qualified'
        } else if (rank === 3) {
          if (allGroupsComplete) {
            status = qualifiedThirdPlaceTeams.has(row.team) ? 'qualified' : 'eliminated'
          } else if (isThirdPlaceGuaranteed(row, group, thirdPointRanges)) {
            status = 'qualified'
          } else if (isThirdPlaceEliminated(row, group, thirdPointRanges)) {
            status = 'eliminated'
          }
        } else {
          status = 'eliminated'
        }
      } else if (isGuaranteedTopTwo(row, rows, remaining)) {
        status = 'qualified'
      } else if (!canFinishTopThree(row.team, outcomes)) {
        status = 'eliminated'
      }

      statuses.set(row.team, status)
    }
  }

  return statuses
}

function simulateGroupPointOutcomes(
  group: string,
  standings: Map<string, StandingRow[]>,
  matches: NormalizedMatch[],
) {
  const rows = standings.get(group) ?? []
  const remaining = groupRemainingMatches(group, matches)
  let outcomes = [new Map(rows.map((row) => [row.team, row.pts]))]

  for (const match of remaining) {
    const home = teamName(match.team1)
    const away = teamName(match.team2)
    const next: Array<Map<string, number>> = []

    for (const outcome of outcomes) {
      next.push(addOutcomePoints(outcome, home, away, 3, 0))
      next.push(addOutcomePoints(outcome, home, away, 1, 1))
      next.push(addOutcomePoints(outcome, home, away, 0, 3))
    }

    outcomes = next
  }

  return outcomes
}

function addOutcomePoints(base: Map<string, number>, home: string, away: string, homePoints: number, awayPoints: number) {
  const next = new Map(base)
  next.set(home, (next.get(home) ?? 0) + homePoints)
  next.set(away, (next.get(away) ?? 0) + awayPoints)
  return next
}

function thirdPlacePointRange(outcomes: Array<Map<string, number>>) {
  const thirdPoints = outcomes.map((outcome) => [...outcome.values()].sort((first, second) => second - first)[2] ?? 0)
  return {
    min: Math.min(...thirdPoints),
    max: Math.max(...thirdPoints),
  }
}

function groupRemainingMatches(group: string, matches: NormalizedMatch[]) {
  return matches.filter((match) => isGroupMatch(match) && groupCode(match) === group && !isPlayed(match))
}

function isGuaranteedTopTwo(row: StandingRow, rows: StandingRow[], remaining: NormalizedMatch[]) {
  const teamsThatCanCatch = rows.filter((candidate) => {
    if (candidate.team === row.team) {
      return false
    }

    const remainingMatches = remaining.filter((match) =>
      [teamName(match.team1), teamName(match.team2)].includes(candidate.team),
    ).length
    return candidate.pts + remainingMatches * 3 >= row.pts
  })

  return teamsThatCanCatch.length <= 1
}

function canFinishTopThree(team: string, outcomes: Array<Map<string, number>>) {
  return outcomes.some((outcome) => {
    const points = outcome.get(team) ?? 0
    const teamsClearlyAbove = [...outcome.entries()].filter(([candidate, candidatePoints]) => candidate !== team && candidatePoints > points).length
    return teamsClearlyAbove <= 2
  })
}

function isThirdPlaceGuaranteed(
  row: StandingRow,
  group: string,
  thirdPointRanges: Map<string, { min: number; max: number }>,
) {
  const groupsThatMustFinishBelow = [...thirdPointRanges.entries()].filter(
    ([candidateGroup, range]) => candidateGroup !== group && row.pts > range.max,
  ).length

  return groupsThatMustFinishBelow >= 4
}

function isThirdPlaceEliminated(
  row: StandingRow,
  group: string,
  thirdPointRanges: Map<string, { min: number; max: number }>,
) {
  const groupsThatMustFinishAbove = [...thirdPointRanges.entries()].filter(
    ([candidateGroup, range]) => candidateGroup !== group && range.min > row.pts,
  ).length

  return groupsThatMustFinishAbove >= 8
}

function teamForm(team: string, matches: NormalizedMatch[]) {
  return matches
    .filter((match) => isPlayed(match) && [teamName(match.team1), teamName(match.team2)].includes(team))
    .sort((first, second) => matchDateValue(second) - matchDateValue(first))
    .slice(0, 5)
    .map((match) => {
      const score = scoreValues(match.score?.ft)
      if (!score) {
        return ''
      }

      const isHome = teamName(match.team1) === team
      const [forGoals, againstGoals] = isHome ? score : [score[1], score[0]]
      if (forGoals > againstGoals) {
        return 'W'
      }
      if (forGoals < againstGoals) {
        return 'L'
      }
      return 'D'
    })
    .filter(Boolean)
}

function compareStandingRows(first: StandingRow, second: StandingRow) {
  return (
    second.pts - first.pts ||
    second.gd - first.gd ||
    second.gf - first.gf ||
    (FIFA_RANKINGS[first.team] ?? 999) - (FIFA_RANKINGS[second.team] ?? 999) ||
    first.team.localeCompare(second.team)
  )
}

function emptyRow(team: string, group: string): StandingRow {
  return { team, group, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }
}

function isGroupMatch(match: OpenfootballMatch) {
  return Boolean(match.group)
}

function isPlayed(match: OpenfootballMatch) {
  return Boolean(scoreValues(match.score?.ft))
}

function groupCode(match: OpenfootballMatch) {
  return String(match.group || '').replace('Group ', '').trim()
}

function matchNumber(match: OpenfootballMatch, fallback: number) {
  return match.num ?? match.matchNumber ?? fallback
}

function sortByMatchNumber(matches: NormalizedMatch[]) {
  return [...matches].sort((first, second) => matchNumber(first, 999) - matchNumber(second, 999))
}

function matchDateValue(match: OpenfootballMatch) {
  return parseMatchDate(match).getTime()
}

function parseMatchDate(match: OpenfootballMatch) {
  if (!match.date) {
    return new Date(Number.MAX_SAFE_INTEGER)
  }

  const rawTime = (match.time || '12:00 UTC').replace('UTC', 'GMT')
  const parsed = new Date(`${match.date} ${rawTime}`)
  return Number.isNaN(parsed.getTime()) ? new Date(`${match.date}T12:00:00Z`) : parsed
}

function scoreValues(score: [number, number] | string | undefined) {
  if (Array.isArray(score) && score.length >= 2) {
    return [Number(score[0]), Number(score[1])] as [number, number]
  }

  if (typeof score === 'string') {
    const values = score.trim().split(/\s+/).map((value) => Number(value))
    return values.length >= 2 && values.every(Number.isFinite) ? ([values[0], values[1]] as [number, number]) : undefined
  }

  return undefined
}

function matchCity(match: OpenfootballMatch) {
  const value = String(match.city || match.ground || '').trim()
  const parenthetical = value.match(/\(([^)]+)\)/)?.[1]
  if (parenthetical) {
    return parenthetical
  }

  return value.replace(/^San Francisco Bay Area$/i, 'San Francisco').replace(/^New York\/New Jersey$/i, 'NY/NJ')
}

function broadcastWindow(date: Date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const days = Math.round((target - today) / 86_400_000)

  if (days === 0) {
    return 'Today'
  }
  if (days === 1) {
    return 'Tomorrow'
  }
  return 'Upcoming'
}

function isMatchInProgress(match: NormalizedMatch, now = Date.now(), liveEvent?: LiveScoreEvent) {
  if (liveEvent) {
    return liveEvent.statusState === 'in'
  }

  if (isPlayed(match)) {
    return false
  }

  const kickoff = matchDateValue(match)
  const matchWindowMs = 2 * 60 * 60 * 1000
  return now >= kickoff && now < kickoff + matchWindowMs
}

function inProgressText(
  match: NormalizedMatch,
  home: Team,
  away: Team,
  liveScore: UpcomingMatch['liveScore'],
  now = Date.now(),
) {
  if (liveScore?.homeScore !== undefined && liveScore.awayScore !== undefined) {
    const clock = liveScore.clock ?? liveScore.status ?? 'Live'
    return `${clock} - ${home.fifaCode} ${liveScore.homeScore}-${liveScore.awayScore} ${away.fifaCode}`
  }

  if (liveScore?.clock || liveScore?.status) {
    return `${liveScore.clock ?? liveScore.status} - live score unavailable`
  }

  const elapsedMinutes = Math.max(1, Math.min(120, Math.floor((now - matchDateValue(match)) / 60_000)))
  return `${elapsedMinutes}' estimated - live score unavailable`
}

function positionLine(position: string): Player['line'] {
  const normalized = key(position)
  if (/\b(?:g|gk)\b/.test(normalized) || normalized.includes('goalkeeper')) {
    return 'GK'
  }
  if (/\b(?:am|cm|dm|lm|mf|rm)\b/.test(normalized) || normalized.includes('midfielder') || normalized.includes('midfield')) {
    return 'MID'
  }
  if (/\b(?:cb|cd|df|lb|rb)\b/.test(normalized) || normalized.includes('defender') || normalized.includes('back')) {
    return 'DEF'
  }
  return 'FWD'
}

function roleLabel(position: string) {
  const normalized = key(position)
  if (normalized.includes('substitute') || normalized === 'sub') {
    return 'Substitute'
  }

  const line = positionLine(position)
  if (line === 'GK') {
    return 'Goalkeeper'
  }
  if (line === 'DEF') {
    return 'Defender'
  }
  if (line === 'MID') {
    return 'Midfielder'
  }
  return 'Forward'
}

function roleOrder(role: string) {
  return { Goalkeeper: 0, Defender: 1, Midfielder: 2, Forward: 3, Substitute: 4 }[role] ?? 9
}

function compareLineupPlayers(first: Player, second: Player) {
  return (
    starterRank(first) - starterRank(second) ||
    (first.lineupOrder ?? 999) - (second.lineupOrder ?? 999) ||
    roleOrder(first.role) - roleOrder(second.role) ||
    first.number - second.number ||
    first.name.localeCompare(second.name)
  )
}

function starterRank(player: Player) {
  return player.isStarter ? 0 : 1
}

function extractAge(value: string) {
  return value.match(/aged\s+(\d+)/i)?.[1] ?? ''
}

function linkText(value: string) {
  return linkTexts(value)[0]?.text ?? ''
}

function linkTexts(value: string) {
  return [...value.matchAll(/<a\b[\s\S]*?<\/a>/g)]
    .map((match) => {
      const link = match[0]
      return {
        text: stripTags(link),
        title: decodeHtml(link.match(/\btitle="([^"]+)"/)?.[1] ?? ''),
      }
    })
    .filter((link) => link.text)
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<sup\b[\s\S]*?<\/sup>/g, '')
      .replace(/<style\b[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function teamName(name: unknown) {
  const value = String(name || '').trim()
  return ALIASES[key(value)] || value
}

function teamId(name: string) {
  return slug(teamName(name))
}

function slug(value: string) {
  return key(value).replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function key(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9&' ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function standingLabel(value: number) {
  if (value === 1) {
    return '1st'
  }
  if (value === 2) {
    return '2nd'
  }
  if (value === 3) {
    return '3rd'
  }
  return value ? `${value}th` : 'unranked'
}

function teamMeta(
  fifaCode: string,
  shortName: string,
  flag: string,
  confederation: string,
  color: string,
): TeamMeta {
  return {
    shortName,
    fifaCode,
    flag,
    group: '',
    confederation,
    color,
  }
}
