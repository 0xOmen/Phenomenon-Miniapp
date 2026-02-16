"use client";

import { useAccount, useConnect } from "wagmi";
import { useMiniApp } from "@neynar/react";
import { usePonderGames } from "@/hooks/usePonderGames";

export default function Home() {
  const { isSDKLoaded, context } = useMiniApp();
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { data: games, isLoading, error, isError } = usePonderGames();

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Phenomenon</h1>
      <p className="text-gray-400 mb-6">Become a Movement — Farcaster miniapp (Neynar)</p>

      {isSDKLoaded && context && (
        <p className="text-gray-500 text-sm mb-2">Miniapp context loaded</p>
      )}

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
        {isLoading && !isError && <p className="text-gray-500">Loading...</p>}
        {isError && (
          <p className="text-red-400">
            Could not load games. Start the indexer (e.g. in indexer/ run npm run dev) and set NEXT_PUBLIC_PONDER_GRAPHQL_URL if needed (default http://localhost:42069/graphql).
          </p>
        )}
        {!isLoading && !error && games && games.length === 0 && (
          <p className="text-gray-500">No games yet. Start the indexer and ensure it has synced.</p>
        )}
        {games && games.length > 0 && (
          <ul className="space-y-2 text-sm">
            {games.map((g) => (
              <li key={g.id}>
                Game #{String(g.gameNumber)} — {g.status} — turn: {g.currentProphetTurn} — prophets:{" "}
                {g.prophetsRemaining}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
