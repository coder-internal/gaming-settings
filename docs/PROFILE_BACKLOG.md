# Gaming Settings — Full Library Profile Backlog

**Purpose of this file:** durable, resumable tracker for populating curated
`SettingsProfile` rows for every remaining game in the library, across all 4
computers. Written so that if this chat session compacts or a fresh session
picks this up, it can resume with zero re-derivation.

## Ground truth vs. this file

The **actual source of truth for progress is the production database**, not
this file. At any time, from any session, run:

```sh
curl -s https://gaming-settings.vercel.app/api/games \
  -H "Authorization: Bearer $API_TOKEN" > /tmp/games.json
curl -s https://gaming-settings.vercel.app/api/settings-profiles \
  -H "Authorization: Bearer $API_TOKEN" > /tmp/profiles.json
node -e "
const games = require('/tmp/games.json').games;
const profiles = require('/tmp/profiles.json').profiles;
const count = {};
for (const p of profiles) count[p.gameId] = (count[p.gameId]||0)+1;
const todo = games.filter(g => (count[g.id]||0) < 4).sort((a,b)=>a.name.localeCompare(b.name));
console.log('remaining:', todo.length);
todo.forEach(g => console.log(g.name, g.id));
"
```

A game is **done** once it has 4 SettingsProfile rows (one per computer:
AI-NT-No-Problem, Shadowtrooper, Good Vibes, Steam Deck). This file's
per-cluster checkboxes are a convenience index on top of that ground truth,
grouping games into research batches — update them after each bulk upsert,
but if they ever drift out of sync, trust the DB query above.

`API_TOKEN` = `6c43972947a3afc4020e60d74e4bcdcb47e0489a9833a4cae2896d4007412c84`
(also in Vercel; see `docs/ENVIRONMENT.md`).

## Computers (unchanged, for reference)

- AI-NT-No-Problem — `cmr6jkxtg0001jr04gv7u6a93` — RTX 5090, 9950X3D, Win11 — 4K240 (fallback 4K60)
- Shadowtrooper — `cmr6jkxb40000l404h0mqkt41` — RTX 5080, Core Ultra 9 285K, Win11 — 4K120 (fallback 1440p120)
- Good Vibes — `cmr6jky5g0000le04dt7u4t74` — Arc B580, Core Ultra 5 245K, Win11 — 1440p120 (fallback 1440p60)
- Steam Deck — `cmr6jkxl50000jr04ot3odqg2` — RDNA2 iGPU, SteamOS 3 — whatever's achievable

## Already done (7 games, from the first batch)

Dead Cells, Gears 5, Halo: The Master Chief Collection, Horizon Zero Dawn
Remastered, Resident Evil 4, Slay the Spire 2, Unravel Two.

## Remaining: 13 research clusters, 66 games

Grouped by engine/franchise so one research subagent can cover several
related titles efficiently instead of one spawn per game (66 individual
spawns would be prohibitively slow/expensive). Each cluster still gets
per-game settings and per-computer breakdown — grouping only shares the
subagent's context/research pass, not the output granularity.

- [x] **Cluster 1 — Valve legacy multiplayer classics** (20 games, all
  trivially light Source/GoldSrc engine titles): Counter-Strike,
  Counter-Strike: Condition Zero, Counter-Strike: Condition Zero Deleted
  Scenes, Counter-Strike: Source, Day of Defeat, Day of Defeat: Source,
  Deathmatch Classic, Half-Life, Half-Life 2, Half-Life 2: Deathmatch,
  Half-Life Deathmatch: Source, Half-Life: Blue Shift, Half-Life: Opposing
  Force, Half-Life: Source, Left 4 Dead, Left 4 Dead 2, Portal, Portal 2,
  Ricochet, Team Fortress Classic
- [x] **Cluster 2 — Batman Arkham trilogy** (3): Batman: Arkham Asylum GOTY
  Edition, Batman: Arkham City GOTY, Batman: Arkham Knight
- [x] **Cluster 3 — Racing/sim** (3): Assetto Corsa Competizione, F1 24,
  F1 Manager 2024
- [x] **Cluster 4 — Metro series** (4): Metro 2033 Redux, Metro: Last Light
  Redux, Metro Exodus, Metro Exodus Enhanced Edition
- [x] **Cluster 5 — STAR WARS** (3): STAR WARS Jedi: Fallen Order, STAR WARS
  Jedi: Survivor, STAR WARS Battlefront II
- [x] **Cluster 6 — FINAL FANTASY VII** (3): FF7 Remake Intergrade, FF7
  Remake Intergrade Demo, FF7 Rebirth
- [x] **Cluster 7 — Modern ARPGs** (6): Diablo IV, Grim Dawn, Last Epoch,
  Path of Exile, Path of Exile 2, Titan Quest Anniversary Edition
- [x] **Cluster 8 — Light indie/roguelike** (7): Balatro, Deep Rock Galactic:
  Survivor, Geometry Dash, Hades, Hades II, Hollow Knight, Slay the Spire
  (the original, not Spire 2)
- [x] **Cluster 9 — BioWare/Larian RPGs** (3): Baldur's Gate 3, Dragon Age
  Inquisition, Mass Effect Legendary Edition
- [x] **Cluster 10 — id Tech shooters** (2): DOOM Eternal, DOOM: The Dark Ages
- [x] **Cluster 11 — Recent UE heavy hitters** (3): Clair Obscur: Expedition
  33, Shadow of the Tomb Raider, Warhammer 40,000: Space Marine 2
- [x] **Cluster 12 — Misc AA/sim** (7): Black Mesa, Cities: Skylines, Cities:
  Skylines II, Control Ultimate Edition, HITMAN World of Assassination,
  LEGO Star Wars: The Skywalker Saga, Microsoft Flight Simulator 2024
- [x] **Cluster 13 — Big standalone RPGs** (2): Fallout 4, The Witcher 3:
  Wild Hunt

Total: 20+3+3+4+3+3+6+7+3+2+3+7+2 = 66. Matches the DB query above exactly
as of 2026-07-04.

## Per-cluster workflow (same as docs/CURATING_SETTINGS.md, applied per cluster)

1. Spawn one subagent (`type: general`, web research only, no file edits)
   per cluster, given the exact computer specs/targets and the list of
   games in that cluster. Ask for the three-section (system/gpuSoftware/
   inGame) breakdown per game per computer, honest about uncertainty,
   verifying real upscaler/RT support and Steam Deck/Proton compatibility
   rather than assuming.
2. Compile the subagent's answer into `profiles-data.js`-style objects
   (gameId, computerId, targetResolution, targetFps, settings, notes).
3. POST the whole cluster in one call to
   `https://gaming-settings.vercel.app/api/settings-profiles/bulk` with
   the `API_TOKEN` bearer header.
4. Check the `succeeded`/`failed` counts in the response; fix and retry any
   failed entries.
5. Check the box for that cluster in this file and commit
   (`git commit -m "docs: mark cluster N done in profile backlog"`,
   direct to main is fine for this tracking-only doc — no app code changes,
   no deploy).

## In-flight subagents (fill in as spawned; check `list_agents` if this
## session loses context)

| Cluster | chat_id | status |
|---------|---------|--------|
| 1 (Valve legacy) | ed8e6a05-445e-44a2-8689-b985150881ee | DONE (80 profiles, 20 games) |
| 2 (Batman Arkham) | c921e30d-f1ab-4abe-8471-6258e45a2dff | DONE (12 profiles, 3 games) |
| 3 (Racing/sim) | e852a54f-e717-464b-a70d-7cf83aeeb2b9 | DONE (12 profiles, 3 games) |
| 4 (Metro series) | 5e02a763-79d8-49ef-ae54-db929f0a8290 | DONE (16 profiles, 4 games) |
| 5 (STAR WARS) | df7a0c0a-322d-42a6-a498-81416cd7c857 | DONE (12 profiles, 3 games) |

**Wave 1 complete: 33 games / 132 profiles written.** Total in DB after wave 1:
160 profiles across 40 games (7 from the original batch + 33 from wave 1).
33 games remain (clusters 6-13). Next: spawn wave 2 (clusters 6-9), same
process.

## Wave 2 in-flight (clusters 6-9)

| Cluster | chat_id | status |
|---------|---------|--------|
| 6 (FINAL FANTASY VII) | 7a0ed298-9c43-405a-b5ea-2f6400b3c5d6 | spawned, awaiting results |
| 7 (Modern ARPGs) | 7739b0a3-c463-4b13-ac88-4177370d06d7 | spawned, awaiting results |
| 8 (Light indie/roguelike) | 52f359c4-8ca1-49af-b601-2a10a3f4533b | spawned, awaiting results |
| 9 (BioWare/Larian RPGs) | 28b7b8ec-a6f9-40db-960d-e3c4cf4b9404 | spawned, awaiting results |


## Wave 2 complete (clusters 6-9): 13 games / 76 profiles written.
Total in DB after wave 2: 236 profiles across 53 games. 14 games remain
(clusters 10-13). chat_ids: cluster 6=7a0ed298-9c43-405a-b5ea-2f6400b3c5d6,
cluster 7=7739b0a3-c463-4b13-ac88-4177370d06d7,
cluster 8=52f359c4-8ca1-49af-b601-2a10a3f4533b,
cluster 9=28b7b8ec-a6f9-40db-960d-e3c4cf4b9404 (all completed and consumed).

## Wave 3 in-flight (clusters 10-13, final wave)

| Cluster | chat_id | status |
|---------|---------|--------|
| 10 (id Tech shooters) | 22143b36-1ec9-422f-b7e6-421fb5d98249 | spawned, awaiting results |
| 11 (Recent UE heavy hitters) | 92500a70-ebea-4f00-a82b-91e2da52c627 | spawned, awaiting results |
| 12 (Misc AA/sim) | 3e5aa079-f7f0-4499-b077-26a219ef5767 | spawned, awaiting results |
| 13 (Big standalone RPGs) | 60abc747-22e7-4e50-8a78-5d2179cc6af7 | spawned, awaiting results |


## STATUS: COMPLETE (2026-07-04)
All 13 clusters / 66 remaining games done. Combined with the original batch
of 7, every one of the 73 games in the library now has curated profiles for
all 4 computers: 292 SettingsProfile rows total, verified via
`GET /api/settings-profiles` grouped by gameId (0 games with fewer than 4
profiles). Wave 3 chat_ids: cluster 10=22143b36-1ec9-422f-b7e6-421fb5d98249,
cluster 11=92500a70-ebea-4f00-a82b-91e2da52c627,
cluster 12=3e5aa079-f7f0-4499-b077-26a219ef5767,
cluster 13=60abc747-22e7-4e50-8a78-5d2179cc6af7 (all completed and consumed).

If new games are added to the library in the future (via Steam/Xbox sync or
manually), re-run the "ground truth" query at the top of this file to find
which ones need profiles, and repeat the cluster-research-then-bulk-upsert
workflow from docs/CURATING_SETTINGS.md.
