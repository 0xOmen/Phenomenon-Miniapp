"use client";

import { useQuery } from "@tanstack/react-query";

export type NeynarUser = {
  pfp_url: string | null;
  username: string | null;
  display_name: string | null;
};

export function useNeynarUser(address: string | undefined) {
  return useQuery({
    queryKey: ["neynar", "user", address],
    queryFn: async (): Promise<{ user: NeynarUser | null }> => {
      if (!address) return { user: null };
      const res = await fetch(`/api/neynar-user?address=${encodeURIComponent(address)}`);
      if (!res.ok) {
        if (res.status === 503) return { user: null };
        throw new Error(await res.text());
      }
      return res.json();
    },
    enabled: !!address,
    staleTime: 60_000,
  });
}
