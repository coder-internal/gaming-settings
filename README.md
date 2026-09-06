# gaming-settings

Personal, single-user web app to track your game library, your computers,
and the optimal graphics settings for each (game, computer, target) combo.
Mobile-first: designed to be pulled up on your phone while sitting at the
machine that's actually running the game.

## Stack

- Next.js 16 (App Router, TypeScript), deployed on Vercel
- Tailwind CSS v4
- Prisma 6 + Postgres (Neon, via the Vercel Marketplace integration)
- Auth: single shared passcode gate (see `src/lib/auth.ts` / `src/proxy.ts`).
  This is a personal single-user app, so a full auth system is unnecessary.

## Data model

- **Game**: name, platform (Steam / Xbox / Other), optional Steam app ID
- **Computer**: name, CPU, GPU, RAM, OS, storage notes
- **SettingsProfile**: settings for a (game, computer, target resolution,
  target FPS) combination, with a `source` of `CURATED` (entered by hand) or
  `AI_GENERATED` (phase 2)

See `prisma/schema.prisma` for the full schema.

## Settings recommendations: phase 1 vs phase 2

There's no API that returns "optimal settings for game X on GPU Y." Phase 1
of this app stores hand-curated `SettingsProfile` rows (entered via the
"Add settings" form, or `prisma/seed.ts`). The `/recommend` page reads these
directly.

`src/lib/recommender.ts` defines a `SettingsRecommender` interface with a
stub implementation for phase 2: swapping in a real LLM call (OpenAI or
Anthropic) to auto-generate a profile when nothing has been curated yet,
without changing any call sites.

## JSON API and MCP server

`/api/*` exposes a small JSON API (Bearer-token auth, separate from the
passcode-gated HTML app) for programmatic reads/writes of games, computers,
and settings profiles. See `docs/API.md`.

`mcp-server/` wraps that API as an MCP server, so an agent can call
`list_games`, `create_game`, `list_computers`, `get_settings_profiles`,
`upsert_settings_profile`, and `bulk_upsert_settings_profiles` as tools
directly, instead of driving a browser. See `mcp-server/README.md` for setup
and registration, and `docs/CURATING_SETTINGS.md` for the repeatable
research-then-populate workflow used to build out curated profiles for a
batch of games/computers.

## Local development

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL/DATABASE_URL_UNPOOLED and APP_PASSCODE
pnpm db:migrate         # creates tables in your dev database
pnpm db:seed            # optional: adds one example game/computer/profile
pnpm dev
```

Requires a local or remote Postgres instance for
`DATABASE_URL`/`DATABASE_URL_UNPOOLED`. See `docs/ENVIRONMENT.md` for what
every environment variable is for and where it comes from.

## Deploying

1. Import the repo into Vercel.
2. Add the Neon Postgres integration from the Vercel Marketplace (Storage
   tab), with no custom variable prefix. It creates `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` automatically, among others (see
   `docs/ENVIRONMENT.md`).
3. Set `APP_PASSCODE` in the Vercel project's environment variables.
4. Deploy. Migrations run automatically as part of the build (`prisma migrate deploy` runs before `next build`; see `package.json`), so there's no separate manual migration step.
5. Set `STEAM_API_KEY` and `STEAM_ID` to enable Steam library sync (already wired up; see `docs/ENVIRONMENT.md`).
6. Set `XBL_API_KEY` (and optionally `XUID`) to enable Xbox library sync (already wired up; see `docs/ENVIRONMENT.md`).
7. Set `API_TOKEN` (any long random string) to enable the JSON API / MCP server (see `docs/API.md`, `mcp-server/README.md`).
