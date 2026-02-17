"use client";

import { useQuery } from "@tanstack/react-query";
import { PONDER_GRAPHQL_URL } from "@/lib/contracts";

export type ProphetItem = {
  id: string;
  prophetIndex: number;
  playerAddress: string;
  isAlive: boolean;
  isFree: boolean;
  role: string;
};

export type AcolyteItem = {
  id: string;
  ownerAddress: string;
  prophetIndex: number;
  ticketCount: string;
};

export type CurrentGame = {
  id: string;
  gameNumber: string | number;
  status: string;
  currentProphetTurn: number;
  prophetsRemaining: number;
  prophetsRequired: number | null;
  prophets: { items: ProphetItem[] };
  acolytes: { items: AcolyteItem[] };
  winnerProphetIndex?: number | null;
};

const CURRENT_GAME_QUERY = `
  query GetCurrentGame($gameId: String!) {
    game(id: $gameId) {
      id
      gameNumber
      status
      currentProphetTurn
      prophetsRemaining
      prophetsRequired
      prophets(limit: 20) {
        items {
          id
          prophetIndex
          playerAddress
          isAlive
          isFree
          role
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
      winnerProphetIndex
    }
  }
`;

export function useCurrentGame(gameId: string | null) {
  return useQuery({
    queryKey: ["ponder", "currentGame", gameId],
    queryFn: async (): Promise<CurrentGame | null> => {
      if (!gameId) return null;
      const res = await fetch(PONDER_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: CURRENT_GAME_QUERY,
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

export function useMyProphetAndAcolyte(
  game: CurrentGame | null | undefined,
  ownerAddress: string | undefined
) {
  if (!game || !ownerAddress) return { prophet: null, acolyte: null };
  const prophet = game.prophets.items.find(
    (p) => p.playerAddress?.toLowerCase() === ownerAddress.toLowerCase()
  ) ?? null;
  const acolyte = game.acolytes.items.find(
    (a) => a.ownerAddress?.toLowerCase() === ownerAddress.toLowerCase()
  ) ?? null;
  return { prophet, acolyte };
}
