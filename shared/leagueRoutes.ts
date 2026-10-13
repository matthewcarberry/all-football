const leaguePathById: Record<string, string> = {
  'premier-league': '/premier-league',
  'la-liga': '/la-liga',
  bundesliga: '/bundesliga',
  'serie-a': '/serie-a',
  'ligue-1': '/ligue-1',
  'liga-mx': '/liga-mx',
  eredivisie: '/eredivisie',
  'liga-portugal': '/liga-portugal',
  'saudi-pro-league': '/saudi-pro-league',
  'brasileirao-serie-a': '/brasileirao-serie-a',
  'j1-league': '/j1-league',
  'k-league-1': '/k-league-1',
  mls: '/mls',
  nwsl: '/nwsl',
  wsl: '/wsl',
  'uefa-nations-league': '/uefa-nations-league',
}

const leagueIdByPath = new Map(Object.entries(leaguePathById).map(([id, path]) => [path, id]))

export function getLeaguePath(leagueId: string) {
  return leaguePathById[leagueId]
}

export function getLeagueIdFromPath(pathname: string) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  return leagueIdByPath.get(normalizedPath)
}
