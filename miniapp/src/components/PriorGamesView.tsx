"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { usePonderGames } from "@/hooks/usePonderGames";
import { usePriorGame } from "@/hooks/usePriorGame";
import { useNeynarUsers } from "@/hooks/useNeynarUsers";
import { TICKET_ENGINE_ADDRESS } from "@/lib/contracts";
import { ticketEngineAbi } from "@/lib/abis";

const TOKEN_DECIMALS = 18;

function formatTokens(wei: string | bigint): string {
  const n = typeof wei === "string" ? BigInt(wei) : wei;
  const div = 10n ** BigInt(TOKEN_DECIMALS);
  const whole = n / div;
  const frac = n % div;
  const fracStr = frac.toString().padStart(TOKEN_DECIMALS, "0").slice(0, 4).replace(/0+$/, "") || "0";
  return fracStr ? `${whole}.${fracStr}` : String(whole);
}

export function PriorGamesView() {
  const { address } = useAccount();
  const { data: games, isLoading: gamesLoading, error: gamesError } = usePonderGames();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const { data: priorGame, isLoading: priorLoading } = usePriorGame(selectedGameId);
  const priorGames = games?.filter((g) => g.status === "ended") ?? [];
  const allProphetAddresses = [
    ...new Set(
      priorGames.flatMap((g) => g.prophets?.items?.map((p) => p.playerAddress) ?? [])
    ),
  ];
  const prophetAddresses = selectedGameId
    ? priorGame?.prophets?.items?.map((p) => p.playerAddress) ?? []
    : allProphetAddresses;
  const { data: neynarUsersMap } = useNeynarUsers(prophetAddresses);
  const { writeContractAsync, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const getDisplayName = (prophetIndex: number) => {
    const p = priorGame?.prophets?.items?.find((x) => x.prophetIndex === prophetIndex);
    if (!p) return `Prophet ${prophetIndex}`;
    const u = neynarUsersMap?.[p.playerAddress.toLowerCase()];
    return u?.display_name ?? u?.username ?? `Prophet ${prophetIndex}`;
  };

  const handleClaim = async () => {
    if (!address || !priorGame) return;
    try {
      await writeContractAsync({
        address: TICKET_ENGINE_ADDRESS,
        abi: ticketEngineAbi,
        functionName: "claimTickets",
        args: [BigInt(priorGame.gameNumber), address],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const walletLower = address?.toLowerCase() ?? "";
  const myAcolyte = priorGame?.acolytes?.items?.find(
    (a) => a.ownerAddress?.toLowerCase() === walletLower
  );
  const myClaim = priorGame?.ticketClaims?.items?.find(
    (c) => c.ownerAddress?.toLowerCase() === walletLower
  );
  const winnerIdx = priorGame?.winnerProphetIndex ?? null;
  const endTotal = priorGame?.endTotalTickets ? BigInt(priorGame.endTotalTickets) : 0n;
  const winningTickets = priorGame?.winningTicketsAtEnd ? BigInt(priorGame.winningTicketsAtEnd) : 0n;
  const winningPct =
    endTotal > 0n ? Math.round(Number((winningTickets * 10000n) / endTotal) / 100) : 0;

  const hasWinningTickets = myAcolyte && winnerIdx != null && myAcolyte.prophetIndex === winnerIdx;
  const hasClaimed = !!myClaim;
  const hasLosingTickets =
    myAcolyte && winnerIdx != null && myAcolyte.prophetIndex !== winnerIdx;
  const losingCount = hasLosingTickets ? myAcolyte!.ticketCount : "0";
  const canClaim = hasWinningTickets && !hasClaimed && !isSuccess;

  const estimatedValue =
    hasWinningTickets &&
    !hasClaimed &&
    endTotal > 0n &&
    priorGame?.tokenBalance
      ? (BigInt(priorGame.tokenBalance) * BigInt(myAcolyte!.ticketCount)) / endTotal
      : null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">Prior Games</h2>
      {gamesLoading && <p className="text-gray-500">Loading…</p>}
      {gamesError && <p className="text-red-400">Could not load games.</p>}
      {!gamesLoading && !gamesError && (
        <ul className="space-y-2">
          {priorGames.slice(0, 21).map((g) => {
            const winnerProphet = g.prophets?.items?.find(
              (p) => p.prophetIndex === (g.winnerProphetIndex ?? -1)
            );
            const winnerName = winnerProphet
              ? neynarUsersMap?.[winnerProphet.playerAddress.toLowerCase()]?.display_name ??
                neynarUsersMap?.[winnerProphet.playerAddress.toLowerCase()]?.username ??
                `Prophet ${g.winnerProphetIndex}`
              : null;
            const label =
              g.status === "ended" && winnerName != null
                ? `${winnerName} won`
                : g.status;
            const isSelected = selectedGameId === g.id;
            return (
              <li key={g.id} className="rounded-lg border border-gray-800 bg-gray-900/50">
                <button
                  type="button"
                  onClick={() => setSelectedGameId(isSelected ? null : g.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50"
                >
                  <span>Game #{String(g.gameNumber)} — {label}</span>
                  <span className="text-gray-500">{isSelected ? "▼" : "▶"}</span>
                </button>
                {isSelected && (
                  <div className="border-t border-gray-800 px-3 py-3">
                    {priorLoading ? (
                      <p className="text-sm text-gray-500">Loading details…</p>
                    ) : priorGame ? (
                      <div className="space-y-3 text-sm">
                        {winnerIdx != null && (
                          <p className="text-gray-300">
                            Winner: {getDisplayName(winnerIdx)}
                          </p>
                        )}
                        {address ? (
                          <>
                            {hasClaimed && (
                              <p className="text-green-400">
                                You held winning tickets and claimed {formatTokens(myClaim!.tokensClaimed)} tokens.
                              </p>
                            )}
                            {canClaim && (
                              <div>
                                <p className="text-gray-300">
                                  You hold {String(myAcolyte!.ticketCount)} winning ticket(s).
                                  {estimatedValue != null && (
                                    <> Estimated value: {formatTokens(estimatedValue)} tokens.</>
                                  )}
                                </p>
                                <button
                                  type="button"
                                  onClick={handleClaim}
                                  disabled={isPending || isConfirming}
                                  className="mt-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                                >
                                  {isPending || isConfirming
                                    ? "Confirm in wallet…"
                                    : "Claim winnings"}
                                </button>
                                {error && (
                                  <p className="mt-2 text-xs text-red-400">{error.message}</p>
                                )}
                              </div>
                            )}
                            {hasLosingTickets && !hasWinningTickets && !hasClaimed && (
                              <p className="text-gray-400">
                                You held {String(losingCount)} losing ticket(s).
                              </p>
                            )}
                            {!myAcolyte && !myClaim && (
                              <p className="text-gray-500">
                                {winningPct}% of ticket holders held winning tickets.
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500">
                            {winningPct}% of ticket holders held winning tickets.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No details available.</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {priorGames.length === 0 && (
            <li className="text-gray-500">No prior games.</li>
          )}
        </ul>
      )}
      {!gamesLoading && (!games || games.length === 0) && (
        <p className="text-gray-500">No games yet.</p>
      )}
    </section>
  );
}
