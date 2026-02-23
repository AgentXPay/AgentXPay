"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { paymentManagerContract } from "@/constants/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function usePayPerUse() {
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

  const payPerUse = (serviceId: bigint, price: bigint) => {
    writeContract({
      ...paymentManagerContract,
      functionName: "payPerUse",
      args: [serviceId],
      value: price,
    });
  };

  return {
    payPerUse,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
