// TicketEngine.sol – Complete ABI (Base Sepolia verified)
// Full ABI at: https://sepolia.basescan.org/address/0x18A7DB39F6FF7F64575E768d9dE0cB56D787ca29#code
export const TicketEngineAbi = [
  {
    inputs: [
      { internalType: "address", name: "gameContractAddress", type: "address" },
      { internalType: "uint256", name: "ticketMultiplier", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
  { inputs: [], name: "TicketEng__AddressIsEliminated", type: "error" },
  { inputs: [], name: "TicketEng__NotAllowed", type: "error" },
  { inputs: [], name: "TicketEng__NotEnoughTicketsOwned", type: "error" },
  { inputs: [], name: "TicketEng__NotInProgress", type: "error" },
  {
    inputs: [],
    name: "TicketEng__ProphetAllegianceChangeDisabled",
    type: "error",
  },
  { inputs: [], name: "TicketEng__ProphetIsDead", type: "error" },
  { inputs: [], name: "TicketEng__TicketSalesDisabled", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_target",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "numTicketsBought",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "totalPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "gainReligion",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_target",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "numTicketsSold",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "totalPrice",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "religionLost",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "_ticketSalesEnabled",
        type: "bool",
      },
    ],
    name: "ticketSalesEnabled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokensSent",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "gameNumber",
        type: "uint256",
      },
    ],
    name: "ticketsClaimed",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "changeOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_gameNumber", type: "uint256" },
      { internalType: "address", name: "_player", type: "address" },
    ],
    name: "claimTickets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "supply", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "getPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "prophetNum", type: "uint256" }],
    name: "getProphetData",
    outputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "bool", name: "", type: "bool" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_prophetNum", type: "uint256" },
      { internalType: "uint256", name: "_ticketsToBuy", type: "uint256" },
    ],
    name: "getReligion",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_senderProphetNum", type: "uint256" },
      { internalType: "uint256", name: "_target", type: "uint256" },
    ],
    name: "highPriest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isTicketSalesEnabled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_ticketsToSell", type: "uint256" },
    ],
    name: "loseReligion",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_prophetAllegianceChangeEnabled",
        type: "bool",
      },
    ],
    name: "setProphetAllegianceChangeEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_ticketMultiplier", type: "uint256" },
    ],
    name: "setTicketMultiplier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bool", name: "_ticketSalesEnabled", type: "bool" },
    ],
    name: "setTicketSalesEnabled",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
