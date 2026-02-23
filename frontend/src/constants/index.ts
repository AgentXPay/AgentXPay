export const CONTRACTS = {
  serviceRegistry: process.env.NEXT_PUBLIC_SERVICE_REGISTRY_ADDRESS || "",
  paymentManager: process.env.NEXT_PUBLIC_PAYMENT_MANAGER_ADDRESS || "",
  subscriptionManager: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS || "",
  escrow: process.env.NEXT_PUBLIC_ESCROW_ADDRESS || "",
  agentWalletFactory: process.env.NEXT_PUBLIC_AGENT_WALLET_FACTORY_ADDRESS || "",
};

export const MONAD_RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/";
