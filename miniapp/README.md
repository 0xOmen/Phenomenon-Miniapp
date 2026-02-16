# Phenomenon Miniapp

Farcaster miniapp for the Phenomenon game (Base Sepolia). Reads game state from the Ponder indexer GraphQL; uses Farcaster wallet for transactions.

## Deploy to Vercel (Farcaster preview)

Use **the repo root** when connecting Vercel: `https://github.com/0xOmen/Phenomenon-Miniapp`, then set **Root Directory** to **`miniapp`**. Full steps, env vars, and manifest/asset notes: see **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_PONDER_GRAPHQL_URL` to your Ponder GraphQL URL (e.g. `http://localhost:42069/graphql` when running the indexer locally).
3. Set `NEYNAR_API_KEY` for the header PFP/username (Neynar API → [dashboard](https://neynar.com) → API key). Used by `/api/neynar-user`.
4. Optionally set `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` and contract addresses (defaults in .env.example).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. In a Farcaster client (e.g. Warpcast), open the miniapp URL to use the in-app wallet.

## Stack

- Next.js (App Router), React, TypeScript
- @farcaster/miniapp-sdk, @farcaster/miniapp-wagmi-connector, Wagmi, viem
- Base Sepolia; contract addresses from env
- Tailwind CSS

## Next

- Wire contract writes (enterGame, performMiracle, getReligion, etc.) and fDEGEN approve.
