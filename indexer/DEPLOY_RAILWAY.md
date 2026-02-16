# Deploy Ponder Indexer to Railway

This guide gets the Phenomenon indexer running on Railway so the production miniapp (e.g. https://phenomenon-miniapp.vercel.app) can read indexed data via GraphQL.

Reference: [Ponder – Deploy on Railway](https://ponder.sh/docs/production/railway).

---

## Prerequisites (you have these)

- **Railway account** and GitHub connected.
- **`RAILWAY_TOKEN`** in project `.env` (for CLI/CI if needed).
- **`PONDER_RPC_URL_84532`** in the Railway project’s **Shared Variables** (no need to add it again in Step 7).

---

## Step 1: Create a new Railway project

1. In [Railway](https://railway.app), click **New Project**.
2. Choose **Deploy from GitHub repo**.
3. Select the repo **`0xOmen/Phenomenon-Miniapp`** (or your fork).
4. Railway creates a service from the repo. You’ll configure it next.

---

## Step 2: Use the `indexer` folder as root

The app to run lives in the **`indexer`** subfolder.

1. Open the new service (the one created from the repo).
2. Go to **Settings** (or the service’s **Settings** tab).
3. Find **Root Directory** (or **Build** / **Source**).
4. Set **Root Directory** to **`indexer`**.
5. Save.

Build and start commands will run from `indexer/` (where `package.json` and `ponder.config.ts` live).

---

## Step 3: Set the start command and schema

Ponder needs a stable **database schema** per deployment for zero-downtime deploys. Railway provides `RAILWAY_DEPLOYMENT_ID`.

1. In the service, go to **Settings → Deploy** (or **Settings → Build & Deploy**).
2. Set **Custom Start Command** to:

   ```bash
   npm run start -- --schema $RAILWAY_DEPLOYMENT_ID
   ```

   (If you use pnpm: `pnpm start --schema $RAILWAY_DEPLOYMENT_ID`.)

3. Save.

Do **not** set `DATABASE_SCHEMA` in env; the `--schema` flag above takes care of it.

---

## Step 4: Healthcheck

1. In **Settings → Deploy**, set **Healthcheck Path** to **`/ready`**.
2. Set **Healthcheck Timeout** to **`3600`** seconds (1 hour; backfill can be slow).

---

## Step 5: Add a PostgreSQL database

1. In the same **Project** (dashboard), click **+ New** (or **Add Service**).
2. Choose **Database → Add PostgreSQL**.
3. Wait until Postgres is provisioned. Railway will show a **Variables** tab for it with **`DATABASE_URL`**.

---

## Step 6: Link Postgres to the indexer service

1. Open the **Ponder indexer service** (the one from GitHub), not the Postgres service.
2. Go to **Variables**.
3. Click **New Variable** (or **Add Variable**).
4. Choose **Add Reference** (or “Reference” from another service).
5. Select the **PostgreSQL** service and the variable **`DATABASE_URL`**.
6. Add it. Railway may name it `DATABASE_URL` in this service as well.

Ponder’s config reads **`PONDER_DATABASE_URL`** or **`DATABASE_URL`**, so the referenced `DATABASE_URL` will be used automatically.

---

## Step 7: Environment variables

**Already set:** `PONDER_RPC_URL_84532` (Shared Variables).

**You must set:** In the indexer service, add a **reference** to the Postgres **`DATABASE_URL`** (Step 6). Optional overrides: `PHENOMENON_ADDRESS`, `GAMEPLAY_ENGINE_ADDRESS`, `TICKET_ENGINE_ADDRESS`, `PHENOMENON_START_BLOCK` (defaults in code).

---

## Step 8: Generate a public domain

1. Open the **indexer service**.
2. Go to **Settings → Networking** (or **Networking**).
3. Click **Generate Domain** (or **Add Public Domain**).
4. Note the URL (e.g. `https://phenomenon-indexer-production-xxxx.up.railway.app`).

GraphQL will be at **`https://<your-domain>/graphql`**. Use this as the indexer URL for the miniapp.

---

## Step 9: Deploy and check logs

1. Trigger a deploy (e.g. push to the connected branch, or **Deploy** in Railway).
2. Open **Deploy Logs** (or **Logs**). You should see Ponder starting, then backfilling from block 37667749. The first run can take a while.
3. When ready, Ponder serves **`/ready`** with 200. Railway will mark the deployment healthy.

---

## Step 10: Point the miniapp at the indexer

1. In **Vercel** (miniapp project), open **Settings → Environment Variables**.
2. Set **`NEXT_PUBLIC_PONDER_GRAPHQL_URL`** to your Railway indexer GraphQL URL, e.g.  
   **`https://<your-railway-domain>/graphql`**
3. Redeploy the miniapp so the new env var is used.

The live miniapp (e.g. https://phenomenon-miniapp.vercel.app) will then load indexed data from Railway.

---

## Troubleshooting

- **Build fails**: Ensure **Root Directory** is `indexer` and the start command is exactly as in Step 3 (including `--schema $RAILWAY_DEPLOYMENT_ID`).
- **DB connection errors**: Confirm the indexer service has a **variable reference** to the Postgres service’s **`DATABASE_URL`** (Step 6).
- **Stuck “Loading” in miniapp**: Confirm `NEXT_PUBLIC_PONDER_GRAPHQL_URL` in Vercel is `https://<railway-domain>/graphql` and that the indexer service is healthy and responding at `/graphql` and `/ready`.
- **“Prophets needed to start” shows —**: The indexer must index `numberOfProphetsSet` (Phenomenon) and backfill existing games. After pulling the latest code, **redeploy the indexer** on Railway so the new handler runs. In Railway: open the indexer service → **Deploy** (or push to the connected branch) → open **Deploy Logs** and confirm no errors; check **Variables** for `PONDER_RPC_URL_84532` and `DATABASE_URL`. To confirm the event is indexed, query GraphQL at `https://<railway-domain>/graphql` for `games { items { id prophetsRequired } }`; once backfilled, `prophetsRequired` will be set.
