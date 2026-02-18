"use client";

import { useQuery } from "@tanstack/react-query";
import { PONDER_GRAPHQL_URL } from "@/lib/contracts";

const GAMES_QUERY = `
  query Games {
    games(limit: 50, orderBy: "gameNumber", orderDirection: "desc") {
      items {
        id
        gameNumber
        status
        currentProphetTurn
        prophetsRemaining
        prophetsRequired
        totalTickets
        tokenBalance
        endTotalTickets
        winnerProphetIndex
        prophets(limit: 20) {
          items {
            prophetIndex
            playerAddress
          }
        }
      }
    }
  }
`;

export type PonderProphet = {
  prophetIndex: number;
  playerAddress: string;
};

export type PonderGame = {
  id: string;
  gameNumber: string | number;
  status: string;
  currentProphetTurn: number;
  prophetsRemaining: number;
  prophetsRequired?: number | null;
  totalTickets: string;
  tokenBalance: string;
  endTotalTickets?: string | null;
  winnerProphetIndex?: number | null;
  prophets?: { items: PonderProphet[] };
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
      if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "GraphQL error");
      return (json.data?.games?.items ?? []) as PonderGame[];
    },
    refetchInterval: 10_000,
    retry: false,
    staleTime: 5_000,
  });
}
