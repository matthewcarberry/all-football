export type ProviderMode = 'sample' | 'live' | 'offline'
export type QualificationStatus = 'qualified' | 'pending' | 'eliminated'

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

export interface Team {
  id: string
  name: string
  shortName: string
  fifaCode: string
  flag: string
  group: string
  confederation: string
  color: string
  record: TeamRecord
  qualificationStatus?: QualificationStatus
  fifaRank?: number
  standingSourceLabel?: string
  standingSourceUrl?: string
  standingUpdatedAt?: string
  form: string[]
}

export interface PlayerStats {
  minutes?: number
  goals?: number
  assists?: number
  expectedGoals?: number
  expectedAssists?: number
  shots?: number
  shotsOnTarget?: number
  chancesCreated?: number
  touches?: number
  passesCompleted?: number
  passesAttempted?: number
  passAccuracy?: number
  progressivePasses?: number
  carries?: number
  duelsWon?: number
  interceptions?: number
  recoveries?: number
  clearances?: number
  tacklesWon?: number
  yellowCards?: number
  redCards?: number
  saves?: number
  goalsPrevented?: number
}

export interface Player {
  id: string
  teamId: string
  name: string
  number: number
  position: string
  line: 'GK' | 'DEF' | 'MID' | 'FWD'
  role: string
  headshotUrl: string
  isStarter?: boolean
  lineupOrder?: number
  age?: string
  caps?: string
  internationalGoals?: string
  club?: string
  clubDivision?: string
  sourceLabel?: string
  sourceUrl?: string
  stats?: PlayerStats
}

export interface TeamLineup {
  teamId: string
  formation: string
  status: 'confirmed' | 'projected' | 'squad' | 'unavailable'
  updatedAt: string
  sourceLabel: string
  sourceUrl?: string
  players: Player[]
}

export interface MatchTeam {
  teamId: string
  projectedStanding: number
  points: number
  scenario: string
}

export interface LiveScore {
  homeScore?: number
  awayScore?: number
  clock?: string
  status?: string
  statusState?: 'pre' | 'in' | 'post'
  sourceLabel: string
  sourceUrl?: string
  updatedAt?: string
}

export interface UpcomingMatch {
  id: string
  kickoff: string
  competitionStage: string
  venue: string
  city: string
  home: MatchTeam
  away: MatchTeam
  isPlacementDecider: boolean
  placementImpact: string
  broadcastWindow: string
  status?: 'in-progress' | 'upcoming'
  statusText?: string
  liveScore?: LiveScore
}

export interface BracketSlot {
  id: string
  placement: string
  teamId?: string
  projectedTeamId?: string
  sourceMatchId?: string
  sourceLabel?: string
}

export type BracketRound =
  | 'round-of-32'
  | 'round-of-16'
  | 'quarterfinal'
  | 'semifinal'
  | 'final'

export interface BracketMatch {
  id: string
  round: BracketRound
  region: string
  kickoff?: string
  location?: string
  venue?: string
  sortOrder: number
  gridRow?: number
  slotA: BracketSlot
  slotB: BracketSlot
}

export interface DashboardData {
  provider: ProviderStatus
  teams: Team[]
  lineups: TeamLineup[]
  matches: UpcomingMatch[]
  bracket: BracketMatch[]
}
