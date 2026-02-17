import { NextResponse } from "next/server";

export type NeynarUserInfo = {
  pfp_url: string | null;
  username: string | null;
  display_name: string | null;
};

/**
 * Fetches Farcaster users by multiple Ethereum addresses (one Neynar call).
 * Returns a map address (lowercase) -> user info. Cuts down API calls when
 * showing many players (e.g. prophet list).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const addressesParam = searchParams.get("addresses");
  if (!addressesParam) {
    return NextResponse.json({ error: "Missing addresses" }, { status: 400 });
  }
  const addresses = addressesParam
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.startsWith("0x") && a.length === 42);
  if (addresses.length === 0) {
    return NextResponse.json({ users: {} as Record<string, NeynarUserInfo> });
  }
  if (addresses.length > 350) {
    return NextResponse.json({ error: "Max 350 addresses" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ users: {} as Record<string, NeynarUserInfo> });
  }

  const commaSeparated = addresses.join(",");
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk-by-address/?addresses=${encodeURIComponent(commaSeparated)}`,
    { headers: { "x-api-key": apiKey } }
  );
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err || "Neynar request failed" }, { status: res.status });
  }

  const data = (await res.json()) as Record<string, unknown>;
  const usersMap: Record<string, NeynarUserInfo> = {};
  const normalize = (u: Record<string, unknown>): NeynarUserInfo => {
    const pfp = (u.pfp_url ?? u.pfpUrl) as string | undefined;
    const username = (u.username as string | undefined) ?? null;
    const displayName = (u.display_name ?? u.displayName) as string | undefined;
    return { pfp_url: pfp ?? null, username, display_name: displayName ?? username ?? null };
  };
  for (const addr of addresses) {
    const lower = addr.toLowerCase();
    const raw = data[addr] ?? data[lower] ?? data[addr as keyof typeof data];
    const arr = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
    const user = arr[0] as Record<string, unknown> | undefined;
    if (user && typeof user === "object") usersMap[lower] = normalize(user);
  }
  // If response is keyed differently, also scan top-level keys that look like addresses
  for (const key of Object.keys(data)) {
    if (!key.startsWith("0x") || key.length !== 42 || key.toLowerCase() in usersMap) continue;
    const raw = data[key];
    const arr = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
    const user = arr[0] as Record<string, unknown> | undefined;
    if (user && typeof user === "object") usersMap[key.toLowerCase()] = normalize(user);
  }
  return NextResponse.json({ users: usersMap });
}
