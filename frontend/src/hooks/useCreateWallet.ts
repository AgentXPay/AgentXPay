"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { agentWalletFactoryContract } from "@/constants/contracts";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useCreateWallet() {
  const queryClient = useQueryClient();

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [isSuccess, queryClient]);

  const createWallet = (dailyLimitEth: string) => {
    writeContract({
      ...agentWalletFactoryContract,
      functionName: "createWallet",
      args: [parseEther(dailyLimitEth)],
    });
  };

  return {
    createWallet,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
