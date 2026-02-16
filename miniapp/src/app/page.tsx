"use client";

import { useAccount, useConnect } from "wagmi";
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { usePonderGames } from "@/hooks/usePonderGames";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: games, isLoading, error } = usePonderGames();

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Phenomenon</h1>
      <p className="text-gray-400 mb-6">Become a Movement — Farcaster miniapp</p>

      {isConnected ? (
        <p className="text-green-400">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => connect({ connector: connectors[0] })}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Connect wallet
        </button>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Games (from Ponder)</h2>
        {isLoading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-400">Error: {String(error)}</p>}
        {games && games.length === 0 && (
          <p className="text-gray-500">No games yet. Start the indexer and ensure it has synced.</p>
        )}
        {games && games.length > 0 && (
          <ul className="space-y-2 text-sm">
            {games.map((g) => (
              <li key={g.id}>
                Game #{g.gameNumber} — {g.status} — turn: {g.currentProphetTurn} — prophets:{" "}
                {g.prophetsRemaining}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
