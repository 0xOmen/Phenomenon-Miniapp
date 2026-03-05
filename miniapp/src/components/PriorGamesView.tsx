"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { usePonderGames } from "@/hooks/usePonderGames";
import { usePriorGame } from "@/hooks/usePriorGame";
import { useNeynarUsers } from "@/hooks/useNeynarUsers";
import { TICKET_ENGINE_ADDRESS } from "@/lib/contracts";
import { ticketEngineAbi } from "@/lib/abis";

const TOKEN_DECIMALS = 18;

function formatTokens(wei: string | bigint): string {
  const n = typeof wei === "string" ? BigInt(wei) : wei;
  const div = BigInt(10) ** BigInt(TOKEN_DECIMALS);
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

  const { data: claimableGameNumbers, refetch: refetchClaimable } = useReadContract({
    address: TICKET_ENGINE_ADDRESS,
    abi: ticketEngineAbi,
    functionName: "getClaimableGameNumbers",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const {
    writeContractAsync: writeBatchClaim,
    data: batchTxHash,
    isPending: batchIsPending,
    error: batchError,
  } = useWriteContract();
  const { isLoading: batchIsConfirming, isSuccess: batchIsSuccess } = useWaitForTransactionReceipt({
    hash: batchTxHash,
  });

  const claimableCount = claimableGameNumbers?.length ?? 0;

  const shortAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  };

  const getDisplayName = (prophetIndex: number, prophets?: { prophetIndex: number; playerAddress: string }[]) => {
    const list = prophets ?? priorGame?.prophets?.items ?? [];
    const p = list.find((x) => x.prophetIndex === prophetIndex);
    if (!p) return `Prophet ${prophetIndex}`;
    const u = neynarUsersMap?.[p.playerAddress.toLowerCase()];
    return u?.username ?? u?.display_name ?? shortAddress(p.playerAddress);
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
      refetchClaimable();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClaimAll = async () => {
    if (!address || !claimableGameNumbers || claimableGameNumbers.length === 0) return;
    try {
      await writeBatchClaim({
        address: TICKET_ENGINE_ADDRESS,
        abi: ticketEngineAbi,
        functionName: "claimTicketsForMultipleGames",
        args: [claimableGameNumbers as bigint[], address],
      });
      refetchClaimable();
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
  const endTotal = priorGame?.endTotalTickets ? BigInt(priorGame.endTotalTickets) : BigInt(0);
  const winningTickets = priorGame?.winningTicketsAtEnd ? BigInt(priorGame.winningTicketsAtEnd) : BigInt(0);
  const winningPct =
    endTotal > BigInt(0) ? Math.round(Number((winningTickets * BigInt(10000)) / endTotal) / 100) : 0;

  const hasWinningTickets = myAcolyte && winnerIdx != null && myAcolyte.prophetIndex === winnerIdx;
  const hasClaimed = !!myClaim;
  const hasLosingTickets =
    myAcolyte && winnerIdx != null && myAcolyte.prophetIndex !== winnerIdx;
  const losingCount = hasLosingTickets ? myAcolyte!.ticketCount : "0";
  const canClaim = hasWinningTickets && !hasClaimed && !isSuccess;

  const estimatedValue =
    hasWinningTickets &&
    !hasClaimed &&
    priorGame?.tokensPerTicket
      ? BigInt(priorGame.tokensPerTicket) * BigInt(myAcolyte!.ticketCount)
      : null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-white">Prior Games</h2>
      {address && claimableCount > 1 && !batchIsSuccess && (
        <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 p-3 space-y-2">
          <p className="text-sm text-green-300">
            You have unclaimed winnings from {claimableCount} games!
          </p>
          <button
            type="button"
            onClick={handleClaimAll}
            disabled={batchIsPending || batchIsConfirming}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {batchIsPending || batchIsConfirming ? "Confirm in wallet…" : `Claim all winnings (${claimableCount} games)`}
          </button>
          {batchError && <p className="text-xs text-red-400">{batchError.message}</p>}
        </div>
      )}
      {batchIsSuccess && (
        <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 p-3">
          <p className="text-sm text-green-400">All winnings claimed successfully!</p>
        </div>
      )}
      {gamesLoading && <p className="text-gray-500">Loading…</p>}
      {gamesError && <p className="text-red-400">Could not load games.</p>}
      {!gamesLoading && !gamesError && (
        <ul className="space-y-2">
          {priorGames.slice(0, 21).map((g) => {
            const winnerProphet = g.prophets?.items?.find(
              (p) => p.prophetIndex === (g.winnerProphetIndex ?? -1)
            );
            const winnerName =
              winnerProphet && g.winnerProphetIndex != null
                ? getDisplayName(g.winnerProphetIndex, g.prophets?.items)
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
                            Winner: {getDisplayName(winnerIdx, priorGame?.prophets?.items)}
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
