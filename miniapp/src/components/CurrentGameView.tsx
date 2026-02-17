"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  type CurrentGame,
  type GameEventItem,
  type ProphetItem,
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
        {isPending
          ? "Confirm in wallet…"
          : canPlay
            ? "Play as Prophet"
            : "Approve & Play as Prophet"}
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
  const [action, setAction] = useState<"miracle" | "smite" | "accuse" | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  const run = async () => {
    if (action === "miracle") {
      await writeContractAsync({
        address: GAMEPLAY_ENGINE_ADDRESS,
        abi: gameplayEngineAbi,
        functionName: "performMiracle",
      });
    } else if (action === "smite" && target != null) {
      await writeContractAsync({
        address: GAMEPLAY_ENGINE_ADDRESS,
        abi: gameplayEngineAbi,
        functionName: "attemptSmite",
        args: [BigInt(target)],
      });
    } else if (action === "accuse" && target != null) {
      await writeContractAsync({
        address: GAMEPLAY_ENGINE_ADDRESS,
        abi: gameplayEngineAbi,
        functionName: "accuseOfBlasphemy",
        args: [BigInt(target)],
      });
    }
    setAction(null);
    setTarget(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-green-400">Your turn.</p>
      {!action && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAction("miracle")}
            disabled={isPending}
            className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Attempt miracle
          </button>
          <button
            type="button"
            onClick={() => setAction("smite")}
            disabled={isPending}
            className="rounded bg-amber-700 px-3 py-1.5 text-sm text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Attempt smite
          </button>
          <button
            type="button"
            onClick={() => setAction("accuse")}
            disabled={isPending}
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
            disabled={isPending || target == null}
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
            disabled={isPending}
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

function BuyTicketSection({
  gameId,
  livingProphets,
}: {
  gameId: string;
  livingProphets: ProphetItem[];
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [prophetIndex, setProphetIndex] = useState<number | null>(null);
  const [amount, setAmount] = useState("1");

  const buy = async () => {
    if (prophetIndex == null) return;
    const num = BigInt(amount || "1");
    if (num < BigInt(1)) return;
    await writeContractAsync({
      address: TICKET_ENGINE_ADDRESS,
      abi: ticketEngineAbi,
      functionName: "getReligion",
      args: [BigInt(prophetIndex), num],
    });
    setProphetIndex(null);
    setAmount("1");
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-300">Buy tickets (getReligion) for a living prophet:</p>
      <div className="flex flex-wrap gap-2">
        {livingProphets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProphetIndex(p.prophetIndex)}
            className={`rounded px-2 py-1 text-sm ${
              prophetIndex === p.prophetIndex ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
            }`}
          >
            Prophet {p.prophetIndex}
          </button>
        ))}
      </div>
      {prophetIndex != null && (
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
            onClick={buy}
            disabled={isPending}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Buy tickets
          </button>
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
  const getName = (prophetIndex: number) => {
    const p = prophets.find((x) => x.prophetIndex === prophetIndex);
    if (!p) return `Prophet ${prophetIndex}`;
    const u = neynarUsersMap?.[p.playerAddress.toLowerCase()];
    return u?.username ? `@${u.username}` : `Prophet ${prophetIndex}`;
  };
  const narratives = events
    .map((ev) => ({ ev, text: eventToNarrative(ev, getName, events) }))
    .filter((x): x is { ev: GameEventItem; text: string } => x.text != null);
  if (narratives.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-800 p-3">
      <p className="mb-2 text-xs font-medium text-gray-500">Action log</p>
      <ul className="space-y-1.5 text-sm text-gray-300">
        {narratives.map(({ ev, text }) => (
          <li key={ev.id}>{text}</li>
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
  const getName = (prophetIndex: number) => {
    const p = prophets.find((x) => x.prophetIndex === prophetIndex);
    if (!p) return `Prophet ${prophetIndex}`;
    const u = neynarUsersMap?.[p.playerAddress.toLowerCase()];
    return u?.username ? `@${u.username}` : `Prophet ${prophetIndex}`;
  };
  const eventsForProphet = (idx: number) =>
    events.filter((e) => e.prophetIndex === idx || (e.type === "accusation" && e.targetIndex === idx));
  const prophetNarratives = (idx: number) =>
    eventsForProphet(idx)
      .map((ev) => eventToNarrative(ev, getName, events))
      .filter((t): t is string => t != null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-lg font-semibold text-white">
          Game #{String(game.gameNumber)} — {status}
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
                  You are Prophet {prophet.prophetIndex}. Need{" "}
                  {required != null ? Math.max(0, required - registered) : "—"} more prophets to
                  register.
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
              <p className="text-sm text-gray-300">
                You are Prophet {prophet.prophetIndex}
                {!prophet.isAlive && " (eliminated)"}.
              </p>
              {prophet.isAlive && isMyTurn && (
                <ProphetTurnActions
                  gameId={game.id}
                  prophetIndex={prophet.prophetIndex}
                  livingProphets={livingProphets}
                />
              )}
              {prophet.isAlive && !isMyTurn && (
                <p className="text-sm text-gray-400">
                  {currentTurnProphet
                    ? currentTurnUsername
                      ? `Waiting for @${currentTurnUsername}'s turn.`
                      : `Waiting for Prophet ${currentTurnIndex}'s turn.`
                    : "Waiting for next turn."}
                </p>
              )}
            </div>
          )}
          {!prophet && (
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              {acolyte ? (
                <p className="text-sm text-gray-300">
                  You hold {String(acolyte.ticketCount)} ticket(s) for Prophet {acolyte.prophetIndex}
                  {acolyteProphetUsername ? ` (@${acolyteProphetUsername})` : ""}.
                </p>
              ) : (
                <BuyTicketSection gameId={game.id} livingProphets={livingProphets} />
              )}
            </div>
          )}
        </>
      )}

      {ended && (
        <p className="text-gray-400">
          Game ended.
          {game.winnerProphetIndex != null && (
            <> Winner: Prophet {game.winnerProphetIndex}</>
          )}
        </p>
      )}

      <div className="rounded-lg border border-gray-800 p-3">
        <p className="mb-2 text-xs font-medium text-gray-500">Prophet list</p>
        <ul className="space-y-1 text-sm">
          {prophets
            .sort((a, b) => a.prophetIndex - b.prophetIndex)
            .map((p) => {
              const isCurrentTurn = p.prophetIndex === currentTurnIndex;
              const isSelected = selectedProphetIndex === p.prophetIndex;
              const userInfo = neynarUsersMap?.[p.playerAddress.toLowerCase()];
              const narratives = prophetNarratives(p.prophetIndex);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedProphetIndex(isSelected ? null : p.prophetIndex)}
                    className={`flex w-full flex-wrap items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-gray-800/50 ${
                      isCurrentTurn ? "bg-blue-900/50 ring-1 ring-blue-500/50" : ""
                    } ${isSelected ? "ring-1 ring-gray-500" : ""}`}
                  >
                    <span className="text-gray-300">
                      Prophet {p.prophetIndex}:{" "}
                      <PlayerIdentity address={p.playerAddress} user={userInfo} />
                    </span>
                    <span className="text-gray-500">
                      {p.isAlive ? "alive" : "out"}
                      {!p.isFree && " (frozen)"}
                      {isSelected ? " ▼" : " ▶"}
                    </span>
                  </button>
                  {isSelected && narratives.length > 0 && (
                    <div className="mt-1 border-l-2 border-gray-700 pl-3 pb-2">
                      <p className="mb-1 text-xs text-gray-500">Actions by this prophet</p>
                      <ul className="space-y-0.5 text-xs text-gray-400">
                        {narratives.map((text, i) => (
                          <li key={i}>{text}</li>
                        ))}
                      </ul>
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
