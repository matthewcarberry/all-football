# Premier League Dashboard

Docker-ready React + TypeScript dashboard for following the 2026/27 English Premier League season.

## What is included

- Opening-week matches and a season countdown
- Premier League-style 20-club standings table
- Clickable club profiles with upcoming matches
- Light mode, dark mode, and color blind mode toggles
- Express API layer with cached match data
- Static pre-season shell while live standings are unavailable

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
docker build -t all-football .
docker run -p 9999:8080 -e PORT=8080 -e CACHE_TTL_MS=60000 all-football
```

The container listens on port `8080`.

You can also use Compose:

```bash
docker compose up -d --build
```

The compose file maps the app to host port `9999` and does not require a `.env` file.

Docker notes:

- The image is a multi-stage build on `node:22-bookworm-slim`: it compiles the Vite client and the Express server, then ships only production dependencies plus `dist` and `dist-server`.
- The image has a built-in healthcheck against `/api/health`, so `docker ps` shows `healthy` once the server is up.
- Compose mounts `./data` at `/app/data` to persist the API-Football usage counter across restarts.
- To enable API-Football data, copy `.env.example` to `.env` and set `API_FOOTBALL_KEY`; Compose picks it up automatically. `.env` and `data` are ignored by git and by the Docker build context.
- Logs: `docker compose logs -f all-football`. Stop: `docker compose down`.

## Unraid Notes

An Unraid template lives at `unraid/all-football.xml`. It pulls `ghcr.io/matthewcarberry/all-football:latest`, which the `Publish Docker image` GitHub Actions workflow builds from this repository on every push to `main`. To use it, copy the file to `/boot/config/plugins/dockerMan/templates-user/` on the Unraid server, then pick `all-football` under Docker > Add Container > Template. If the GitHub package is private, make it public or add a ghcr.io login on Unraid first.

Or set it up by hand as a custom Docker app:

- Repository/image: the image you build and push, or build locally from this folder
- Container port: `8080`
- Host port: `9999`
- Environment variables: copy values from `.env.example`
- Healthcheck URL: `http://[UNRAID_IP]:9999/api/health`

The dashboard works without credentials. It ships with the official 2026/27 opening matches and clearly labels the league table as pre-season until current records are available.

## Remote Access

The app does not include its own login screen. For internet access, put it behind one of these:

- Recommended: Cloudflare Tunnel with Cloudflare Access if you want a public hostname without opening router ports.
- Also fine: an existing reverse proxy on Unraid, such as Nginx Proxy Manager or SWAG, if you already expose services that way.
- Private-only: Tailscale/WireGuard VPN if only you need access.

For Cloudflare Tunnel, publish the service as:

- Type: `HTTP`
- URL: `http://[UNRAID_IP]:9999`
- Hostname: your chosen subdomain, for example `all-football.example.com`

Then add a Cloudflare Access policy if you do not want the dashboard open to everyone on the internet.

## Data Sources

- 2026/27 match list: [Premier League](https://www.premierleague.com/en/news/4675097/all-380-%66ixtures-for-202627-premier-league-season)
- UI palette: [Premier League Color Palette](https://www.color-hex.com/color-palette/44426)
- U.S. broadcast platforms and opening-week coverage: [NBC Sports](https://www.nbcsports.com/pressbox/press-releases/the-2026-27-premier-league-season-kicks-off-in-one-month-across-platforms-of-nbcuniversal-with-nbc-sports-studio-team-on-site-in-u-k)

Optional `.env` values:

```bash
PORT=8787
CACHE_TTL_MS=60000
LIVE_CACHE_TTL_MS=15000
```
