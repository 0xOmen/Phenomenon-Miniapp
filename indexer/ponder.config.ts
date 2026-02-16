import { createConfig } from "ponder";
import { PhenomenonAbi } from "./abis/Phenomenon";
import { GameplayEngineAbi } from "./abis/GameplayEngine";
import { TicketEngineAbi } from "./abis/TicketEngine";

const PHENOMENON_ADDRESS = process.env.PHENOMENON_ADDRESS ?? "0x2472FCd582b6f48D4977b6b1AD44Ad7a0B444827";
const GAMEPLAY_ENGINE_ADDRESS = process.env.GAMEPLAY_ENGINE_ADDRESS ?? "0xf952f23061031d9e8561C5ca12381C2eE04919F3";
const TICKET_ENGINE_ADDRESS = process.env.TICKET_ENGINE_ADDRESS ?? "0x18A7DB39F6FF7F64575E768d9dE0cB56D787ca29";

const START_BLOCK = Number(process.env.PHENOMENON_START_BLOCK ?? "37667749");

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
