# Deployment

This dashboard is ready to run as a Docker container on Unraid. The app listens on container port `8080`; the included Compose file maps it to host port `9999`.

## 1. Build And Run On Unraid

Copy this project folder to a location on the Unraid server, then run:

```bash
docker compose up -d --build
```

After it starts, check:

```text
http://[UNRAID_IP]:9999
http://[UNRAID_IP]:9999/api/health
```

The health endpoint should return JSON with `"ok": true`.

## 2. Make It Reachable From Anywhere

Recommended path: Cloudflare Tunnel.

Why this path: it gives you a normal HTTPS hostname without opening inbound router ports to your Unraid server. Cloudflare's current dashboard flow creates a tunnel, runs a `cloudflared` connector, and publishes an HTTP service to a hostname.

Cloudflare Tunnel settings if you run the tunnel as a separate Unraid app:

```text
Service type: HTTP
Service URL: http://[UNRAID_IP]:9999
Public hostname: all-football.[YOUR_DOMAIN]
```

Cloudflare Tunnel settings if you use the included Compose override:

```text
Service type: HTTP
Service URL: http://all-football:8080
Public hostname: all-football.[YOUR_DOMAIN]
```

To run the included override, create a `.env` file with your tunnel token:

```bash
CLOUDFLARE_TUNNEL_TOKEN=your-cloudflare-token
```

Then start both services:

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudflare.example.yml up -d --build
```

Use Cloudflare Access if you want this private to you and approved users. Without an Access policy, anyone who knows the hostname can view the dashboard.

Official references:

- Cloudflare Tunnel setup: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/
- cloudflared Docker image: https://hub.docker.com/r/cloudflare/cloudflared

## 3. Unraid App Template Values

If creating it manually in Unraid's Docker UI:

```text
Name: all-football
Repository: all-football
Network type: bridge
Container port: 8080
Host port: 9999
PORT: 8080
CACHE_TTL_MS: 60000
LIVE_CACHE_TTL_MS: 15000
```

## 4. Alternatives

Use an existing reverse proxy if you already run one. Point it at `http://[UNRAID_IP]:9999` and terminate HTTPS at the proxy.

Use Tailscale or WireGuard if you only want private access from your own devices and do not need a public hostname.
