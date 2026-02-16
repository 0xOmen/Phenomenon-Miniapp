// Phenomenon.sol – events only (Base Sepolia verified)
// Full ABI at: https://sepolia.basescan.org/address/0x2472FCd582b6f48D4977b6b1AD44Ad7a0B444827#code
export const PhenomenonAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "prophetNumber", type: "uint256" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: true, internalType: "uint256", name: "gameNumber", type: "uint256" },
    ],
    name: "ProphetEnteredGame",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "gameNumber", type: "uint256" }],
    name: "GameStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "gameNumber", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "tokensPerTicket", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "currentProphetTurn", type: "uint256" },
    ],
    name: "GameEnded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "newGameNumber", type: "uint256" }],
    name: "GameReset",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "nextProphetTurn", type: "uint256" }],
    name: "CurrentTurn",
    type: "event",
  },
] as const;
