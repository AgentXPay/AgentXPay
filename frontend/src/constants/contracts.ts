import { type Abi } from "viem";
import { CONTRACTS } from "./index";
import ServiceRegistryABI from "@/abi/ServiceRegistry.json";
import PaymentManagerABI from "@/abi/PaymentManager.json";
import SubscriptionManagerABI from "@/abi/SubscriptionManager.json";
import EscrowABI from "@/abi/Escrow.json";
import AgentWalletFactoryABI from "@/abi/AgentWalletFactory.json";
import AgentWalletABI from "@/abi/AgentWallet.json";

export const serviceRegistryContract = {
  address: CONTRACTS.serviceRegistry as `0x${string}`,
  abi: ServiceRegistryABI as unknown as Abi,
} as const;

export const paymentManagerContract = {
  address: CONTRACTS.paymentManager as `0x${string}`,
  abi: PaymentManagerABI as unknown as Abi,
} as const;

export const subscriptionManagerContract = {
  address: CONTRACTS.subscriptionManager as `0x${string}`,
  abi: SubscriptionManagerABI as unknown as Abi,
} as const;

export const escrowContract = {
  address: CONTRACTS.escrow as `0x${string}`,
  abi: EscrowABI as unknown as Abi,
} as const;

export const agentWalletFactoryContract = {
  address: CONTRACTS.agentWalletFactory as `0x${string}`,
  abi: AgentWalletFactoryABI as unknown as Abi,
} as const;

export const agentWalletAbi = AgentWalletABI as unknown as Abi;
export { AgentWalletABI };
