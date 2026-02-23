"use client";

import { useReadContract } from "wagmi";
import { agentWalletAbi } from "@/constants/contracts";
import { type Address } from "viem";

export interface AuthorizedAgentsResult {
  agents: Address[];
  isLoading: boolean;
  refetch: () => void;
}

export function useAuthorizedAgents(walletAddress: Address | null): AuthorizedAgentsResult {
  const { data, isLoading, refetch } = useReadContract({
    address: walletAddress ?? undefined,
    abi: agentWalletAbi,
    functionName: "getAuthorizedAgents",
    query: {
      enabled: !!walletAddress,
    },
  });

  const agents = (data as Address[]) || [];

  return { agents, isLoading, refetch };
}
