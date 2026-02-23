"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  type CurrentGame,
  type GameEventItem,
  type ProphetItem,
  type AcolyteItem,
  useMyProphetAndAcolyte,
} from "@/hooks/useCurrentGame";
import { useNeynarUsers } from "@/hooks/useNeynarUsers";
import type { NeynarUserInfo } from "@/hooks/useNeynarUsers";
import {
  PHENOMENON_ADDRESS,
  GAMEPLAY_ENGINE_ADDRESS,
  TICKET_ENGINE_ADDRESS,
  TEST_TOKEN_ADDRESS,
} from "@/lib/contracts";
import {
  erc20Abi,
  phenomenonAbi,
  gameplayEngineAbi,
  ticketEngineAbi,
} from "@/lib/abis";

function RegisterProphetButton({ gameId }: { gameId: string }) {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [locallyApproved, setLocallyApproved] = useState(false);
  const { data: entranceFee } = useReadContract({
    address: PHENOMENON_ADDRESS,
    abi: phenomenonAbi,
    functionName: "s_entranceFee",
  });
  const { data: allowance } = useReadContract({
    address: TEST_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, PHENOMENON_ADDRESS] : undefined,
  });

  const fee = entranceFee ?? BigInt(0);
  const hasEnoughAllowance = allowance != null && allowance >= fee;
  const canPlay = hasEnoughAllowance || locallyApproved;

  const handleRegister = async () => {
    if (!address) return;
    try {
      if (!canPlay && fee > BigInt(0)) {
        await writeContractAsync({
          address: TEST_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [PHENOMENON_ADDRESS, fee],
        });
        setLocallyApproved(true);
      }
      await writeContractAsync({
        address: GAMEPLAY_ENGINE_ADDRESS,
        abi: gameplayEngineAbi,
        functionName: "enterGame",
        // For now we pass an empty allow list proof. If the
        // deployed game enforces an allow list, this will
        // revert and can be extended later to fetch a proof.
        args: [[]],
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!address) return null;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRegister}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet…" : "Play as Prophet"}
      </button>
      {error && <p className="text-sm text-red-400">{error.message}</p>}
    </div>
  );
}

function ProphetTurnActions({
  gameId,
  prophetIndex,
  livingProphets,
}: {
  gameId: string;
  prophetIndex: number;
  livingProphets: ProphetItem[];
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null);
  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({ hash: pendingTxHash ?? undefined });
  const [action, setAction] = useState<"miracle" | "smite" | "accuse" | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    if (isReceiptSuccess && pendingTxHash) setPendingTxHash(null);
  }, [isReceiptSuccess, pendingTxHash]);

  const run = async () => {
    try {
      let hash: `0x${string}` | undefined;
      if (action === "miracle") {
        hash = await writeContractAsync({
          address: GAMEPLAY_ENGINE_ADDRESS,
          abi: gameplayEngineAbi,
          functionName: "performMiracle",
        });
      } else if (action === "smite" && target != null) {
        hash = await writeContractAsync({
          address: GAMEPLAY_ENGINE_ADDRESS,
          abi: gameplayEngineAbi,
          functionName: "attemptSmite",
          args: [BigInt(target)],
        });
      } else if (action === "accuse" && target != null) {
        hash = await writeContractAsync({
          address: GAMEPLAY_ENGINE_ADDRESS,
          abi: gameplayEngineAbi,
          functionName: "accuseOfBlasphemy",
          args: [BigInt(target)],
        });
      }
      if (hash) setPendingTxHash(hash);
      setAction(null);
      setTarget(null);
    } catch {
      // keep action/target for retry
    }
  };

  const waiting = isPending || (pendingTxHash != null && !isReceiptSuccess) || isConfirming;

  return (
    <div className="space-y-3">
      <p className="text-sm text-green-400">Your turn.</p>
      {waiting && (
        <p className="text-sm text-amber-400">
          Transaction submitted. Waiting for confirmation and Chainlink fulfillment. Actions are disabled until the round updates.
        </p>
      )}
      {!action && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAction("miracle")}
            disabled={waiting}
            className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Attempt miracle
          </button>
          <button
            type="button"
            onClick={() => setAction("smite")}
            disabled={waiting}
            className="rounded bg-amber-700 px-3 py-1.5 text-sm text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Attempt smite
          </button>
          <button
            type="button"
            onClick={() => setAction("accuse")}
            disabled={waiting}
            className="rounded bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            Accuse
          </button>
        </div>
      )}
      {(action === "smite" || action === "accuse") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">Target prophet:</span>
          {livingProphets
            .filter((p) => p.prophetIndex !== prophetIndex)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setTarget(p.prophetIndex)}
                className={`rounded px-2 py-1 text-sm ${
                  target === p.prophetIndex
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Prophet {p.prophetIndex}
              </button>
            ))}
          <button
            type="button"
            onClick={run}
            disabled={waiting || target == null}
            className="rounded bg-blue-600 px-2 py-1 text-sm text-white disabled:opacity-50"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => { setAction(null); setTarget(null); }}
            className="rounded bg-gray-600 px-2 py-1 text-sm text-white"
          >
            Cancel
          </button>
        </div>
      )}
      {action === "miracle" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={run}
            disabled={waiting}
            className="rounded bg-blue-600 px-2 py-1 text-sm text-white disabled:opacity-50"
          >
            Confirm miracle
          </button>
          <button
            type="button"
            onClick={() => setAction(null)}
            className="rounded bg-gray-600 px-2 py-1 text-sm text-white"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error.message}</p>}
    </div>
  );
}

function formatTokenAmount(wei: bigint): string {
  const decimals = 18;
  const div = BigInt(10) ** BigInt(decimals);
  const whole = wei / div;
  const frac = wei % div;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "") || "0";
  return fracStr !== "0" ? `${whole}.${fracStr}` : String(whole);
}

function AcolyteTicketActions({
  gameId,
  livingProphets,
  currentAcolyte,
  getName,
}: {
  gameId: string;
  livingProphets: ProphetItem[];
  currentAcolyte: AcolyteItem | null;
  getName: (idx: number) => string;
}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [mode, setMode] = useState<"buy" | "sell" | null>(currentAcolyte ? null : "buy");
  const [selectedProphet, setSelectedProphet] = useState<number | null>(currentAcolyte?.prophetIndex ?? null);
  const [amount, setAmount] = useState("1");

  let ticketCount = BigInt(0);
  try {
    ticketCount = BigInt(amount || "0");
  } catch {
    ticketCount = BigInt(0);
  }
  const validAmount = ticketCount > BigInt(0);

  const buyProphetIndex = currentAcolyte?.prophetIndex ?? selectedProphet;
  const buyProphet = buyProphetIndex != null
    ? livingProphets.find((p) => p.prophetIndex === buyProphetIndex)
    : null;
  const supply = buyProphet ? BigInt(buyProphet.accolites ?? 0) : BigInt(0);

  const { data: ticketSalesEnabled } = useReadContract({
    address: TICKET_ENGINE_ADDRESS,
    abi: ticketEngineAbi,
    functionName: "isTicketSalesEnabled",
  });

  const { data: buyPrice } = useReadContract({
    address: TICKET_ENGINE_ADDRESS,
    abi: ticketEngineAbi,
    functionName: "getPrice",
    args: [supply, ticketCount],
    query: { enabled: mode === "buy" && buyProphetIndex != null && validAmount },
  });

  const sellSupply = supply > ticketCount ? supply - ticketCount : BigInt(0);
  const { data: sellPrice } = useReadContract({
    address: TICKET_ENGINE_ADDRESS,
    abi: ticketEngineAbi,
    functionName: "getPrice",
    args: [sellSupply, ticketCount],
    query: { enabled: mode === "sell" && validAmount && supply > BigInt(0) },
  });

  const { data: allowance } = useReadContract({
    address: TEST_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, PHENOMENON_ADDRESS] : undefined,
    query: { enabled: !!address && mode === "buy" && validAmount },
  });

  const needsApproval = mode === "buy" && buyPrice != null && allowance != null && allowance < buyPrice;
  const heldCount = currentAcolyte ? BigInt(currentAcolyte.ticketCount) : BigInt(0);
  const canSell = validAmount && ticketCount <= heldCount;

  const handleBuy = async () => {
    if (buyProphetIndex == null || !validAmount || !address) return;
    try {
      if (needsApproval && buyPrice != null) {
        await writeContractAsync({
          address: TEST_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [PHENOMENON_ADDRESS, buyPrice],
        });
      }
      await writeContractAsync({
        address: TICKET_ENGINE_ADDRESS,
        abi: ticketEngineAbi,
        functionName: "getReligion",
        args: [BigInt(buyProphetIndex), ticketCount],
      });
      setMode(null);
      setAmount("1");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSell = async () => {
    if (!validAmount || !canSell) return;
    try {
      await writeContractAsync({
        address: TICKET_ENGINE_ADDRESS,
        abi: ticketEngineAbi,
        functionName: "loseReligion",
        args: [ticketCount],
      });
      setMode(null);
      setAmount("1");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode(mode === "buy" ? null : "buy"); setAmount("1"); }}
          className={`rounded px-3 py-1 text-sm ${
            mode === "buy" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
          }`}
        >
          {currentAcolyte ? "Buy more tickets" : "Buy tickets"}
        </button>
        {ticketSalesEnabled && heldCount > BigInt(0) && (
          <button
            type="button"
            onClick={() => { setMode(mode === "sell" ? null : "sell"); setAmount("1"); }}
            className={`rounded px-3 py-1 text-sm ${
              mode === "sell" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            Sell tickets
          </button>
        )}
      </div>
      {mode === "buy" && (
        <div className="space-y-2">
          {!currentAcolyte && (
            <>
              <p className="text-xs text-gray-400">Select a prophet:</p>
              <div className="flex flex-wrap gap-1">
                {livingProphets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProphet(p.prophetIndex)}
                    className={`rounded px-2 py-0.5 text-xs ${
                      selectedProphet === p.prophetIndex ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    }`}
                  >
                    {getName(p.prophetIndex)}
                  </button>
                ))}
              </div>
            </>
          )}
          {buyProphetIndex != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-20 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={isPending || !validAmount}
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  {isPending ? "Confirm in wallet…" : "Buy"}
                </button>
              </div>
              {buyPrice != null && validAmount && (
                <p className="text-xs text-gray-400">
                  Cost: {formatTokenAmount(buyPrice)} $DEGEN
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {mode === "sell" && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            You hold {String(heldCount)} ticket(s). How many to sell?
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={Number(heldCount)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-20 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
            />
            <button
              type="button"
              onClick={handleSell}
              disabled={isPending || !canSell}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              {isPending ? "Confirm in wallet…" : "Sell"}
            </button>
          </div>
          {sellPrice != null && validAmount && canSell && (
            <p className="text-xs text-gray-400">
              You will receive: {formatTokenAmount(sellPrice)} $DEGEN
            </p>
          )}
          {!canSell && validAmount && (
            <p className="text-xs text-red-400">
              Cannot sell more than you hold.
            </p>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error.message}</p>}
    </div>
  );
}

function PlayerIdentity({
  address,
  user,
}: {
  address: string;
  user: NeynarUserInfo | null | undefined;
}) {
  const short = address.slice(0, 8);
  if (user?.username) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-gray-200">{user.username}</span>
        {user.pfp_url && (
          <img
            src={user.pfp_url}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
            width={24}
            height={24}
          />
        )}
      </span>
    );
  }
  return <span className="font-mono text-gray-400">{short}</span>;
}

/** Events are ordered by blockNumber desc (most recent first). */
function getForcedMiracleOutcome(
  forceEvent: GameEventItem,
  events: GameEventItem[]
): boolean | null {
  const i = events.findIndex((e) => e.id === forceEvent.id);
  if (i < 0 || forceEvent.prophetIndex == null) return null;
  for (let j = 0; j < i; j++) {
    const e = events[j];
    if (e.type === "miracleAttempted" && e.prophetIndex === forceEvent.prophetIndex) return e.success ?? null;
  }
  return null;
}

/** Display name for narratives: username (no @) or 0x + first 6 hex chars. */
function getDisplayName(
  prophetIndex: number,
  prophets: ProphetItem[],
  neynarUsersMap: Record<string, NeynarUserInfo> | undefined
): string {
  const p = prophets.find((x) => x.prophetIndex === prophetIndex);
  if (!p) return `Prophet ${prophetIndex}`;
  const u = neynarUsersMap?.[p.playerAddress.toLowerCase()];
  return u?.username ?? p.playerAddress.slice(0, 8);
}

function getEventEmoji(type: string): string {
  switch (type) {
    case "prophetEnteredGame": return "👤";
    case "prophetRegistered": return "📝";
    case "gameStarted": return "🚀";
    case "gameEnded": return "🏁";
    case "gameReset": return "🔄";
    case "miracleAttempted": return "✨";
    case "smiteAttempted": return "⚡";
    case "accusation": return "📢";
    case "forceMiracleTriggered": return "⏩";
    case "gainReligion": return "🎫";
    default: return "•";
  }
}

function eventToNarrative(
  event: GameEventItem,
  getName: (prophetIndex: number) => string,
  eventsOrderedDesc?: GameEventItem[]
): string | null {
  const actor = event.prophetIndex != null ? getName(event.prophetIndex) : null;
  const target = event.targetIndex != null ? getName(event.targetIndex) : null;
  switch (event.type) {
    case "prophetEnteredGame":
      return actor ? `${actor} entered the game as a prophet.` : null;
    case "prophetRegistered":
      return actor ? `${actor} registered as a prophet.` : null;
    case "gameStarted":
      return "The game started.";
    case "gameEnded":
      return actor ? `The game ended. ${actor} won.` : "The game ended.";
    case "gameReset":
      return "A new game was reset.";
    case "miracleAttempted":
      if (actor == null) return null;
      return event.success
        ? `${actor} successfully performed a miracle.`
        : `${actor} failed to perform a miracle and was eliminated.`;
    case "smiteAttempted":
      if (actor == null || target == null) return null;
      return event.success
        ? `${actor} successfully smote ${target} and ${target} was eliminated.`
        : `${actor} failed to smite ${target} and was sent to jail.`;
    case "accusation":
      if (actor == null || target == null) return null;
      if (!event.success) return `${actor} failed to accuse ${target} of blasphemy and was sent to jail.`;
      if (event.targetIsAlive === true) return `${actor} successfully accused ${target} of blasphemy and sent ${target} to jail.`;
      if (event.targetIsAlive === false) return `${actor} successfully accused ${target} of blasphemy and ${target} was executed.`;
      return `${actor} successfully accused ${target} of blasphemy and ${target} was punished.`;
    case "forceMiracleTriggered": {
      if (!actor) return "A miracle was forced.";
      const outcome = eventsOrderedDesc ? getForcedMiracleOutcome(event, eventsOrderedDesc) : null;
      if (outcome === true) return `${actor}'s turn was forced; a miracle was triggered. ${actor} succeeded (no change or freed from jail).`;
      if (outcome === false) return `${actor}'s turn was forced; a miracle was triggered. ${actor} failed and was eliminated.`;
      return `${actor}'s turn was forced; a miracle was triggered.`;
    }
    case "gainReligion":
      return target ? `Tickets were bought for ${target}.` : null;
    default:
      return null;
  }
}

function NarrativeFeed({
  events,
  prophets,
  neynarUsersMap,
}: {
  events: GameEventItem[];
  prophets: ProphetItem[];
  neynarUsersMap: Record<string, NeynarUserInfo> | undefined;
}) {
  const getName = (prophetIndex: number) => getDisplayName(prophetIndex, prophets, neynarUsersMap);
  const ACTION_LOG_SKIP_TYPES = ["prophetEnteredGame"]; // show only prophetRegistered for registration
  const narratives = events
    .filter((ev) => !ACTION_LOG_SKIP_TYPES.includes(ev.type))
    .map((ev) => ({ ev, text: eventToNarrative(ev, getName, events) }))
    .filter((x): x is { ev: GameEventItem; text: string } => x.text != null);
  if (narratives.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-800 p-3">
      <p className="mb-2 text-xs font-medium text-gray-500">Action log</p>
      <ul className="space-y-1.5 text-sm text-gray-300">
        {narratives.map(({ ev, text }) => (
          <li key={ev.id}>{getEventEmoji(ev.type)} {text}</li>
        ))}
      </ul>
    </div>
  );
}

function ForceTurnButton() {
  const { data: lastRound } = useReadContract({
    address: PHENOMENON_ADDRESS,
    abi: phenomenonAbi,
    functionName: "s_lastRoundTimestamp",
  });
  const { data: maxInterval } = useReadContract({
    address: PHENOMENON_ADDRESS,
    abi: phenomenonAbi,
    functionName: "s_maxInterval",
  });
  const { writeContractAsync, isPending, error } = useWriteContract();
  const now = Math.floor(Date.now() / 1000);
  const deadline =
    lastRound != null && maxInterval != null ? Number(lastRound) + Number(maxInterval) : 0;
  const canForce = deadline > 0 && now >= deadline;
  if (!canForce) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => writeContractAsync({ address: GAMEPLAY_ENGINE_ADDRESS, abi: gameplayEngineAbi, functionName: "forceMiracle" })}
        disabled={isPending}
        className="rounded bg-amber-700 px-2 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {isPending ? "Confirm…" : "Force turn"}
      </button>
      {error && <span className="ml-2 text-xs text-red-400">{error.message}</span>}
    </div>
  );
}

function StartNewGameButton({ numberOfProphets }: { numberOfProphets: number }) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          writeContractAsync({
            address: PHENOMENON_ADDRESS,
            abi: phenomenonAbi,
            functionName: "reset",
            args: [numberOfProphets],
          })
        }
        disabled={isPending}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet…" : "Start New Game"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error.message}</p>}
    </div>
  );
}

function HighPriestAllegianceButton({
  prophetIndex,
  currentAllegianceIndex,
  livingProphets,
  getName,
}: {
  prophetIndex: number;
  currentAllegianceIndex: number | null;
  livingProphets: ProphetItem[];
  getName: (idx: number) => string;
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [target, setTarget] = useState<number | null>(null);

  const eligibleTargets = livingProphets.filter(
    (p) => p.prophetIndex !== prophetIndex && p.prophetIndex !== currentAllegianceIndex
  );

  if (eligibleTargets.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs text-gray-500">Give allegiance to:</p>
      <div className="flex flex-wrap gap-1">
        {eligibleTargets.map((p) => (
          <button
            key={p.prophetIndex}
            type="button"
            onClick={() => setTarget(p.prophetIndex)}
            className={`rounded px-2 py-0.5 text-xs ${
              target === p.prophetIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            {getName(p.prophetIndex)}
          </button>
        ))}
      </div>
      {target != null && (
        <button
          type="button"
          onClick={() =>
            writeContractAsync({
              address: TICKET_ENGINE_ADDRESS,
              abi: ticketEngineAbi,
              functionName: "highPriest",
              args: [BigInt(prophetIndex), BigInt(target)],
            })
          }
          disabled={isPending}
          className="mt-1 rounded bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {isPending ? "Confirm…" : `Pledge to ${getName(target)}`}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
    </div>
  );
}

export function CurrentGameView({
  game,
  isLoading,
  error,
}: {
  game: CurrentGame | null | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  const { address } = useAccount();
  const { prophet, acolyte } = useMyProphetAndAcolyte(game, address ?? undefined);
  const prophetAddresses = game?.prophets?.items?.map((p) => p.playerAddress) ?? [];
  const { data: neynarUsersMap } = useNeynarUsers(prophetAddresses);
  const [selectedProphetIndex, setSelectedProphetIndex] = useState<number | null>(null);

  if (isLoading) {
    return <p className="text-gray-500">Loading current game…</p>;
  }
  if (error) {
    return (
      <p className="text-red-400">
        Failed to load game. Is the indexer running?
      </p>
    );
  }
  if (!game) {
    return <p className="text-gray-500">No current game.</p>;
  }

  const status = game.status;
  const required = game.prophetsRequired ?? null;
  const registered = game.prophetsRemaining;
  const open = status === "open";
  const started = status === "started";
  const ended = status === "ended";
  const prophets = game.prophets.items;
  const livingProphets = prophets.filter((p) => p.isAlive);
  const currentTurnIndex = game.currentProphetTurn;
  const currentTurnProphet = prophets.find((p) => p.prophetIndex === currentTurnIndex);
  const isMyTurn = prophet != null && prophet.prophetIndex === currentTurnIndex && prophet.isAlive;
  const currentTurnUsername =
    currentTurnProphet && neynarUsersMap?.[currentTurnProphet.playerAddress.toLowerCase()]?.username;
  const acolyteProphet = acolyte && prophets.find((x) => x.prophetIndex === acolyte.prophetIndex);
  const acolyteProphetUsername =
    acolyteProphet && neynarUsersMap?.[acolyteProphet.playerAddress.toLowerCase()]?.username;

  const events = game.events?.items ?? [];
  const getName = (prophetIndex: number) => getDisplayName(prophetIndex, prophets, neynarUsersMap);
  const eventsForProphet = (idx: number) =>
    events.filter(
      (e) =>
        e.prophetIndex === idx ||
        (e.type === "accusation" && e.targetIndex === idx) ||
        (e.type === "smiteAttempted" && e.targetIndex === idx)
    );
  const DROPDOWN_SKIP_TYPES = ["prophetEnteredGame", "prophetRegistered"];
  const prophetNarratives = (idx: number) =>
    eventsForProphet(idx)
      .filter((e) => !DROPDOWN_SKIP_TYPES.includes(e.type))
      .map((ev) => ({ ev, text: eventToNarrative(ev, getName, events) }))
      .filter((x): x is { ev: GameEventItem; text: string } => x.text != null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-lg font-semibold text-white">
          Game #{String(game.gameNumber)} — {status === "started" ? "In progress" : status}
        </h3>
        <p className="text-sm text-gray-400">
          Prophets: {registered}
          {required != null && ` / ${required}`} • Turn: Prophet {currentTurnIndex}
        </p>
      </div>

      {/* Open: waiting for prophets */}
      {open && (
        <>
          {required != null && registered < required && (
            <>
              {!address && (
                <p className="text-gray-400">Connect a wallet to register as a prophet.</p>
              )}
              {address && prophet && (
                <p className="text-green-400">
                  You are registered! Waiting for{" "}
                  {required != null ? Math.max(0, required - registered) : "—"} more players to start.
                </p>
              )}
              {address && !prophet && (
                <RegisterProphetButton gameId={game.id} />
              )}
            </>
          )}
          {required != null && registered >= required && (
            <p className="text-gray-400">Enough prophets registered; game will start soon.</p>
          )}
        </>
      )}

      {/* In progress */}
      {started && (
        <>
          {prophet && (
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              {prophet.role === "highPriest" ? (
                (() => {
                  const myAcolyte = game.acolytes?.items?.find(
                    (a) => a.ownerAddress?.toLowerCase() === address?.toLowerCase()
                  );
                  const followedProphet = myAcolyte
                    ? prophets.find((pp) => pp.prophetIndex === myAcolyte.prophetIndex)
                    : null;
                  const followedEliminated = followedProphet && !followedProphet.isAlive;
                  return followedEliminated ? (
                    <p className="text-sm text-red-400">
                      You are Prophet {prophet.prophetIndex} (eliminated).
                    </p>
                  ) : (
                    <p className="text-sm text-amber-300">
                      You are a High Priest, lend your power to other prophets to win!
                    </p>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-300">
                  You are Prophet {prophet.prophetIndex}
                  {!prophet.isAlive && " (eliminated)"}.
                </p>
              )}
              {prophet.isAlive && isMyTurn && (
                <ProphetTurnActions
                  gameId={game.id}
                  prophetIndex={prophet.prophetIndex}
                  livingProphets={livingProphets}
                />
              )}
              {prophet.isAlive && !isMyTurn && prophet.role !== "highPriest" && (
                <p className="text-sm text-gray-400">
                  {currentTurnProphet
                    ? currentTurnUsername
                      ? `Waiting for ${currentTurnUsername}'s turn.`
                      : `Waiting for Prophet ${currentTurnIndex}'s turn.`
                    : "Waiting for next turn."}
                </p>
              )}
            </div>
          )}
          {!prophet && (
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-3">
              {acolyte && (
                <p className="text-sm text-gray-300">
                  You hold {String(acolyte.ticketCount)} ticket(s) for{" "}
                  {acolyteProphetUsername ?? getName(acolyte.prophetIndex)}.
                </p>
              )}
              <AcolyteTicketActions
                gameId={game.id}
                livingProphets={livingProphets}
                currentAcolyte={acolyte}
                getName={getName}
              />
            </div>
          )}
        </>
      )}

      {ended && (
        <div className="space-y-3">
          <p className="text-gray-400">
            Game ended.
            {game.winnerProphetIndex != null && (
              <> Winner: Prophet {game.winnerProphetIndex}</>
            )}
          </p>
          <StartNewGameButton numberOfProphets={required ?? 2} />
        </div>
      )}

      <div className="rounded-lg border border-gray-800 p-3">
        <p className="mb-2 text-xs font-medium text-gray-500">Prophet list</p>
        <ul className="space-y-1 text-sm">
          {prophets
            .sort((a, b) => a.prophetIndex - b.prophetIndex)
            .map((p) => {
              const isCurrentTurn = p.prophetIndex === currentTurnIndex;
              const isWinner = ended && game.winnerProphetIndex != null && p.prophetIndex === game.winnerProphetIndex;
              const isSelected = selectedProphetIndex === p.prophetIndex;
              const userInfo = neynarUsersMap?.[p.playerAddress.toLowerCase()];
              const totalTickets = BigInt(game.totalTickets ?? 0);
              const supremacyPct =
                totalTickets > BigInt(0)
                  ? Math.round(
                      (Number((BigInt(p.accolites ?? 0) + BigInt(p.highPriests ?? 0)) * BigInt(10000)) /
                        Number(totalTickets))
                    ) / 100
                  : 0;
              const narratives = prophetNarratives(p.prophetIndex);
              const isHighPriest = p.role === "highPriest";
              const isEliminated = !p.isAlive;
              const isJailed = p.isAlive && !p.isFree;
              const rowColor =
                isWinner
                  ? "bg-green-900/40 ring-1 ring-green-500/50"
                  : isCurrentTurn && started
                    ? "bg-blue-900/50 ring-1 ring-blue-500/50"
                    : "";
              const textColor = isWinner ? "text-green-300" : isEliminated ? "text-red-400" : isJailed ? "text-yellow-400" : "text-gray-300";
              const statusLabel = isWinner
                ? "Winner!"
                : isHighPriest
                  ? null
                  : p.isAlive
                    ? p.isFree
                      ? "Alive"
                      : "Jailed"
                    : "Eliminated";
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedProphetIndex(isSelected ? null : p.prophetIndex)}
                    className={`flex w-full flex-wrap items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-gray-800/50 ${rowColor} ${isSelected ? "ring-1 ring-gray-500" : ""}`}
                  >
                    <span className={textColor}>
                      Prophet {p.prophetIndex}: <PlayerIdentity address={p.playerAddress} user={userInfo} />
                    </span>
                    <span className={`flex items-center gap-2 ${isWinner ? "text-green-400 font-medium" : isHighPriest ? "text-gray-500" : isEliminated ? "text-red-400" : isJailed ? "text-yellow-400" : "text-gray-500"}`}>
                      <span className="rounded bg-gray-700/80 px-1.5 py-0.5 text-xs text-gray-300">
                        {supremacyPct}%
                      </span>
                      {isHighPriest ? (
                        <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-xs font-medium text-amber-200">
                          High Priest
                        </span>
                      ) : (
                        statusLabel
                      )}
                      {isSelected ? " ▼" : " ▶"}
                    </span>
                  </button>
                  {isSelected && (
                    <div className="mt-1 border-l-2 border-gray-700 pl-3 pb-2">
                      <p className="mb-2 text-xs text-gray-400">
                        Supremacy: {supremacyPct}% ({String(BigInt(p.accolites ?? 0))} Acolyte{BigInt(p.accolites ?? 0) !== BigInt(1) ? "s" : ""}, {String(BigInt(p.highPriests ?? 0))} High Priest{BigInt(p.highPriests ?? 0) !== BigInt(1) ? "s" : ""})
                      </p>
                      {isHighPriest && (
                        <div className="mb-2 text-xs">
                          <p className="text-gray-500">
                            Current allegiance:{" "}
                            {(() => {
                              const ac = game.acolytes?.items?.find(
                                (a) => a.ownerAddress?.toLowerCase() === p.playerAddress.toLowerCase()
                              );
                              return ac != null ? getName(ac.prophetIndex) : "None";
                            })()}
                          </p>
                          {(() => {
                            const history = events.filter(
                              (e) =>
                                e.type === "gainReligion" &&
                                e.actorAddress?.toLowerCase() === p.playerAddress.toLowerCase()
                            );
                            if (history.length === 0) return null;
                            return (
                              <p className="mt-0.5 text-gray-500">
                                Allegiance history: {history.map((e) => getName(e.prophetIndex ?? -1)).join(" → ")}
                              </p>
                            );
                          })()}
                          {address && p.playerAddress.toLowerCase() === address.toLowerCase() && started && livingProphets.length > 2 && (
                            <HighPriestAllegianceButton
                              prophetIndex={p.prophetIndex}
                              currentAllegianceIndex={
                                game.acolytes?.items?.find(
                                  (a) => a.ownerAddress?.toLowerCase() === p.playerAddress.toLowerCase()
                                )?.prophetIndex ?? null
                              }
                              livingProphets={livingProphets}
                              getName={getName}
                            />
                          )}
                        </div>
                      )}
                      {narratives.length > 0 && (
                        <>
                          <p className="mb-1 text-xs text-gray-500">Actions by this prophet</p>
                          <ul className="space-y-0.5 text-xs text-gray-400">
                            {narratives.map(({ ev, text }, i) => (
                              <li key={i}>{getEventEmoji(ev.type)} {text}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                  {isCurrentTurn && started && <ForceTurnButton />}
                </li>
              );
            })}
        </ul>
      </div>

      <NarrativeFeed events={events} prophets={prophets} neynarUsersMap={neynarUsersMap} />
    </div>
  );
}
