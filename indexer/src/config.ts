import dotenv from "dotenv";
dotenv.config();

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://agentxpay:agentxpay123@localhost:5432/agentxpay",

  rpcUrl: process.env.RPC_URL || "https://testnet-rpc.monad.xyz/",

  paymentManagerAddress:
    process.env.PAYMENT_MANAGER_ADDRESS ||
    "0x1593b641a7038d30d068EE567A33c892DB7F17f2",

  subscriptionManagerAddress:
    process.env.SUBSCRIPTION_MANAGER_ADDRESS ||
    "0xb4daE4538dACA8430421869E3c234DD1d7aBa7DE",

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
