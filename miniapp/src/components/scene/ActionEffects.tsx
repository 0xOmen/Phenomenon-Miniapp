"use client";

import { useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { ActiveEffect } from "./types";
import { EFFECT_DURATION } from "./types";

function SmiteEffect({
  from,
  to,
  success,
  progress,
}: {
  from: [number, number, number];
  to: [number, number, number];
  success: boolean;
  progress: number;
}) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(...from).add(new THREE.Vector3(0, 0.5, 0));
    const end = new THREE.Vector3(...to).add(new THREE.Vector3(0, 0.5, 0));
    const segments = 10;
    const pts: [number, number, number][] = [];
    const reach = Math.min(progress * 2.5, 1);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      if (t > reach) break;
      const p = start.clone().lerp(end, t);
      if (i > 0 && i < segments) {
        p.x += (Math.random() - 0.5) * 0.3;
        p.y += Math.random() * 0.4 + 0.3;
        p.z += (Math.random() - 0.5) * 0.3;
      }
      pts.push([p.x, p.y, p.z]);
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, Math.floor(progress * 8)]);

  const opacity = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
  if (points.length < 2 || opacity <= 0) return null;

  return (
    <>
      <Line
        points={points}
        color={success ? "#facc15" : "#ef4444"}
        lineWidth={3}
        opacity={opacity}
        transparent
      />
      {/* Glow line underneath */}
      <Line
        points={points}
        color={success ? "#fef08a" : "#fca5a5"}
        lineWidth={6}
        opacity={opacity * 0.3}
        transparent
      />
      {/* Impact flash at target */}
      {progress > 0.35 && progress < 0.6 && (
        <mesh position={[to[0], 0.5, to[2]]}>
          <sphereGeometry args={[0.3 + (progress - 0.35) * 2, 16, 16]} />
          <meshBasicMaterial
            color={success ? "#facc15" : "#ef4444"}
            opacity={Math.max(0, 0.6 - (progress - 0.35) * 2.4)}
            transparent
          />
        </mesh>
      )}
    </>
  );
}

function AccuseEffect({
  from,
  to,
  progress,
}: {
  from: [number, number, number];
  to: [number, number, number];
  progress: number;
}) {
  const t = Math.min(progress * 2.5, 1);
  const x = from[0] + (to[0] - from[0]) * t;
  const arcHeight = Math.sin(t * Math.PI) * 1.8;
  const y = 0.6 + arcHeight;
  const z = from[2] + (to[2] - from[2]) * t;
  const opacity = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

  if (progress > 0.85) return null;

  return (
    <>
      <group position={[x, y, z]} rotation={[progress * 3, progress * Math.PI * 6, progress * 2]}>
        {/* Book body */}
        <mesh>
          <boxGeometry args={[0.2, 0.28, 0.06]} />
          <meshStandardMaterial color="#5c3317" />
        </mesh>
        {/* Cross emblem */}
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[0.04, 0.15]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <mesh position={[0, 0.02, 0.031]}>
          <planeGeometry args={[0.1, 0.04]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>
      {/* Trail particles */}
      {progress < 0.5 && (
        <mesh position={[x - (to[0] - from[0]) * 0.05, y - 0.1, z - (to[2] - from[2]) * 0.05]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" opacity={opacity * 0.5} transparent />
        </mesh>
      )}
    </>
  );
}

function MiracleEffect({
  position,
  success,
  progress,
}: {
  position: [number, number, number];
  success: boolean;
  progress: number;
}) {
  const color = success ? "#a855f7" : "#ef4444";
  const glowColor = success ? "#c084fc" : "#fca5a5";

  return (
    <group position={position}>
      {/* Expanding rings */}
      {[0, 0.12, 0.24].map((delay, i) => {
        const p = Math.max(0, progress - delay);
        const scale = p * 2.5;
        const opacity = Math.max(0, 0.8 - p * 1.6);
        if (opacity <= 0) return null;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1 + i * 0.3, 0]}>
            <ringGeometry args={[scale * 0.4, scale * 0.4 + 0.08, 32]} />
            <meshBasicMaterial
              color={color}
              opacity={opacity}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Vertical beam */}
      {progress < 0.5 && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.02, 0.25, 4, 8]} />
          <meshBasicMaterial
            color={glowColor}
            opacity={0.5 - progress}
            transparent
          />
        </mesh>
      )}

      {/* Hand glow spheres */}
      {progress < 0.6 && (
        <>
          <mesh position={[-0.3, 0.3, 0.2]}>
            <sphereGeometry args={[0.12 + progress * 0.15, 12, 12]} />
            <meshBasicMaterial
              color={glowColor}
              opacity={Math.max(0, 0.7 - progress * 1.2)}
              transparent
            />
          </mesh>
          <mesh position={[0.3, 0.3, 0.2]}>
            <sphereGeometry args={[0.12 + progress * 0.15, 12, 12]} />
            <meshBasicMaterial
              color={glowColor}
              opacity={Math.max(0, 0.7 - progress * 1.2)}
              transparent
            />
          </mesh>
        </>
      )}
    </group>
  );
}

function EffectRunner({
  effect,
  onDone,
}: {
  effect: ActiveEffect;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useFrame((_, delta) => {
    setProgress((p) => {
      const next = p + delta / EFFECT_DURATION;
      if (next >= 1) {
        onDone();
        return 1;
      }
      return next;
    });
  });

  if (effect.type === "smite" && effect.targetPos) {
    return (
      <SmiteEffect
        from={effect.attackerPos}
        to={effect.targetPos}
        success={effect.success}
        progress={progress}
      />
    );
  }
  if (effect.type === "accuse" && effect.targetPos) {
    return (
      <AccuseEffect
        from={effect.attackerPos}
        to={effect.targetPos}
        progress={progress}
      />
    );
  }
  if (effect.type === "miracle") {
    return (
      <MiracleEffect
        position={effect.attackerPos}
        success={effect.success}
        progress={progress}
      />
    );
  }
  return null;
}

export function EffectManager({
  effects,
  onEffectDone,
}: {
  effects: ActiveEffect[];
  onEffectDone: (id: string) => void;
}) {
  return (
    <>
      {effects.map((effect) => (
        <EffectRunner
          key={effect.id}
          effect={effect}
          onDone={() => onEffectDone(effect.id)}
        />
      ))}
    </>
  );
}
