# World Cup Dashboard

Docker-ready React + TypeScript dashboard for following the 2026 World Cup matchday and knockout path.

## What is included

- Upcoming matches as the primary view
- Prominent styling for matches that affect Round of 32 placement
- Light mode, dark mode, and color blind mode toggles
- Clickable teams with source-aware lineup/player-stat availability
- Knockout bracket with scheduled date/location labels
- Express API layer for OpenFootball/ESPN/Wikipedia provider proxying and caching
- Static fallback shell only when the public providers are unavailable

## Local Development

```bash
npm install
npm run dev
```

The dev server uses:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`

On Windows PowerShell, use `npm.cmd` if script execution blocks `npm.ps1`:

```bash
npm.cmd run dev
```

## Production Build

```bash
npm run build
npm start
```

Set `NODE_ENV=production` when running the built server directly so Express serves the Vite static files.

## Docker

```bash
docker build -t world-cup-dashboard .
docker run -p 8088:8080 -e PORT=8080 -e CACHE_TTL_MS=60000 -e LIVE_CACHE_TTL_MS=15000 world-cup-dashboard
```

The container listens on port `8080`.

You can also use Compose:

```bash
docker compose up -d --build
```

The compose file maps the app to host port `8088` and does not require a `.env` file.

## Unraid Notes

Use this as a custom Docker app:

- Repository/image: the image you build and push, or build locally from this folder
- Container port: `8080`
- Host port: any available Unraid port, for example `8088`
- Environment variables: copy values from `.env.example`
- Healthcheck URL: `http://[UNRAID_IP]:8088/api/health`

The dashboard works without credentials. It pulls match schedule/results/bracket data from OpenFootball, overlays live score windows from ESPN's World Cup scoreboard, pulls squad tables from Wikipedia, and does not generate fake player stats.

## Remote Access

The app does not include its own login screen. For internet access, put it behind one of these:

- Recommended: Cloudflare Tunnel with Cloudflare Access if you want a public hostname without opening router ports.
- Also fine: an existing reverse proxy on Unraid, such as Nginx Proxy Manager or SWAG, if you already expose services that way.
- Private-only: Tailscale/WireGuard VPN if only you need access.

For Cloudflare Tunnel, publish the service as:

- Type: `HTTP`
- URL: `http://[UNRAID_IP]:8088`
- Hostname: your chosen subdomain, for example `worldcup.example.com`

Then add a Cloudflare Access policy if you do not want the dashboard open to everyone on the internet.

## Data Sources

- Match schedule/results/bracket: `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json`
- Live scores/status: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
- Squad tables: `https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads`
- Team rankings/group constants: mirrored from Ben's dashboard source in `C:\Users\Matt Carberry\Downloads\bens-world-cup-dashboard`

Optional `.env` values:

```bash
PORT=8787
CACHE_TTL_MS=60000
LIVE_CACHE_TTL_MS=15000
```
