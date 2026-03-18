export type SceneProphet = {
  prophetIndex: number;
  displayName: string;
  isAlive: boolean;
  isFree: boolean;
  role: string;
  isCurrentTurn: boolean;
  isWinner: boolean;
  supremacyPct: number;
  position: [number, number, number];
};

export type ActiveEffect = {
  id: string;
  type: "smite" | "accuse" | "miracle";
  attackerPos: [number, number, number];
  targetPos?: [number, number, number];
  success: boolean;
};

export const CIRCLE_RADIUS = 4;
export const EFFECT_DURATION = 2;

export function getProphetPosition(
  index: number,
  total: number
): [number, number, number] {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return [
    Math.cos(angle) * CIRCLE_RADIUS,
    0,
    Math.sin(angle) * CIRCLE_RADIUS,
  ];
}
