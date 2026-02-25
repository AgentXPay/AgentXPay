import dotenv from "dotenv";
dotenv.config();

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://agentxpay:agentxpay123@localhost:5432/agentxpay",

  rpcUrl: process.env.RPC_URL || "https://testnet-rpc.monad.xyz/",

  paymentManagerAddress:
    process.env.PAYMENT_MANAGER_ADDRESS ||
    "0xf4AE7E15B1012edceD8103510eeB560a9343AFd3",

  subscriptionManagerAddress:
    process.env.SUBSCRIPTION_MANAGER_ADDRESS ||
    "0x0bF7dE8d71820840063D4B8653Fd3F0618986faF",

  startBlock: BigInt(process.env.START_BLOCK || "0"),

  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS || "3000"),

  port: Number(process.env.PORT || "3002"),

  // Monad Testnet RPC limits eth_getLogs to 100 block range
  chunkSize: 100n,

  // Leave 2 blocks for confirmation to avoid reorg issues
  confirmationBlocks: 2n,
};

// Minimal ABI fragments for event parsing
export const PAYMENT_MADE_EVENT =
  "event PaymentMade(uint256 indexed serviceId, address indexed payer, address indexed provider, uint256 amount, uint256 platformFee)";

export const SUBSCRIPTION_PAID_EVENT =
  "event SubscriptionPaid(uint256 indexed serviceId, address indexed subscriber, address indexed provider, uint256 amount, uint256 platformFee)";
