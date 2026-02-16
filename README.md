# Phenomenon Miniapp

Farcaster miniapp and event indexer for the [Phenomenon](https://github.com/0xOmen/phenomenon) game. Contracts live on **Base Sepolia** ([Phenomenon-Foundry](https://github.com/0xOmen/Phenomenon-Foundry)).

## Repo layout

| Path | Purpose |
|------|--------|
| **indexer/** | Ponder indexer: indexes Phenomenon, GameplayEngine, TicketEngine events; exposes GraphQL. |
| **miniapp/** | Next.js Farcaster miniapp: Wagmi + Farcaster wallet, reads from Ponder, Neynar for profiles. |
| **PHENOMENON_MINIAPP_REWRITE_PLAN.md** | Full rewrite plan (stack, phases, env, deployment). |

## Quick start

1. **Indexer** (from repo root, set RPC URL):
   ```bash
   cd indexer
   export PONDER_RPC_URL_84532="https://base-sepolia.g.alchemy.com/v2/YOUR_KEY"
   npm install && npm run dev
   ```
   GraphQL: http://localhost:42069/graphql

2. **Miniapp**:
   ```bash
   cd miniapp
   cp .env.example .env.local
   # Set NEXT_PUBLIC_PONDER_GRAPHQL_URL=http://localhost:42069/graphql
   npm install && npm run dev
   ```
   App: http://localhost:3000

3. **Env**: See root `.env` and `indexer/.env.example`, `miniapp/.env.example`. Contract addresses and RPC URLs are in the [plan](./PHENOMENON_MINIAPP_REWRITE_PLAN.md#21-stack-contracts--environment-variables).

## Implemented

- **Phase 1**: Ponder indexer with three contracts (Base Sepolia, start block 37667749), schema (game, prophet, acolyte, game_event), event handlers, GraphQL API. Deploy to Railway with `RAILWAY_TOKEN` and Postgres.
- **Phase 2 (shell)**: Next.js miniapp with Farcaster miniapp SDK, Wagmi, Base Sepolia, `sdk.actions.ready()`, connect wallet UI. Contract writes and fDEGEN approve are next.
- **Phase 3+**: Game UI, Ponder GraphQL queries, Neynar profile components, manifest, and Vercel deploy are planned in the rewrite plan.
