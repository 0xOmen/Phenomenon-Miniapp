"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  type CurrentGame,
  type ProphetItem,
  useMyProphetAndAcolyte,
} from "@/hooks/useCurrentGame";
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

  const handleRegister = async () => {
    if (!address) return;
    try {
      if (!hasEnoughAllowance && fee > 0n) {
        await writeContractAsync({
          address: TEST_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [PHENOMENON_ADDRESS, fee],
        });
      }
      await writeContractAsync({
        address: PHENOMENON_ADDRESS,
        abi: phenomenonAbi,
        functionName: "registerProphet",
        args: [address],
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
        {isPending ? "Confirm in wallet…" : hasEnoughAllowance ? "Register as prophet" : "Approve & register as prophet"}
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
            disabled={isPending || (target == null && action !== "miracle")}
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
    if (num < 1n) return;
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
                <p className="text-green-400">You are registered as a prophet for this game.</p>
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
                    ? `Waiting for Prophet ${currentTurnIndex}'s turn.`
                    : "Waiting for next turn."}
                </p>
              )}
            </div>
          )}
          {!prophet && (
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
              {acolyte ? (
                <p className="text-sm text-gray-300">
                  You hold {String(acolyte.ticketCount)} ticket(s) for Prophet {acolyte.prophetIndex}.
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
            .map((p) => (
              <li key={p.id} className="font-mono text-gray-300">
                Prophet {p.prophetIndex}: {p.playerAddress.slice(0, 10)}… —{" "}
                {p.isAlive ? "alive" : "out"} {!p.isFree && " (frozen)"}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
