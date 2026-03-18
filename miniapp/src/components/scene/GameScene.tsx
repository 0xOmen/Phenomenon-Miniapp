"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import type { ProphetItem, GameEventItem } from "@/hooks/useCurrentGame";
import type { NeynarUserInfo } from "@/hooks/useNeynarUsers";
import { ProphetNode } from "./ProphetNode";
import { EffectManager } from "./ActionEffects";
import type { SceneProphet, ActiveEffect } from "./types";
import { CIRCLE_RADIUS, getProphetPosition } from "./types";

function ArenaFloor({ radius }: { radius: number }) {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[radius + 1.5, 64]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Inner arena accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <circleGeometry args={[radius + 0.5, 64]} />
        <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      {/* Arena ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
        <meshBasicMaterial color="#4338ca" opacity={0.4} transparent />
      </mesh>
      {/* Center mark */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color="#6366f1" opacity={0.25} transparent />
      </mesh>
    </group>
  );
}

function SceneContents({
  sceneProphets,
  effects,
  selectedProphetIndex,
  onSelectProphet,
  onEffectDone,
}: {
  sceneProphets: SceneProphet[];
  effects: ActiveEffect[];
  selectedProphetIndex: number | null;
  onSelectProphet: (idx: number | null) => void;
  onEffectDone: (id: string) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 12, 5]} intensity={0.7} />
      <pointLight position={[0, 6, 0]} intensity={0.5} color="#818cf8" />
      <pointLight position={[-4, 3, -4]} intensity={0.2} color="#c084fc" />

      <ArenaFloor radius={CIRCLE_RADIUS} />

      {sceneProphets.map((sp) => (
        <ProphetNode
          key={sp.prophetIndex}
          prophet={sp}
          isSelected={selectedProphetIndex === sp.prophetIndex}
          onClick={() =>
            onSelectProphet(
              selectedProphetIndex === sp.prophetIndex ? null : sp.prophetIndex
            )
          }
        />
      ))}

      <EffectManager effects={effects} onEffectDone={onEffectDone} />
    </>
  );
}

export function GameScene({
  prophets,
  currentTurnIndex,
  totalTickets,
  events,
  neynarUsersMap,
  isEnded,
  winnerProphetIndex,
  selectedProphetIndex,
  onSelectProphet,
}: {
  prophets: ProphetItem[];
  currentTurnIndex: number;
  totalTickets: string | null;
  events: GameEventItem[];
  neynarUsersMap: Record<string, NeynarUserInfo> | undefined;
  isEnded: boolean;
  winnerProphetIndex: number | null;
  selectedProphetIndex: number | null;
  onSelectProphet: (idx: number | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalBig = BigInt(totalTickets ?? 0);

  const sceneProphets: SceneProphet[] = useMemo(() => {
    const sorted = [...prophets].sort((a, b) => a.prophetIndex - b.prophetIndex);
    return sorted.map((p) => {
      const supremacyPct =
        totalBig > BigInt(0)
          ? Math.round(
              (Number(
                (BigInt(p.accolites ?? 0) + BigInt(p.highPriests ?? 0)) *
                  BigInt(10000)
              ) /
                Number(totalBig)) / 100
            )
          : 0;
      const u = neynarUsersMap?.[p.playerAddress.toLowerCase()];
      const displayName = u?.username ?? p.playerAddress.slice(0, 8);
      return {
        prophetIndex: p.prophetIndex,
        displayName,
        isAlive: p.isAlive,
        isFree: p.isFree,
        role: p.role,
        isCurrentTurn: p.prophetIndex === currentTurnIndex,
        isWinner: isEnded && winnerProphetIndex === p.prophetIndex,
        supremacyPct,
        position: getProphetPosition(p.prophetIndex, prophets.length),
      };
    });
  }, [prophets, currentTurnIndex, totalBig, neynarUsersMap, isEnded, winnerProphetIndex]);

  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[0];
    if (latest.id === lastEventId) return;
    setLastEventId(latest.id);

    const ACTION_TYPES = ["smiteAttempted", "accusation", "miracleAttempted"];
    if (!ACTION_TYPES.includes(latest.type)) return;

    const attackerIdx = latest.prophetIndex;
    const targetIdx = latest.targetIndex;
    if (attackerIdx == null) return;

    const attackerPos = getProphetPosition(attackerIdx, prophets.length);
    const targetPos =
      targetIdx != null
        ? getProphetPosition(targetIdx, prophets.length)
        : undefined;

    let effectType: "smite" | "accuse" | "miracle";
    if (latest.type === "smiteAttempted") effectType = "smite";
    else if (latest.type === "accusation") effectType = "accuse";
    else effectType = "miracle";

    setEffects((prev) => [
      ...prev,
      {
        id: latest.id,
        type: effectType,
        attackerPos,
        targetPos,
        success: latest.success ?? false,
      },
    ]);
  }, [events, lastEventId, prophets.length]);

  const removeEffect = useCallback((id: string) => {
    setEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-800 bg-gray-950"
        style={{ height: 420 }}
      >
        <p className="text-gray-500">Loading scene…</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border border-gray-800"
      style={{ height: 420 }}
    >
      <Canvas
        camera={{ position: [0, 11, 7], fov: 48 }}
        style={{ background: "#080816" }}
        gl={{ antialias: true }}
      >
        <SceneContents
          sceneProphets={sceneProphets}
          effects={effects}
          selectedProphetIndex={selectedProphetIndex}
          onSelectProphet={onSelectProphet}
          onEffectDone={removeEffect}
        />
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 flex gap-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-600" /> Turn
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-yellow-600" /> Jailed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-800" /> Dead
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-600" /> High Priest
        </span>
      </div>
    </div>
  );
}
