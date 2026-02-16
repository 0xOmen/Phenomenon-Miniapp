# Phenomenon Front-End Rewrite: Farcaster Miniapp — Comprehensive Plan

This document outlines the plan to rewrite the Phenomenon blockchain game front-end as a **Farcaster miniapp**, with **Ponder** event indexing on **Railway**, Farcaster identity via **Neynar**, and native wallet flows. The initial version targets **Base Sepolia** with the refactored multi-contract setup (Phenomenon-Foundry).

---

## 1. Executive Summary

**Current state (original):**
- Static HTML/JS site; no indexer or database; all data from RPC on each load.
- Data effectively static after load; basic UX.
- Single contract (Phenomenon_Degen).

**Target state (this rewrite):**
- **Farcaster miniapp**: discoverable in Farcaster, signed-in users (FID), native wallet; **Farcaster miniapp SDK**.
- **Indexed state**: game/prophet/ticket/history in a database via **Ponder on Railway**; PostgreSQL on Railway (Supabase fallback if needed).
- **Chain**: **Base Sepolia** for initial testing; contracts deployed on or after block **37667749**.
- **Contracts**: Three verified contracts — Phenomenon.sol, GameplayEngine.sol, TicketEngine.sol (ABIs from sepolia.basescan.org or repo).
- **Game token**: **fDEGEN** (custom ERC20) for testing.
- **Farcaster data**: **Neynar** (API key in `.env`); UX uses Farcaster usernames, PFPs, and profile data for prophets and user info.
- **Hosting**: **Vercel** for the miniapp; domain to be purchased and connected manually after the project is pushed to GitHub.

**Out of scope for this plan:** Smart contract changes (Phenomenon-Foundry is the source of events and interface).

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Farcaster Client (Warpcast, etc.)                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Phenomenon Miniapp (React/Next) — Hosted on Vercel                    │  │
│  │  • @farcaster/miniapp-sdk (ready, auth, wallet)                        │  │
│  │  • @farcaster/miniapp-wagmi-connector + Wagmi + viem                    │  │
│  │  • Neynar: Farcaster usernames, PFPs, profile data for prophets/users   │  │
│  │  • UI: game state, prophets, tickets, actions, Farcaster identity       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                    │
         │ read state / subscribe              │ write (txs)
         ▼                                    ▼
┌─────────────────────┐            ┌─────────────────────┐
│  Ponder on Railway   │            │  Farcaster wallet   │
│  • GraphQL / API     │            │  (Base Sepolia)     │
│  • PostgreSQL        │            │  + Alchemy RPC      │
│  (Railway DB)        │            │  if needed           │
└─────────────────────┘            └─────────────────────┘
         │
         │ sync from (Base Sepolia, block ≥ 37667749)
         ▼
┌─────────────────────┐
│  Alchemy Base       │  Phenomenon.sol, GameplayEngine.sol,
│  Sepolia RPC         │  TicketEngine.sol (verified on Basescan)
└─────────────────────┘
```

- **Frontend**: Farcaster miniapp (React/Next). Reads from Ponder GraphQL; sends transactions via Farcaster wallet (Wagmi). **Farcaster data** (usernames, PFPs) from **Neynar** for prophet and user rendering.
- **Indexer**: **Ponder** hosted on **Railway**; listens to the three Phenomenon-Foundry contracts on **Base Sepolia**; PostgreSQL on Railway; exposes GraphQL for the app.
- **RPC**: **Alchemy** free tier (`ALCHEMY_BASE_SEPOLIA_RPC_URL`) for Ponder sync and optional frontend chain/write use; wallet uses Farcaster’s provider for user txs.

---

## 2.1 Stack, contracts & environment variables

### Chain and start block

- **Chain:** Base Sepolia (initial testing).
- **Indexer start block:** 37667749 (contracts deployed on or after this block).
- **Note:** Two prophets are already registered for testing event indexing.

### Smart contracts (Base Sepolia, verified on sepolia.basescan.org)

| Contract            | Address | .env variable |
|---------------------|---------|----------------|
| Phenomenon.sol      | `0x2472FCd582b6f48D4977b6b1AD44Ad7a0B444827` | `PHENOMENON_ADDRESS` |
| GameplayEngine.sol  | `0xf952f23061031d9e8561C5ca12381C2eE04919F3` | `GAMEPLAY_ENGINE_ADDRESS` |
| TicketEngine.sol    | `0x18A7DB39F6FF7F64575E768d9dE0cB56D787ca29` | `TICKET_ENGINE_ADDRESS` |

- **ABIs:** From [sepolia.basescan.org](https://sepolia.basescan.org) (e.g. [Phenomenon](https://sepolia.basescan.org/address/0x2472fcd582b6f48d4977b6b1ad44ad7a0b444827#code)) or the Phenomenon-Foundry repo. Supply ABIs in the Ponder project and frontend config as needed.

### Game token

- **fDEGEN** (custom ERC20 for testing): `0xA18A39F7f5Fa1A6d4aD6B67f6d5578D4002E2f98` → `.env`: `TEST_TOKEN_ADDRESS`.

### Environment variables (reference)

| Purpose        | Variable | Notes |
|----------------|----------|--------|
| Railway        | `RAILWAY_TOKEN` | Ponder + DB deployment |
| RPC (Alchemy)  | `ALCHEMY_API_KEY`, `ALCHEMY_BASE_SEPOLIA_RPC_URL` | Indexer + optional frontend |
| Contracts      | `PHENOMENON_ADDRESS`, `GAMEPLAY_ENGINE_ADDRESS`, `TICKET_ENGINE_ADDRESS` | |
| Game token     | `TEST_TOKEN_ADDRESS` | fDEGEN |
| Farcaster data | `NEYNAR_API_KEY` | Usernames, PFPs, profiles |

Domain and Vercel are configured manually after the repo is pushed to GitHub. Ensure `.env` uses the contract addresses and variable names above (e.g. `PHENOMENON_ADDRESS=0x2472FCd582b6f48D4977b6b1AD44Ad7a0B444827`).

---

## 3. Indexing Layer

### 3.1 Why Index (vs RPC-Only)

- **Original pain**: Every reload re-queried RPC; no history; no aggregations; rate limits and latency.
- **With indexer**: Single source of truth in DB; fast reads; game/prophet/ticket history; optional real-time (SSE/subscriptions).

### 3.2 Choice: Ponder on Railway

**Decision:** Use **Ponder** for indexing, hosted on **Railway** (`RAILWAY_TOKEN` in `.env`).

**Why Ponder:**
- Open-source, TypeScript; no codegen; hot reload.
- **GraphQL API** auto-generated from schema; optional **@ponder/client** and **SSE** for live updates.
- **PostgreSQL** in production (Railway); SQLite for local dev.
- Fits the refactored setup: three contracts (Phenomenon, GameplayEngine, TicketEngine) with events spread across them; Ponder’s `.on("ContractName:EventName")` model maps to `prophetEnteredGame`, `gameStarted`, `miracleAttempted`, `smiteAttempted`, `accusation`, `gainReligion`, `religionLost`, `gameEnded`, `ticketsClaimed`, `gameReset`, etc.

**Resources:**
- [Ponder](https://ponder.sh/) — docs, contracts/networks.
- [Indexing functions](https://ponder.sh/docs/api-reference/ponder/indexing-functions) — event handlers.
- [GraphQL](https://ponder.sh/docs/query/graphql) — API for frontend.
- [Deploy on Railway](https://ponder.sh/docs/production/railway) — use `RAILWAY_TOKEN` for deployment.

### 3.3 Other indexers (not in scope for this version)

Goldsky, The Graph, or custom indexers could be revisited later; for this rewrite, **Ponder on Railway** is the chosen stack.

---

## 4. Database

### 4.1 With Ponder

- **Local dev:** SQLite (default).
- **Production:** **PostgreSQL** (required for Ponder prod).

**Choice:** **Railway** for both Ponder and PostgreSQL. Use Railway’s Postgres plugin and set `PONDER_DATABASE_URL` (or the variable Ponder expects) to the Railway Postgres URL. This keeps indexer and DB in one place and uses `RAILWAY_TOKEN` for deployment.
- **Fallback:** If Railway is not used for the DB, **Supabase** is an option (Supabase API key or connection string can be supplied); point Ponder’s production config at that Postgres URL.

### 4.2 If You Add an Application Backend

If you later add a small API (e.g. Quick Auth, user preferences by FID), use a separate schema in the same Postgres (e.g. `app`) for app tables, or a separate Supabase/DB if you prefer strict separation.

---

## 5. RPC

### 5.1 Indexer (Ponder)

- **Choice:** **Alchemy** free tier for Base Sepolia.
- **Env:** `ALCHEMY_API_KEY` and `ALCHEMY_BASE_SEPOLIA_RPC_URL`. Use `ALCHEMY_BASE_SEPOLIA_RPC_URL` as the chain RPC URL in Ponder config (e.g. for `baseSepolia`).
- Upgrade to a paid Alchemy plan if indexing volume or rate limits require it.

### 5.2 Frontend (Miniapp)

- **Wallet / sends:** Farcaster miniapp uses **`sdk.wallet.getEthereumProvider()`**; the in-client wallet handles chain and RPC. No RPC needed in the app for normal user txs.
- **Reads:** From **Ponder GraphQL** only; no RPC in the browser for game state.
- **Optional:** For Wagmi (e.g. `http()` for chainId or gas), use `ALCHEMY_BASE_SEPOLIA_RPC_URL` via a public env (e.g. `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`) if needed; avoid exposing the API key in the client (use a backend proxy if you must use the key for frontend-initiated RPC).

---

## 6. Frontend Hosting

### 6.1 Choice: Vercel

- **Platform:** **Vercel** for the miniapp frontend (Next.js or Vite+React).
- **Domain:** A custom domain will be purchased when ready; it will be **connected manually** after the project is pushed to GitHub (e.g. connect repo to Vercel, then add the purchased domain in Vercel project settings).
- **Constraints:** The miniapp is tied to one domain; it cannot be changed later for the same app identity. Serve `/.well-known/farcaster.json` from that domain (static file or API route). HTTPS is required; Vercel provides this when the domain is connected.
- **Indexer:** Remains on Railway (separate from the frontend).

---

## 7. Farcaster Miniapp Integration

### 7.1 SDK and display

- **SDK:** **Farcaster miniapp SDK** — `@farcaster/miniapp-sdk`.
- **Install:** `npm install @farcaster/miniapp-sdk` (and `@farcaster/miniapp-wagmi-connector` for wallet).
- **On load:** Call `await sdk.actions.ready()` after the app is ready to hide the splash screen.
- **Scaffold:** Optionally `npm create @farcaster/mini-app`, or add the SDK to an existing React/Next app.

### 7.2 Farcaster data: Neynar

- **Choice:** **Neynar** for Farcaster data (usernames, display names, PFPs, profiles).
- **Env:** `NEYNAR_API_KEY` in `.env`. Use Neynar’s APIs to resolve **wallet address → FID → profile** (and optionally FID directly) for display in the app.
- **Use in UI:** Prophet cards, user info, “who is this prophet” — use Neynar to fetch Farcaster username, PFP, and other profile fields for each prophet address (and the connected user). Fall back to truncated address if no Farcaster profile is found.
- **Optional:** `sdk.actions.viewProfile({ fid })` to open the native Farcaster profile view from the app.

### 7.3 UX: Farcaster identity in gameplay

- **Prophet rendering:** For each prophet (wallet address), call Neynar to get Farcaster username, PFP, and display name; show these in prophet lists, turn indicator, and game table. Use PFPs and usernames instead of (or in addition to) placeholder avatars and addresses.
- **User info:** For the connected wallet, show the linked Farcaster profile (username, PFP) in the header or profile area.
- **Consistency:** Use the same Neynar-backed components wherever a wallet/FID is displayed (prophets, acolytes, high priests, “last action” by prophet, etc.).

### 7.4 Auth (optional)

- **Quick Auth:** Use `sdk.quickAuth.getToken()` or `sdk.quickAuth.fetch()` if you add a backend; verify JWT with `@farcaster/quick-auth` and read FID from `sub`. The in-app wallet already ties the user to an address; Neynar can link address ↔ FID for display.

### 7.5 Wallet (transactions)

- **Connector:** `@farcaster/miniapp-wagmi-connector` with Wagmi; config with `farcasterMiniApp()` and **Base Sepolia** in `createConfig`.
- **Behavior:** In Farcaster client, wallet is already connected; connector uses `sdk.wallet.getEthereumProvider()`. Check `isConnected` and prompt connect only if needed.
- **Sending txs:** Use Wagmi (`useWriteContract`, `useSendTransaction`). User sees Farcaster’s native tx preview and confirmation. For approve + action flows, use EIP-5792 `useSendCalls` where supported.
- **Contract interaction:** Use contract addresses from `.env` (`PHENOMENON_ADDRESS`, `GAMEPLAY_ENGINE_ADDRESS`, `TICKET_ENGINE_ADDRESS`) and ABIs from sepolia.basescan.org or the repo. Implement: enterGame, startGame, performMiracle, attemptSmite, accuseOfBlasphemy, getReligion, highPriest, claimTickets, reset. Include ERC20 approve for **fDEGEN** (`TEST_TOKEN_ADDRESS`) when the game requires token approval.

---

## 8. Data Model (Indexer)

Align with the **three-contract** Phenomenon-Foundry setup (Phenomenon.sol, GameplayEngine.sol, TicketEngine.sol) on **Base Sepolia**. Events may be emitted from different contracts; configure Ponder to listen to each contract’s address and ABI (start block 37667749).

### 8.1 Entities (Ponder tables / views)

- **Game** — `gameNumber`, `status` (open/started/oracle/ended), `currentProphetTurn`, `prophetsRemaining`, `totalTickets`, `tokenBalance`, `startBlock`, `endBlock`, etc.
- **Prophet** — per-game prophet index; `gameId`, `prophetIndex`, `playerAddress`, `isAlive`, `isFree`, `role` (e.g. prophet/highPriest), `accolites`, `highPriests`, derived `tokensPerTicket` if indexed or computed. (Frontend will enrich `playerAddress` with Neynar Farcaster username/PFP.)
- **Acolyte / Tickets** — `gameId`, `ownerAddress`, `prophetIndex`, `ticketCount`; from `gainReligion` / `religionLost` (and any ticket views). Ticket-related events may live on TicketEngine.
- **GameEvent** (optional) — `gameId`, `type`, `prophetIndex`, `targetIndex`, `success`, `blockNumber`, `transactionHash`, for history and “last action” UX.
- **FID linkage:** Not stored in Ponder; frontend uses Neynar to resolve wallet → Farcaster profile for display.

### 8.2 Events to index (three contracts)

Map each event to the correct contract (Phenomenon, GameplayEngine, or TicketEngine) and handler. ABIs from sepolia.basescan.org define which contract emits which event. Example mapping:

- **Phenomenon:** `prophetEnteredGame`, `gameStarted`, `gameEnded`, `gameReset`, `currentTurn`, etc. → update Game + Prophet list, status, turn.
- **GameplayEngine:** `miracleAttempted`, `smiteAttempted`, `accusation` → update prophet state + optional GameEvent.
- **TicketEngine:** `gainReligion`, `religionLost`, `ticketsClaimed` → update Acolyte/Tickets and prophet acolyte counts.

Configure `ponder.config.ts` with all three contract addresses and ABIs; register handlers per `ContractName:EventName` for each.

---

## 9. Frontend Data Flow

- **Initial load:** (1) GraphQL queries to Ponder: current game, prophets, current user’s tickets/allegiance (by address from Wagmi). (2) For each prophet address (and the connected user’s address), call **Neynar** to resolve Farcaster username, PFP, display name; cache or batch where possible.
- **Real-time:** Ponder’s SSE (e.g. `@ponder/client`) or polling (e.g. every 5–10 s) for current game and “my tickets”; re-resolve Neynar only when prophet set or user changes.
- **Actions:** User clicks “Perform Miracle,” “Smite,” “Buy tickets,” etc. → Wagmi write → tx via Farcaster wallet → indexer picks up events on next block → UI updates via subscription or refetch.
- **No RPC reads** in the app for game state; only Ponder GraphQL + Neynar for profiles + wallet for writes.

---

## 10. Implementation Phases

### Phase 1: Foundation (Indexer + API)

1. **Ponder project**
   - Add **three contracts** to `ponder.config.ts`: Phenomenon (`PHENOMENON_ADDRESS`), GameplayEngine (`GAMEPLAY_ENGINE_ADDRESS`), TicketEngine (`TICKET_ENGINE_ADDRESS`). Use ABIs from sepolia.basescan.org (or repo). Network: **baseSepolia**; start block: **37667749**.
   - Define `ponder.schema.ts`: Game, Prophet, Acolyte/Tickets, optionally GameEvent.
   - Implement indexing functions for each event per contract; derive prophet list, turn, acolytes, token balance from events.
   - Expose GraphQL (and optional REST/Hono route if desired).
2. **Database**
   - Local: SQLite. Production: **PostgreSQL on Railway**; set `PONDER_DATABASE_URL` to Railway Postgres URL. Fallback: Supabase if needed.
3. **RPC**
   - Use **ALCHEMY_BASE_SEPOLIA_RPC_URL** in Ponder config for baseSepolia. Test sync and event parsing (two prophets already registered for testing).
4. **Deploy**
   - Deploy Ponder to **Railway** using `RAILWAY_TOKEN`.

**Deliverable:** Indexer syncing on Base Sepolia; GraphQL returning current game, prophets, tickets; deployable on Railway.

### Phase 2: Miniapp shell and wallet

1. **Scaffold**
   - Next.js (or Vite) app; add `@farcaster/miniapp-sdk`, `@farcaster/miniapp-wagmi-connector`, Wagmi, viem.
   - Call `sdk.actions.ready()` on load; configure Wagmi with **Base Sepolia** and Farcaster miniapp connector.
2. **Contract wiring**
   - Use addresses from `.env`: `PHENOMENON_ADDRESS`, `GAMEPLAY_ENGINE_ADDRESS`, `TICKET_ENGINE_ADDRESS`; ABIs from Basescan or repo. Implement writes: enterGame, startGame, performMiracle, attemptSmite, accuseOfBlasphemy, getReligion, highPriest, claimTickets, reset. Add ERC20 approve for **fDEGEN** (`TEST_TOKEN_ADDRESS`) where required.
3. **Env**
   - `NEXT_PUBLIC_PONDER_GRAPHQL_URL` (Railway Ponder URL once deployed); no RPC in client for game reads.

**Deliverable:** Miniapp loads in Farcaster, shows connected wallet, sends one test tx (e.g. enterGame) via Farcaster wallet on Base Sepolia.

### Phase 3: Game UI and indexer data

1. **Queries**
   - GraphQL queries to Ponder: current game, prophets (status, acolytes, tokens per ticket), current user’s tickets and allegiance.
2. **Neynar integration**
   - For each prophet address and the connected user, call Neynar (`NEYNAR_API_KEY`) to get Farcaster username, PFP, display name; use in UI components.
3. **Screens**
   - **Lobby:** Game status, prophet list (with Farcaster usernames/PFPs), “Enter game” / “Start game.”
   - **In-game:** Current turn, prophet table with Farcaster identity, last actions; miracle/smite/accuse/force miracle when allowed.
   - **Acolyte:** Prophet selector (with PFPs/usernames), buy/sell tickets; show ticket count and allegiance.
   - **High priest:** Set allegiance. **End game:** Claim tickets; reset (with cooldown).
4. **Real-time**
   - SSE or polling for current game and “current turn” updates.

**Deliverable:** Full gameplay using indexed state, Farcaster wallet, and Neynar-backed prophet/user rendering.

### Phase 4: Farcaster identity and publishing

1. **Profile UX**
   - Ensure all prophet and user displays use Neynar data (usernames, PFPs); optional `sdk.actions.viewProfile({ fid })` for profile deep link.
2. **Publishing**
   - Deploy frontend to **Vercel**. Purchase domain and **connect it manually** in Vercel after the project is pushed to GitHub. Serve `/.well-known/farcaster.json` from that domain; register in Farcaster developer tools (name, icon, description, webhooks if needed).
3. **UX**
   - Loading states, error handling, responsive layout; optional Farcaster notifications (webhook in manifest).

**Deliverable:** Production miniapp with Farcaster identity and manifest on Vercel at custom domain.

### Phase 5: Observability and hardening

- Logging and error tracking (e.g. Sentry) for frontend and indexer.
- Indexer: monitor sync lag and reorgs; health endpoint.
- Rate limiting and caching on Ponder GraphQL if public.
- Optional: Blockaid verification for contract txs.

---

## 11. Technology Summary

| Layer              | Choice for this rewrite |
|--------------------|--------------------------|
| **Chain**          | Base Sepolia (start block 37667749) |
| **Contracts**      | Phenomenon.sol, GameplayEngine.sol, TicketEngine.sol (addresses in §2.1) |
| **Game token**     | fDEGEN (`TEST_TOKEN_ADDRESS`) |
| **Indexing**       | Ponder on Railway |
| **Database**       | PostgreSQL on Railway (Supabase fallback) |
| **Indexer RPC**    | Alchemy (ALCHEMY_BASE_SEPOLIA_RPC_URL) |
| **Frontend reads** | Ponder GraphQL only (no RPC for game state) |
| **Frontend**       | Next.js + React, Farcaster miniapp SDK |
| **Hosting (app)**  | Vercel (domain connected manually after GitHub push) |
| **Hosting (indexer)** | Railway (RAILWAY_TOKEN) |
| **Farcaster data** | Neynar (NEYNAR_API_KEY); usernames, PFPs, profiles for prophets and users |
| **Wallet**         | @farcaster/miniapp-wagmi-connector + Wagmi (Base Sepolia) |

---

## 12. Risks and Mitigations

- **Contract upgrades:** Phenomenon-Foundry contracts are upgradeable; new events or params may appear. Mitigation: version contract addresses or start block in Ponder; extend schema and handlers when deploying new logic.
- **Indexer lag:** If Ponder falls behind, UI may be stale. Mitigation: show “indexer block” vs “latest block” in dev; in prod, monitor Railway and Alchemy; optional short polling.
- **Farcaster client changes:** SDK or wallet behavior may change. Mitigation: pin SDK version; follow Farcaster miniapp changelog; test in Warpcast regularly.
- **Domain lock-in:** Miniapp domain is fixed once published. Mitigation: purchase and connect domain before publishing the manifest; use it from first production deploy on Vercel.
- **Neynar rate limits:** Heavy profile lookups could hit Neynar limits. Mitigation: batch or cache Neynar responses by address; use minimal required fields.

---

## 13. Next Steps

1. **ABIs:** Pull verified ABIs for Phenomenon.sol, GameplayEngine.sol, and TicketEngine.sol from [sepolia.basescan.org](https://sepolia.basescan.org) (or Phenomenon-Foundry repo) and add to Ponder + frontend.
2. **Ponder:** Create Ponder project; add three contracts (addresses from §2.1), start block 37667749, Base Sepolia; implement schema and event handlers; deploy to Railway with `RAILWAY_TOKEN` and Railway Postgres.
3. **Miniapp:** Scaffold with `create @farcaster/mini-app` or Next + SDK; configure Wagmi for Base Sepolia and Farcaster connector; wire contract addresses and fDEGEN approve; test enterGame (or equivalent) in Farcaster.
4. **UI + Neynar:** Connect UI to Ponder GraphQL; integrate Neynar (`NEYNAR_API_KEY`) for prophet and user Farcaster usernames/PFPs; build lobby, in-game, acolyte, and end-game screens.
5. **Vercel + domain:** Push project to GitHub; connect repo to Vercel; purchase domain and add it in Vercel; add `/.well-known/farcaster.json`; register miniapp in Farcaster developer tools.

This plan reflects the chosen stack: **Base Sepolia**, three verified contracts, **Ponder on Railway**, **Alchemy** RPC, **Vercel** + manual domain, **Farcaster miniapp SDK**, and **Neynar** for Farcaster identity in gameplay UX.
