"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { serviceRegistryContract } from "@/constants/contracts";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useAddSubscriptionPlan() {
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

  const addPlan = (params: {
    serviceId: bigint;
    name: string;
    price: string; // MON string
    duration: bigint; // seconds
  }) => {
    writeContract({
      ...serviceRegistryContract,
      functionName: "addSubscriptionPlan",
      args: [
        params.serviceId,
        params.name,
        parseEther(params.price),
        params.duration,
      ],
    });
  };

  return {
    addPlan,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
