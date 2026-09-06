# Environment variables

This app runs on Vercel with the Neon Postgres integration (installed via
Vercel Marketplace, "Storage" tab, no custom env var prefix). Neon's
integration auto-creates a large number of connection-string variables;
we only use two of them. This file exists so future sessions (human or
agent) don't have to rediscover this by trial and error.

## Variables this app actually reads

| Variable                | Source                          | Used for |
|--------------------------|----------------------------------|----------|
| `DATABASE_URL`           | Neon integration (auto-created)  | Pooled connection, used by Prisma Client at runtime (`prisma/schema.prisma` `datasource.url`) |
| `DATABASE_URL_UNPOOLED`  | Neon integration (auto-created)  | Direct/non-pooled connection, used by Prisma for migrations (`prisma/schema.prisma` `datasource.directUrl`) |
| `APP_PASSCODE`           | Manually set in Vercel           | Shared passcode for the single-user auth gate (`src/lib/auth.ts`, `src/proxy.ts`) |
| `STEAM_API_KEY`          | Manually set in Vercel           | Steam Web API key, used by the Steam library sync (`src/app/(app)/games/actions.ts`) |
| `STEAM_ID`               | Manually set in Vercel           | Your SteamID64, used by the Steam library sync above |
| `XBL_API_KEY`            | Manually set in Vercel           | OpenXBL (xbl.io) API key, used by the Xbox library sync (`src/app/(app)/games/actions.ts`) |
| `XUID`                   | Manually set in Vercel           | Your Xbox XUID. Not currently read by the code (the OpenXBL title history endpoint returns your own history using the API key alone), kept for future use (e.g. per-title stats lookups) |
| `API_TOKEN`              | Manually set in Vercel           | Bearer token for the JSON API under `/api/*` (games, computers, settings-profiles), used by the MCP server in `mcp-server/` and any other programmatic client. See `docs/API.md`. Not the same as `APP_PASSCODE`; keep them distinct so the API credential can be rotated independently of the human login. |

Prisma originally used a variable named `DIRECT_URL` (a common convention
in Prisma+Neon guides), but Neon's Vercel integration does not create a
variable with that exact name; it creates `DATABASE_URL_UNPOOLED` instead.
The schema was updated to reference `DATABASE_URL_UNPOOLED` directly rather
than manually duplicating the secret into a second variable, so there's
nothing to keep in sync if Neon ever rotates credentials.

## Other variables Neon creates that we don't use

The Neon integration also creates: `PGUSER`, `PGDATABASE`, `PGPASSWORD`,
`PGHOST`, `PGHOST_UNPOOLED`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`,
`POSTGRES_URL_NON_POOLING`, `POSTGRES_URL_NO_SSL`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_HOST`,
`NEON_PROJECT_ID`, and a Neon Auth variable (`NEON_AUTH_...` /
`VITE_NEON_AUTH_...`, from Neon's optional Auth product, unrelated to this
app's passcode gate). These are harmless to leave in place; nothing in
this codebase reads them. Don't delete them from Vercel, since Neon
manages them as part of the integration.

## Xbox library sync

Microsoft doesn't offer a self-serve Xbox Live API for personal use.
Instead, this app uses [OpenXBL](https://xbl.io) (`xbl.io`), an
unofficial, free third-party API that authenticates with your Microsoft
account and issues a simple API key (similar developer experience to
Steam's). Its `/api/v2/player/titleHistory` endpoint returns games you've
launched at least once; Game Pass titles you own but have never played
won't appear; add those manually via `/games/new`.

## Sensitive variables and `vercel env pull`

All of the Neon-provided variables above are marked **Sensitive** in
Vercel. Sensitive variables are write-only: Vercel injects them into
builds and runtime, but `vercel env pull` (and the API) returns an empty
string for them locally, even when logged in and linked to the project.
This is expected, not a bug. It means:

- Database migrations must run as part of the Vercel build itself, where
  the real values are available (`prisma migrate deploy` is chained into
  the `build` script in `package.json`), rather than by pulling env vars
  and running migrations from a local machine or workspace.
- To run one-off scripts against production data from a local shell,
  temporarily copy the real connection string from the Vercel dashboard
  (reveal the value in the UI) rather than relying on `env pull`.

## Local development

Copy `.env.example` to `.env` and fill in `DATABASE_URL` /
`DATABASE_URL_UNPOOLED` from either:
- `vercel env pull` (once the Vercel CLI is linked to this project), or
- a local Postgres instance (e.g. `docker run -p 5433:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine`, using the same URL for both variables since there's no pooling to worry about locally).
