/**
 * Contract addresses (Base Sepolia). Set via NEXT_PUBLIC_ in .env.local.
 */
export const PHENOMENON_ADDRESS = (process.env.NEXT_PUBLIC_PHENOMENON_ADDRESS ??
  "0x2472FCd582b6f48D4977b6b1AD44Ad7a0B444827") as `0x${string}`;

export const GAMEPLAY_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_GAMEPLAY_ENGINE_ADDRESS ??
  "0xf952f23061031d9e8561C5ca12381C2eE04919F3") as `0x${string}`;

export const TICKET_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_TICKET_ENGINE_ADDRESS ??
  "0x18A7DB39F6FF7F64575E768d9dE0cB56D787ca29") as `0x${string}`;

export const TEST_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS ??
  "0xA18A39F7f5Fa1A6d4aD6B67f6d5578D4002E2f98") as `0x${string}`;

export const PONDER_GRAPHQL_URL = process.env.NEXT_PUBLIC_PONDER_GRAPHQL_URL ?? "http://localhost:42069/graphql";
