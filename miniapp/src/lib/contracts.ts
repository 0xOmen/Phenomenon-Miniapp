/**
 * Contract addresses (Base Sepolia). Set via NEXT_PUBLIC_ in .env.local.
 */
export const PHENOMENON_ADDRESS = (process.env.NEXT_PUBLIC_PHENOMENON_ADDRESS ??
  "0x47e7517c0641e00b06429eaedc4fdd331ba2df13") as `0x${string}`;

export const GAMEPLAY_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_GAMEPLAY_ENGINE_ADDRESS ??
  "0x3d703fcca56522a066165c3ab2d7652be7d22163") as `0x${string}`;

export const TICKET_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_TICKET_ENGINE_ADDRESS ??
  "0x04964cdc1a4cb24a1b1212cdbada8a84eeb6388b") as `0x${string}`;

export const TEST_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS ??
  "0xA18A39F7f5Fa1A6d4aD6B67f6d5578D4002E2f98") as `0x${string}`;

export const PONDER_GRAPHQL_URL = process.env.NEXT_PUBLIC_PONDER_GRAPHQL_URL ?? "http://localhost:42069/graphql";
