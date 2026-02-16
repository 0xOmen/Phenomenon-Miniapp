"use client";

import { usePonderGames } from "@/hooks/usePonderGames";
import { Header } from "@/components/Header";

export default function Home() {
  const { data: games, isLoading, error, isError } = usePonderGames();

  return (
    <>
      <Header />
      <main className="min-h-screen p-6">
        <p className="text-gray-400 mb-6">Become a Movement — Farcaster miniapp</p>

        <section>
          <h2 className="text-lg font-semibold mb-2 text-white">Current game</h2>
          {isLoading && !isError && <p className="text-gray-500">Loading...</p>}
          {isError && (
            <p className="text-red-400">
              Could not load games. Check that the indexer is running and NEXT_PUBLIC_PONDER_GRAPHQL_URL is set.
            </p>
          )}
          {!isLoading && !error && games && games.length === 0 && (
            <p className="text-gray-500">No games yet. Start the indexer and ensure it has synced.</p>
          )}
          {games && games.length > 0 && (
            <div className="space-y-3 text-sm">
              {games.slice(0, 1).map((g) => {
                const required = g.prophetsRequired ?? null;
                const needed = required != null ? Math.max(0, required - g.prophetsRemaining) : null;
                const prophets = g.prophets?.items ?? [];
                return (
                  <div key={g.id} className="space-y-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                    <p className="text-gray-200">
                      Game #{String(g.gameNumber)} — {g.status} — turn: {g.currentProphetTurn} — prophets
                      registered: {g.prophetsRemaining}
                    </p>
                    <p className="text-gray-400">
                      Prophets needed to start: {needed != null ? needed : "—"}
                    </p>
                    {prophets.length > 0 && (
                      <div>
                        <p className="mb-1 text-gray-400">Prophet addresses:</p>
                        <ul className="list-inside list-disc space-y-0.5 font-mono text-gray-300">
                          {prophets
                            .sort((a, b) => a.prophetIndex - b.prophetIndex)
                            .map((p) => (
                              <li key={`${g.id}-${p.prophetIndex}`}>
                                {p.playerAddress}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
