#!/usr/bin/env node
// MCP server for gaming-settings. Exposes the app's /api/* JSON API
// (games, computers, settings profiles) as MCP tools so an agent can read
// the library and write curated SettingsProfile rows directly, without
// scraping the HTML app with a browser automation tool.
//
// Config (env vars):
//   GAMING_SETTINGS_BASE_URL   default: https://gaming-settings.vercel.app
//   GAMING_SETTINGS_API_TOKEN  required, must match the app's API_TOKEN env var

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.GAMING_SETTINGS_BASE_URL ?? "https://gaming-settings.vercel.app";
const API_TOKEN = process.env.GAMING_SETTINGS_API_TOKEN;

if (!API_TOKEN) {
  console.error("GAMING_SETTINGS_API_TOKEN is not set; every API call will fail with 401.");
}

async function apiFetch(path, options = {}) {
  const response = await fetch(new URL(path, BASE_URL), {
    ...options,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_TOKEN}`,
      ...options.headers,
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function toolResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "gaming-settings", version: "1.0.0" });

server.registerTool(
  "list_games",
  {
    title: "List games",
    description:
      "List every game in the library (id, name, platform, steamAppId, xboxTitleId). Use this to find the exact gameId needed for other tools.",
  },
  async () => toolResult(await apiFetch("/api/games"))
);

server.registerTool(
  "create_game",
  {
    title: "Add a game",
    description:
      "Add a game to the library that isn't already synced from Steam/Xbox (e.g. a Game Pass title never launched).",
    inputSchema: {
      name: z.string().describe("Display name of the game."),
      platform: z.enum(["STEAM", "XBOX", "OTHER"]).default("OTHER"),
      steamAppId: z.number().int().optional(),
      xboxTitleId: z.string().optional(),
      notes: z.string().optional(),
    },
  },
  async (args) => toolResult(await apiFetch("/api/games", { method: "POST", body: JSON.stringify(args) }))
);

server.registerTool(
  "list_computers",
  {
    title: "List computers",
    description: "List every computer (id, name, cpu, gpu, ramGb, os, storageNotes). Use this to find the exact computerId needed for other tools.",
  },
  async () => toolResult(await apiFetch("/api/computers"))
);

const sectionShape = z.record(z.string(), z.string());
const settingsShape = {
  system: sectionShape.optional().describe("OS/Windows/SteamOS-level settings, e.g. power plan, HAGS, VRR, TDP."),
  gpuSoftware: sectionShape
    .optional()
    .describe("NVIDIA App / Intel Arc Software / AMD Software driver-level settings."),
  inGame: sectionShape.optional().describe("In-game graphics options."),
};

const profileShape = {
  gameId: z.string(),
  computerId: z.string(),
  targetResolution: z.enum(["3840x2160", "2560x1440", "1920x1080", "1280x800"]),
  targetFps: z.union([z.literal(240), z.literal(120), z.literal(60), z.literal(40), z.literal(30)]),
  settings: z.object(settingsShape).describe("At least one of system/gpuSoftware/inGame must have a key/value pair."),
  notes: z.string().optional(),
};

server.registerTool(
  "get_settings_profiles",
  {
    title: "Get settings profiles",
    description:
      "List curated settings profiles, optionally filtered by gameId and/or computerId. Use before upserting to see what already exists.",
    inputSchema: {
      gameId: z.string().optional(),
      computerId: z.string().optional(),
    },
  },
  async ({ gameId, computerId }) => {
    const params = new URLSearchParams();
    if (gameId) params.set("gameId", gameId);
    if (computerId) params.set("computerId", computerId);
    const qs = params.toString();
    return toolResult(await apiFetch(`/api/settings-profiles${qs ? `?${qs}` : ""}`));
  }
);

server.registerTool(
  "upsert_settings_profile",
  {
    title: "Upsert one settings profile",
    description:
      "Create or update the curated SettingsProfile for one (game, computer, resolution, fps) combination. Idempotent: re-running with the same key updates the existing row.",
    inputSchema: profileShape,
  },
  async (args) =>
    toolResult(await apiFetch("/api/settings-profiles", { method: "POST", body: JSON.stringify(args) }))
);

server.registerTool(
  "bulk_upsert_settings_profiles",
  {
    title: "Bulk upsert settings profiles",
    description:
      "Create or update many curated SettingsProfile rows in one call, e.g. after researching N games across M computers. Returns per-item success/failure; a bad entry doesn't fail the whole batch.",
    inputSchema: {
      profiles: z.array(z.object(profileShape)).min(1),
    },
  },
  async (args) =>
    toolResult(await apiFetch("/api/settings-profiles/bulk", { method: "POST", body: JSON.stringify(args) }))
);

const transport = new StdioServerTransport();
await server.connect(transport);
