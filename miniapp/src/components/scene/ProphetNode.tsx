"use client";

import { useRef } from "react";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import type { SceneProphet } from "./types";

export function ProphetNode({
  prophet,
  isSelected,
  onClick,
}: {
  prophet: SceneProphet;
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const baseColor = prophet.isWinner
    ? "#22c55e"
    : !prophet.isAlive
      ? "#991b1b"
      : !prophet.isFree
        ? "#a16207"
        : prophet.role === "highPriest"
          ? "#d97706"
          : prophet.isCurrentTurn
            ? "#2563eb"
            : "#4b5563";

  const statusText = prophet.isWinner
    ? "WINNER"
    : prophet.role === "highPriest"
      ? "High Priest"
      : !prophet.isAlive
        ? "Eliminated"
        : !prophet.isFree
          ? "Jailed"
          : "Alive";

  const statusColor = prophet.isWinner
    ? "#16a34a"
    : !prophet.isAlive
      ? "#dc2626"
      : !prophet.isFree
        ? "#ca8a04"
        : prophet.role === "highPriest"
          ? "#d97706"
          : "#4ade80";

  return (
    <group ref={groupRef} position={prophet.position}>
      {/* Blood pool for dead prophets */}
      {!prophet.isAlive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial color="#7f1d1d" opacity={0.6} transparent />
        </mesh>
      )}

      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Selection ring */}
        {isSelected && (
          <mesh position={[0, 0, -0.01]}>
            <ringGeometry args={[0.58, 0.68, 32]} />
            <meshBasicMaterial color="#60a5fa" opacity={0.9} transparent />
          </mesh>
        )}

        {/* Current turn pulse ring */}
        {prophet.isCurrentTurn && prophet.isAlive && (
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[0.75, 32]} />
            <meshBasicMaterial color="#3b82f6" opacity={0.15} transparent />
          </mesh>
        )}

        {/* Prophet body */}
        <mesh
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          rotation={!prophet.isAlive ? [0, 0, Math.PI / 2] : [0, 0, 0]}
        >
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color={baseColor} />
        </mesh>

        {/* Border ring */}
        <mesh
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          rotation={!prophet.isAlive ? [0, 0, Math.PI / 2] : [0, 0, 0]}
        >
          <ringGeometry args={[0.47, 0.52, 32]} />
          <meshBasicMaterial
            color={isSelected ? "#93c5fd" : "#e2e8f0"}
            opacity={0.7}
            transparent
          />
        </mesh>

        {/* Prophet index */}
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          rotation={!prophet.isAlive ? [0, 0, Math.PI / 2] : [0, 0, 0]}
        >
          {String(prophet.prophetIndex)}
        </Text>

        {/* Name label */}
        <Text
          position={[0, -0.78, 0]}
          fontSize={0.16}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          {prophet.displayName}
        </Text>

        {/* Status tag */}
        <group position={[0, 0.72, 0]}>
          <mesh>
            <planeGeometry args={[statusText.length * 0.095 + 0.2, 0.22]} />
            <meshBasicMaterial color="#0f172a" opacity={0.85} transparent />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
            color={statusColor}
            anchorX="center"
            anchorY="middle"
          >
            {statusText}
          </Text>
        </group>

        {/* Supremacy badge */}
        <group position={[0.58, 0.42, 0]}>
          <mesh>
            <circleGeometry args={[0.2, 16]} />
            <meshBasicMaterial color="#0f172a" opacity={0.9} transparent />
          </mesh>
          <mesh>
            <ringGeometry args={[0.18, 0.2, 16]} />
            <meshBasicMaterial color="#6366f1" opacity={0.6} transparent />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
            color="#a5b4fc"
            anchorX="center"
            anchorY="middle"
          >
            {`${prophet.supremacyPct}%`}
          </Text>
        </group>
      </Billboard>
    </group>
  );
}
