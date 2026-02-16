import type { Metadata } from "next";
import "./globals.css";
import "@neynar/react/dist/style.css";
import { Providers } from "@/components/Providers";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const fcMiniappEmbed = {
  version: "1",
  imageUrl: `${baseUrl}/opengraph-image.png`,
  button: {
    title: "Play",
    action: {
      type: "launch_frame",
      name: "Phenomenon",
      url: baseUrl,
      splashImageUrl: `${baseUrl}/icon.png`,
      splashBackgroundColor: "#0a0a0a",
    },
  },
};

export const metadata: Metadata = {
  title: "Phenomenon",
  description: "Become a Movement — Farcaster miniapp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="fc:miniapp" content={JSON.stringify(fcMiniappEmbed)} />
        {/* Backward compatibility for legacy clients */}
        <meta name="fc:frame" content={JSON.stringify(fcMiniappEmbed)} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
