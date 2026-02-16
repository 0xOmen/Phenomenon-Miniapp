# Phenomenon Indexer (Ponder)

Event indexer for Phenomenon game contracts on **Base Sepolia**. Exposes GraphQL at `/graphql` for the miniapp.

## Setup

1. **Env**: Copy `.env.example` to `.env` and set:
   - `PONDER_RPC_URL_84532` — Base Sepolia RPC (e.g. from root `.env`: same value as `ALCHEMY_BASE_SEPOLIA_RPC_URL`).
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

3. **Production (Railway)**: Use `RAILWAY_TOKEN` and Railway Postgres; set `PONDER_DATABASE_URL` and `PONDER_RPC_URL_84532` in Railway env.

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

ABIs in `abis/` are events-only; full ABIs from [sepolia.basescan.org](https://sepolia.basescan.org) if needed.
