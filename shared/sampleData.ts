import type { DashboardData, Team, TeamRecord, UpcomingMatch } from './types.js'
import { deriveEuropeanQualification, toQualificationConfig } from './europeanQualification.js'
import { getVenueTimeZone } from './timezones.js'

const updatedAt = '2026-08-17T21:00:00.000Z'

const clubSeeds: Array<[string, string, string, string, string]> = [
  ['arsenal', 'Arsenal', 'Arsenal', 'ARS', '#d71920'],
  ['aston-villa', 'Aston Villa', 'Aston Villa', 'AVL', '#670e36'],
  ['bournemouth', 'AFC Bournemouth', 'Bournemouth', 'BOU', '#da291c'],
  ['brentford', 'Brentford', 'Brentford', 'BRE', '#e30613'],
  ['brighton', 'Brighton & Hove Albion', 'Brighton', 'BHA', '#0057b8'],
  ['chelsea', 'Chelsea', 'Chelsea', 'CHE', '#034694'],
  ['coventry', 'Coventry City', 'Coventry', 'COV', '#67b2e8'],
  ['crystal-palace', 'Crystal Palace', 'Crystal Palace', 'CRY', '#1b458f'],
  ['everton', 'Everton', 'Everton', 'EVE', '#003399'],
  ['fulham', 'Fulham', 'Fulham', 'FUL', '#111111'],
  ['hull', 'Hull City', 'Hull', 'HUL', '#f5a800'],
  ['ipswich', 'Ipswich Town', 'Ipswich', 'IPS', '#0054a6'],
  ['leeds', 'Leeds United', 'Leeds', 'LEE', '#ffcd00'],
  ['liverpool', 'Liverpool', 'Liverpool', 'LIV', '#c8102e'],
  ['man-city', 'Manchester City', 'Man City', 'MCI', '#6cabdd'],
  ['man-united', 'Manchester United', 'Man Utd', 'MUN', '#da291c'],
  ['newcastle', 'Newcastle United', 'Newcastle', 'NEW', '#241f20'],
  ['nottingham-forest', 'Nottingham Forest', "Nott'm Forest", 'NFO', '#e53233'],
  ['sunderland', 'Sunderland', 'Sunderland', 'SUN', '#eb172b'],
  ['tottenham', 'Tottenham Hotspur', 'Spurs', 'TOT', '#132257'],
]

const officialBadgeIdByClub: Record<string, number> = {
  arsenal: 3,
  'aston-villa': 7,
  bournemouth: 91,
  brentford: 94,
  brighton: 36,
  chelsea: 8,
  coventry: 9,
  'crystal-palace': 31,
  everton: 11,
  fulham: 54,
  hull: 88,
  ipswich: 40,
  leeds: 2,
  liverpool: 14,
  'man-city': 43,
  'man-united': 1,
  newcastle: 4,
  'nottingham-forest': 17,
  sunderland: 56,
  tottenham: 6,
}

const emptyRecord = (): TeamRecord => ({ played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })

export const sampleTeams: Team[] = clubSeeds.map(([id, name, shortName, abbreviation, color]) => ({
  id,
  name,
  shortName,
  abbreviation,
    logoUrl: `https://resources.premierleague.com/premierleague25/badges/${officialBadgeIdByClub[id]}.svg`,
  color,
  record: emptyRecord(),
  form: [],
}))

const openingMatches: Array<[string, string, string, string, string, string, string]> = [
  ['2026-08-21T20:00:00+01:00', 'Arsenal', 'Coventry City', 'Emirates Stadium', 'USA Network', 'opener-arsenal-coventry', 'Matchweek 1'],
  ['2026-08-22T12:30:00+01:00', 'Hull City', 'Manchester United', 'MKM Stadium', 'USA Network', 'opener-hull-united', 'Matchweek 1'],
  ['2026-08-22T15:00:00+01:00', 'Everton', 'Crystal Palace', 'Hill Dickinson Stadium', 'USA Network', 'opener-everton-palace', 'Matchweek 1'],
  ['2026-08-22T15:00:00+01:00', 'Ipswich Town', 'Sunderland', 'Portman Road', 'Peacock / NBCSN', 'opener-ipswich-sunderland', 'Matchweek 1'],
  ['2026-08-22T15:00:00+01:00', 'Nottingham Forest', 'Leeds United', 'The City Ground', 'Peacock / NBCSN', 'opener-forest-leeds', 'Matchweek 1'],
  ['2026-08-22T17:30:00+01:00', 'Brentford', 'Tottenham Hotspur', 'Gtech Community Stadium', 'NBC / Peacock', 'opener-brentford-spurs', 'Matchweek 1'],
  ['2026-08-23T14:00:00+01:00', 'Brighton & Hove Albion', 'Aston Villa', 'American Express Stadium', 'Peacock', 'opener-brighton-villa', 'Matchweek 1'],
  ['2026-08-23T14:00:00+01:00', 'Manchester City', 'AFC Bournemouth', 'Etihad Stadium', 'USA Network', 'opener-city-bournemouth', 'Matchweek 1'],
  ['2026-08-23T16:30:00+01:00', 'Newcastle United', 'Liverpool', "St James' Park", 'USA Network', 'opener-newcastle-liverpool', 'Matchweek 1'],
  ['2026-08-24T20:00:00+01:00', 'Fulham', 'Chelsea', 'Craven Cottage', 'USA Network', 'opener-fulham-chelsea', 'Matchweek 1'],
]

const secondMatchweek: Array<[string, string, string, string, string, string]> = [
  ['2026-08-28T20:00:00+01:00', 'Crystal Palace', 'Manchester City', 'Selhurst Park', 'U.S. coverage TBD', 'mw2-palace-city'],
  ['2026-08-29T12:30:00+01:00', 'Liverpool', 'Nottingham Forest', 'Anfield', 'U.S. coverage TBD', 'mw2-liverpool-forest'],
  ['2026-08-29T15:00:00+01:00', 'AFC Bournemouth', 'Everton', 'Vitality Stadium', 'U.S. coverage TBD', 'mw2-bournemouth-everton'],
  ['2026-08-29T15:00:00+01:00', 'Coventry City', 'Hull City', 'Coventry Building Society Arena', 'U.S. coverage TBD', 'mw2-coventry-hull'],
  ['2026-08-29T17:30:00+01:00', 'Tottenham Hotspur', 'Newcastle United', 'Tottenham Hotspur Stadium', 'U.S. coverage TBD', 'mw2-spurs-newcastle'],
]

const teamIdByName = new Map(sampleTeams.map((team) => [team.name, team.id]))

const europeanQualification = deriveEuropeanQualification({ accessListRank: 1, seasonCoefficientRank: 1, seasonAssociationCoefficient: 28.680, baseChampionsLeaguePlaces: 4, faCupWinnerAlreadyQualified: true, eflCupWinnerAlreadyQualified: true })

export const sampleMatches: UpcomingMatch[] = [
  ...openingMatches.map(([kickoff, home, away, venue, broadcast, id, stage]) => buildMatch(kickoff, home, away, venue, broadcast, id, stage)),
  ...secondMatchweek.map(([kickoff, home, away, venue, broadcast, id]) => buildMatch(kickoff, home, away, venue, broadcast, id, 'Matchweek 2')),
]

export const sampleDashboard: DashboardData = {
  league: { id: 'premier-league', name: 'Premier League', shortName: 'Premier League', country: 'England', region: 'Europe', accent: '#e90052', logoUrl: 'https://media.api-sports.io/football/leagues/39.png', matchweekCount: 38, currentWeek: 1 },
  provider: { mode: 'sample', name: 'Premier League launchpad', lastUpdated: updatedAt, message: 'The 2026/27 match list is loaded. League records will populate when the season begins.' },
  competition: 'English Premier League',
  season: '2026/27',
  seasonStart: '2026-08-21T20:00:00+01:00',
  broadcastSourceUrl: 'https://www.nbcsports.com/pressbox/press-releases/the-2026-27-premier-league-season-kicks-off-in-one-month-across-platforms-of-nbcuniversal-with-nbc-sports-studio-team-on-site-in-u-k',
  qualification: toQualificationConfig(europeanQualification),
  europeanQualification,
  teams: sampleTeams,
  matches: sampleMatches,
}

function buildMatch(kickoff: string, homeName: string, awayName: string, venue: string, broadcast: string, id: string, stage: string): UpcomingMatch {
  const homeId = teamIdByName.get(homeName)
  const awayId = teamIdByName.get(awayName)
  if (!homeId || !awayId) throw new Error(`Unknown club in match: ${homeName} or ${awayName}`)
  return { id, kickoff, competitionStage: stage, venue, venueTimeZone: getVenueTimeZone('premier-league', homeName), broadcast: broadcast || undefined, home: { teamId: homeId }, away: { teamId: awayId }, status: 'upcoming' }
}
