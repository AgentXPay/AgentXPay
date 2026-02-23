"use client";

import { useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from "wagmi";
import { agentWalletAbi } from "@/constants/contracts";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useWalletDeposit() {
  const queryClient = useQueryClient();

  const {
    sendTransaction,
    data: hash,
    isPending,
    error,
    reset,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [isSuccess, queryClient]);

  const deposit = (walletAddress: `0x${string}`, amountEth: string) => {
    sendTransaction({
      to: walletAddress,
      value: parseEther(amountEth),
    });
  };

  return { deposit, isPending, isConfirming, isSuccess, error, hash, reset };
}

export function useWalletWithdraw() {
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

  const withdraw = (walletAddress: `0x${string}`, amountEth: string) => {
    writeContract({
      address: walletAddress,
      abi: agentWalletAbi,
      functionName: "withdrawFunds",
      args: [parseEther(amountEth)],
    });
  };

  return { withdraw, isPending, isConfirming, isSuccess, error, hash, reset };
}

export function useAuthorizeAgent() {
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

  const authorizeAgent = (walletAddress: `0x${string}`, agentAddress: `0x${string}`) => {
    writeContract({
      address: walletAddress,
      abi: agentWalletAbi,
      functionName: "authorizeAgent",
      args: [agentAddress],
    });
  };

  return { authorizeAgent, isPending, isConfirming, isSuccess, error, hash, reset };
}

export function useRevokeAgent() {
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

  const revokeAgent = (walletAddress: `0x${string}`, agentAddress: `0x${string}`) => {
    writeContract({
      address: walletAddress,
      abi: agentWalletAbi,
      functionName: "revokeAgent",
      args: [agentAddress],
    });
  };

  return { revokeAgent, isPending, isConfirming, isSuccess, error, hash, reset };
}
