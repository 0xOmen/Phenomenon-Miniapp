"use client";

import { useQuery } from "@tanstack/react-query";
import { PONDER_GRAPHQL_URL } from "@/lib/contracts";

const GAMES_QUERY = `
  query Games {
    games(limit: 10, orderBy: "gameNumber", orderDirection: "desc") {
      items {
        id
        gameNumber
        status
        currentProphetTurn
        prophetsRemaining
        totalTickets
        tokenBalance
      }
    }
  }
`;

export type PonderGame = {
  id: string;
  gameNumber: string;
  status: string;
  currentProphetTurn: number;
  prophetsRemaining: number;
  totalTickets: string;
  tokenBalance: string;
};

export function usePonderGames() {
  return useQuery({
    queryKey: ["ponder", "games"],
    queryFn: async () => {
      const res = await fetch(PONDER_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: GAMES_QUERY }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      return (json.data?.games?.items ?? []) as PonderGame[];
    },
    refetchInterval: 10_000,
  });
}
