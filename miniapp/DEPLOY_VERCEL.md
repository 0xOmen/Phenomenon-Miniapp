# Deploy Phenomenon Miniapp to Vercel

Use this guide to host the miniapp on Vercel so you can test it in the [Farcaster miniapp preview](https://farcaster.xyz/~/developers/mini-apps/preview).

## 1. Repository and root directory

- **Use the full repository**, not the `miniapp` subfolder URL:
  - **Correct:** `https://github.com/0xOmen/Phenomenon-Miniapp`
  - **Wrong:** `https://github.com/0xOmen/Phenomenon-Miniapp/tree/master/miniapp` (that is only a GitHub browse URL; Vercel does not use it as the project URL.)

- In Vercel, after importing the repo:
  1. Open **Project Settings → General**.
  2. Set **Root Directory** to **`miniapp`** (click Edit, enter `miniapp`, Save).
  3. Vercel will then build and run the Next.js app from that directory (e.g. `npm run build` inside `miniapp/`).

So: **one repo**, **Root Directory = `miniapp`**.

## 2. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. Click **Add New → Project**.
3. Import **0xOmen/Phenomenon-Miniapp** (or your fork).
4. Before deploying:
   - Set **Root Directory** to **`miniapp`** as above.
   - **Framework Preset:** Next.js (should be auto-detected).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** default (Next.js handles this).

## 3. Environment variables

In **Project Settings → Environment Variables**, add:

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_PONDER_GRAPHQL_URL` | Your Ponder GraphQL URL | e.g. your Railway/indexer URL: `https://your-indexer.up.railway.app/graphql` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | Optional. If unset, Vercel uses `https://<your-project>.vercel.app` via `VERCEL_URL`. Set this if you use a custom domain. |

Add any other `NEXT_PUBLIC_*` or contract addresses your app needs (e.g. RPC URL). Redeploy after changing env vars.

## 4. Deploy

1. Click **Deploy** (or push to the connected branch; Vercel will auto-deploy).
2. Wait for the build. The app will be at `https://<project-name>.vercel.app`.

## 5. Manifest and embed assets

The app serves a Farcaster manifest at **`/.well-known/farcaster.json`** (no account association for now; add that when you have a domain).

For the manifest and embed to look right in clients:

1. **Icon (required for manifest):** Add **`public/icon.png`** (1024×1024 PNG, no transparency). Used as app icon and splash.
2. **Embed image (for feeds):** Add **`public/opengraph-image.png`** (3:2 aspect ratio, e.g. 1200×800). Used in the `fc:miniapp` / `fc:frame` meta tag.

If these files are missing, the manifest and meta tag still work; clients may show a placeholder or broken image until you add them.

## 6. Test in Farcaster

1. Open the [miniapp preview](https://farcaster.xyz/~/developers/mini-apps/preview).
2. Enter your Vercel URL (e.g. `https://<project-name>.vercel.app`).
3. Confirm the app loads and the manifest is used (you can open `https://<your-app>.vercel.app/.well-known/farcaster.json` in a browser to verify).

## 7. Later: custom domain and account association

When you have a domain:

1. Add the domain in Vercel (Project Settings → Domains).
2. Use the [Mini App Manifest Tool](https://farcaster.xyz/~/developers/mini-apps/manifest) to claim ownership and get the signed **accountAssociation** block.
3. Add **accountAssociation** to the manifest (e.g. extend `src/app/api/farcaster-manifest/route.ts` to include it when `NEXT_PUBLIC_APP_URL` matches your domain, or serve a static `farcaster.json` with the signed payload).
