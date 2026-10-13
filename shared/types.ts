export type ProviderMode = 'sample' | 'live' | 'offline'

export interface ProviderStatus {
  mode: ProviderMode
  name: string
  lastUpdated: string
  message: string
}

export interface TeamRecord {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export type SquadPlayerStatus = 'starting' | 'substitute' | 'available' | 'unavailable'

export interface SquadPlayer {
  id: string
  name: string
  position: string
  number?: number
  status?: SquadPlayerStatus
}

export interface Team {
  id: string
  providerId?: number
  name: string
  shortName: string
  abbreviation: string
  logoUrl: string
  color: string
  record: TeamRecord
  form: string[]
  squad?: SquadPlayer[]
}

export interface LeagueMeta {
  id: string
  name: string
  shortName: string
  country: string
  region: string
  accent: string
  logoUrl: string
  matchweekCount: number
  currentWeek: number
}

export type QualificationTone = 'champions' | 'europa' | 'conference' | 'continental' | 'relegation'

export interface QualificationBand {
  id: string
  label: string
  fromPosition: number
  toPosition: number
  tone: QualificationTone
}

export interface QualificationConfig {
  bands: QualificationBand[]
  note: string
}

export type EuropeanCompetition = 'champions' | 'europa' | 'conference'

export interface EuropeanQualificationPlace {
  competition: EuropeanCompetition
  fromPosition: number
  toPosition: number
}

export interface EuropeanQualification {
  accessListRank: number
  seasonCoefficientRank: number
  seasonAssociationCoefficient: number
  europeanPerformanceSpot: boolean
  places: EuropeanQualificationPlace[]
  note: string
}

export interface MatchTeam {
  teamId: string
  score?: number
}

export interface UpcomingMatch {
  id: string
  kickoff: string
  competitionStage: string
  venue: string
  venueTimeZone?: string
  broadcast?: string
  home: MatchTeam
  away: MatchTeam
  status: 'in-progress' | 'upcoming' | 'final'
  liveScore?: {
    homeScore?: number
    awayScore?: number
    clock?: string
    status?: string
    postMatchUntil?: string
  }
}

export interface LiveMatchSummary {
  id: string
  league: Pick<LeagueMeta, 'id' | 'name' | 'shortName' | 'accent' | 'logoUrl'>
  kickoff: string
  competitionStage: string
  venue: string
  broadcast?: string
  home: { team: Team; score?: number }
  away: { team: Team; score?: number }
  status: 'in-progress'
  liveScore?: UpcomingMatch['liveScore']
}

export interface LiveMatchesResponse {
  matches: LiveMatchSummary[]
  lastUpdated: string
  source: string
}

export interface DashboardData {
  league: LeagueMeta
  provider: ProviderStatus
  competition: string
  season: string
  seasonStart: string
  broadcastSourceUrl: string
  qualification: QualificationConfig
  europeanQualification?: EuropeanQualification
  teams: Team[]
  matches: UpcomingMatch[]
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export interface NewsResponse {
  items: NewsItem[]
  source: string
  lastUpdated: string
  message?: string
}
