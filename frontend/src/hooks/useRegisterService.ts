"use client";

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { serviceRegistryContract } from "@/constants/contracts";
import { parseEther, decodeEventLog } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";

export function useRegisterService() {
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const [registeredServiceId, setRegisteredServiceId] = useState<bigint | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset: rawReset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse serviceId from ServiceRegistered event log
  useEffect(() => {
    if (isSuccess && receipt && publicClient) {
      try {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: serviceRegistryContract.abi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "ServiceRegistered") {
              const args = decoded.args as any;
              setRegisteredServiceId(args.serviceId);
              break;
            }
          } catch {
            // skip non-matching logs
          }
        }
      } catch {
        // ignore
      }
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [isSuccess, receipt, publicClient, queryClient]);

  const registerService = (params: {
    name: string;
    description: string;
    endpoint: string;
    category: string;
    pricePerCall: string;
  }) => {
    setRegisteredServiceId(null);
    writeContract({
      ...serviceRegistryContract,
      functionName: "registerService",
      args: [
        params.name,
        params.description,
        params.endpoint,
        params.category,
        parseEther(params.pricePerCall),
      ],
    });
  };

  const reset = useCallback(() => {
    rawReset();
    setRegisteredServiceId(null);
  }, [rawReset]);

  return {
    registerService,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
    registeredServiceId,
  };
}
