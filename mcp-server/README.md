# gaming-settings MCP server

An [MCP](https://modelcontextprotocol.io) server that exposes the
gaming-settings app's JSON API (`/api/*`) as tools, so an agent can read the
game/computer library and write curated `SettingsProfile` rows directly,
instead of scraping the HTML app with browser automation.

## Tools

- `list_games` — list every game (id, name, platform, steamAppId, xboxTitleId).
- `create_game` — add a game not already synced from Steam/Xbox.
- `list_computers` — list every computer (id, name, cpu, gpu, ramGb, os).
- `get_settings_profiles` — list curated profiles, optionally filtered by
  `gameId` and/or `computerId`.
- `upsert_settings_profile` — create or update one curated profile for a
  `(gameId, computerId, targetResolution, targetFps)` combination.
- `bulk_upsert_settings_profiles` — create or update many profiles in one
  call (e.g. after researching N games across M computers). Per-item
  success/failure is reported; one bad entry doesn't fail the whole batch.

## Setup

```sh
cd mcp-server
npm install
```

Requires two env vars when run:

- `GAMING_SETTINGS_API_TOKEN` — must match the `API_TOKEN` env var set on
  the deployed app (Vercel → Settings → Environment Variables).
- `GAMING_SETTINGS_BASE_URL` — optional, defaults to
  `https://gaming-settings.vercel.app`.

## Registering with an MCP client

Example config (stdio transport):

```json
{
  "mcpServers": {
    "gaming-settings": {
      "command": "node",
      "args": ["/absolute/path/to/gaming-settings/mcp-server/index.js"],
      "env": {
        "GAMING_SETTINGS_API_TOKEN": "<value of API_TOKEN from Vercel>"
      }
    }
  }
}
```

Claude Desktop, Claude Code, and Coder's MCP integration all accept this
same `command`/`args`/`env` shape (file location differs per client).

## Why a Bearer token instead of the passcode cookie?

The HTML app (`/login`, `/games`, `/computers`, `/recommend`) is gated by a
single shared passcode stored in a session cookie (`src/proxy.ts`), which is
designed for a human filling out a login form once per session. A
non-interactive MCP client needs a stable, revocable credential instead, so
`/api/*` routes check an `Authorization: Bearer <API_TOKEN>` header
(`src/lib/api-auth.ts`) and are excluded from the passcode gate entirely.
Rotate `API_TOKEN` in Vercel any time without affecting the human login.
