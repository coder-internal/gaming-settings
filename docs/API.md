# JSON API (`/api/*`)

A small JSON API for programmatic access, separate from the passcode-gated
HTML app. Used by `mcp-server/` and available for any other script/agent
that needs to read the library or write curated settings profiles without
driving a browser.

## Auth

Every route requires `Authorization: Bearer <API_TOKEN>`, where `API_TOKEN`
is the env var set in Vercel (see `docs/ENVIRONMENT.md`). Requests without a
valid token get `401 { "error": "Unauthorized" }`. This is intentionally
separate from `APP_PASSCODE` (the human login cookie); the two can be
rotated independently.

`/api/*` is excluded from the passcode-gate proxy (`src/proxy.ts`) entirely,
since it authenticates itself.

## Endpoints

### `GET /api/games`

Lists every game. Response: `{ "games": [{ id, name, platform, steamAppId, xboxTitleId, notes, ... }] }`.

### `POST /api/games`

Creates a game. Body:

```json
{ "name": "Unravel Two", "platform": "XBOX", "notes": "Xbox Game Pass" }
```

`platform` is one of `STEAM` | `XBOX` | `OTHER` (default `OTHER`).
`steamAppId` (number) and `xboxTitleId` (string) are optional.

### `GET /api/computers`

Lists every computer. Response: `{ "computers": [{ id, name, cpu, gpu, ramGb, os, storageNotes }] }`.

### `GET /api/settings-profiles?gameId=&computerId=`

Lists curated settings profiles, optionally filtered by `gameId` and/or
`computerId` (both optional query params). Response includes the related
`game` and `computer` records.

### `POST /api/settings-profiles`

Upserts one profile, keyed by `(gameId, computerId, targetResolution, targetFps)`.
Body:

```json
{
  "gameId": "cmr6...",
  "computerId": "cmr6...",
  "targetResolution": "3840x2160",
  "targetFps": 120,
  "settings": {
    "system": { "Power Plan": "Balanced" },
    "gpuSoftware": { "App": "NVIDIA App" },
    "inGame": { "Ray Tracing": "Off" }
  },
  "notes": "optional free text"
}
```

`targetResolution` must be one of `3840x2160` | `2560x1440` | `1920x1080` |
`1280x800`. `targetFps` must be one of `240` | `120` | `60` | `40` | `30`
(matches the options in the HTML form). At least one section in `settings`
must have at least one key/value pair. Always sets `source: "CURATED"`.

### `POST /api/settings-profiles/bulk`

Same shape, batched: `{ "profiles": [ {...}, {...}, ... ] }`. Processes
sequentially and returns per-item results rather than failing the whole
batch on one bad entry:

```json
{
  "succeeded": 27,
  "failed": 1,
  "results": [
    { "index": 0, "ok": true, "id": "cmr7..." },
    { "index": 1, "ok": false, "error": "targetFps must be one of 240, 120, 60, 40, 30." }
  ]
}
```

## Local testing

```sh
curl -s https://gaming-settings.vercel.app/api/games \
  -H "Authorization: Bearer $API_TOKEN"
```

Against a local dev server, the same routes work with `http://localhost:PORT`.
