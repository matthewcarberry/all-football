import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  Activity,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Eye,
  Moon,
  RadioTower,
  Shield,
  Sun,
  Users,
  X,
} from 'lucide-react'
import './App.css'
import { sampleDashboard } from '../shared/sampleData'
import type {
  BracketMatch,
  BracketRound,
  BracketSlot,
  DashboardData,
  Player,
  Team,
  TeamLineup,
  UpcomingMatch,
} from '../shared/types'

type ThemeMode = 'light' | 'dark'

const roundLabels: Record<BracketRound, string> = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinal: 'Quarterfinals',
  semifinal: 'Semifinals',
  final: 'Final',
}

const roundOrder: BracketRound[] = ['round-of-32', 'round-of-16', 'quarterfinal', 'semifinal', 'final']
const dashboardRefreshMs = 30_000
const bracketRowHeight = 70

const flagCodeByFifaCode: Record<string, string> = {
  ARG: 'ar',
  BEL: 'be',
  BRA: 'br',
  CAN: 'ca',
  COL: 'co',
  CPV: 'cv',
  CRC: 'cr',
  CRO: 'hr',
  DEN: 'dk',
  EGY: 'eg',
  ENG: 'gb-eng',
  ESP: 'es',
  FRA: 'fr',
  GER: 'de',
  GHA: 'gh',
  IRN: 'ir',
  IRQ: 'iq',
  ITA: 'it',
  JPN: 'jp',
  KOR: 'kr',
  KSA: 'sa',
  MAR: 'ma',
  MEX: 'mx',
  NED: 'nl',
  NGA: 'ng',
  NOR: 'no',
  NZL: 'nz',
  POR: 'pt',
  SEN: 'sn',
  SUI: 'ch',
  URU: 'uy',
  USA: 'us',
}

const bracketGridRows: Record<BracketRound, (index: number) => number> = {
  'round-of-32': (index) => 1 + index * 2,
  'round-of-16': (index) => 2 + index * 4,
  quarterfinal: (index) => 4 + index * 8,
  semifinal: (index) => 8 + index * 16,
  final: () => 16,
}

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function matchdayKey(kickoff: string) {
  const date = new Date(kickoff)
  if (Number.isNaN(date.getTime())) {
    return kickoff.slice(0, 10)
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function useStoredState<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue

    try {
      const rawValue = window.localStorage.getItem(key)
      return rawValue ? (JSON.parse(rawValue) as T) : fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function App() {
  const [dashboard, setDashboard] = useState<DashboardData>(sampleDashboard)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [showAllUpcomingMatches, setShowAllUpcomingMatches] = useState(false)
  const [theme, setTheme] = useStoredState<ThemeMode>('world-cup-dashboard.theme', getPreferredTheme)
  const [colorBlind, setColorBlind] = useStoredState('world-cup-dashboard.color-blind', false)

  const teamsById = useMemo(() => new Map(dashboard.teams.map((team) => [team.id, team])), [dashboard.teams])
  const lineupsByTeamId = useMemo(
    () => new Map(dashboard.lineups.map((lineup) => [lineup.teamId, lineup])),
    [dashboard.lineups],
  )
  const sortedMatches = useMemo(
    () => [...dashboard.matches].sort((first, second) => Date.parse(first.kickoff) - Date.parse(second.kickoff)),
    [dashboard.matches],
  )
  const inProgressMatches = useMemo(
    () => sortedMatches.filter((match) => match.status === 'in-progress'),
    [sortedMatches],
  )
  const upcomingMatches = useMemo(
    () => sortedMatches.filter((match) => match.status !== 'in-progress'),
    [sortedMatches],
  )
  const firstUpcomingMatchday = upcomingMatches[0] ? matchdayKey(upcomingMatches[0].kickoff) : ''
  const sameDayUpcomingMatches = useMemo(
    () => upcomingMatches.filter((match) => matchdayKey(match.kickoff) === firstUpcomingMatchday),
    [firstUpcomingMatchday, upcomingMatches],
  )
  const visibleUpcomingMatches = showAllUpcomingMatches ? upcomingMatches : sameDayUpcomingMatches
  const hiddenUpcomingCount = Math.max(0, upcomingMatches.length - sameDayUpcomingMatches.length)
  const selectedTeam = selectedTeamId ? teamsById.get(selectedTeamId) : undefined
  const selectedLineup = selectedTeam ? lineupsByTeamId.get(selectedTeam.id) : undefined

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.colorBlind = String(colorBlind)
  }, [colorBlind, theme])

  useEffect(() => {
    let isActive = true

    async function loadDashboardData(showLoading = false) {
      if (showLoading) {
        setIsLoading(true)
      }

      try {
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          throw new Error(`Dashboard API returned ${response.status}`)
        }

        const data = (await response.json()) as DashboardData
        if (isActive) {
          setDashboard(data)
        }
      } catch {
        if (isActive) {
          setDashboard({
            ...sampleDashboard,
            provider: {
              ...sampleDashboard.provider,
              mode: 'offline',
              lastUpdated: new Date().toISOString(),
              message: 'API is unavailable. Sourced standings, confirmed lineups, and player stats are unavailable.',
            },
          })
        }
      } finally {
        if (isActive && showLoading) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboardData(true)
    const refreshTimer = window.setInterval(() => {
      void loadDashboardData()
    }, dashboardRefreshMs)

    return () => {
      isActive = false
      window.clearInterval(refreshTimer)
    }
  }, [])

  useEffect(() => {
    if (selectedTeamId && !teamsById.has(selectedTeamId)) {
      setSelectedTeamId('')
    }
  }, [selectedTeamId, teamsById])

  useEffect(() => {
    if (showAllUpcomingMatches && hiddenUpcomingCount === 0) {
      setShowAllUpcomingMatches(false)
    }
  }, [hiddenUpcomingCount, showAllUpcomingMatches])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div>
            <h1>World Cup 2026</h1>
          </div>
        </div>

        <div className="topbar-actions">
          <StatusPill dashboard={dashboard} isLoading={isLoading} />
          <button
            type="button"
            className="icon-button"
            data-testid="color-blind-toggle"
            onClick={() => setColorBlind((current) => !current)}
            aria-pressed={colorBlind}
            aria-label="Toggle color blind mode"
            title="Color blind mode"
          >
            <Eye size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button"
            data-testid="theme-toggle"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
            title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="surface match-surface" aria-labelledby="upcoming-heading">
          {inProgressMatches.length > 0 ? (
            <div className="live-section" aria-labelledby="live-heading">
              <div className="section-heading live-heading">
                <div>
                  <h2 id="live-heading">In Progress</h2>
                </div>
                <div className="metric-cluster live-count" aria-label="Matches in progress">
                  <RadioTower size={18} aria-hidden="true" />
                  <span>{inProgressMatches.length}</span>
                </div>
              </div>

              <div className="live-match-list">
                {inProgressMatches.map((match) => (
                  <LiveMatchCard
                    key={match.id}
                    match={match}
                    teamsById={teamsById}
                    selectedTeamId={selectedTeamId}
                    onSelectTeam={setSelectedTeamId}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="section-heading">
            <div>
              <h2 id="upcoming-heading">Upcoming</h2>
            </div>
          </div>

          <div className="match-list">
            {visibleUpcomingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                teamsById={teamsById}
                selectedTeamId={selectedTeamId}
                onSelectTeam={setSelectedTeamId}
              />
            ))}
          </div>

          {hiddenUpcomingCount > 0 ? (
            <div className="match-list-footer">
              <button
                type="button"
                className="text-button match-more-button"
                onClick={() => setShowAllUpcomingMatches((current) => !current)}
                aria-expanded={showAllUpcomingMatches}
              >
                {showAllUpcomingMatches ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                <span>{showAllUpcomingMatches ? 'Show less' : 'More'}</span>
              </button>
            </div>
          ) : null}
        </section>
      </main>

      <section className="surface bracket-surface" aria-labelledby="bracket-heading">
        <div className="section-heading bracket-heading">
          <div>
            <h2 id="bracket-heading">Knockout</h2>
          </div>
        </div>

        <BracketBoard
          bracket={dashboard.bracket}
          teamsById={teamsById}
          onSelectTeam={setSelectedTeamId}
        />
      </section>

      {selectedTeam && selectedLineup ? (
        <TeamDetailModal onClose={() => setSelectedTeamId('')}>
          <TeamDetail
            team={selectedTeam}
            lineup={selectedLineup}
            teams={dashboard.teams}
            onClose={() => setSelectedTeamId('')}
          />
        </TeamDetailModal>
      ) : null}
    </div>
  )
}

function StatusPill({ dashboard, isLoading }: { dashboard: DashboardData; isLoading: boolean }) {
  return (
    <div className={`status-pill status-${dashboard.provider.mode}`}>
      <Activity size={16} aria-hidden="true" />
      <span>{isLoading ? 'Loading' : dashboard.provider.name}</span>
    </div>
  )
}

function LiveMatchCard({
  match,
  teamsById,
  selectedTeamId,
  onSelectTeam,
}: {
  match: UpcomingMatch
  teamsById: Map<string, Team>
  selectedTeamId: string
  onSelectTeam: (teamId: string) => void
}) {
  const home = teamsById.get(match.home.teamId)
  const away = teamsById.get(match.away.teamId)

  if (!home || !away) {
    return null
  }

  const statusText = match.liveScore?.status ?? match.liveScore?.clock ?? 'Live'
  const homeScore = liveScoreValue(match.liveScore?.homeScore)
  const awayScore = liveScoreValue(match.liveScore?.awayScore)

  return (
    <article className="live-match-card">
      <div className="live-card-header">
        <strong>{statusText}</strong>
      </div>

      <div className="live-board">
        <button
          type="button"
          className={`live-team-card ${selectedTeamId === home.id ? 'is-selected' : ''}`}
          onClick={() => onSelectTeam(home.id)}
        >
          <TeamFlag team={home} />
          <strong>{home.name}</strong>
        </button>

        <div className="live-scoreboard" aria-label={`${home.name} ${homeScore}, ${away.name} ${awayScore}`}>
          <strong>{homeScore}</strong>
          <span>-</span>
          <strong>{awayScore}</strong>
        </div>

        <button
          type="button"
          className={`live-team-card ${selectedTeamId === away.id ? 'is-selected' : ''}`}
          onClick={() => onSelectTeam(away.id)}
        >
          <TeamFlag team={away} />
          <strong>{away.name}</strong>
        </button>
      </div>

      <p className="live-stage-line">{liveStageLabel(match)}</p>
      <p className="live-context-line">
        {match.venue}, {match.city}
      </p>
    </article>
  )
}

function liveScoreValue(value: number | undefined) {
  return value === undefined ? '-' : String(value)
}

function liveStageLabel(match: UpcomingMatch) {
  if (/^Group\s+/i.test(match.competitionStage)) {
    return `Group Stage / ${match.competitionStage}`
  }
  return match.competitionStage
}

function MatchCard({
  match,
  teamsById,
  selectedTeamId,
  onSelectTeam,
}: {
  match: UpcomingMatch
  teamsById: Map<string, Team>
  selectedTeamId: string
  onSelectTeam: (teamId: string) => void
}) {
  const home = teamsById.get(match.home.teamId)
  const away = teamsById.get(match.away.teamId)

  if (!home || !away) {
    return null
  }

  return (
    <article className="match-card">
      <div className="live-board upcoming-board">
        <button
          type="button"
          className={`live-team-card ${selectedTeamId === home.id ? 'is-selected' : ''}`}
          onClick={() => onSelectTeam(home.id)}
        >
          <TeamFlag team={home} />
          <strong>{home.name}</strong>
        </button>

        <div className="upcoming-center">
          <strong>vs</strong>
          <span>
            <CalendarClock size={14} aria-hidden="true" />
            {formatKickoff(match.kickoff)}
          </span>
        </div>

        <button
          type="button"
          className={`live-team-card ${selectedTeamId === away.id ? 'is-selected' : ''}`}
          onClick={() => onSelectTeam(away.id)}
        >
          <TeamFlag team={away} />
          <strong>{away.name}</strong>
        </button>
      </div>

      <p className="live-stage-line">{liveStageLabel(match)}</p>
      <p className="live-context-line">
        {match.venue}, {match.city}
      </p>
    </article>
  )
}

function TeamDetailModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="team-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="surface team-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  )
}

function TeamDetail({
  team,
  lineup,
  teams,
  onClose,
}: {
  team: Team
  lineup: TeamLineup
  teams: Team[]
  onClose: () => void
}) {
  const displayedPlayers = useMemo(
    () => sortPlayersForLineup(lineup.players, lineup.status),
    [lineup.players, lineup.status],
  )
  const boardPlayers = useMemo(() => displayedPlayers.filter((player) => player.isStarter !== false), [displayedPlayers])
  const positionedBoardPlayers = useMemo(
    () => positionPlayersOnPitch(boardPlayers, lineup.formation),
    [boardPlayers, lineup.formation],
  )
  const groupStandings = useMemo(() => groupStandingsForTeam(team, teams), [team, teams])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const selectedPlayer = displayedPlayers.find((player) => player.id === selectedPlayerId)
  const lineupAvailable = lineup.status !== 'unavailable' && displayedPlayers.length > 0
  const hasPlayerStats = displayedPlayers.some((player) => player.stats)
  const showPlayerBoard = lineupAvailable && lineup.status !== 'squad'
  const lineupText = lineupPanelText(lineup)

  useEffect(() => {
    setSelectedPlayerId('')
  }, [lineup.teamId])

  return (
    <>
      <div className="section-heading team-heading">
        <div>
          <p className="eyebrow">Selected Team</p>
          <h2 id="team-heading">{team.name}</h2>
        </div>
        <div className="team-heading-actions">
          <TeamBadge team={team} size="large" />
          <button
            type="button"
            className="icon-button team-close-button"
            onClick={onClose}
            aria-label="Back to all teams"
            title="Back to all teams"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <GroupStandingsTable group={team.group} selectedTeamId={team.id} standings={groupStandings} />

      <div className="lineup-header">
        <div>
          <p className="eyebrow">{lineupText.eyebrow}</p>
        </div>
        <Users size={19} aria-hidden="true" />
      </div>

      {lineupAvailable ? (
        <>
          {showPlayerBoard ? (
            <div className="pitch" aria-label={`${team.name} player board`}>
              <div className="pitch-header">
                <span>
                  <TeamFlag team={team} />
                  <strong>{team.name}</strong>
                </span>
                {lineupText.title ? <strong className="formation-pill">{lineupText.title}</strong> : null}
              </div>
              <div className="pitch-field">
                <span className="pitch-marking pitch-box-large" />
                <span className="pitch-marking pitch-box-small" />
                <span className="pitch-marking pitch-midline" />
                <span className="pitch-marking pitch-center-circle" />
                {positionedBoardPlayers.map(({ player, x, y }) => (
                  <button
                    type="button"
                    className={`player-dot ${selectedPlayer?.id === player.id ? 'is-selected' : ''}`}
                    key={player.id}
                    title={`${player.name}, ${player.role}`}
                    style={{ '--pitch-x': `${x}%`, '--pitch-y': `${y}%` } as CSSProperties}
                    onClick={() => setSelectedPlayerId(player.id)}
                  >
                    <img className="player-headshot" src={player.headshotUrl} alt="" />
                    <strong>{pitchPlayerLabel(player)}</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {selectedPlayer ? <PlayerDetail player={selectedPlayer} team={team} onClose={() => setSelectedPlayerId('')} /> : null}

          <div className="player-table-wrap">
            <table className="player-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Pos</th>
                  {hasPlayerStats ? (
                    <>
                      <th>Min</th>
                      <th>G+A</th>
                      <th>Pass</th>
                      <th>Def</th>
                    </>
                  ) : (
                    <>
                      <th>Age</th>
                      <th>Caps</th>
                      <th>Goals</th>
                      <th>Club</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayedPlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    showStats={hasPlayerStats}
                    isSelected={selectedPlayer?.id === player.id}
                    onSelect={() => setSelectedPlayerId(player.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="data-unavailable" role="status">
          <Shield size={20} aria-hidden="true" />
          <div>
            <strong>Confirmed lineup and player stats are unavailable.</strong>
            <span>This panel will populate once a live lineup and player-stat feed is connected for the match.</span>
          </div>
        </div>
      )}
    </>
  )
}

function GroupStandingsTable({
  group,
  selectedTeamId,
  standings,
}: {
  group: string
  selectedTeamId: string
  standings: Team[]
}) {
  return (
    <section className="group-standings" aria-label={`Group ${group} standings`}>
      <h3>Group {group}</h3>
      <div className="group-standings-table-wrap">
        <table className="group-standings-table">
          <thead>
            <tr>
              <th aria-label="Rank" />
              <th>Team</th>
              <th>MP</th>
              <th>W-D-L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standingTeam, index) => (
              <tr className={standingTeam.id === selectedTeamId ? 'is-selected' : ''} key={standingTeam.id}>
                <td className="rank-cell">{index + 1}</td>
                <td className="standings-team-cell">
                  <TeamFlag team={standingTeam} />
                  <strong>{standingTeam.name}</strong>
                </td>
                <td>{standingTeam.record.played}</td>
                <td>
                  {standingTeam.record.wins}-{standingTeam.record.draws}-{standingTeam.record.losses}
                </td>
                <td>{standingTeam.record.goalsFor}</td>
                <td>{standingTeam.record.goalsAgainst}</td>
                <td>{formatGoalDifference(standingTeam.record.goalDifference)}</td>
                <td>{standingTeam.record.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function groupStandingsForTeam(team: Team, teams: Team[]) {
  return teams.filter((candidate) => candidate.group === team.group).sort(compareTeamsForStandings)
}

function compareTeamsForStandings(first: Team, second: Team) {
  return (
    second.record.points - first.record.points ||
    second.record.goalDifference - first.record.goalDifference ||
    second.record.goalsFor - first.record.goalsFor ||
    (first.fifaRank ?? 999) - (second.fifaRank ?? 999) ||
    first.name.localeCompare(second.name)
  )
}

function formatGoalDifference(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function lineupPanelText(lineup: TeamLineup) {
  if (lineup.status === 'squad') {
    return {
      eyebrow: 'Tournament Squad',
      title: '',
    }
  }

  if (lineup.status === 'confirmed') {
    return {
      eyebrow: 'Confirmed Match Lineup',
      title: lineup.formation,
    }
  }

  if (lineup.status === 'projected') {
    return {
      eyebrow: 'Projected Match Lineup',
      title: lineup.formation,
    }
  }

  return {
    eyebrow: 'Squad',
    title: lineup.formation,
  }
}

function sortPlayersForLineup(players: Player[], status: TeamLineup['status']) {
  return [...players].sort((first, second) => {
    if (status === 'squad') {
      return first.number - second.number || comparePlayersByLastName(first, second)
    }

    return (
      starterOrder(first) - starterOrder(second) ||
      playerLineOrder(first) - playerLineOrder(second) ||
      (first.lineupOrder ?? 999) - (second.lineupOrder ?? 999) ||
      first.number - second.number ||
      comparePlayersByLastName(first, second)
    )
  })
}

function starterOrder(player: Player) {
  return player.isStarter === false ? 1 : 0
}

function playerLineOrder(player: Player) {
  return { GK: 0, DEF: 1, MID: 2, FWD: 3 }[player.line] ?? 9
}

function comparePlayersByLastName(first: Player, second: Player) {
  return lastNameKey(first.name).localeCompare(lastNameKey(second.name)) || first.name.localeCompare(second.name)
}

function lastNameKey(name: string) {
  const cleaned = name
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+(?:Jr\.?|Sr\.?|II|III|IV|V)$/i, '')
    .trim()
  const parts = cleaned.split(/\s+/)
  return (parts.at(-1) ?? cleaned).toLocaleLowerCase()
}

function compactPlayerName(name: string) {
  const parts = name.replace(/\([^)]*\)/g, '').trim().split(/\s+/)
  if (parts.length <= 1) {
    return name
  }

  return `${parts[0][0]}. ${parts.at(-1)}`
}

interface PositionedPlayer {
  player: Player
  x: number
  y: number
}

const formationSlotOrders: Record<string, number[][]> = {
  '3-4-3': [
    [4, 5, 6],
    [3, 4, 8, 2],
    [9, 10, 11],
  ],
  '3-5-2': [
    [4, 5, 6],
    [3, 11, 8, 10, 2],
    [9, 7],
  ],
  '4-2-3-1': [
    [2, 5, 6, 3],
    [4, 8],
    [9, 10, 7],
    [11],
  ],
  '4-3-3': [
    [2, 5, 6, 3],
    [4, 8, 10],
    [11, 9, 7],
  ],
  '4-4-2': [
    [2, 5, 6, 3],
    [11, 4, 8, 7],
    [9, 10],
  ],
  '5-4-1': [
    [2, 6, 5, 4, 3],
    [11, 10, 8, 7],
    [9],
  ],
}

function positionPlayersOnPitch(players: Player[], formation: string): PositionedPlayer[] {
  const slots = pitchSlotsForFormation(formation)
  const fallbackGroups = fallbackPitchGroups(players)

  return players
    .map((player) => {
      const explicitSlot = player.lineupOrder ? slots.get(player.lineupOrder) : undefined
      const fallbackSlot = fallbackCoordinate(player, fallbackGroups)
      return {
        player,
        x: explicitSlot?.x ?? fallbackSlot.x,
        y: explicitSlot?.y ?? fallbackSlot.y,
      }
    })
    .sort((first, second) => first.y - second.y || first.x - second.x)
}

function pitchSlotsForFormation(formation: string) {
  const normalized = formation.match(/\d+(?:-\d+)+/)?.[0] ?? ''
  const rowOrders = formationSlotOrders[normalized] ?? []
  const yValues = pitchRowYValues(rowOrders.length)
  const slots = new Map<number, { x: number; y: number }>([[1, { x: 50, y: 12 }]])

  rowOrders.forEach((row, rowIndex) => {
    const xs = spreadAcrossPitch(row.length)
    row.forEach((slotNumber, playerIndex) => {
      if (!slots.has(slotNumber)) {
        slots.set(slotNumber, { x: xs[playerIndex] ?? 50, y: yValues[rowIndex] ?? 50 })
      }
    })
  })

  return slots
}

function pitchRowYValues(rowCount: number) {
  if (rowCount >= 4) {
    return [30, 50, 68, 87]
  }

  if (rowCount === 3) {
    return [31, 57, 83]
  }

  if (rowCount === 2) {
    return [36, 73]
  }

  return [58]
}

function spreadAcrossPitch(count: number) {
  if (count <= 1) {
    return [50]
  }

  const inset = count >= 5 ? 12 : count === 4 ? 16 : count === 3 ? 24 : 34
  const step = (100 - inset * 2) / (count - 1)
  return Array.from({ length: count }, (_, index) => inset + step * index)
}

function fallbackPitchGroups(players: Player[]) {
  return {
    GK: players.filter((player) => player.line === 'GK'),
    DEF: players.filter((player) => player.line === 'DEF'),
    MID: players.filter((player) => player.line === 'MID'),
    FWD: players.filter((player) => player.line === 'FWD'),
  }
}

function fallbackCoordinate(player: Player, groups: ReturnType<typeof fallbackPitchGroups>) {
  const row = groups[player.line]
  const index = row.findIndex((candidate) => candidate.id === player.id)
  const y = { GK: 12, DEF: 32, MID: 58, FWD: 83 }[player.line]
  return {
    x: spreadAcrossPitch(row.length)[Math.max(0, index)] ?? 50,
    y,
  }
}

function pitchPlayerLabel(player: Player) {
  return `${player.number} ${compactPlayerName(player.name)}`
}

function PlayerDetail({ player, team, onClose }: { player: Player; team: Team; onClose: () => void }) {
  const stats = player.stats
  const rows = matchStatRows(player)

  return (
    <section className="player-detail" aria-live="polite">
      <div className="player-detail-header">
        <img className="detail-headshot" src={player.headshotUrl} alt="" />
        <div>
          <h3>{player.name}</h3>
          <span className="player-team-line">
            <TeamFlag team={team} />
            {team.name} #{player.number}
          </span>
        </div>
        <button
          type="button"
          className="icon-button player-detail-close"
          onClick={onClose}
          aria-label="Close player stats"
          title="Close player stats"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="match-stat-panel">
        <h3>Match stats</h3>
        {!stats ? (
          <p className="stat-source-note">Match stats are not reported by the current source.</p>
        ) : null}
        <div className="match-stat-list">
          {rows.map((row) => (
            <div className={row.featured ? 'match-stat-row is-featured' : 'match-stat-row'} key={row.label}>
              <div>
                <strong>{row.label}</strong>
                {row.note ? <span>{row.note}</span> : null}
              </div>
              <em>{row.value}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function matchStatRows(player: Player) {
  const stats = player.stats
  const rows: Array<{ label: string; note?: string; value: string; featured?: boolean }> = [
    {
      label: 'Minutes played',
      value: statValue(stats?.minutes),
    },
  ]

  if (player.line === 'GK') {
    rows.push({
      label: 'Keeper saves',
      value: statValue(stats?.saves),
    })
  } else {
    rows.push(
      {
        label: 'Goals',
        value: statValue(stats?.goals),
      },
      {
        label: 'Assists',
        value: statValue(stats?.assists),
      },
      {
        label: 'Shots on target',
        value: statValue(stats?.shotsOnTarget),
      },
    )
  }

  rows.push(
    {
      label: 'Yellow cards',
      value: statValue(stats?.yellowCards),
    },
    {
      label: 'Red cards',
      value: statValue(stats?.redCards),
    },
  )

  return rows
}

function statValue(value: number | undefined) {
  return value === undefined ? 'Not reported' : String(value)
}

function PlayerRow({
  player,
  showStats,
  isSelected,
  onSelect,
}: {
  player: Player
  showStats: boolean
  isSelected: boolean
  onSelect: () => void
}) {
  const stats = player.stats

  return (
    <tr className={isSelected ? 'is-selected' : ''}>
      <td>
        <button type="button" className="table-player-button" onClick={onSelect}>
          <img className="table-headshot" src={player.headshotUrl} alt="" />
          <div>
            <strong>{player.name}</strong>
            <span className="player-role">
              {player.role} #{player.number}
            </span>
          </div>
        </button>
      </td>
      <td>{player.position}</td>
      {showStats ? (
        <>
          <td>{stats?.minutes ?? '-'}</td>
          <td>{stats ? statTotal(stats.goals, stats.assists) : '-'}</td>
          <td>{stats?.passAccuracy !== undefined ? `${stats.passAccuracy}%` : '-'}</td>
          <td>{stats ? (stats.saves ?? stats.tacklesWon) : '-'}</td>
        </>
      ) : (
        <>
          <td>{player.age || '-'}</td>
          <td>{player.caps || '-'}</td>
          <td>{player.internationalGoals || '-'}</td>
          <td>{player.club || '-'}</td>
        </>
      )}
    </tr>
  )
}

function statTotal(...values: Array<number | undefined>) {
  const reported = values.filter((value): value is number => value !== undefined)
  return reported.length ? reported.reduce((sum, value) => sum + value, 0) : '-'
}

function BracketBoard({
  bracket,
  teamsById,
  onSelectTeam,
}: {
  bracket: BracketMatch[]
  teamsById: Map<string, Team>
  onSelectTeam: (teamId: string) => void
}) {
  const bracketLayout = useMemo(() => buildBracketLayout(bracket), [bracket])

  return (
    <div className="bracket-board">
      {roundOrder.map((round) => {
        const matches = bracket
          .filter((match) => match.round === round)
          .sort((first, second) => first.sortOrder - second.sortOrder)

        return (
          <div
            className={`bracket-round bracket-round-${round}`}
            key={round}
          >
            <h3>{roundLabels[round]}</h3>
            <div
              className="bracket-row-matches"
              style={{
                gridTemplateRows: `repeat(${bracketLayout.rowCount}, ${bracketRowHeight}px)`,
                minHeight: `${bracketLayout.rowCount * bracketRowHeight}px`,
              }}
            >
              {matches.map((match, index) => {
                const gridRow = bracketLayout.rows.get(match.id) ?? match.gridRow ?? bracketGridRows[round](index)
                const finalRegion = match.round === 'final' ? match.region.toLowerCase() : ''
                const matchLabel = finalRegion === 'third place' ? 'Third Place' : finalRegion === 'final' ? 'Final' : ''

                return (
                  <div
                    className="bracket-match-stack"
                    key={match.id}
                    style={{ '--bracket-row': gridRow } as CSSProperties}
                  >
                    {matchLabel ? <span className="bracket-match-label">{matchLabel}</span> : null}
                    <BracketMatchCard
                      match={match}
                      teamsById={teamsById}
                      onSelectTeam={onSelectTeam}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function buildBracketLayout(bracket: BracketMatch[]) {
  const rows = new Map<string, number>()
  const visibleRounds = roundOrder
    .filter((round) => round !== 'final')
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

  return { rows, rowCount }
}

function distributedBracketRow(index: number, matchCount: number, rowCount: number) {
  if (matchCount <= 1) {
    return Math.ceil(rowCount / 2)
  }

  return Math.max(1, Math.min(rowCount, Math.round(1 + ((index + 0.5) * rowCount) / matchCount - 0.5)))
}

function BracketMatchCard({
  match,
  teamsById,
  onSelectTeam,
}: {
  match: BracketMatch
  teamsById: Map<string, Team>
  onSelectTeam: (teamId: string) => void
}) {
  return (
    <article
      className="bracket-match"
      data-match-id={match.id}
    >
      <div className="bracket-match-meta">
        <span>{formatBracketMeta(match)}</span>
        <span>{match.id.toUpperCase()}</span>
      </div>
      <BracketSlotButton
        slot={match.slotA}
        matchId={match.id}
        teamsById={teamsById}
        onSelectTeam={onSelectTeam}
      />
      <BracketSlotButton
        slot={match.slotB}
        matchId={match.id}
        teamsById={teamsById}
        onSelectTeam={onSelectTeam}
      />
    </article>
  )
}

function BracketSlotButton({
  slot,
  matchId,
  teamsById,
  onSelectTeam,
}: {
  slot: BracketSlot
  matchId: string
  teamsById: Map<string, Team>
  onSelectTeam: (teamId: string) => void
}) {
  const team = resolveSlotTeam(slot, teamsById)
  const isEmpty = !team
  const handleClick = () => {
    if (!team) {
      return
    }

    onSelectTeam(team.id)
  }

  return (
    <button
      type="button"
      className={`bracket-slot ${isEmpty ? 'is-empty' : ''}`}
      data-testid={`bracket-slot-${matchId}-${slot.id}`}
      data-match-id={matchId}
      data-slot-id={slot.id}
      data-team-id={team?.id ?? ''}
      disabled={!team}
      onClick={handleClick}
    >
      <span className="slot-team">
        {team ? (
          <>
            <TeamBadge team={team} size="plain" />
            <strong>{team.name}</strong>
          </>
        ) : (
          <span className="slot-placement">{slot.placement}</span>
        )}
      </span>
      <span className="slot-spacer" aria-hidden="true" />
    </button>
  )
}

function formatBracketMeta(match: BracketMatch) {
  const date = formatBracketDate(match.kickoff)
  const location = match.location || match.venue || ''
  const details = [date && location ? `${date} - ${location}` : date || location].filter(Boolean)
  return details.length ? details.join(' · ') : 'Schedule TBD'
}

function formatBracketDate(value: string | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function TeamBadge({ team, size = 'default' }: { team: Team; size?: 'default' | 'large' | 'mini' | 'plain' }) {
  const flagUrl = flagUrlForTeam(team)
  const qualificationStatus = team.qualificationStatus ?? 'pending'

  return (
    <span
      className={`team-code ${size}`}
      data-qualification-status={qualificationStatus}
      title={qualificationStatusLabel(qualificationStatus)}
    >
      {flagUrl ? (
        <img
          className="flag-icon"
          src={flagUrl}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      ) : null}
      <span>{team.fifaCode}</span>
    </span>
  )
}

function qualificationStatusLabel(status: NonNullable<Team['qualificationStatus']>) {
  if (status === 'qualified') {
    return 'Qualified for the Round of 32'
  }
  if (status === 'eliminated') {
    return 'Eliminated from Round of 32 qualification'
  }
  return 'Not yet qualified for the Round of 32'
}

function TeamFlag({ team }: { team: Team }) {
  const flagUrl = flagUrlForTeam(team)

  return flagUrl ? (
    <img
      className="standings-flag"
      src={flagUrl}
      alt=""
      loading="lazy"
      onError={(event) => {
        event.currentTarget.hidden = true
      }}
    />
  ) : (
    <span className="standings-flag fallback-flag" aria-hidden="true" />
  )
}

function flagUrlForTeam(team: Team) {
  const flagCode = team.flag ? team.flag.toLowerCase() : flagCodeByFifaCode[team.fifaCode]
  return flagCode ? `https://flagcdn.com/w40/${flagCode}.png` : undefined
}

function resolveSlotTeam(slot: BracketSlot, teamsById: Map<string, Team>) {
  if (slot.teamId) {
    return teamsById.get(slot.teamId)
  }

  return undefined
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default App
