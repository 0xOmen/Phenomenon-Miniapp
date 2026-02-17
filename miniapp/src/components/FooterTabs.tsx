"use client";

export type TabId = "current" | "prior" | "stats";

const TABS: { id: TabId; label: string }[] = [
  { id: "current", label: "Current Game" },
  { id: "prior", label: "Prior Games" },
  { id: "stats", label: "Stats" },
];

export function FooterTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-800 bg-black/95 backdrop-blur">
      <nav className="flex">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === id
                ? "border-t-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </footer>
  );
}
