// GameplayEngine.sol – events only (Base Sepolia verified)
// Full ABI at: https://sepolia.basescan.org/address/0xf952f23061031d9e8561C5ca12381C2eE04919F3#code
export const GameplayEngineAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bool", name: "isSuccess", type: "bool" },
      { indexed: true, internalType: "uint256", name: "currentProphetTurn", type: "uint256" },
    ],
    name: "MiracleAttempted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "target", type: "uint256" },
      { indexed: true, internalType: "bool", name: "isSuccess", type: "bool" },
      { indexed: true, internalType: "uint256", name: "currentProphetTurn", type: "uint256" },
    ],
    name: "SmiteAttempted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bool", name: "isSuccess", type: "bool" },
      { indexed: false, internalType: "bool", name: "targetIsAlive", type: "bool" },
      { indexed: true, internalType: "uint256", name: "currentProphetTurn", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "_target", type: "uint256" },
    ],
    name: "Accusation",
    type: "event",
  },
] as const;
