# Phenomenon Indexer (Ponder)

Event indexer for Phenomenon game contracts on **Base Sepolia**. Exposes GraphQL at `/graphql` for the miniapp.

## Setup

1. **Env**: Copy `.env.example` to `.env` and set:
   - `PONDER_RPC_URL_84532` — Base Sepolia RPC (e.g. from root `.env`: same value as `ALCHEMY_BASE_SEPOLIA_RPC_URL`).
   - `DATABASE_SCHEMA` — Required for `npm run start` (e.g. `ponder`; max 45 chars).
   - Optional: `PHENOMENON_ADDRESS`, `GAMEPLAY_ENGINE_ADDRESS`, `TICKET_ENGINE_ADDRESS`, `PHENOMENON_START_BLOCK` (defaults in `ponder.config.ts`).
   - Production: `PONDER_DATABASE_URL` for PostgreSQL (e.g. Railway).

2. **Run locally** (from repo root so RPC URL is available):

   ```bash
   cd indexer
   # Set RPC (use your Alchemy Base Sepolia URL)
   export PONDER_RPC_URL_84532="https://base-sepolia.g.alchemy.com/v2/YOUR_KEY"
   npm run dev
   ```

   API (including GraphiQL): http://localhost:42069  
   GraphQL: http://localhost:42069/graphql

   **If you see "PGlite is closed"** during backfill (e.g. after a file save): the dev server hot-reloads and closes the in-process DB. Either:
   - **Option A**: Set `PONDER_DATABASE_URL` to a Postgres instance (local or cloud). Ponder will use it instead of PGlite, so reloads no longer close the DB. Example local: `postgresql://postgres:postgres@127.0.0.1:5432/ponder`.
   - **Option B**: Run the first full sync with `npm run start` (no file watching, no reload), then use `npm run dev` for day-to-day work. **For `npm run start` you must set `DATABASE_SCHEMA`** in `.env` (e.g. `DATABASE_SCHEMA=ponder`), or pass `--schema ponder`.

3. **Production (Railway)**: Deploy so the miniapp can read indexed data. See **[DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)** for step-by-step (repo root directory, Postgres, start command, env vars). Set `PONDER_RPC_URL_84532` and link Railway Postgres `DATABASE_URL` to the indexer service.

## Contracts (Base Sepolia)

- Phenomenon: `PHENOMENON_ADDRESS`
- GameplayEngine: `GAMEPLAY_ENGINE_ADDRESS`
- TicketEngine: `TICKET_ENGINE_ADDRESS`  
  Start block: `37667749`.

## Schema

- **game** — game number, status, current turn, prophets remaining, etc.
- **prophet** — per-game prophet (address, alive, free, role, acolytes).
- **acolyte** — ticket holdings per game/owner.
- **game_event** — event log for “last action” and history.

ABIs are the complete ABIs, not just the events.
