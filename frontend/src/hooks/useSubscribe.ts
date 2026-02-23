"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { subscriptionManagerContract } from "@/constants/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useSubscribe() {
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

  const subscribe = (params: {
    serviceId: bigint;
    planId: bigint;
    price: bigint;
  }) => {
    writeContract({
      ...subscriptionManagerContract,
      functionName: "subscribe",
      args: [params.serviceId, params.planId],
      value: params.price,
    });
  };

  return {
    subscribe,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
