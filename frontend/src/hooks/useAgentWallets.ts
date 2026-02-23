"use client";

import { useReadContract, useReadContracts, useBalance } from "wagmi";
import { agentWalletFactoryContract, agentWalletAbi } from "@/constants/contracts";

export interface AgentWalletInfo {
  address: `0x${string}`;
  balance: bigint;
  dailyLimit: bigint;
  dailySpent: bigint;
  owner: `0x${string}`;
}

export function useAgentWallets(ownerAddress: `0x${string}` | undefined) {
  const { data: walletAddresses, isLoading: addressesLoading, refetch: refetchAddresses } = useReadContract({
    ...agentWalletFactoryContract,
    functionName: "getWallets",
    args: ownerAddress ? [ownerAddress] : undefined,
    query: { enabled: !!ownerAddress },
  });

  const addresses = (walletAddresses as `0x${string}`[]) || [];

  const detailContracts = addresses.flatMap((addr) => [
    {
      address: addr,
      abi: agentWalletAbi,
      functionName: "getDailySpendingLimit" as const,
    },
    {
      address: addr,
      abi: agentWalletAbi,
      functionName: "getDailySpent" as const,
    },
    {
      address: addr,
      abi: agentWalletAbi,
      functionName: "getOwner" as const,
    },
  ]);

  const { data: detailsData, isLoading: detailsLoading } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: addresses.length > 0 },
  });

  const balanceContracts = addresses.map((addr) => ({
    address: addr,
    abi: [{
      type: "function" as const,
      name: "getRemainingDailyAllowance" as const,
      inputs: [],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view" as const,
    }],
    functionName: "getRemainingDailyAllowance" as const,
  }));

  const wallets: AgentWalletInfo[] = addresses.map((addr, i) => {
    const baseIdx = i * 3;
    const dailyLimit = detailsData?.[baseIdx]?.result as bigint || 0n;
    const dailySpent = detailsData?.[baseIdx + 1]?.result as bigint || 0n;
    const owner = detailsData?.[baseIdx + 2]?.result as `0x${string}` || "0x0";
    return {
      address: addr,
      balance: 0n,
      dailyLimit,
      dailySpent,
      owner,
    };
  });

  return {
    wallets,
    walletCount: addresses.length,
    isLoading: addressesLoading || detailsLoading,
    refetch: refetchAddresses,
  };
}

export function useWalletCount(ownerAddress: `0x${string}` | undefined) {
  return useReadContract({
    ...agentWalletFactoryContract,
    functionName: "getWalletCount",
    args: ownerAddress ? [ownerAddress] : undefined,
    query: { enabled: !!ownerAddress },
  });
}
