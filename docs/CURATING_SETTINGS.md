# Curating settings profiles (repeatable workflow)

This is the process used to populate the first 28 curated `SettingsProfile`
rows (7 games x 4 computers), written down so a future agent session (or
Rob) can repeat it for new games/computers without re-deriving the approach.

Prefer the MCP server (`mcp-server/`) or the JSON API (`docs/API.md`) for
every write in this workflow. Do not scrape the HTML app with Playwright for
new work; that was a stopgap before the API/MCP server existed.

## 1. Get real IDs first, never guess them

Call `list_games` and `list_computers` (MCP tools) — or
`GET /api/games` / `GET /api/computers` with `curl` — to get the exact
`gameId`/`computerId` values and each computer's real specs (cpu, gpu,
ramGb, os) and any `storageNotes` describing its target resolution/fps.
If a game isn't in the library yet (e.g. a Game Pass title never launched,
so it never synced), add it with `create_game` first.

## 2. Confirm scope with Rob

Get an explicit list of which games and which computers to cover, and don't
assume "all computers" or guess ambiguous titles (e.g. "Slay the Spire" vs
"Slay the Spire 2"). Ask rather than guess when a title is ambiguous or
missing from the library.

## 3. Research per game, not per profile

Settings differ mainly by **game engine + GPU vendor**, not by computer, so
spawn one research subagent per game (`spawn_agent`, `type: "general"`,
web-search only, no file edits), covering all target computers in one pass.
Give each subagent:

- The exact hardware + target resolution/fps for every computer in scope.
- An explicit instruction to verify real facts rather than invent settings:
  - Does the game actually support ray tracing / DLSS / FSR / XeSS / frame
    generation? Many games only support a subset (e.g. AMD-only frame gen,
    or upscalers added by unofficial mods rather than the base game).
    Don't assume every modern game has all of them.
  - For Xbox Play Anywhere / Game Pass titles: is the game even on Steam or
    does it need the Xbox/EA app? Does it run on Steam Deck at all (check
    ProtonDB), and are there known anti-cheat/Proton-version caveats for
    multiplayer specifically?
  - For any GPU-vendor-specific quirk claims (e.g. "XeSS underperforms FSR
    in this title"), ask the subagent to confirm with a source rather than
    generalize from other titles.
  - Ask for the three-section output shape directly (`system`,
    `gpuSoftware`, `inGame`) with brief inline source citations, and to be
    explicit about uncertainty ("likely", "unconfirmed") rather than
    inventing precise numbers.

See the git history of this file's introducing commit for the exact prompt
template used for the original 7 games, if a close starting point helps.

## 4. Compile into the profile schema

Each profile needs:

```json
{
  "gameId": "...",
  "computerId": "...",
  "targetResolution": "3840x2160 | 2560x1440 | 1920x1080 | 1280x800",
  "targetFps": 240 | 120 | 60 | 40 | 30,
  "settings": {
    "system": { "Key": "Value" },
    "gpuSoftware": { "Key": "Value" },
    "inGame": { "Key": "Value" }
  },
  "notes": "caveats, sources, honest compatibility assessment"
}
```

Use the computer's *actual* stated target from `storageNotes`/context, not a
default. If research shows the primary target isn't realistically
achievable (e.g. an Xbox Play Anywhere title with a hard ~60fps engine cap,
or unclear Steam Deck compatibility), use the honest achievable target
instead and explain why in `notes` — don't force an unrealistic number into
the field just to fill it in.

## 5. Write with `bulk_upsert_settings_profiles`

Call the MCP tool (or `POST /api/settings-profiles/bulk`) with the full
array in one call. It's idempotent (upserts on the
`gameId`+`computerId`+`targetResolution`+`targetFps` key) and reports
per-item success/failure, so re-running after fixing one bad entry is safe.

## 6. Verify

Call `get_settings_profiles` (or `GET /api/settings-profiles`) filtered by
one `gameId`/`computerId` you just wrote, and confirm the three sections
came through as expected before considering the batch done.
