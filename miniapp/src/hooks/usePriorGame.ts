"use client";

import { useQuery } from "@tanstack/react-query";
import { PONDER_GRAPHQL_URL } from "@/lib/contracts";

export type PriorGameAcolyte = {
  id: string;
  ownerAddress: string;
  prophetIndex: number;
  ticketCount: string;
};

export type PriorGameTicketClaim = {
  id: string;
  ownerAddress: string;
  tokensClaimed: string;
};

export type PriorGameProphet = {
  prophetIndex: number;
  playerAddress: string;
};

export type PriorGameDetail = {
  id: string;
  gameNumber: string;
  status: string;
  winnerProphetIndex: number | null;
  endTotalTickets: string | null;
  winningTicketsAtEnd: string | null;
  tokenBalance: string;
  prophets: { items: PriorGameProphet[] };
  acolytes: { items: PriorGameAcolyte[] };
  ticketClaims: { items: PriorGameTicketClaim[] };
};

const PRIOR_GAME_QUERY = `
  query GetPriorGame($gameId: String!) {
    game(id: $gameId) {
      id
      gameNumber
      status
      winnerProphetIndex
      endTotalTickets
      winningTicketsAtEnd
      tokenBalance
      prophets(limit: 20) {
        items {
          prophetIndex
          playerAddress
        }
      }
      acolytes(limit: 500) {
        items {
          id
          ownerAddress
          prophetIndex
          ticketCount
        }
      }
      ticketClaims(limit: 100) {
        items {
          id
          ownerAddress
          tokensClaimed
        }
      }
    }
  }
`;

export function usePriorGame(gameId: string | null) {
  return useQuery({
    queryKey: ["ponder", "priorGame", gameId],
    queryFn: async (): Promise<PriorGameDetail | null> => {
      if (!gameId) return null;
      const res = await fetch(PONDER_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: PRIOR_GAME_QUERY,
          variables: { gameId },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "GraphQL error");
      return json.data?.game ?? null;
    },
    enabled: !!gameId,
    refetchInterval: 10_000,
    retry: false,
    staleTime: 5_000,
  });
}
