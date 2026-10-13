import type { DashboardData, Team, TeamRecord } from '../shared/types.js'

const ESPN_STANDINGS_BASE = 'https://site.web.api.espn.com/apis/v2/sports/soccer'

const espnStandingsSlugs: Record<string, string> = {
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

type StandingsStat = { name?: string; value?: number }
type StandingsEntry = { team?: { displayName?: string; shortDisplayName?: string; name?: string }; stats?: StandingsStat[] }
type StandingsResponse = { children?: Array<{ standings?: { entries?: StandingsEntry[] } }> }

const providerTeamAliases: Record<string, string> = {
  'stade rennais': 'Rennes',
  'red bull new york': 'New York Red Bulls',
  'st louis city sc': 'St. Louis City SC',
  'chicago fire fc': 'Chicago Fire',
  'dc united': 'DC United',
  'd c united': 'DC United',
  'orlando city sc': 'Orlando City',
  'atlanta united fc': 'Atlanta United',
  'inter miami cf': 'Inter Miami',
  'houston dynamo fc': 'Houston Dynamo',
  'seattle sounders fc': 'Seattle Sounders',
  'minnesota united fc': 'Minnesota United',
  america: 'Club América',
  guadalajara: 'Chivas',
  santos: 'Santos Laguna',
  'fc juarez': 'Juárez',
  maritimo: 'CS Marítimo',
  estrela: 'Estrela Amadora',
  'fc famalicao': 'Famalicão',
  'academico de viseu': 'Viseu',
  'vitoria de guimaraes': 'Vitória Guimarães',
  'neom sc': 'NEOM Sports Club',
  'al diriyah': 'Diriyah FC',
  'athletico paranaense': 'Athletico-PR',
  'red bull bragantino': 'Bragantino',
  'sanfrecce hiroshima': 'Hiroshima Sanfrecce',
  'mito hollyhock': 'Mito HollyHock',
  'fagiano okayama': 'Okayama',
  'jef united ichihara chiba': 'JEF United Chiba',
  'go ahead eagles': 'Go Ahead',
  'fortuna sittard': 'Sittard',
  'ajax amsterdam': 'Ajax',
  'feyenoord rotterdam': 'Feyenoord',
  'sparta rotterdam': 'Sparta',
  'fc augsburg': 'Augsburg',
  'sv elversberg': 'Elversberg',
  'fc cologne': 'Cologne',
  'hamburg sv': 'Hamburg',
  'tsg hoffenheim': 'Hoffenheim',
  mainz: 'Mainz 05',
  'sc paderborn 07': 'Paderborn',
  'schalke 04': 'Schalke',
  '1 fc union berlin': 'Union Berlin',
}

export async function hydrateDashboardWithStandings(baseDashboard: DashboardData): Promise<DashboardData> {
  const slug = espnStandingsSlugs[baseDashboard.league.id]
  if (!slug) return baseDashboard

  try {
    const response = await fetch(`${ESPN_STANDINGS_BASE}/${slug}/standings`, {
      headers: { Accept: 'application/json', 'User-Agent': 'all-football-dashboard/1.0' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) throw new Error(`ESPN standings returned ${response.status}`)
    const payload = await response.json() as StandingsResponse
    const records = buildRecords(baseDashboard.teams, payload)
    if (records.size < Math.ceil(baseDashboard.teams.length * 0.75)) throw new Error(`Only matched ${records.size}/${baseDashboard.teams.length} teams`)
    const maxPlayed = Math.max(...[...records.values()].map((record) => record.played), 0)
    const currentWeek = maxPlayed > 0
      ? Math.min(baseDashboard.league.matchweekCount, maxPlayed + 1)
      : baseDashboard.league.currentWeek

    return {
      ...baseDashboard,
      league: { ...baseDashboard.league, currentWeek },
      provider: {
        ...baseDashboard.provider,
        mode: 'live',
        name: 'ESPN standings and live scoreboard',
        lastUpdated: new Date().toISOString(),
        message: 'Current standings and match status are updating from ESPN.',
      },
      teams: baseDashboard.teams.map((team) => ({ ...team, record: records.get(team.id) ?? team.record })),
    }
  } catch (error) {
    console.warn(`Standings unavailable for ${baseDashboard.league.id}:`, error)
    return baseDashboard
  }
}

function buildRecords(teams: Team[], payload: StandingsResponse) {
  const localTeams = new Map(teams.map((team) => [normalizeTeamName(team.name), team]))
  const records = new Map<string, TeamRecord>()
  const entries = payload.children?.flatMap((child) => child.standings?.entries ?? []) ?? []

  for (const entry of entries) {
    const providerName = entry.team?.displayName ?? entry.team?.shortDisplayName ?? entry.team?.name ?? ''
    const localName = providerTeamAliases[normalizeTeamName(providerName)] ?? providerName
    const team = localTeams.get(normalizeTeamName(localName))
    if (!team) continue
    const stats = new Map((entry.stats ?? []).map((stat) => [stat.name, stat.value ?? 0]))
    const goalsFor = stats.get('pointsFor') ?? 0
    const goalsAgainst = stats.get('pointsAgainst') ?? 0
    records.set(team.id, {
      played: stats.get('gamesPlayed') ?? 0,
      wins: stats.get('wins') ?? 0,
      draws: stats.get('ties') ?? 0,
      losses: stats.get('losses') ?? 0,
      goalsFor,
      goalsAgainst,
      goalDifference: stats.get('pointDifferential') ?? goalsFor - goalsAgainst,
      points: stats.get('points') ?? 0,
    })
  }

  return records
}

function normalizeTeamName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}
