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

  const data = (await res.json()) as { users?: Array<{ pfp_url?: string; username?: string; display_name?: string; custody_address?: string }> };
  const user = data.users?.[0] ?? null;
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      pfp_url: user.pfp_url ?? null,
      username: user.username ?? null,
      display_name: user.display_name ?? null,
    },
  });
}
