import { NextResponse } from "next/server";

/**
 * Fetches Farcaster user (PFP, username, display_name) by Ethereum address via Neynar.
 * Requires NEYNAR_API_KEY in env.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "Missing or invalid address" }, { status: 400 });
  }

  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Neynar API not configured" }, { status: 503 });
  }

  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(address)}`,
    { headers: { "x-api-key": apiKey } }
  );
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err || "Neynar request failed" }, { status: res.status });
  }

  const data = (await res.json()) as Record<string, unknown>;
  // Neynar may return { users: [...] } or address-keyed arrays; normalize to array
  let users: Array<Record<string, unknown>> = [];
  if (Array.isArray(data.users)) {
    users = data.users;
  } else if (data[address] && Array.isArray(data[address])) {
    users = data[address] as Array<Record<string, unknown>>;
  } else if (data[address.toLowerCase()] && Array.isArray(data[address.toLowerCase()])) {
    users = data[address.toLowerCase()] as Array<Record<string, unknown>>;
  } else {
    const firstArray = Object.values(data).find((v): v is unknown[] => Array.isArray(v) && v.length > 0 && typeof v[0] === "object");
    if (firstArray?.length) users = firstArray as Array<Record<string, unknown>>;
  }
  const user = users[0] ?? null;
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const pfp = (user.pfp_url ?? user.pfpUrl) as string | undefined;
  const username = (user.username as string | undefined) ?? null;
  const displayName = (user.display_name ?? user.displayName) as string | undefined;

  return NextResponse.json({
    user: {
      pfp_url: pfp ?? null,
      username: username ?? null,
      display_name: displayName ?? username ?? null,
    },
  });
}
