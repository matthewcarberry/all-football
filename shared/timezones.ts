const leagueTimeZones: Record<string, string> = {
  'premier-league': 'Europe/London',
  'la-liga': 'Europe/Madrid',
  bundesliga: 'Europe/Berlin',
  'serie-a': 'Europe/Rome',
  'ligue-1': 'Europe/Paris',
  mls: 'America/New_York',
  'liga-mx': 'America/Mexico_City',
  eredivisie: 'Europe/Amsterdam',
  'liga-portugal': 'Europe/Lisbon',
  'saudi-pro-league': 'Asia/Riyadh',
  'brasileirao-serie-a': 'America/Sao_Paulo',
  'j1-league': 'Asia/Tokyo',
  'k-league-1': 'Asia/Seoul',
  nwsl: 'America/New_York',
  wsl: 'Europe/London',
  'uefa-nations-league': 'Europe/Zurich',
}

const teamTimeZones: Record<string, Record<string, string>> = {
  mls: {
    'vancouver whitecaps': 'America/Vancouver',
    'portland timbers': 'America/Los_Angeles',
    'seattle sounders': 'America/Los_Angeles',
    'la galaxy': 'America/Los_Angeles',
    lafc: 'America/Los_Angeles',
    'san jose earthquakes': 'America/Los_Angeles',
    'san diego fc': 'America/Los_Angeles',
    'real salt lake': 'America/Denver',
    'colorado rapids': 'America/Denver',
    'minnesota united': 'America/Chicago',
    'sporting kansas city': 'America/Chicago',
    'st louis city sc': 'America/Chicago',
    'chicago fire': 'America/Chicago',
    'fc dallas': 'America/Chicago',
    'houston dynamo': 'America/Chicago',
    'austin fc': 'America/Chicago',
  },
  nwsl: {
    'portland thorns fc': 'America/Los_Angeles',
    'seattle reign fc': 'America/Los_Angeles',
    'bay fc': 'America/Los_Angeles',
    'angel city fc': 'America/Los_Angeles',
    'san diego wave fc': 'America/Los_Angeles',
    'utah royals': 'America/Denver',
    'denver summit fc': 'America/Denver',
    'chicago stars fc': 'America/Chicago',
    'kansas city current': 'America/Chicago',
    'houston dash': 'America/Chicago',
  },
  'liga-mx': {
    tijuana: 'America/Tijuana',
    'club tijuana': 'America/Tijuana',
    juarez: 'America/Ciudad_Juarez',
    'fc juarez': 'America/Ciudad_Juarez',
    mazatlan: 'America/Mazatlan',
    'club leon': 'America/Mexico_City',
    monterrey: 'America/Monterrey',
    'rayados monterrey': 'America/Monterrey',
  },
  'brasileirao-serie-a': {
    fortaleza: 'America/Fortaleza',
    ceara: 'America/Fortaleza',
    bahia: 'America/Bahia',
    vitoria: 'America/Bahia',
    'sport recife': 'America/Recife',
  },
}

function normalizeTeamName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getVenueTimeZone(leagueId: string, homeTeamName?: string) {
  const normalized = homeTeamName ? normalizeTeamName(homeTeamName) : ''
  return teamTimeZones[leagueId]?.[normalized] ?? leagueTimeZones[leagueId] ?? 'UTC'
}
