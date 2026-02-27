export interface AgentXPayConfig {
  rpcUrl: string;
  privateKey?: string;
  signer?: any; // ethers.Signer
  contracts?: ContractAddresses;
  network?: "local" | "testnet" | "mainnet";
}

export interface ContractAddresses {
  serviceRegistry?: string;
  paymentManager?: string;
  subscriptionManager?: string;
  escrow?: string;
  agentWalletFactory?: string;
}

export interface Service {
  id: bigint;
  provider: string;
  name: string;
  description: string;
  endpoint: string;
  category: string;
  pricePerCall: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface SubscriptionPlan {
  planId: bigint;
  serviceId: bigint;
  price: bigint;
  duration: bigint;
  name: string;
}

export interface Subscription {
  subscriptionId: bigint;
  serviceId: bigint;
  planId: bigint;
  subscriber: string;
  startTime: bigint;
  endTime: bigint;
  autoRenew: boolean;
  isActive: boolean;
}

export enum EscrowStatus {
  Created = 0,
  Funded = 1,
  Released = 2,
  Disputed = 3,
  Refunded = 4,
  Resolved = 5,
}

export interface EscrowData {
  escrowId: bigint;
  serviceId: bigint;
  payer: string;
  provider: string;
  amount: bigint;
  status: EscrowStatus;
  createdAt: bigint;
  deadline: bigint;
  description: string;
}

export interface DiscoverFilter {
  category?: string;
  maxPrice?: bigint;
  isActive?: boolean;
}

export interface PaymentResult {
  txHash: string;
  serviceId: bigint;
  amount: bigint;
  provider: string;
}

export interface X402PaymentInfo {
  address: string;
  amount: string;
  token: string;
  serviceId: string;
  chainId: string;
}

export interface X402FetchOptions extends RequestInit {
  autoPayment?: boolean;
  maxRetries?: number;
  /** On-chain service ID (from discoverServices). If provided, validates against the serviceId in the 402 response header — mismatch throws an error. */
  serviceId?: string;
  /** On-chain pricePerCall in wei (from discoverServices). If provided, validates against the 402 response amount. */
  pricePerCall?: string;
}
