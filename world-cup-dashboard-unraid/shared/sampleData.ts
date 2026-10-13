import type { BracketMatch, DashboardData, Team, TeamLineup, UpcomingMatch } from './types.js'

const updatedAt = '2026-06-26T15:45:00.000Z'

type TeamSeed = Omit<Team, 'record' | 'form'>

const seeds: TeamSeed[] = [
  team('mex', 'Mexico', 'Mexico', 'MEX', '🇲🇽', 'A', 'CONCACAF', '#0b8f61'),
  team('arg', 'Argentina', 'Argentina', 'ARG', '🇦🇷', 'A', 'CONMEBOL', '#48a7d8'),
  team('cro', 'Croatia', 'Croatia', 'CRO', '🇭🇷', 'A', 'UEFA', '#d22f27'),
  team('crc', 'Costa Rica', 'Costa Rica', 'CRC', '🇨🇷', 'A', 'CONCACAF', '#1f5fbf'),
  team('can', 'Canada', 'Canada', 'CAN', '🇨🇦', 'B', 'CONCACAF', '#d62828'),
  team('usa', 'United States', 'USA', 'USA', '🇺🇸', 'B', 'CONCACAF', '#1f5fbf'),
  team('ger', 'Germany', 'Germany', 'GER', '🇩🇪', 'C', 'UEFA', '#dd0000'),
  team('jpn', 'Japan', 'Japan', 'JPN', '🇯🇵', 'C', 'AFC', '#d43d51'),
  team('eng', 'England', 'England', 'ENG', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'D', 'UEFA', '#7a8aa0'),
  team('gha', 'Ghana', 'Ghana', 'GHA', '🇬🇭', 'D', 'CAF', '#d6a313'),
  team('bra', 'Brazil', 'Brazil', 'BRA', '🇧🇷', 'E', 'CONMEBOL', '#198754'),
  team('kor', 'Korea Republic', 'Korea', 'KOR', '🇰🇷', 'E', 'AFC', '#c1121f'),
  team('por', 'Portugal', 'Portugal', 'POR', '🇵🇹', 'F', 'UEFA', '#006f4e'),
  team('mar', 'Morocco', 'Morocco', 'MAR', '🇲🇦', 'F', 'CAF', '#b00020'),
  team('egy', 'Egypt', 'Egypt', 'EGY', '🇪🇬', 'G', 'CAF', '#bf1e2e'),
  team('irn', 'Iran', 'Iran', 'IRN', '🇮🇷', 'G', 'AFC', '#239f40'),
  team('nzl', 'New Zealand', 'New Zealand', 'NZL', '🇳🇿', 'G', 'OFC', '#111820'),
  team('bel', 'Belgium', 'Belgium', 'BEL', '🇧🇪', 'G', 'UEFA', '#f2c230'),
  team('cpv', 'Cape Verde', 'Cape Verde', 'CPV', '🇨🇻', 'H', 'CAF', '#2446a0'),
  team('ksa', 'Saudi Arabia', 'Saudi Arabia', 'KSA', '🇸🇦', 'H', 'AFC', '#128c45'),
  team('uru', 'Uruguay', 'Uruguay', 'URU', '🇺🇾', 'H', 'CONMEBOL', '#5ab9ea'),
  team('esp', 'Spain', 'Spain', 'ESP', '🇪🇸', 'H', 'UEFA', '#b21f2d'),
  team('fra', 'France', 'France', 'FRA', '🇫🇷', 'I', 'UEFA', '#2446a0'),
  team('sen', 'Senegal', 'Senegal', 'SEN', '🇸🇳', 'I', 'CAF', '#f0a500'),
  team('irq', 'Iraq', 'Iraq', 'IRQ', '🇮🇶', 'I', 'AFC', '#c8102e'),
  team('nor', 'Norway', 'Norway', 'NOR', '🇳🇴', 'I', 'UEFA', '#ba0c2f'),
  team('ned', 'Netherlands', 'Netherlands', 'NED', '🇳🇱', 'J', 'UEFA', '#f58220'),
  team('col', 'Colombia', 'Colombia', 'COL', '🇨🇴', 'J', 'CONMEBOL', '#f4d03f'),
  team('ita', 'Italy', 'Italy', 'ITA', '🇮🇹', 'K', 'UEFA', '#0066cc'),
  team('sui', 'Switzerland', 'Switzerland', 'SUI', '🇨🇭', 'K', 'UEFA', '#d52b1e'),
  team('den', 'Denmark', 'Denmark', 'DEN', '🇩🇰', 'L', 'UEFA', '#c8102e'),
  team('nga', 'Nigeria', 'Nigeria', 'NGA', '🇳🇬', 'L', 'CAF', '#008751'),
]

export const sampleTeams: Team[] = seeds.map((seed) => ({
  ...seed,
  record: emptyRecord(),
  qualificationStatus: 'pending',
  standingSourceLabel: 'Standings unavailable until the live standings source refreshes',
  form: [],
}))

export const sampleLineups: TeamLineup[] = sampleTeams.map(buildLineup)

export const sampleMatches: UpcomingMatch[] = [
  match('match-nor-fra', '2026-06-26T14:00:00-05:00', 'Group I', 'Boston Stadium', 'Foxborough', 'nor', 'fra', [
    'A win can push Norway into the automatic places; a draw keeps third-place math in play.',
    'France can secure the group and a seeded Round of 32 path with a result.',
  ], 'Group I winner and runner-up placement are on the line.'),
  match('match-sen-irq', '2026-06-26T14:00:00-05:00', 'Group I', 'Toronto Stadium', 'Toronto', 'sen', 'irq', [
    'Senegal can climb into an automatic slot with a win and favorable goal difference.',
    'Iraq need points to keep a third-place path alive.',
  ], 'The result shapes Group I automatic qualification and third-place safety.'),
  match('match-uru-esp', '2026-06-26T19:00:00-05:00', 'Group H', 'Estadio Akron', 'Guadalajara', 'uru', 'esp', [
    'Uruguay can flip the group with a win and protect a Round of 32 placement.',
    'Spain can hold first place and avoid a tougher opening knockout draw.',
  ], 'Group H seeding is decided directly by this result.'),
  match('match-cpv-ksa', '2026-06-26T19:00:00-05:00', 'Group H', 'Houston Stadium', 'Houston', 'cpv', 'ksa', [
    'Cape Verde can keep a historic third-place qualification push alive.',
    'Saudi Arabia need a result to stay above the third-place cut line.',
  ], 'Third-place qualification and Group H order both move on this match.'),
  match('match-nzl-bel', '2026-06-26T22:00:00-05:00', 'Group G', 'BC Place', 'Vancouver', 'nzl', 'bel', [
    'New Zealand need points to stay in the third-place race.',
    'Belgium can secure a top-two slot and improve knockout placement.',
  ], 'Group G top-two placement and the third-place table are affected.'),
  match('match-egy-irn', '2026-06-26T22:00:00-05:00', 'Group G', 'Lumen Field', 'Seattle', 'egy', 'irn', [
    'Egypt can lock a top-two finish and potentially win Group G.',
    'Iran need points to influence both second place and third-place qualification.',
  ], 'This directly affects Group G placement for the Round of 32 bracket.'),
]

const r32Pairings: Array<[string, string, string, string, string, string]> = [
  ['1A', 'mex', '3C/E/F', 'mar', 'A', 'r32-1'],
  ['2B', 'can', '2F', 'sen', 'A', 'r32-2'],
  ['1C', 'eng', '3A/B/F', 'gha', 'B', 'r32-3'],
  ['1D', 'usa', '2E', 'jpn', 'B', 'r32-4'],
  ['1E', 'bra', '2A', 'arg', 'C', 'r32-5'],
  ['1F', 'fra', '2C', 'ger', 'C', 'r32-6'],
  ['1G', 'egy', '3A/B/H', 'uru', 'D', 'r32-7'],
  ['1H', 'esp', '2D', 'col', 'D', 'r32-8'],
  ['1I', 'nor', '3C/D/G', 'crc', 'E', 'r32-9'],
  ['1J', 'ned', '2H', 'ksa', 'E', 'r32-10'],
  ['1K', 'por', '3D/E/I', 'irq', 'F', 'r32-11'],
  ['1L', 'ita', '2G', 'nzl', 'F', 'r32-12'],
  ['2A', 'cro', '2K', 'bel', 'G', 'r32-13'],
  ['2I', 'irn', '2J', 'den', 'G', 'r32-14'],
  ['2L', 'sui', '3G/H/I', 'kor', 'H', 'r32-15'],
  ['3J/K/L', 'cpv', '3A/E/F', 'nga', 'H', 'r32-16'],
]

const r32Matches: BracketMatch[] = r32Pairings.map(([placementA, teamA, placementB, teamB, region, id], index) => ({
  id,
  round: 'round-of-32',
  region,
  sortOrder: index + 1,
  slotA: { id: `${id}-a`, placement: placementA, teamId: teamA },
  slotB: { id: `${id}-b`, placement: placementB, teamId: teamB },
}))

export const sampleBracket: BracketMatch[] = [
  ...r32Matches,
  ...buildSourceRound('round-of-16', 'r16', 'R32', 8, 17),
  ...buildSourceRound('quarterfinal', 'qf', 'R16', 4, 25),
  ...buildSourceRound('semifinal', 'sf', 'QF', 2, 29),
  {
    id: 'final-1',
    round: 'final',
    region: 'Champion',
    sortOrder: 31,
    slotA: { id: 'final-1-a', placement: 'W SF-1', sourceMatchId: 'sf-1', sourceLabel: 'Winner SF-1' },
    slotB: { id: 'final-1-b', placement: 'W SF-2', sourceMatchId: 'sf-2', sourceLabel: 'Winner SF-2' },
  },
]

export const sampleDashboard: DashboardData = {
  provider: {
    mode: 'sample',
    name: 'Fallback shell',
    lastUpdated: updatedAt,
    message: 'Static fixture and bracket shell is active. Standings, confirmed lineups, and player stats require live sources.',
  },
  teams: sampleTeams,
  lineups: sampleLineups,
  matches: sampleMatches,
  bracket: sampleBracket,
}

function team(
  id: string,
  name: string,
  shortName: string,
  fifaCode: string,
  flag: string,
  group: string,
  confederation: string,
  color: string,
): TeamSeed {
  return { id, name, shortName, fifaCode, flag, group, confederation, color }
}

function emptyRecord() {
  return {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }
}

function buildLineup(teamValue: Team): TeamLineup {
  return {
    teamId: teamValue.id,
    formation: 'TBD',
    status: 'unavailable',
    updatedAt,
    sourceLabel:
      teamValue.id === 'fra'
        ? 'FFF squad source available; confirmed lineup and player stats unavailable'
        : 'Confirmed lineup and player stats unavailable until a live match source is connected',
    sourceUrl:
      teamValue.id === 'fra'
        ? 'https://www.fff.fr/selection/2-equipe-de-france/derniere-selection.html'
        : undefined,
    players: [],
  }
}

function match(
  id: string,
  kickoff: string,
  competitionStage: string,
  venue: string,
  city: string,
  homeTeamId: string,
  awayTeamId: string,
  scenarios: [string, string],
  placementImpact: string,
): UpcomingMatch {
  const home = sampleTeams.find((teamValue) => teamValue.id === homeTeamId)
  const away = sampleTeams.find((teamValue) => teamValue.id === awayTeamId)

  return {
    id,
    kickoff,
    competitionStage,
    venue,
    city,
    home: {
      teamId: homeTeamId,
      projectedStanding: home ? projectedStanding(home) : 3,
      points: home?.record.points ?? 0,
      scenario: scenarios[0],
    },
    away: {
      teamId: awayTeamId,
      projectedStanding: away ? projectedStanding(away) : 3,
      points: away?.record.points ?? 0,
      scenario: scenarios[1],
    },
    isPlacementDecider: true,
    placementImpact,
    broadcastWindow: 'Today',
    status: 'upcoming',
    statusText: 'Upcoming',
  }
}

function projectedStanding(teamValue: Team) {
  const standings = sampleTeams
    .filter((candidate) => candidate.group === teamValue.group)
    .sort((first, second) => second.record.points - first.record.points || second.record.goalDifference - first.record.goalDifference)

  return standings.findIndex((candidate) => candidate.id === teamValue.id) + 1
}

function buildSourceRound(
  round: BracketMatch['round'],
  idPrefix: string,
  sourcePrefix: string,
  matchCount: number,
  sortStart: number,
): BracketMatch[] {
  return Array.from({ length: matchCount }, (_, index) => {
    const id = `${idPrefix}-${index + 1}`
    const sourceA = `${previousId(idPrefix, index * 2 + 1)}`
    const sourceB = `${previousId(idPrefix, index * 2 + 2)}`
    const region = index < matchCount / 2 ? 'Left' : 'Right'

    return {
      id,
      round,
      region,
      sortOrder: sortStart + index,
      slotA: {
        id: `${id}-a`,
        placement: `W ${sourcePrefix}-${index * 2 + 1}`,
        sourceMatchId: sourceA,
        sourceLabel: `Winner ${sourcePrefix}-${index * 2 + 1}`,
      },
      slotB: {
        id: `${id}-b`,
        placement: `W ${sourcePrefix}-${index * 2 + 2}`,
        sourceMatchId: sourceB,
        sourceLabel: `Winner ${sourcePrefix}-${index * 2 + 2}`,
      },
    }
  })
}

function previousId(idPrefix: string, sourceIndex: number) {
  if (idPrefix === 'r16') {
    return `r32-${sourceIndex}`
  }
  if (idPrefix === 'qf') {
    return `r16-${sourceIndex}`
  }
  return `qf-${sourceIndex}`
}
