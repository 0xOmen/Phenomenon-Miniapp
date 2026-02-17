/**
 * Minimal ABIs for contract writes (names from indexer ABIs).
 */

export const erc20Abi = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const phenomenonAbi = [
  {
    inputs: [{ name: "_prophet", type: "address" }],
    name: "registerProphet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "s_entranceFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "s_lastRoundTimestamp",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "s_maxInterval",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const gameplayEngineAbi = [
  {
    inputs: [],
    name: "performMiracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_target", type: "uint256" }],
    name: "attemptSmite",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_target", type: "uint256" }],
    name: "accuseOfBlasphemy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_allowListProof", type: "bytes32[]" }],
    name: "enterGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "forceMiracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ticketEngineAbi = [
  {
    inputs: [
      { name: "_prophetNum", type: "uint256" },
      { name: "_ticketsToBuy", type: "uint256" },
    ],
    name: "getReligion",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
