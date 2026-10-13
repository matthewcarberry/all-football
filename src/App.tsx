import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CalendarDays, Eye, Moon, Newspaper, Sun, X } from 'lucide-react'
import './App.css'
import { getLeagueDashboard, leagueCatalog } from '../shared/leagueCatalog'
import { getLeagueIdFromPath, getLeaguePath } from '../shared/leagueRoutes'
import { sampleDashboard } from '../shared/sampleData'
import type { DashboardData, LiveMatchSummary, LiveMatchesResponse, NewsResponse, QualificationConfig, SquadPlayer, Team, UpcomingMatch } from '../shared/types'

function useStoredState<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => window.localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue] as const
}

function buildFallbackWeekMatches(dashboard: DashboardData, weekNumber: number): UpcomingMatch[] {
  const teams = dashboard.teams
  const matchCount = Math.floor(teams.length / 2)
  const rotationLength = Math.max(1, teams.length - 1)
  const rotation = ((weekNumber - 1) % rotationLength + rotationLength) % rotationLength
  const rotatingTeams = teams.slice(1)
  const rotatedTeams = [...rotatingTeams.slice(rotation), ...rotatingTeams.slice(0, rotation)]
  const roundTeams = [teams[0], ...rotatedTeams]
  const kickoffStart = Date.parse(dashboard.seasonStart) + (weekNumber - dashboard.league.currentWeek) * 7 * 86_400_000
  const historical = weekNumber < dashboard.league.currentWeek
  return Array.from({ length: matchCount }, (_, index) => {
    const home = roundTeams[index]
    const away = roundTeams[roundTeams.length - 1 - index]
    const homeScore = (weekNumber + index * 2) % 4
    const awayScore = (weekNumber + index) % 3
    return {
      id: `${dashboard.league.id}-week-${weekNumber}-${index + 1}`,
      kickoff: new Date(kickoffStart + index * 2 * 3_600_000).toISOString(),
      competitionStage: `Matchweek ${weekNumber}`,
      venue: 'Venue TBA',
      broadcast: dashboard.league.id === 'premier-league' ? 'USA Network' : 'U.S. coverage TBD',
      home: { teamId: home.id, ...(historical ? { score: homeScore } : {}) },
      away: { teamId: away.id, ...(historical ? { score: awayScore } : {}) },
      status: historical ? 'final' : 'upcoming',
    }
  })
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [selectedLeagueId, setSelectedLeagueId] = useStoredState('all-football.selected-league', () => getLeagueIdFromPath(pathname) ?? sampleDashboard.league.id)
  const [dashboard, setDashboard] = useState<DashboardData>(() => getLeagueDashboard(selectedLeagueId))
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedWeek, setSelectedWeek] = useState(() => getLeagueDashboard(selectedLeagueId).league.currentWeek)
  const [colorBlind, setColorBlind] = useStoredState('premier-league-dashboard.color-blind', false)
  const [darkMode, setDarkMode] = useStoredState('all-football.dark-mode', true)
  const [now, setNow] = useState(() => Date.now())
  const [globalLiveMatches, setGlobalLiveMatches] = useState<LiveMatchSummary[] | null>(null)
  const [squadLoading, setSquadLoading] = useState(false)
  const lastAutoSelectedWeek = useRef({ leagueId: selectedLeagueId, week: getLeagueDashboard(selectedLeagueId).league.currentWeek })
  const isHomePage = !getLeagueIdFromPath(pathname)

  const teamsById = useMemo(() => new Map(dashboard.teams.map((team) => [team.id, team])), [dashboard.teams])
  const table = useMemo(() => [...dashboard.teams].sort((a, b) => b.record.points - a.record.points || b.record.goalDifference - a.record.goalDifference || b.record.goalsFor - a.record.goalsFor || a.name.localeCompare(b.name)), [dashboard.teams])
  const sortedMatches = useMemo(() => [...dashboard.matches].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff)), [dashboard.matches])
  const weekOptions = useMemo(() => Array.from({ length: dashboard.league.matchweekCount }, (_, index) => index + 1), [dashboard.league.matchweekCount])
  const visibleMatches = useMemo(() => {
    const stage = `Matchweek ${selectedWeek}`
    const stageMatches = sortedMatches.filter((match) => match.competitionStage === stage)
    const upcomingMatches = stageMatches.filter((match) => match.status === 'upcoming' && Date.parse(match.kickoff) > now)
    return stageMatches.length > 0 ? upcomingMatches : buildFallbackWeekMatches(dashboard, selectedWeek).filter((match) => match.status === 'upcoming' && Date.parse(match.kickoff) > now)
  }, [dashboard, now, selectedWeek, sortedMatches])
  const selectedTeam = selectedTeamId ? teamsById.get(selectedTeamId) : undefined
  const qualificationAriaLabel = formatQualificationAriaLabel(dashboard.qualification)
  const finalScores = useMemo(() => dashboard.matches.filter((match) => match.status === 'final' && typeof match.home.score === 'number' && typeof match.away.score === 'number' && getLocalDateKey(match.kickoff, match.venueTimeZone) === getLocalDateKey(now, match.venueTimeZone)).sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff)), [dashboard.matches, now])
  const pageLiveMatches = useMemo(() => (globalLiveMatches ?? []).filter((match) => match.league.id === selectedLeagueId), [globalLiveMatches, selectedLeagueId])
  const seasonInProgress = dashboard.league.currentWeek > 1 || dashboard.matches.some((match) => match.status !== 'upcoming')
  const seasonStartTime = Date.parse(dashboard.seasonStart)
  const seasonStarted = Number.isFinite(seasonStartTime) && now >= seasonStartTime
  const showSeasonHero = !seasonStarted && !seasonInProgress

  useEffect(() => {
    const nextDashboard = getLeagueDashboard(selectedLeagueId)
    setDashboard(nextDashboard)
    setSelectedTeamId('')
    lastAutoSelectedWeek.current = { leagueId: selectedLeagueId, week: nextDashboard.league.currentWeek }
    setSelectedWeek(nextDashboard.league.currentWeek)
  }, [selectedLeagueId])

  useEffect(() => {
    const currentWeek = dashboard.league.currentWeek
    const lastAutoSelection = lastAutoSelectedWeek.current
    if (lastAutoSelection.leagueId === selectedLeagueId && lastAutoSelection.week === currentWeek) return
    lastAutoSelectedWeek.current = { leagueId: selectedLeagueId, week: currentWeek }
    setSelectedWeek(currentWeek)
  }, [dashboard.league.currentWeek, selectedLeagueId])

  useEffect(() => {
    const pathLeagueId = getLeagueIdFromPath(pathname)
    if (pathLeagueId && pathLeagueId !== selectedLeagueId) setSelectedLeagueId(pathLeagueId)
  }, [pathname, selectedLeagueId, setSelectedLeagueId])

  useEffect(() => {
    const handlePopState = () => {
      const pathLeagueId = getLeagueIdFromPath(window.location.pathname)
      setPathname(window.location.pathname)
      if (pathLeagueId) setSelectedLeagueId(pathLeagueId)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setSelectedLeagueId])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    document.documentElement.dataset.colorBlind = String(colorBlind)
  }, [colorBlind, darkMode])

  useEffect(() => {
    if (isHomePage) {
      setGlobalLiveMatches(null)
      return
    }
    let active = true
    async function loadLiveMatches() {
      try {
        const response = await fetch(`/api/live-matches?_=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Live match API unavailable')
        const data = (await response.json()) as LiveMatchesResponse
        if (active) setGlobalLiveMatches(data.matches)
      } catch {
        if (active) setGlobalLiveMatches([])
      }
    }
    void loadLiveMatches()
    const timer = window.setInterval(() => void loadLiveMatches(), 15_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [isHomePage])

  useEffect(() => {
    if (isHomePage) return
    let active = true
    async function loadDashboard() {
      try {
        const response = await fetch(`/api/dashboard?league=${encodeURIComponent(selectedLeagueId)}&_=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Dashboard API unavailable')
        const data = (await response.json()) as DashboardData
        if (active) setDashboard(data)
      } catch {
        if (active) setDashboard({ ...sampleDashboard, provider: { ...sampleDashboard.provider, mode: 'offline', name: 'Local match shell', lastUpdated: new Date().toISOString() } })
      }
    }
    void loadDashboard()
    const timer = window.setInterval(() => void loadDashboard(), 15_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [isHomePage, selectedLeagueId])

  useEffect(() => {
    if (isHomePage || !selectedTeamId || !selectedTeam || selectedTeam.squad !== undefined || !selectedTeam.providerId) return
    let active = true
    setSquadLoading(true)
    async function loadSquad() {
      try {
        const response = await fetch(`/api/team-squad?league=${encodeURIComponent(selectedLeagueId)}&team=${encodeURIComponent(selectedTeamId)}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Squad API unavailable')
        const data = await response.json() as { squad?: SquadPlayer[] }
        if (active) setDashboard((current) => ({ ...current, teams: current.teams.map((team) => team.id === selectedTeamId ? { ...team, squad: data.squad ?? [] } : team) }))
      } catch {
        if (active) setDashboard((current) => ({ ...current, teams: current.teams.map((team) => team.id === selectedTeamId ? { ...team, squad: [] } : team) }))
      } finally {
        if (active) setSquadLoading(false)
      }
    }
    void loadSquad()
    return () => { active = false; setSquadLoading(false) }
  }, [isHomePage, selectedLeagueId, selectedTeamId, selectedTeam, selectedTeam?.providerId, selectedTeam?.squad])

  function navigateToLeague(leagueId: string) {
    setSelectedLeagueId(leagueId)
    const path = getLeaguePath(leagueId)
    if (path) {
      if (window.location.pathname !== path) window.history.pushState({}, '', path)
      setPathname(path)
    }
  }

  function navigateHome() {
    setSelectedTeamId('')
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/')
    setPathname('/')
  }

  useEffect(() => {
    document.title = isHomePage ? 'All Football' : `${dashboard.league.name} Dashboard`
  }, [dashboard.league.name, isHomePage])

  return (
    <div className="app-shell" style={{ '--league-accent': isHomePage ? '#863bff' : dashboard.league.accent, '--accent': isHomePage ? '#863bff' : dashboard.league.accent } as CSSProperties}>
      <header className="topbar">
        <button type="button" className="brand-lockup brand-home-button" onClick={navigateHome} aria-label="Go to All Football news homepage">
          <div className="brand-mark"><img className="brand-logo" src={isHomePage ? '/favicon.svg' : dashboard.league.logoUrl} alt={isHomePage ? 'All Football logo' : `${dashboard.league.name} logo`} /></div>
          <div><p className="eyebrow">{isHomePage ? 'Global soccer news' : `${dashboard.season} season`}</p><h1>{isHomePage ? 'All Football' : dashboard.league.name}</h1></div>
        </button>
        <div className="topbar-actions">
          <button type="button" className={`icon-button theme-button ${darkMode ? 'is-active' : ''}`} onClick={() => setDarkMode((current) => !current)} aria-pressed={darkMode} aria-label={`${darkMode ? 'Dark' : 'Light'} mode on`} title={`${darkMode ? 'Dark' : 'Light'} mode`}>
            {darkMode ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
          <button type="button" className={`icon-button toggle-button ${colorBlind ? 'is-active' : ''}`} onClick={() => setColorBlind((current) => !current)} aria-pressed={colorBlind} aria-label={`Color blind mode ${colorBlind ? 'on' : 'off'}`} title={`Color blind mode: ${colorBlind ? 'on' : 'off'}`}><Eye size={18} aria-hidden="true" /></button>
        </div>
      </header>

      <nav className="league-tabs" aria-label="Soccer leagues">
        <button type="button" className={`league-tab home-tab ${isHomePage ? 'is-active' : ''}`} style={{ '--tab-accent': '#863bff' } as CSSProperties} onClick={navigateHome} aria-current={isHomePage ? 'page' : undefined}><Newspaper size={18} aria-hidden="true" />News</button>
        {leagueCatalog.map((league) => <button key={league.id} type="button" className={`league-tab ${!isHomePage && league.id === selectedLeagueId ? 'is-active' : ''}`} style={{ '--tab-accent': league.accent } as CSSProperties} onClick={() => navigateToLeague(league.id)} aria-current={!isHomePage && league.id === selectedLeagueId ? 'page' : undefined}><img className="league-tab-logo" src={league.logoUrl} alt="" aria-hidden="true" />{league.shortName}</button>)}
      </nav>

      {isHomePage ? <HomePage /> : <>
      {pageLiveMatches.length ? <LiveMatchesBanner matches={pageLiveMatches} leagueName={dashboard.league.shortName} /> : finalScores.length ? <FinalScoresBanner matches={finalScores} teamsById={teamsById} leagueName={dashboard.league.shortName} /> : showSeasonHero ? <section className="season-hero surface" aria-labelledby="season-heading">
        <div className="hero-copy"><p className="eyebrow">League hub</p><h2 id="season-heading">The {dashboard.league.shortName} season is here.</h2><p>{dashboard.league.id === 'premier-league' ? 'Champions Arsenal host newly promoted Coventry City under the lights at Emirates Stadium.' : `Track ${dashboard.league.shortName} standings, upcoming matches, and continental qualification paths.`}</p><div className="hero-meta"><span><CalendarDays size={16} aria-hidden="true" /> {formatLocalDate(dashboard.seasonStart)}</span><span>{formatLocalTime(dashboard.seasonStart)}</span><span className="broadcast-tag">{dashboard.league.id === 'premier-league' ? 'USA Network' : 'U.S. coverage TBD'}</span></div></div>
        <Countdown target={dashboard.seasonStart} />
      </section> : null}

      <main className="dashboard-grid">
        <section className="surface match-surface" aria-labelledby="matches-heading">
          <div className="section-heading"><div><h2 id="matches-heading">Upcoming Matches</h2></div><div className="section-heading-actions"><label className="week-select"><span className="sr-only">Select week</span><select value={selectedWeek} onChange={(event) => setSelectedWeek(Number(event.target.value))}>{weekOptions.map((week) => <option key={week} value={week}>Week {week}</option>)}</select></label></div></div>
          <div className="match-list">{visibleMatches.map((match) => <MatchCard key={match.id} match={match} teamsById={teamsById} onSelectTeam={setSelectedTeamId} />)}</div>
        </section>

        <section className="surface table-surface" aria-labelledby="table-heading">
          <div className="section-heading"><div><h2 id="table-heading">League Standings</h2></div><span className="section-badge muted-badge">{table.some((team) => team.record.played > 0) ? `MW${dashboard.league.currentWeek}` : 'Pre-season'}</span></div>
          <div className="table-wrap"><table className="league-table"><thead><tr><th title="League position">#</th><th title="Club">Club</th><th title="Matches played">Pl</th><th title="Wins">W</th><th title="Draws">D</th><th title="Losses">L</th><th title="Goal difference">GD</th><th title="Points">Pts</th></tr></thead><tbody>{table.map((team, index) => <StandingRow key={team.id} team={team} position={index + 1} qualification={dashboard.qualification} selected={team.id === selectedTeamId} onSelect={() => setSelectedTeamId(team.id)} />)}</tbody></table></div>
          <p className="table-note" aria-label={qualificationAriaLabel}>{dashboard.qualification.bands.map((band) => <span className="legend-item" key={band.id}><span className={`legend-dot ${band.tone}`} /> {band.label}</span>)}</p>
        </section>
      </main>

      {selectedTeam ? <TeamModal team={selectedTeam} matches={dashboard.matches} teamsById={teamsById} squadLoading={squadLoading} onClose={() => setSelectedTeamId('')} /> : null}
      </>}
    </div>
  )
}

function HomePage() {
  const [news, setNews] = useState<NewsResponse>({ items: [], source: 'News feeds', lastUpdated: new Date().toISOString() })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadNews() {
      try {
        const response = await fetch(`/api/news?_=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('News feed unavailable')
        const data = (await response.json()) as NewsResponse
        if (active) setNews(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadNews()
    const timer = window.setInterval(() => void loadNews(), 60_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const [featured, ...stories] = news.items
  return <main className="news-page" aria-labelledby="news-heading">
    <section className="news-hero surface">
      <div><p className="eyebrow">Latest around the game</p><h2 id="news-heading">The world of soccer, updated.</h2><p>News, analysis, transfers, and match-day stories from across the global game.</p></div>
      <div className="news-source"><span className="news-live-dot" /> <strong>{loading ? 'Refreshing headlines' : `Updated from ${news.source}`}</strong><span>{formatNewsDate(news.lastUpdated)}</span></div>
    </section>
    {featured ? <section className="news-layout" aria-label="Latest soccer news">
      <article className="news-feature surface"><NewsImage item={featured} /><div className="news-card-copy"><p className="news-kicker">{featured.source} · {formatNewsDate(featured.publishedAt)}</p><h3><a href={featured.url} target="_blank" rel="noreferrer">{featured.title}</a></h3><p>{featured.summary}</p><a className="news-read-more" href={featured.url} target="_blank" rel="noreferrer">Read story <span aria-hidden="true">↗</span></a></div></article>
      <div className="news-list">{stories.slice(0, 8).map((item) => <article className="news-card surface" key={item.id}><NewsImage item={item} /><div className="news-card-copy"><p className="news-kicker">{item.source} · {formatNewsDate(item.publishedAt)}</p><h3><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3><p>{item.summary}</p></div></article>)}</div>
    </section> : <section className="news-empty surface"><strong>{loading ? 'Loading the latest soccer headlines…' : 'Headlines are temporarily unavailable.'}</strong><span>{news.message ?? 'Refresh the page to try the news feeds again.'}</span></section>}
  </main>
}

function NewsImage({ item }: { item: NewsResponse['items'][number] }) {
  return item.imageUrl ? <img className="news-image" src={item.imageUrl} alt="" loading="lazy" /> : <div className="news-image news-image-placeholder" aria-hidden="true"><Newspaper size={28} /></div>
}

function formatNewsDate(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Just now'
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date)
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const remaining = Math.max(0, Date.parse(target) - now)
  const days = Math.floor(remaining / 86_400_000)
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  return <div className="countdown" aria-label={`${days} days, ${hours} hours, and ${minutes} minutes until kickoff`}><div><strong>{days}</strong><span>days</span></div><div><strong>{String(hours).padStart(2, '0')}</strong><span>hours</span></div><div><strong>{String(minutes).padStart(2, '0')}</strong><span>mins</span></div></div>
}

function LiveMatchesBanner({ matches, leagueName }: { matches: LiveMatchSummary[]; leagueName: string }) {
  return <section className="live-match-banner live-match-banner-multi surface" aria-labelledby="live-match-heading"><div className="live-match-heading"><span className="live-pill"><span className="live-dot" /> Live now</span><p className="eyebrow">{leagueName}</p><h2 id="live-match-heading">Live matches</h2><span className="live-match-count">{matches.length} {matches.length === 1 ? 'match' : 'matches'}</span></div><div className="live-match-list">{matches.map((match) => <LiveMatchFixture key={match.id} match={match} />)}</div></section>
}

function LiveMatchFixture({ match }: { match: LiveMatchSummary }) {
  const homeScore = match.liveScore?.homeScore ?? match.home.score ?? 0
  const awayScore = match.liveScore?.awayScore ?? match.away.score ?? 0
  return <article className="live-match-row"><div className="live-league"><img src={match.league.logoUrl} alt="" aria-hidden="true" /><strong>{match.league.shortName}</strong><span>{match.competitionStage}</span></div><div className="live-match-teams"><div className="live-team"><ClubBadge team={match.home.team} /><strong>{match.home.team.shortName}</strong></div><div className="live-score"><strong>{homeScore} - {awayScore}</strong><span>{match.liveScore?.clock ?? match.liveScore?.status ?? 'In progress'}</span></div><div className="live-team"><ClubBadge team={match.away.team} /><strong>{match.away.team.shortName}</strong></div></div><div className="live-match-meta"><span>{match.venue}</span><span>{match.broadcast ?? 'Live match stats'}</span></div></article>
}

function FinalScoresBanner({ matches, teamsById, leagueName }: { matches: UpcomingMatch[]; teamsById: Map<string, Team>; leagueName: string }) {
  return <section className="live-match-banner live-match-banner-multi final-scores-banner surface" aria-labelledby="final-scores-heading"><div className="live-match-heading"><span className="final-pill">Full time</span><p className="eyebrow">{leagueName}</p><h2 id="final-scores-heading">Final scores</h2><span className="live-match-count">{matches.length} {matches.length === 1 ? 'match' : 'matches'} today</span></div><div className="live-match-list">{matches.map((match) => <FinalScoreFixture key={match.id} match={match} teamsById={teamsById} />)}</div></section>
}

function FinalScoreFixture({ match, teamsById }: { match: UpcomingMatch; teamsById: Map<string, Team> }) {
  const home = teamsById.get(match.home.teamId)
  const away = teamsById.get(match.away.teamId)
  if (!home || !away) return null
  const homeScore = match.liveScore?.homeScore ?? match.home.score ?? 0
  const awayScore = match.liveScore?.awayScore ?? match.away.score ?? 0
  return <article className="live-match-row final-score-row"><div className="live-league"><strong>{match.competitionStage}</strong><span>{formatLocalTime(match.kickoff)}</span></div><div className="live-match-teams"><div className="live-team"><ClubBadge team={home} /><strong>{home.shortName}</strong></div><div className="live-score"><strong>{homeScore} - {awayScore}</strong><span>Final score</span></div><div className="live-team"><ClubBadge team={away} /><strong>{away.shortName}</strong></div></div><div className="live-match-meta"><span>{match.venue}</span><span>Match stats updated</span></div></article>
}

function MatchCard({ match, teamsById, onSelectTeam }: { match: UpcomingMatch; teamsById: Map<string, Team>; onSelectTeam: (id: string) => void }) {
  const home = teamsById.get(match.home.teamId)
  const away = teamsById.get(match.away.teamId)
  if (!home || !away) return null
  const dateLabel = formatLocalDate(match.kickoff)
  const timeLabel = formatLocalTime(match.kickoff)
  const isFinal = match.status === 'final'
  const isLive = match.status === 'in-progress'
  return <article className="match-card"><div className="match-time"><strong>{dateLabel}</strong><span>{timeLabel}</span></div><button type="button" className="club-button home-club" onClick={() => onSelectTeam(home.id)}><ClubBadge team={home} /><strong>{home.shortName}</strong></button><div className={isFinal || isLive ? `match-score${isLive ? ' match-score-live' : ''}` : 'match-vs'}>{isFinal ? <><span>FT</span><strong>{match.home.score ?? 0} - {match.away.score ?? 0}</strong></> : isLive ? <><span>LIVE</span><strong>{match.liveScore?.homeScore ?? match.home.score ?? 0} - {match.liveScore?.awayScore ?? match.away.score ?? 0}</strong><small>{match.liveScore?.clock ?? 'In progress'}</small></> : <><span>vs</span>{match.broadcast ? <small>{match.broadcast}</small> : null}</>}</div><button type="button" className="club-button away-club" onClick={() => onSelectTeam(away.id)}><ClubBadge team={away} /><strong>{away.shortName}</strong></button><div className="match-venue">{match.venue}</div></article>
}

function StandingRow({ team, position, qualification, selected, onSelect }: { team: Team; position: number; qualification: QualificationConfig; selected: boolean; onSelect: () => void }) {
  const record = team.record
  const place = getQualificationPlace(position, qualification)
  return <tr className={`${selected ? 'is-selected ' : ''}${place ? `qualification-${place.tone}` : ''}`}><td className="position-cell"><span className={`position-mark position-${position}`}>{position}</span></td><td><button type="button" className="table-club-button" onClick={onSelect}><ClubBadge team={team} size="small" /><strong>{team.shortName}</strong></button></td><td>{record.played}</td><td>{record.wins}</td><td>{record.draws}</td><td>{record.losses}</td><td>{record.goalDifference > 0 ? `+${record.goalDifference}` : record.goalDifference}</td><td className="points-cell">{record.points}</td></tr>
}

function getQualificationPlace(position: number, qualification: QualificationConfig) {
  return qualification.bands.find((band) => position >= band.fromPosition && position <= band.toPosition)
}

function formatQualificationAriaLabel(qualification: QualificationConfig) {
  const places = qualification.bands.map((band) => `${band.label} positions ${band.fromPosition} through ${band.toPosition}`).join(', ')
  return `Projected qualification places: ${places}. ${qualification.note}`
}

function ClubBadge({ team, size = 'normal' }: { team: Team; size?: 'small' | 'normal' }) {
  return <span className={`club-badge club-badge-${size}`} style={{ '--club-color': team.color } as CSSProperties}>{team.logoUrl ? <img className="club-logo" src={team.logoUrl} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; const fallback = event.currentTarget.nextElementSibling as HTMLElement | null; if (fallback) fallback.hidden = false }} /> : null}<span className="club-code" hidden={Boolean(team.logoUrl)}>{team.abbreviation}</span></span>
}

function TeamModal({ team, matches, teamsById, squadLoading, onClose }: { team: Team; matches: UpcomingMatch[]; teamsById: Map<string, Team>; squadLoading: boolean; onClose: () => void }) {
  const teamMatches = matches.filter((match) => match.status === 'upcoming' && Date.parse(match.kickoff) > Date.now() && (match.home.teamId === team.id || match.away.teamId === team.id)).slice(0, 5)
  const squad = [...(team.squad ?? [])].sort((a, b) => squadPriority(a) - squadPriority(b) || a.position.localeCompare(b.position) || a.name.localeCompare(b.name))
  const confirmedPlayers = squad.filter((player) => player.status === 'starting' || player.status === 'substitute')
  useEffect(() => { const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown) }, [onClose])
  return <div className="team-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="surface team-modal-panel" role="dialog" aria-modal="true" aria-labelledby="club-heading" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">Club profile</p><h2 id="club-heading">{team.name}</h2></div><button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close club profile"><X size={18} /></button></div><div className="club-profile"><ClubBadge team={team} /><div><strong>{team.record.played ? `${team.record.points} points` : 'Season not started'}</strong><span>{team.record.played ? `${team.record.wins} wins · ${team.record.draws} draws · ${team.record.losses} losses` : 'Records will populate after the opening whistle.'}</span></div></div><div className="modal-section-heading"><h3 className="modal-subheading">Squad</h3>{confirmedPlayers.length ? <span className="squad-confirmed-count">{confirmedPlayers.length} matchday players</span> : null}</div>{squadLoading ? <div className="squad-empty"><strong>Loading squad information</strong><span>Fetching the latest club roster.</span></div> : squad.length ? <div className="squad-list">{squad.map((player) => <SquadRow key={player.id} player={player} />)}</div> : <div className="squad-empty"><strong>Squad information unavailable</strong><span>When the club feed provides a squad, confirmed matchday players will appear at the top.</span></div>}<h3 className="modal-subheading">Upcoming matches</h3><div className="modal-matches">{teamMatches.map((match) => { const opponentId = match.home.teamId === team.id ? match.away.teamId : match.home.teamId; const opponent = teamsById.get(opponentId); return opponent ? <div className="modal-match" key={match.id}><span>{formatLocalDate(match.kickoff)}</span><strong>{match.home.teamId === team.id ? 'H' : 'A'} · {opponent.shortName}</strong></div> : null })}</div></section></div>
}

function squadPriority(player: SquadPlayer) {
  if (player.status === 'starting') return 0
  if (player.status === 'substitute') return 1
  if (player.status === 'available') return 2
  return 3
}

function SquadRow({ player }: { player: SquadPlayer }) {
  const statusLabel = player.status === 'starting' ? 'Starting XI' : player.status === 'substitute' ? 'Substitute' : player.status === 'unavailable' ? 'Unavailable' : undefined
  return <div className={`squad-row ${player.status ? `squad-row-${player.status}` : ''}`}><span className="squad-number">{player.number ?? '—'}</span><div className="squad-player"><strong>{player.name}</strong><span>{player.position}</span></div>{statusLabel ? <span className="squad-status">{statusLabel}</span> : null}</div>
}

function formatLocalDate(kickoff: string) {
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).formatToParts(new Date(kickoff))
  const values = new Map(parts.map((part) => [part.type, part.value]))
  return `${values.get('weekday')} ${values.get('month')} ${values.get('day')}`
}

function getLocalDateKey(value: string | number, timeZone?: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const resolvedTimeZone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: resolvedTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
    const values = new Map(parts.map((part) => [part.type, part.value]))
    return `${values.get('year')}-${values.get('month')}-${values.get('day')}`
  } catch {
    return getLocalDateKey(value)
  }
}

function formatLocalTime(kickoff: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' }).format(new Date(kickoff))
}

export default App
