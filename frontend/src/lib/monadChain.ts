import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const anvilLocalChain = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_ANVIL_RPC_URL || "http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});

export const ACTIVE_CHAIN = process.env.NEXT_PUBLIC_ACTIVE_CHAIN === "monad" ? monadTestnet : anvilLocalChain;
