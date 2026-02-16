"use client";

import { useAccount, useConnect } from "wagmi";
import { useNeynarUser } from "@/hooks/useNeynarUser";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { data, isLoading } = useNeynarUser(isConnected ? address : undefined);

  const user = data?.user;
  const displayName = user?.display_name || user?.username || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-800 bg-black/95 px-4 backdrop-blur">
      <h1 className="text-lg font-semibold text-white">Phenomenon</h1>
      <div className="flex items-center gap-3">
        {!isConnected ? (
          <button
            type="button"
            onClick={() => connect({ connector: connectors[0] })}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Connect wallet
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {displayName && (
              <span className="max-w-[120px] truncate text-sm text-gray-300" title={address ?? undefined}>
                {displayName}
              </span>
            )}
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
            ) : user?.pfp_url ? (
              <img
                src={user.pfp_url}
                alt=""
                className="h-8 w-8 rounded-full border border-gray-600 object-cover"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs text-gray-400"
                title={address ?? undefined}
              >
                {address?.slice(2, 4).toUpperCase() ?? "?"}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
