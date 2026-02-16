// TicketEngine.sol – events only (Base Sepolia verified)
// Full ABI at: https://sepolia.basescan.org/address/0x18A7DB39F6FF7F64575E768d9dE0cB56D787ca29#code
export const TicketEngineAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "_target", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "numTicketsBought", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "totalPrice", type: "uint256" },
      { indexed: false, internalType: "address", name: "sender", type: "address" },
    ],
    name: "GainReligion",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "_target", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "numTicketsSold", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "totalPrice", type: "uint256" },
      { indexed: false, internalType: "address", name: "sender", type: "address" },
    ],
    name: "ReligionLost",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "ticketsClaimed", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "tokensSent", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "gameNumber", type: "uint256" },
    ],
    name: "TicketsClaimed",
    type: "event",
  },
] as const;
