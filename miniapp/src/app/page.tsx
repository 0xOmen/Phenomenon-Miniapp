"use client";

import { useState } from "react";
import { usePonderGames } from "@/hooks/usePonderGames";
import { useCurrentGame } from "@/hooks/useCurrentGame";
import { Header } from "@/components/Header";
import { FooterTabs, type TabId } from "@/components/FooterTabs";
import { CurrentGameView } from "@/components/CurrentGameView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("current");
  const { data: games, isLoading: gamesLoading, error: gamesError } = usePonderGames();
  const currentGameId = games && games.length > 0 ? games[0].id : null;
  const { data: currentGame, isLoading: currentLoading, error: currentError } = useCurrentGame(currentGameId);

  return (
    <>
      <Header />
      <main className="min-h-screen p-6 pb-20">
        {activeTab === "current" && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Current Game</h2>
            <CurrentGameView
              game={currentGame}
              isLoading={gamesLoading || currentLoading}
              error={gamesError ?? currentError ?? null}
            />
          </section>
        )}

        {activeTab === "prior" && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Prior Games</h2>
            {gamesLoading && <p className="text-gray-500">Loading…</p>}
            {gamesError && (
              <p className="text-red-400">Could not load games.</p>
            )}
            {!gamesLoading && !gamesError && games && (
              <ul className="space-y-2">
                {games.slice(1, 21).map((g) => (
                  <li
                    key={g.id}
                    className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-sm text-gray-300"
                  >
                    Game #{String(g.gameNumber)} — {g.status}
                  </li>
                ))}
                {games.length <= 1 && (
                  <li className="text-gray-500">No prior games.</li>
                )}
              </ul>
            )}
            {!gamesLoading && (!games || games.length === 0) && (
              <p className="text-gray-500">No games yet.</p>
            )}
          </section>
        )}

        {activeTab === "stats" && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">Stats</h2>
            <p className="text-gray-500">Stats view coming soon.</p>
          </section>
        )}
      </main>
      <FooterTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
