import { createConfig } from "ponder";
import { PhenomenonAbi } from "./abis/Phenomenon";
import { GameplayEngineAbi } from "./abis/GameplayEngine";
import { TicketEngineAbi } from "./abis/TicketEngine";

const PHENOMENON_ADDRESS = process.env.PHENOMENON_ADDRESS ?? "0x47e7517c0641e00b06429eaedc4fdd331ba2df13";
const GAMEPLAY_ENGINE_ADDRESS = process.env.GAMEPLAY_ENGINE_ADDRESS ?? "0x3d703fcca56522a066165c3ab2d7652be7d22163";
const TICKET_ENGINE_ADDRESS = process.env.TICKET_ENGINE_ADDRESS ?? "0x04964cdc1a4cb24a1b1212cdbada8a84eeb6388b";

const START_BLOCK = Number(process.env.PHENOMENON_START_BLOCK ?? "38444062");

// Use Postgres when PONDER_DATABASE_URL or DATABASE_URL (Railway reference) is set.
const databaseUrl = process.env.PONDER_DATABASE_URL ?? process.env.DATABASE_URL;

export default createConfig({
  database:
    databaseUrl ?
      { kind: "postgres" as const, connectionString: databaseUrl }
    : undefined,
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: process.env.PONDER_RPC_URL_84532 ?? process.env.ALCHEMY_BASE_SEPOLIA_RPC_URL,
    },
  },
  contracts: {
    Phenomenon: {
      abi: PhenomenonAbi,
      chain: "baseSepolia",
      address: PHENOMENON_ADDRESS as `0x${string}`,
      startBlock: START_BLOCK,
    },
    GameplayEngine: {
      abi: GameplayEngineAbi,
      chain: "baseSepolia",
      address: GAMEPLAY_ENGINE_ADDRESS as `0x${string}`,
      startBlock: START_BLOCK,
    },
    TicketEngine: {
      abi: TicketEngineAbi,
      chain: "baseSepolia",
      address: TICKET_ENGINE_ADDRESS as `0x${string}`,
      startBlock: START_BLOCK,
    },
  },
});
