"use client";

import { useState } from "react";
import { usePonderGames } from "@/hooks/usePonderGames";
import { useCurrentGame } from "@/hooks/useCurrentGame";
import { Header } from "@/components/Header";
import { FooterTabs, type TabId } from "@/components/FooterTabs";
import { CurrentGameView } from "@/components/CurrentGameView";
import { PriorGamesView } from "@/components/PriorGamesView";

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
            <CurrentGameView
              game={currentGame}
              isLoading={gamesLoading || currentLoading}
              error={gamesError ?? currentError ?? null}
            />
          </section>
        )}

        {activeTab === "prior" && <PriorGamesView />}

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
