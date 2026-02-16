import { NextResponse } from "next/server";

/**
 * Serves the Farcaster miniapp manifest at /.well-known/farcaster.json (via rewrite in next.config).
 * See https://miniapps.farcaster.xyz/docs/specification#frame
 * Omit accountAssociation for local/preview testing; add it when you have a domain and use the manifest tool.
 */
export async function GET() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const manifest = {
    miniapp: {
      version: "1",
      name: "Phenomenon",
      homeUrl: `${baseUrl}/`,
      iconUrl: `${baseUrl}/icon.png`,
      splashImageUrl: `${baseUrl}/icon.png`,
      splashBackgroundColor: "#0a0a0a",
      imageUrl: `${baseUrl}/opengraph-image.png`,
      buttonTitle: "Play",
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
