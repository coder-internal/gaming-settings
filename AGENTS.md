<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## If you're helping someone set up their own instance

This repo is a shared template, not a shared app — see the README's
["Getting your own instance"](README.md#getting-your-own-instance) and
["Deploying"](README.md#deploying) sections for the full walkthrough
(fork the repo, deploy to Vercel + Neon Postgres, set `APP_PASSCODE` and
optional `STEAM_API_KEY`/`STEAM_ID`/`XBL_API_KEY`/`API_TOKEN`). Point the
user there rather than improvising deployment steps. `docs/ENVIRONMENT.md`
has the definitive list of every environment variable.
