import { ContractAddresses } from "../types";

export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz/";

export const DEFAULT_CONTRACTS: Record<string, ContractAddresses> = {
  local: {
    serviceRegistry: "",
    paymentManager: "",
    subscriptionManager: "",
    escrow: "",
    agentWalletFactory: "",
  },
  testnet: {
    serviceRegistry: "",
    paymentManager: "",
    subscriptionManager: "",
    escrow: "",
    agentWalletFactory: "",
  },
};

export const DEFAULT_GAS_LIMIT = 500000n;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
