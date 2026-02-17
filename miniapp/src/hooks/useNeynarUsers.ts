"use client";

import { useQuery } from "@tanstack/react-query";

export type NeynarUserInfo = {
  pfp_url: string | null;
  username: string | null;
  display_name: string | null;
};

/**
 * Fetches Farcaster user info for multiple addresses in one request.
 * Cached by React Query (staleTime 5 min) to avoid repeated Neynar calls.
 */
export function useNeynarUsers(addresses: string[]) {
  const normalized = [...new Set(addresses.map((a) => a.toLowerCase()).filter(Boolean))];
  const key = normalized.length ? normalized.sort().join(",") : "";

  return useQuery({
    queryKey: ["neynar", "users", key],
    queryFn: async (): Promise<Record<string, NeynarUserInfo>> => {
      if (normalized.length === 0) return {};
      const res = await fetch(
        `/api/neynar-users?addresses=${encodeURIComponent(normalized.join(","))}`
      );
      if (!res.ok) {
        if (res.status === 503 || res.status === 502) return {};
        throw new Error(await res.text());
      }
      const json = await res.json();
      return json.users ?? {};
    },
    enabled: normalized.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
