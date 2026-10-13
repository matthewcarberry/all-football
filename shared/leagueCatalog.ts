import { sampleDashboard } from './sampleData.js'
import { clubLogoSources } from './clubLogoSources.js'
import { nwslMatchweeks } from './nwslSchedule.js'
import { getVenueTimeZone } from './timezones.js'
import type { DashboardData, LeagueMeta, QualificationBand, QualificationConfig, Team, TeamRecord, UpcomingMatch } from './types.js'

type LeagueDefinition = {
  meta: Omit<LeagueMeta, 'logoUrl' | 'matchweekCount' | 'currentWeek'>
  seasonStart: string
  teams: string[]
  qualification: QualificationConfig
  matchweek1?: MatchSeed[]
  matchweeks?: Record<number, MatchSeed[]>
}

export type MatchSeed = {
  kickoff: string
  home: string
  away: string
  venue?: string
  broadcast?: string
  homeScore?: number
  awayScore?: number
}

const clubColors = ['#e90052', '#00b866', '#04f5ff', '#ffd166', '#cc79a7', '#d55e00', '#0072b2', '#f4e8f3']

const leagueLogoIds: Record<string, number> = {
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
  nwsl: 674,
  'uefa-nations-league': 5,
}

const leagueLogoUrls: Record<string, string> = {
  wsl: 'https://images.wslfootball.com/image/private/t_w_480/v1748266678/prd/assets/widgets/competitions/WSL.png',
}

const leagueMatchweekCounts: Record<string, number> = {
  'la-liga': 38,
  bundesliga: 34,
  'serie-a': 38,
  'ligue-1': 34,
  mls: 34,
  'liga-mx': 17,
  eredivisie: 34,
  'liga-portugal': 34,
  'saudi-pro-league': 34,
  'brasileirao-serie-a': 38,
  'j1-league': 38,
  'k-league-1': 38,
  nwsl: 27,
  wsl: 26,
  'uefa-nations-league': 6,
}

const leagueCurrentWeeks: Record<string, number> = {
  'la-liga': 4,
  bundesliga: 2,
  'serie-a': 3,
  'ligue-1': 3,
  mls: 24,
  'liga-mx': 7,
  eredivisie: 5,
  'liga-portugal': 5,
  'saudi-pro-league': 5,
  'brasileirao-serie-a': 26,
  'j1-league': 5,
  'k-league-1': 27,
  nwsl: 23,
  wsl: 1,
  'uefa-nations-league': 1,
}

function withLeagueLogo(meta: Omit<LeagueMeta, 'logoUrl' | 'matchweekCount' | 'currentWeek'>): LeagueMeta {
  const logoId = leagueLogoIds[meta.id]
  return { ...meta, logoUrl: leagueLogoUrls[meta.id] ?? `https://media.api-sports.io/football/leagues/${logoId}.png`, matchweekCount: leagueMatchweekCounts[meta.id] ?? 38, currentWeek: leagueCurrentWeeks[meta.id] ?? 1 }
}

function band(id: string, label: string, fromPosition: number, toPosition: number, tone: QualificationBand['tone']): QualificationBand {
  return { id, label, fromPosition, toPosition, tone }
}

function qualification(bands: QualificationBand[], note: string): QualificationConfig {
  return { bands, note }
}

function baseEuropeanQualification(teamCount: number, note: string) {
  return qualification([
    band('champions', 'Champions League', 1, 4, 'champions'),
    band('europa', 'Europa League', 5, 5, 'europa'),
    band('conference', 'Conference League', 6, 6, 'conference'),
    band('relegation', 'Relegation', teamCount - 2, teamCount, 'relegation'),
  ], note)
}

// Verified schedule data for the currently relevant matchweek in each league.
// Kickoffs are stored with the source league's local offset and rendered in
// the viewer's local timezone by the client.
const verifiedMatchweeks: Record<string, Record<number, MatchSeed[]>> = {
  'la-liga': {
    1: [
      { kickoff: '2026-08-15T17:30:00+02:00', home: 'Alavés', away: 'Getafe' },
      { kickoff: '2026-08-15T19:30:00+02:00', home: 'Sevilla', away: 'Rayo Vallecano' },
      { kickoff: '2026-08-16T15:00:00+02:00', home: 'Racing Santander', away: 'Villarreal' },
      { kickoff: '2026-08-16T17:00:00+02:00', home: 'Espanyol', away: 'Levante' },
      { kickoff: '2026-08-17T19:00:00+02:00', home: 'Deportivo', away: 'Elche' },
      { kickoff: '2026-08-19T19:00:00+02:00', home: 'Atlético Madrid', away: 'Málaga' },
      { kickoff: '2026-08-25T21:00:00+02:00', home: 'Valencia', away: 'Real Betis' },
      { kickoff: '2026-08-26T21:00:00+02:00', home: 'Real Madrid', away: 'Real Sociedad' },
      { kickoff: '2026-08-27T20:30:00+02:00', home: 'Celta Vigo', away: 'Osasuna' },
      { kickoff: '2026-08-27T21:00:00+02:00', home: 'Barcelona', away: 'Athletic Club' },
    ],
  },
  'serie-a': {
    1: [
      { kickoff: '2026-08-22T18:30:00+02:00', home: 'Internazionale', away: 'Monza' },
      { kickoff: '2026-08-22T18:30:00+02:00', home: 'Udinese', away: 'Como' },
      { kickoff: '2026-08-22T20:45:00+02:00', home: 'Genoa', away: 'Napoli' },
      { kickoff: '2026-08-22T20:45:00+02:00', home: 'Parma', away: 'Cagliari' },
      { kickoff: '2026-08-23T18:30:00+02:00', home: 'Frosinone', away: 'Juventus' },
      { kickoff: '2026-08-23T18:30:00+02:00', home: 'Venezia', away: 'Lecce' },
      { kickoff: '2026-08-23T20:45:00+02:00', home: 'Atalanta', away: 'Sassuolo' },
      { kickoff: '2026-08-23T20:45:00+02:00', home: 'Torino', away: 'Milan' },
      { kickoff: '2026-08-24T18:30:00+02:00', home: 'Bologna', away: 'Lazio' },
      { kickoff: '2026-08-24T20:45:00+02:00', home: 'Roma', away: 'Fiorentina' },
    ],
  },
  'ligue-1': {
    1: [
      { kickoff: '2026-08-21T20:45:00+02:00', home: 'Marseille', away: 'Strasbourg' },
      { kickoff: '2026-08-22T17:15:00+02:00', home: 'Lens', away: 'Auxerre' },
      { kickoff: '2026-08-22T20:45:00+02:00', home: 'Le Mans', away: 'Brest' },
      { kickoff: '2026-08-22T20:45:00+02:00', home: 'Nice', away: 'Lorient' },
      { kickoff: '2026-08-22T20:45:00+02:00', home: 'Toulouse', away: 'Lyon' },
      { kickoff: '2026-08-22T20:45:00+02:00', home: 'Troyes', away: 'Paris FC' },
      { kickoff: '2026-08-23T15:00:00+02:00', home: 'Angers', away: 'Lille' },
      { kickoff: '2026-08-23T17:15:00+02:00', home: 'Le Havre', away: 'Monaco' },
      { kickoff: '2026-08-23T20:45:00+02:00', home: 'Paris Saint-Germain', away: 'Rennes' },
    ],
  },
  mls: {
    26: [
      { kickoff: '2026-08-19T23:30:00Z', home: 'FC Cincinnati', away: 'New York City FC' },
      { kickoff: '2026-08-19T23:30:00Z', home: 'Columbus Crew', away: 'CF Montréal' },
      { kickoff: '2026-08-19T23:30:00Z', home: 'DC United', away: 'New England Revolution' },
      { kickoff: '2026-08-19T23:30:00Z', home: 'New York Red Bulls', away: 'Nashville SC' },
      { kickoff: '2026-08-19T23:30:00Z', home: 'Orlando City', away: 'Chicago Fire' },
      { kickoff: '2026-08-19T23:30:00Z', home: 'Philadelphia Union', away: 'Inter Miami' },
      { kickoff: '2026-08-19T23:30:00Z', home: 'Toronto FC', away: 'Charlotte FC' },
      { kickoff: '2026-08-20T00:00:00Z', home: 'Sporting Kansas City', away: 'St. Louis City SC' },
      { kickoff: '2026-08-20T00:30:00Z', home: 'Minnesota United', away: 'Atlanta United' },
      { kickoff: '2026-08-20T01:30:00Z', home: 'Colorado Rapids', away: 'LAFC' },
      { kickoff: '2026-08-20T01:30:00Z', home: 'Real Salt Lake', away: 'FC Dallas' },
      { kickoff: '2026-08-20T01:30:00Z', home: 'Seattle Sounders', away: 'Austin FC' },
      { kickoff: '2026-08-20T02:30:00Z', home: 'LA Galaxy', away: 'San Jose Earthquakes' },
      { kickoff: '2026-08-20T02:30:00Z', home: 'Portland Timbers', away: 'San Diego FC' },
      { kickoff: '2026-08-20T02:30:00Z', home: 'Vancouver Whitecaps', away: 'Houston Dynamo' },
    ],
  },
  'liga-mx': {
    5: [
      { kickoff: '2026-08-21T20:00:00-06:00', home: 'Puebla', away: 'Santos Laguna' },
      { kickoff: '2026-08-21T21:00:00-06:00', home: 'Juárez', away: 'Club América' },
      { kickoff: '2026-08-22T17:00:00-06:00', home: 'Querétaro', away: 'Toluca' },
      { kickoff: '2026-08-22T17:07:00-06:00', home: 'Chivas', away: 'Tijuana' },
      { kickoff: '2026-08-22T19:00:00-06:00', home: 'León', away: 'Monterrey' },
      { kickoff: '2026-08-22T20:00:00-06:00', home: 'Tigres UANL', away: 'Atlante' },
      { kickoff: '2026-08-22T20:00:00-06:00', home: 'Cruz Azul', away: 'Atlas' },
      { kickoff: '2026-08-23T17:00:00-06:00', home: 'Atlético de San Luis', away: 'Pachuca' },
      { kickoff: '2026-08-23T19:00:00-06:00', home: 'Pumas UNAM', away: 'Necaxa' },
    ],
  },
  'liga-portugal': {
    3: [
      { kickoff: '2026-08-22T14:30:00+01:00', home: 'CS Marítimo', away: 'Viseu' },
      { kickoff: '2026-08-22T17:00:00+01:00', home: 'Estoril', away: 'Rio Ave' },
      { kickoff: '2026-08-22T20:30:00+01:00', home: 'Sporting CP', away: 'Alverca' },
      { kickoff: '2026-08-23T14:30:00+01:00', home: 'Vitória Guimarães', away: 'Nacional' },
      { kickoff: '2026-08-23T17:00:00+01:00', home: 'Santa Clara', away: 'Famalicão' },
      { kickoff: '2026-08-23T19:30:00+01:00', home: 'FC Porto', away: 'Arouca' },
      { kickoff: '2026-08-24T19:15:00+01:00', home: 'Gil Vicente', away: 'Casa Pia' },
      { kickoff: '2026-09-09T19:15:00+01:00', home: 'Moreirense', away: 'Benfica' },
      { kickoff: '2026-09-10T19:15:00+01:00', home: 'Estrela Amadora', away: 'Braga' },
    ],
  },
  'saudi-pro-league': {
    2: [
      { kickoff: '2026-08-20T21:00:00+03:00', home: 'Al Fayha', away: 'Al Hilal' },
      { kickoff: '2026-08-21T19:00:00+03:00', home: 'Al Riyadh', away: 'Al Nassr' },
      { kickoff: '2026-08-21T19:15:00+03:00', home: 'Al Hazem', away: 'Diriyah FC' },
      { kickoff: '2026-08-21T21:00:00+03:00', home: 'Al Qadsiah', away: 'Al Ittihad' },
      { kickoff: '2026-08-21T21:00:00+03:00', home: 'Al Faisaly', away: 'NEOM Sports Club' },
      { kickoff: '2026-08-22T18:45:00+03:00', home: 'Al Fateh', away: 'Al Ettifaq' },
      { kickoff: '2026-08-22T19:10:00+03:00', home: 'Al Kholood', away: 'Al Taawoun' },
      { kickoff: '2026-08-22T21:00:00+03:00', home: 'Al Khaleej', away: 'Al Shabab' },
      { kickoff: '2026-08-22T21:00:00+03:00', home: 'Al Ahli', away: 'Abha' },
    ],
  },
  'brasileirao-serie-a': {
    24: [
      { kickoff: '2026-08-22T16:00:00-03:00', home: 'Fluminense', away: 'Remo' },
      { kickoff: '2026-08-22T18:30:00-03:00', home: 'Internacional', away: 'Atlético-MG' },
      { kickoff: '2026-08-22T20:30:00-03:00', home: 'Cruzeiro', away: 'Flamengo' },
      { kickoff: '2026-08-23T16:00:00-03:00', home: 'Palmeiras', away: 'Vasco da Gama' },
      { kickoff: '2026-08-23T16:00:00-03:00', home: 'Bragantino', away: 'Grêmio' },
      { kickoff: '2026-08-23T16:00:00-03:00', home: 'Vitória', away: 'Bahia' },
      { kickoff: '2026-08-23T18:30:00-03:00', home: 'Santos', away: 'Mirassol' },
      { kickoff: '2026-08-23T18:30:00-03:00', home: 'Chapecoense', away: 'São Paulo' },
      { kickoff: '2026-08-23T19:30:00-03:00', home: 'Coritiba', away: 'Corinthians' },
      { kickoff: '2026-08-24T20:00:00-03:00', home: 'Botafogo', away: 'Athletico-PR' },
    ],
  },
  'j1-league': {
    3: [
      { kickoff: '2026-08-21T19:00:00+09:00', home: 'Kashiwa Reysol', away: 'V-Varen Nagasaki' },
      { kickoff: '2026-08-22T18:00:00+09:00', home: 'Kashima Antlers', away: 'Avispa Fukuoka' },
      { kickoff: '2026-08-22T18:30:00+09:00', home: 'Okayama', away: 'Tokyo Verdy' },
      { kickoff: '2026-08-22T19:00:00+09:00', home: 'Nagoya Grampus', away: 'Gamba Osaka' },
      { kickoff: '2026-08-22T19:00:00+09:00', home: 'Kyoto Sanga', away: 'Mito HollyHock' },
      { kickoff: '2026-08-22T19:00:00+09:00', home: 'Cerezo Osaka', away: 'Shimizu S-Pulse' },
      { kickoff: '2026-08-22T19:15:00+09:00', home: 'Hiroshima Sanfrecce', away: 'Kawasaki Frontale' },
      { kickoff: '2026-08-22T19:30:00+09:00', home: 'Yokohama F. Marinos', away: 'Vissel Kobe' },
      { kickoff: '2026-08-22T19:30:00+09:00', home: 'FC Tokyo', away: 'JEF United Chiba' },
      { kickoff: '2026-08-23T19:30:00+09:00', home: 'Machida Zelvia', away: 'Urawa Red Diamonds' },
    ],
  },
  'k-league-1': {
    27: [
      { kickoff: '2026-09-05T19:00:00+09:00', home: 'FC Seoul', away: 'Incheon United', venue: 'Seoul World Cup Stadium' },
      { kickoff: '2026-09-05T19:00:00+09:00', home: 'Bucheon FC 1995', away: 'Daejeon Hana Citizen', venue: 'Bucheon Stadium' },
      { kickoff: '2026-09-05T19:00:00+09:00', home: 'Jeonbuk Hyundai Motors', away: 'Pohang Steelers', venue: 'Jeonju World Cup Stadium' },
      { kickoff: '2026-09-05T19:00:00+09:00', home: 'Jeju SK', away: 'Ulsan HD', venue: 'Jeju World Cup Stadium' },
      { kickoff: '2026-09-06T19:00:00+09:00', home: 'FC Anyang', away: 'Gangwon FC', venue: 'Anyang Stadium' },
      { kickoff: '2026-09-06T19:00:00+09:00', home: 'Gimcheon Sangmu', away: 'Gwangju FC', venue: 'Gimcheon Stadium' },
    ],
  },
  wsl: {
    1: [
      { kickoff: '2026-09-04T19:00:00+01:00', home: 'London City Lionesses', away: 'Manchester United', venue: 'Copperjax Community Stadium', broadcast: 'Sky Sports' },
      { kickoff: '2026-09-05T12:30:00+01:00', home: 'Chelsea', away: 'Aston Villa', venue: 'Stamford Bridge', broadcast: 'BBC One' },
      { kickoff: '2026-09-06T12:00:00+01:00', home: 'Tottenham Hotspur', away: 'West Ham United', venue: 'BetWright Stadium', broadcast: 'Sky Sports' },
      { kickoff: '2026-09-06T12:00:00+01:00', home: 'Brighton & Hove Albion', away: 'Arsenal', venue: 'Broadfield Stadium', broadcast: 'Sky Sports' },
      { kickoff: '2026-09-06T14:00:00+01:00', home: 'Charlton Athletic', away: 'Liverpool', venue: 'The Valley', broadcast: 'Sky Sports' },
      { kickoff: '2026-09-06T14:00:00+01:00', home: 'Crystal Palace', away: 'Everton', venue: 'VBS Community Stadium', broadcast: 'Sky Sports' },
      { kickoff: '2026-09-06T14:30:00+01:00', home: 'Manchester City', away: 'Birmingham City', venue: 'Joie Stadium', broadcast: 'Sky Sports' },
    ],
  },
}

const definitions: LeagueDefinition[] = [
  { meta: { id: 'la-liga', name: 'La Liga', shortName: 'La Liga', country: 'Spain', region: 'Europe', accent: '#f59e0b' }, seasonStart: '2026-08-15T15:30:00+02:00', teams: ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Athletic Club', 'Villarreal', 'Real Betis', 'Real Sociedad', 'Valencia', 'Sevilla', 'Celta Vigo', 'Osasuna', 'Getafe', 'Rayo Vallecano', 'Espanyol', 'Alavés', 'Levante', 'Racing Santander', 'Deportivo', 'Elche', 'Málaga'], qualification: baseEuropeanQualification(20, 'Provisional UEFA bands; Copa del Rey and coefficient-driven reallocations can change the final places.'), matchweeks: verifiedMatchweeks['la-liga'] },
  { meta: { id: 'bundesliga', name: 'Bundesliga', shortName: 'Bundesliga', country: 'Germany', region: 'Europe', accent: '#d20515' }, seasonStart: '2026-08-28T18:30:00Z', teams: ['Bayern Munich', 'VfB Stuttgart', 'RB Leipzig', 'Borussia Mönchengladbach', 'Mainz 05', 'Paderborn', 'Union Berlin', 'Eintracht Frankfurt', 'Cologne', 'Hoffenheim', 'Elversberg', 'Bayer Leverkusen', 'Borussia Dortmund', 'Hamburg', 'SC Freiburg', 'Werder Bremen', 'Augsburg', 'Schalke'], qualification: baseEuropeanQualification(18, 'Provisional UEFA bands; the DFB-Pokal winner and coefficient-driven places can change the final allocation.'), matchweek1: [
    { kickoff: '2026-08-28T18:30:00Z', home: 'Bayern Munich', away: 'VfB Stuttgart' },
    { kickoff: '2026-08-29T13:30:00Z', home: 'RB Leipzig', away: 'Borussia Mönchengladbach' },
    { kickoff: '2026-08-29T13:30:00Z', home: 'Mainz 05', away: 'Paderborn' },
    { kickoff: '2026-08-29T13:30:00Z', home: 'Cologne', away: 'Hoffenheim' },
    { kickoff: '2026-08-29T13:30:00Z', home: 'Union Berlin', away: 'Eintracht Frankfurt' },
    { kickoff: '2026-08-29T13:30:00Z', home: 'Elversberg', away: 'Bayer Leverkusen' },
    { kickoff: '2026-08-29T14:30:00Z', home: 'Borussia Dortmund', away: 'Hamburg' },
    { kickoff: '2026-08-30T11:30:00Z', home: 'SC Freiburg', away: 'Werder Bremen' },
    { kickoff: '2026-08-30T13:30:00Z', home: 'Augsburg', away: 'Schalke' },
  ] },
  { meta: { id: 'serie-a', name: 'Serie A', shortName: 'Serie A', country: 'Italy', region: 'Europe', accent: '#1683c8' }, seasonStart: '2026-08-22T16:30:00+02:00', teams: ['Atalanta', 'Bologna', 'Cagliari', 'Como', 'Fiorentina', 'Frosinone', 'Genoa', 'Internazionale', 'Juventus', 'Lazio', 'Lecce', 'Milan', 'Monza', 'Napoli', 'Parma', 'Roma', 'Sassuolo', 'Torino', 'Udinese', 'Venezia'], qualification: baseEuropeanQualification(20, 'Provisional UEFA bands; Coppa Italia and coefficient-driven reallocations can change the final places.'), matchweeks: verifiedMatchweeks['serie-a'] },
  { meta: { id: 'ligue-1', name: 'Ligue 1', shortName: 'Ligue 1', country: 'France', region: 'Europe', accent: '#1d4ed8' }, seasonStart: '2026-08-21T20:45:00+02:00', teams: ['Paris Saint-Germain', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Nice', 'Rennes', 'Lens', 'Strasbourg', 'Toulouse', 'Brest', 'Auxerre', 'Lorient', 'Le Havre', 'Le Mans', 'Troyes', 'Paris FC', 'Angers'], qualification: baseEuropeanQualification(18, 'Provisional UEFA bands; Coupe de France and coefficient-driven reallocations can change the final places.'), matchweeks: verifiedMatchweeks['ligue-1'] },
  { meta: { id: 'mls', name: 'Major League Soccer', shortName: 'MLS', country: 'United States / Canada', region: 'North America', accent: '#0b4ea2' }, seasonStart: '2026-08-19T23:30:00Z', teams: ['Nashville SC', 'Inter Miami', 'Chicago Fire', 'New England Revolution', 'Charlotte FC', 'FC Cincinnati', 'New York City FC', 'New York Red Bulls', 'DC United', 'Orlando City', 'Columbus Crew', 'Toronto FC', 'Philadelphia Union', 'CF Montréal', 'Atlanta United', 'Vancouver Whitecaps', 'Houston Dynamo', 'LAFC', 'San Jose Earthquakes', 'FC Dallas', 'St. Louis City SC', 'Real Salt Lake', 'Colorado Rapids', 'Minnesota United', 'Portland Timbers', 'Seattle Sounders', 'San Diego FC', 'LA Galaxy', 'Austin FC', 'Sporting Kansas City'], qualification: qualification([band('continental', 'CONCACAF Champions Cup', 1, 4, 'continental')], 'MLS qualification is determined through the league, MLS Cup, Supporters’ Shield, conference standings, and domestic cup routes.'), matchweeks: verifiedMatchweeks.mls },
  { meta: { id: 'liga-mx', name: 'Liga MX', shortName: 'Liga MX', country: 'Mexico', region: 'North America', accent: '#006847' }, seasonStart: '2026-08-21T20:00:00-06:00', teams: ['Club América', 'Tijuana', 'Monterrey', 'Atlas', 'Toluca', 'Pumas UNAM', 'Puebla', 'Querétaro', 'Chivas', 'Cruz Azul', 'León', 'Necaxa', 'Atlante', 'Pachuca', 'Atlético de San Luis', 'Tigres UANL', 'Santos Laguna', 'Juárez'], qualification: qualification([band('continental', 'CONCACAF Champions Cup', 1, 4, 'continental')], 'CONCACAF qualification uses Liga MX league and tournament results, including the Leagues Cup and domestic cup routes.'), matchweeks: verifiedMatchweeks['liga-mx'] },
  { meta: { id: 'liga-portugal', name: 'Liga Portugal', shortName: 'Liga Portugal', country: 'Portugal', region: 'Europe', accent: '#16a34a' }, seasonStart: '2026-08-08T17:00:00+01:00', teams: ['Arouca', 'FC Porto', 'CS Marítimo', 'Benfica', 'Nacional', 'Sporting CP', 'Santa Clara', 'Gil Vicente', 'Estrela Amadora', 'Braga', 'Famalicão', 'Viseu', 'Alverca', 'Estoril', 'Moreirense', 'Vitória Guimarães', 'Rio Ave', 'Casa Pia'], qualification: baseEuropeanQualification(18, 'Provisional UEFA bands; Taça de Portugal and coefficient-driven reallocations can change the final places.'), matchweeks: verifiedMatchweeks['liga-portugal'] },
  { meta: { id: 'saudi-pro-league', name: 'Saudi Pro League', shortName: 'Saudi Pro League', country: 'Saudi Arabia', region: 'Asia', accent: '#0b8f55' }, seasonStart: '2026-08-20T19:00:00+03:00', teams: ['Al Hilal', 'Al Nassr', 'Al Ittihad', 'Al Ahli', 'Al Shabab', 'Al Ettifaq', 'Al Qadsiah', 'Al Fateh', 'Al Taawoun', 'Al Khaleej', 'NEOM Sports Club', 'Al Hazem', 'Al Fayha', 'Al Kholood', 'Al Riyadh', 'Abha', 'Al Faisaly', 'Diriyah FC'], qualification: qualification([band('continental', 'AFC Champions League', 1, 3, 'continental'), band('relegation', 'Relegation', 16, 18, 'relegation')], 'AFC access-list rules and domestic cup results determine the final Asian competition places.'), matchweeks: verifiedMatchweeks['saudi-pro-league'] },
  { meta: { id: 'brasileirao-serie-a', name: 'Campeonato Brasileiro Série A', shortName: 'Brasileirão', country: 'Brazil', region: 'South America', accent: '#009c3b' }, seasonStart: '2026-08-22T16:00:00-03:00', teams: ['Palmeiras', 'Flamengo', 'Athletico-PR', 'Fluminense', 'Cruzeiro', 'Bahia', 'Bragantino', 'Atlético-MG', 'Corinthians', 'Coritiba', 'Botafogo', 'Vitória', 'São Paulo', 'Santos', 'Grêmio', 'Internacional', 'Mirassol', 'Remo', 'Vasco da Gama', 'Chapecoense'], qualification: qualification([band('continental', 'Copa Libertadores', 1, 6, 'continental'), band('europa', 'Copa Sudamericana', 7, 12, 'europa'), band('relegation', 'Relegation', 17, 20, 'relegation')], 'CONMEBOL qualification depends on league position and Copa do Brasil results, with places reallocated when clubs qualify by more than one route.'), matchweeks: verifiedMatchweeks['brasileirao-serie-a'] },
  { meta: { id: 'j1-league', name: 'J1 League', shortName: 'J1 League', country: 'Japan', region: 'Asia', accent: '#e60012' }, seasonStart: '2026-08-21T19:00:00+09:00', teams: ['Machida Zelvia', 'Hiroshima Sanfrecce', 'Kashiwa Reysol', 'Kashima Antlers', 'Gamba Osaka', 'Vissel Kobe', 'Avispa Fukuoka', 'Yokohama F. Marinos', 'Okayama', 'V-Varen Nagasaki', 'Shimizu S-Pulse', 'Cerezo Osaka', 'Kawasaki Frontale', 'Kyoto Sanga', 'Mito HollyHock', 'Tokyo Verdy', 'FC Tokyo', 'Nagoya Grampus', 'Urawa Red Diamonds', 'JEF United Chiba'], qualification: qualification([band('continental', 'AFC Champions League', 1, 3, 'continental'), band('relegation', 'Relegation', 18, 20, 'relegation')], 'AFC access-list rules and the Emperor’s Cup determine Japan’s continental places.'), matchweeks: verifiedMatchweeks['j1-league'] },
  { meta: { id: 'eredivisie', name: 'Eredivisie', shortName: 'Eredivisie', country: 'Netherlands', region: 'Europe', accent: '#f97316' }, seasonStart: '2026-08-07T18:00:00Z', teams: ['AZ Alkmaar', 'Groningen', 'Go Ahead', 'Sittard', 'Ajax', 'PSV Eindhoven', 'Feyenoord', 'Heerenveen', 'Excelsior', 'NEC Nijmegen', 'Sparta', 'FC Twente', 'Telstar', 'FC Utrecht', 'PEC Zwolle', 'ADO Den Haag', 'Willem II', 'Cambuur'], qualification: baseEuropeanQualification(18, 'Provisional UEFA bands; the KNVB Cup and coefficient-driven access list can change the final places.'), matchweeks: {
    3: [
      { kickoff: '2026-08-22T16:30:00+02:00', home: 'Sittard', away: 'AZ Alkmaar' },
      { kickoff: '2026-08-22T18:45:00+02:00', home: 'Sparta', away: 'FC Utrecht' },
      { kickoff: '2026-08-22T20:00:00+02:00', home: 'NEC Nijmegen', away: 'Excelsior' },
      { kickoff: '2026-08-22T21:00:00+02:00', home: 'Heerenveen', away: 'PEC Zwolle' },
      { kickoff: '2026-08-23T12:15:00+02:00', home: 'Go Ahead', away: 'ADO Den Haag' },
      { kickoff: '2026-08-23T14:30:00+02:00', home: 'PSV Eindhoven', away: 'Groningen' },
      { kickoff: '2026-08-23T16:45:00+02:00', home: 'Cambuur', away: 'Feyenoord' },
      { kickoff: '2026-09-09T16:45:00+02:00', home: 'FC Twente', away: 'Telstar' },
      { kickoff: '2026-09-15T18:00:00+02:00', home: 'Ajax', away: 'Willem II' },
    ],
  } },
  { meta: { id: 'k-league-1', name: 'K League 1', shortName: 'K League 1', country: 'South Korea', region: 'Asia', accent: '#005baa' }, seasonStart: '2026-08-22T19:30:00+09:00', teams: ['FC Seoul', 'Ulsan HD', 'Gangwon FC', 'Jeonbuk Hyundai Motors', 'Jeju SK', 'Pohang Steelers', 'FC Anyang', 'Incheon United', 'Bucheon FC 1995', 'Daejeon Hana Citizen', 'Gimcheon Sangmu', 'Gwangju FC'], qualification: qualification([band('continental', 'AFC Champions League', 1, 3, 'continental'), band('relegation', 'Relegation', 10, 12, 'relegation')], 'AFC access-list rules and the Korean FA Cup determine South Korea’s continental places.'), matchweeks: verifiedMatchweeks['k-league-1'] },
  { meta: { id: 'nwsl', name: "National Women's Soccer League", shortName: 'NWSL', country: 'United States', region: 'North America', accent: '#e86a2b' }, seasonStart: '2026-03-14T00:00:00Z', teams: ['Angel City FC', 'Bay FC', 'Boston Legacy FC', 'Chicago Stars FC', 'Denver Summit FC', 'Gotham FC', 'Houston Dash', 'Kansas City Current', 'North Carolina Courage', 'Orlando Pride', 'Portland Thorns FC', 'Racing Louisville FC', 'San Diego Wave FC', 'Seattle Reign FC', 'Utah Royals', 'Washington Spirit'], qualification: qualification([band('playoffs', 'NWSL Playoffs', 1, 8, 'continental')], 'The top eight teams qualify for the NWSL playoffs.'), matchweeks: nwslMatchweeks },
  { meta: { id: 'wsl', name: "Women's Super League", shortName: 'WSL', country: 'England', region: 'Europe', accent: '#e90052' }, seasonStart: '2026-09-04T19:00:00+01:00', teams: ['Arsenal', 'Aston Villa', 'Birmingham City', 'Brighton & Hove Albion', 'Charlton Athletic', 'Chelsea', 'Crystal Palace', 'Everton', 'Liverpool', 'London City Lionesses', 'Manchester City', 'Manchester United', 'Tottenham Hotspur', 'West Ham United'], qualification: qualification([band('champions', 'Champions League', 1, 3, 'champions'), band('relegation', 'Relegation', 14, 14, 'relegation')], 'UEFA access and domestic cup outcomes can change the final allocation; the bottom club is relegated to BWSL2.'), matchweeks: verifiedMatchweeks.wsl },
  { meta: { id: 'uefa-nations-league', name: 'UEFA Nations League', shortName: 'Nations League', country: 'Europe', region: 'Europe', accent: '#003399' }, seasonStart: '2026-09-24T16:00:00Z', teams: ['Belgium', 'France', 'Croatia', 'Sweden', 'Spain', 'England', 'Serbia', 'Switzerland', 'Iceland', 'Denmark', 'Poland', 'Germany', 'Portugal', 'Wales', 'Italy', 'Hungary', 'Czechia', 'Northern Ireland', 'Ukraine', 'Slovakia', 'Romania', 'Austria', 'Rep. Of Ireland', 'Türkiye', 'Albania', 'Norway', 'Slovenia', 'Latvia', 'Gibraltar', 'Armenia', 'Kazakhstan', 'Azerbaijan', 'Lithuania', 'Faroe Islands', 'Finland', 'Belarus', 'Estonia', 'Luxembourg', 'Bulgaria', 'Georgia', 'FYR Macedonia', 'Cyprus', 'Liechtenstein', 'Scotland', 'Montenegro', 'Andorra', 'Kosovo', 'Malta', 'Bosnia & Herzegovina', 'Moldova', 'San Marino', 'Israel', 'Greece', 'Netherlands'], qualification: qualification([], 'UEFA Nations League promotion, relegation, and finals places are determined within each league and group.'), matchweeks: {} },
]

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function abbreviation(value: string) {
  const words = value.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.map((word) => word[0]).join('').slice(0, 3).toUpperCase()
}

const clubLogoAliases: Record<string, string> = {
  'Racing Santander': 'Racing de Santander',
  Deportivo: 'RC Deportivo',
  Atalanta: 'Atalanta Bergamo',
  Bologna: 'Bologna FC 1909',
  Como: 'Calcio Como 1907',
  Genoa: 'Genoa CFC',
  Internazionale: 'Inter Milan',
  Lazio: 'SS Lazio',
  Lecce: 'US Lecce',
  Monza: 'AC Monza Brianza',
  Napoli: 'SSC Napoli',
  Parma: 'Parma Calcio 1913',
  Roma: 'AS Roma',
  Sassuolo: 'US Sassuolo Calcio',
  Marseille: 'Olympique de Marseille',
  Lyon: 'Olympique Lyonnais',
  Monaco: 'AS Monaco',
  Lille: 'LOSC Lille',
  Nice: 'OGC Nice',
  Rennes: 'FC Stade Rennes',
  Lens: 'RC Lens',
  Brest: 'Stade Brestois 29',
  Angers: 'SCO Angers',
  'Minnesota United': 'Minnesota United FC',
  Toluca: 'Deportivo Toluca',
  Sparta: 'Sparta Rotterdam',
  'Willem II': 'Jong Willem II Tilburg',
  'NEOM Sports Club': 'NEOM SC',
  'Al Faisaly': 'Al Faysaly',
  Barcelona: 'FC Barcelona',
  'Atlético Madrid': 'Atlético de Madrid',
  Villarreal: 'Villarreal CF',
  Valencia: 'Valencia CF',
  Sevilla: 'Sevilla FC',
  'Celta Vigo': 'Celta de Vigo',
  Getafe: 'Getafe CF',
  Espanyol: 'RCD Espanyol',
  Levante: 'Levante UD',
  'Bayern Munich': 'Bayern München',
  'Mainz 05': '1. FSV Mainz 05',
  'Werder Bremen': 'SV Werder Bremen',
  Wolfsburg: 'VfL Wolfsburg',
  Augsburg: 'FC Augsburg',
  'Union Berlin': '1. FC Union Berlin',
  'St. Pauli': 'St Pauli',
  'Bayer Leverkusen': 'Bayer 04 Leverkusen',
  'SC Freiburg': 'Freiburg',
  'Athletico-PR': 'Athletico Paranaense',
  'Atlético-MG': 'Atlético Mineiro',
  'Vasco da Gama': 'Vasco Da Gama',
  Chapecoense: 'Chapecoense B',
  'Urawa Red Diamonds': 'Urawa Red Diamonds',
  'Yokohama F. Marinos': 'Yokohama F. Marinos',
  'Avispa Fukuoka': 'Fukuoka',
  'Kyoto Sanga': 'Kyoto',
  Sittard: 'Fortuna Sittard',
  'Go Ahead': 'Go Ahead Eagles',
  Telstar: 'SC Telstar',
  Cambuur: 'Cambuur Leeuwarden',
  'NEC Nijmegen': 'N.E.C. Nijmegen',
  'Estrela Amadora': 'Estrela da Amadora',
  Benfica: 'SL Benfica',
  'Sporting CP': 'Sporting Lisbon',
  Braga: 'SC  Braga',
  'Gil Vicente': 'Gil Vicente FC',
  Nacional: 'CD Nacional',
  'Jeonbuk Hyundai Motors': 'Jeonbuk Motors',
  'Gimcheon Sangmu': 'Sangju Sangmu',
  Paderborn: 'SC Paderborn 07',
  Hamburg: 'Hamburger SV',
  Cologne: '1. FC Köln',
  Hoffenheim: 'TSG 1899 Hoffenheim',
  Elversberg: 'SV 07 Elversberg',
  Schalke: 'FC Schalke 04',
  'LAFC': 'Los Angeles FC',
  'LA Galaxy': 'Los Angeles Galaxy',
  'Orlando City': 'Orlando City Soccer Club',
  'Houston Dynamo': 'Houston Dynamo FC',
  'Sporting Kansas City': 'Sporting KC',
  'CF Montréal': 'CF Montréal',
  Tijuana: 'Xolos de Tijuana',
  Atlas: 'Atlas Guadalajara',
  Chivas: 'Guadalajara Chivas',
  Monterrey: 'Rayados de Monterrey ',
  'Tigres UANL': 'U.A.N.L. - Tigres',
  'Atlético de San Luis': 'Atlético San Luis',
  Juárez: 'FC Juarez',
  'Club América': 'Club América',
  'Pumas UNAM': 'Pumas UNAM',
  'Querétaro': 'Queretaro FC',
  'PSV Eindhoven': 'PSV Eindhoven',
  Ajax: 'Ajax Amsterdam',
  Groningen: 'FC Groningen',
  Heerenveen: 'SC Heerenveen',
  Excelsior: 'SBV Excelsior',
  'Casa Pia': 'Casa Pia AC',
  'Al Hilal': 'Al Hilal Riyadh',
  'Al Nassr': 'Al Nassr FC Riyadh',
  'Al Ittihad': 'Al-Ittihad Club',
  'Al Ahli': 'Al Ahli Jeddah',
  'Al Shabab': 'Al Shabab Riyadh',
  'Al Ettifaq': 'Al Ettifaq FC',
  'Al Fateh': 'Al Fateh SC',
  'Al Qadsiah': 'Al Qadisiyah',
  Damac: 'Damac',
  'Al Riyadh': 'Al Riyadh SC',
  'Al Hazem': 'Al Hazm FC',
  'Al Kholood': 'Al-Kholood',
  'Al Taawoun': 'Al Taawoun',
  'Al Khaleej': 'Al Khaleej Club',
  'Red Bull Bragantino': 'Bragantino',
  'Athletico Paranaense': 'Athletico Paranaense',
  'Sanfrecce Hiroshima': 'Hiroshima Sanfrecce',
  'Mito HollyHock': 'Mito Hollyhock',
  'Ulsan HD': 'Ulsan Hyundai',
}

function normalizeClubLogoName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter((token) => !['fc', 'cf', 'sc', 'ac', 'club', 'soccer', 'calcio'].includes(token)).join(' ')
}

function fallbackClubLogo(color: string, code: string) {
  const label = code.slice(0, 3)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 72"><path d="M6 6h52v33c0 14-11 24-26 28C17 63 6 53 6 39V6Z" fill="${color}" stroke="#ffffff" stroke-width="3"/><text x="32" y="40" fill="#ffffff" font-family="Arial,sans-serif" font-size="16" font-weight="700" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function teamLogoUrl(name: string, color: string, code: string) {
  const sourceName = clubLogoAliases[name] ?? name
  const normalized = normalizeClubLogoName(sourceName)
  const matchedName = Object.keys(clubLogoSources).find((candidate) => normalizeClubLogoName(candidate) === normalized)
  return matchedName ? clubLogoSources[matchedName] : fallbackClubLogo(color, code)
}

function emptyRecord(): TeamRecord {
  return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }
}

function record(played: number, wins: number, draws: number, losses: number, goalsFor: number, goalsAgainst: number, points: number): TeamRecord {
  return { played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference: goalsFor - goalsAgainst, points }
}

const currentStandings: Record<string, Record<string, TeamRecord>> = {
  nwsl: {
    "Gotham FC": record(20, 13, 4, 3, 26, 13, 43),
    "Washington Spirit": record(20, 11, 4, 5, 30, 18, 37),
    "Utah Royals": record(20, 11, 3, 6, 35, 23, 36),
    "Portland Thorns FC": record(20, 10, 4, 6, 34, 29, 34),
    "San Diego Wave FC": record(20, 10, 3, 7, 25, 21, 33),
    "North Carolina Courage": record(19, 9, 3, 7, 34, 29, 30),
    "Kansas City Current": record(20, 9, 3, 8, 31, 28, 30),
    "Seattle Reign FC": record(18, 8, 3, 7, 23, 23, 27),
    "Angel City FC": record(18, 7, 4, 7, 27, 20, 25),
    "Denver Summit FC": record(19, 6, 6, 7, 25, 25, 24),
    "Houston Dash": record(19, 6, 5, 8, 23, 28, 23),
    "Orlando Pride": record(20, 7, 2, 11, 24, 31, 23),
    "Racing Louisville FC": record(19, 6, 2, 11, 28, 36, 20),
    "Boston Legacy FC": record(20, 5, 5, 10, 23, 32, 20),
    "Bay FC": record(19, 5, 4, 10, 20, 27, 19),
    "Chicago Stars FC": record(19, 4, 1, 14, 9, 34, 13),
  },
  mls: {
    'Nashville SC': record(19, 13, 4, 2, 39, 15, 43),
    'Inter Miami': record(19, 11, 5, 3, 46, 36, 38),
    'Chicago Fire': record(18, 10, 2, 6, 34, 24, 32),
    'New England Revolution': record(19, 9, 3, 7, 29, 25, 30),
    'Charlotte FC': record(19, 8, 4, 7, 32, 28, 28),
    'FC Cincinnati': record(19, 7, 6, 6, 46, 45, 27),
    'New York City FC': record(19, 7, 5, 7, 33, 27, 26),
    'New York Red Bulls': record(19, 7, 4, 8, 30, 41, 25),
    'DC United': record(19, 5, 9, 5, 27, 30, 24),
    'Orlando City': record(19, 6, 3, 10, 31, 48, 21),
    'Columbus Crew': record(19, 5, 5, 9, 27, 31, 20),
    'Toronto FC': record(19, 4, 8, 7, 26, 33, 20),
    'Philadelphia Union': record(19, 5, 4, 10, 28, 35, 19),
    'CF Montréal': record(19, 4, 5, 10, 25, 36, 17),
    'Atlanta United': record(19, 4, 3, 12, 21, 34, 15),
    'Vancouver Whitecaps': record(18, 11, 4, 3, 40, 17, 37),
    'Houston Dynamo': record(19, 11, 2, 6, 28, 24, 35),
    'LAFC': record(20, 10, 4, 6, 35, 20, 34),
    'San Jose Earthquakes': record(19, 10, 3, 6, 38, 27, 33),
    'FC Dallas': record(19, 8, 6, 5, 34, 26, 30),
    'St. Louis City SC': record(19, 8, 5, 6, 27, 25, 29),
    'Real Salt Lake': record(18, 8, 4, 6, 30, 26, 28),
    'Colorado Rapids': record(19, 8, 1, 10, 29, 25, 25),
    'Minnesota United': record(19, 6, 7, 6, 21, 26, 25),
    'Portland Timbers': record(19, 7, 3, 9, 34, 35, 24),
    'Seattle Sounders': record(18, 7, 3, 8, 20, 24, 24),
    'San Diego FC': record(19, 6, 6, 7, 33, 29, 24),
    'LA Galaxy': record(20, 5, 7, 8, 24, 30, 22),
    'Austin FC': record(19, 4, 5, 10, 23, 38, 17),
    'Sporting Kansas City': record(19, 4, 2, 13, 18, 48, 14),
  },
  'liga-mx': {
    'Club América': record(4, 3, 1, 0, 8, 1, 10),
    Tijuana: record(4, 3, 1, 0, 6, 2, 10),
    Monterrey: record(4, 3, 0, 1, 12, 5, 9),
    Atlas: record(4, 3, 0, 1, 6, 5, 9),
    Toluca: record(4, 2, 1, 1, 6, 3, 7),
    'Pumas UNAM': record(4, 2, 1, 1, 7, 5, 7),
    Puebla: record(4, 2, 1, 1, 6, 5, 7),
    Querétaro: record(4, 2, 1, 1, 5, 4, 7),
    Chivas: record(4, 2, 1, 1, 3, 3, 7),
    'Cruz Azul': record(4, 2, 0, 2, 8, 8, 6),
    'León': record(4, 2, 0, 2, 5, 5, 6),
    Necaxa: record(4, 2, 0, 2, 6, 7, 6),
    Atlante: record(4, 1, 2, 1, 5, 5, 5),
    Pachuca: record(4, 1, 0, 3, 6, 6, 3),
    'Atlético de San Luis': record(4, 0, 2, 2, 4, 8, 2),
    'Tigres UANL': record(4, 0, 1, 3, 6, 10, 1),
    'Santos Laguna': record(4, 0, 0, 4, 2, 8, 0),
    Juárez: record(4, 0, 0, 4, 2, 13, 0),
  },
  'k-league-1': {
    'FC Seoul': record(26, 17, 5, 4, 49, 20, 56),
    'Ulsan HD': record(26, 12, 4, 10, 41, 37, 40),
    'Jeonbuk Hyundai Motors': record(26, 10, 9, 7, 31, 22, 39),
    'Jeju SK': record(26, 10, 8, 8, 29, 26, 38),
    'Gangwon FC': record(25, 9, 10, 6, 30, 24, 37),
    'Pohang Steelers': record(26, 10, 5, 11, 24, 29, 35),
    'FC Anyang': record(26, 8, 10, 8, 33, 39, 34),
    'Incheon United': record(25, 9, 7, 9, 31, 27, 34),
    'Daejeon Hana Citizen': record(26, 8, 8, 10, 34, 30, 32),
    'Bucheon FC 1995': record(26, 7, 10, 9, 28, 29, 31),
    'Gimcheon Sangmu': record(26, 4, 15, 7, 24, 32, 27),
    'Gwangju FC': record(26, 1, 9, 16, 15, 54, 12),
  },
  'j1-league': {
    'Machida Zelvia': record(2, 2, 0, 0, 9, 1, 6),
    'Hiroshima Sanfrecce': record(2, 2, 0, 0, 7, 1, 6),
    'Kashiwa Reysol': record(2, 2, 0, 0, 5, 2, 6),
    'Kashima Antlers': record(2, 2, 0, 0, 6, 4, 6),
    'Gamba Osaka': record(2, 1, 1, 0, 5, 4, 4),
    'Vissel Kobe': record(2, 1, 1, 0, 3, 2, 4),
    'Avispa Fukuoka': record(2, 1, 0, 1, 3, 1, 3),
    'Yokohama F. Marinos': record(2, 1, 0, 1, 4, 4, 3),
    Okayama: record(2, 1, 0, 1, 2, 2, 3),
    'V-Varen Nagasaki': record(2, 1, 0, 1, 2, 2, 3),
    'Shimizu S-Pulse': record(2, 1, 0, 1, 1, 1, 3),
    'Cerezo Osaka': record(2, 1, 0, 1, 2, 4, 3),
    'Kawasaki Frontale': record(2, 0, 2, 0, 3, 3, 2),
    'Kyoto Sanga': record(2, 0, 1, 1, 3, 4, 1),
    'Mito HollyHock': record(2, 0, 1, 1, 2, 3, 1),
    'Tokyo Verdy': record(2, 0, 1, 1, 2, 4, 1),
    'FC Tokyo': record(2, 0, 1, 1, 3, 7, 1),
    'Nagoya Grampus': record(2, 0, 0, 2, 1, 3, 0),
    'Urawa Red Diamonds': record(2, 0, 0, 2, 4, 8, 0),
    'JEF United Chiba': record(2, 0, 0, 2, 0, 7, 0),
  },
  'brasileirao-serie-a': {
    Palmeiras: record(23, 14, 6, 3, 40, 19, 48),
    Flamengo: record(22, 13, 6, 3, 44, 19, 45),
    'Athletico-PR': record(23, 12, 5, 6, 31, 20, 41),
    Fluminense: record(23, 10, 8, 5, 34, 28, 38),
    Cruzeiro: record(23, 10, 6, 7, 32, 32, 36),
    Bahia: record(23, 8, 10, 5, 32, 28, 34),
    Bragantino: record(22, 9, 5, 8, 27, 23, 32),
    'Atlético-MG': record(22, 9, 5, 8, 30, 27, 32),
    Corinthians: record(23, 8, 8, 7, 25, 22, 32),
    Coritiba: record(23, 8, 7, 8, 28, 30, 31),
    Botafogo: record(22, 8, 6, 8, 35, 34, 30),
    Vitória: record(23, 8, 5, 10, 23, 33, 29),
    'São Paulo': record(22, 7, 6, 9, 27, 26, 27),
    Santos: record(22, 6, 7, 9, 32, 35, 25),
    'Grêmio': record(22, 6, 7, 9, 24, 30, 25),
    Internacional: record(23, 5, 9, 9, 24, 28, 24),
    Mirassol: record(22, 6, 5, 11, 25, 35, 23),
    Remo: record(23, 5, 8, 10, 27, 37, 23),
    'Vasco da Gama': record(22, 5, 7, 10, 23, 34, 22),
    Chapecoense: record(22, 1, 8, 13, 23, 46, 11),
  },
  'liga-portugal': {
    Arouca: record(2, 2, 0, 0, 5, 0, 6),
    'FC Porto': record(2, 2, 0, 0, 4, 0, 6),
    'CS Marítimo': record(2, 2, 0, 0, 3, 1, 6),
    Benfica: record(2, 1, 1, 0, 9, 2, 4),
    Nacional: record(2, 1, 1, 0, 4, 2, 4),
    'Sporting CP': record(2, 1, 1, 0, 5, 4, 4),
    'Santa Clara': record(2, 1, 1, 0, 3, 2, 4),
    'Gil Vicente': record(1, 1, 0, 0, 1, 0, 3),
    'Estrela Amadora': record(2, 0, 2, 0, 4, 4, 2),
    Braga: record(1, 0, 1, 0, 2, 2, 1),
    'Famalicão': record(2, 0, 1, 1, 2, 3, 1),
    Viseu: record(2, 0, 1, 1, 2, 3, 1),
    Alverca: record(2, 0, 1, 1, 2, 4, 1),
    Estoril: record(2, 0, 1, 1, 1, 3, 1),
    Moreirense: record(2, 0, 1, 1, 2, 6, 1),
    'Vitória Guimarães': record(2, 0, 0, 2, 2, 4, 0),
    'Rio Ave': record(2, 0, 0, 2, 0, 3, 0),
    'Casa Pia': record(2, 0, 0, 2, 0, 8, 0),
  },
  eredivisie: {
    'AZ Alkmaar': record(2, 2, 0, 0, 6, 1, 6),
    Groningen: record(2, 2, 0, 0, 6, 2, 6),
    'Go Ahead': record(2, 1, 1, 0, 6, 3, 4),
    Sittard: record(2, 1, 1, 0, 5, 3, 4),
    Ajax: record(2, 1, 1, 0, 4, 2, 4),
    'PSV Eindhoven': record(2, 1, 1, 0, 4, 3, 4),
    Feyenoord: record(2, 1, 1, 0, 3, 2, 4),
    Heerenveen: record(2, 1, 1, 0, 3, 2, 4),
    Excelsior: record(2, 1, 0, 1, 5, 2, 3),
    'NEC Nijmegen': record(2, 1, 0, 1, 5, 3, 3),
    Sparta: record(2, 1, 0, 1, 3, 2, 3),
    'FC Twente': record(2, 1, 0, 1, 3, 2, 3),
    Telstar: record(2, 1, 0, 1, 3, 4, 3),
    'FC Utrecht': record(2, 0, 0, 2, 2, 6, 0),
    'PEC Zwolle': record(2, 0, 0, 2, 1, 5, 0),
    'ADO Den Haag': record(2, 0, 0, 2, 1, 6, 0),
    'Willem II': record(2, 0, 0, 2, 2, 8, 0),
    Cambuur: record(2, 0, 0, 2, 1, 7, 0),
  },
}

function buildTeams(definition: LeagueDefinition) {
  return definition.teams.map((name, index): Team => {
    const color = clubColors[index % clubColors.length]
    const code = abbreviation(name)
    return {
    id: `${definition.meta.id}-${slugify(name)}`,
    name,
    shortName: name,
    abbreviation: code,
    logoUrl: teamLogoUrl(name, color, code),
    color,
    record: currentStandings[definition.meta.id]?.[name] ?? emptyRecord(),
    form: [],
    }
  })
}

function getUpcomingStart(plannedStart: string) {
  const plannedStartMs = Date.parse(plannedStart)
  const nextWindow = new Date()
  nextWindow.setHours(12, 0, 0, 0)
  if (nextWindow.getTime() <= Date.now()) nextWindow.setDate(nextWindow.getDate() + 1)
  return new Date(Math.max(plannedStartMs, nextWindow.getTime())).toISOString()
}

function buildMatches(definition: LeagueDefinition, teams: Team[], seasonStart: string): UpcomingMatch[] {
  const scheduledMatchweeks = definition.matchweeks ?? (definition.matchweek1 ? { 1: definition.matchweek1 } : undefined)
  if (scheduledMatchweeks) {
    const teamsByName = new Map(teams.map((team) => [team.name, team]))
    return Object.entries(scheduledMatchweeks).flatMap(([week, seeds]) => seeds.flatMap((seed, index) => {
      const home = teamsByName.get(seed.home)
      const away = teamsByName.get(seed.away)
      if (!home || !away) return []
      const hasScore = typeof seed.homeScore === 'number' && typeof seed.awayScore === 'number'
      return [{ id: `${definition.meta.id}-week-${week}-${index + 1}`, kickoff: seed.kickoff, competitionStage: `Matchweek ${week}`, venue: seed.venue ?? 'Venue TBA', venueTimeZone: getVenueTimeZone(definition.meta.id, seed.home), broadcast: seed.broadcast ?? 'U.S. coverage TBD', home: { teamId: home.id, ...(hasScore ? { score: seed.homeScore } : {}) }, away: { teamId: away.id, ...(hasScore ? { score: seed.awayScore } : {}) }, status: hasScore ? 'final' as const : 'upcoming' as const }]
    }))
  }
  const kickoffStart = Date.parse(seasonStart)
  const matches: UpcomingMatch[] = []
  for (let index = 0; index < Math.floor(teams.length / 2); index += 1) {
    const home = teams[index * 2]
    const away = teams[index * 2 + 1]
    matches.push({ id: `${definition.meta.id}-opening-${index + 1}`, kickoff: new Date(kickoffStart + index * 86_400_000).toISOString(), competitionStage: 'Matchweek 1', venue: 'Venue TBA', venueTimeZone: getVenueTimeZone(definition.meta.id, home.name), broadcast: 'U.S. coverage TBD', home: { teamId: home.id }, away: { teamId: away.id }, status: 'upcoming' })
  }
  return matches
}

function buildDashboard(definition: LeagueDefinition): DashboardData {
  const teams = buildTeams(definition)
  const seasonStart = getUpcomingStart(definition.seasonStart)
  return {
    league: withLeagueLogo(definition.meta),
    provider: { mode: 'sample', name: `${definition.meta.shortName} sample`, lastUpdated: new Date().toISOString(), message: `Sample ${definition.meta.name} data is loaded. League records and U.S. coverage will update when a live feed is connected.` },
    competition: definition.meta.name,
    season: '2026/27',
    seasonStart,
    broadcastSourceUrl: '',
    qualification: definition.qualification,
    teams,
    matches: buildMatches(definition, teams, seasonStart),
  }
}

const generatedDashboards = new Map(definitions.map((definition) => [definition.meta.id, buildDashboard(definition)]))

export const leagueCatalog: LeagueMeta[] = [sampleDashboard.league, ...definitions.map((definition) => withLeagueLogo(definition.meta))]

export function getLeagueDashboard(leagueId: string) {
  if (leagueId === sampleDashboard.league.id) return sampleDashboard
  return generatedDashboards.get(leagueId) ?? sampleDashboard
}
