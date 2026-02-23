"use client";

import { useReadContract } from "wagmi";
import { paymentManagerContract, agentWalletFactoryContract, subscriptionManagerContract } from "@/constants/contracts";
import { usePaymentEvents } from "./usePaymentEvents";
import { useUserSubscriptions } from "./useUserSubscriptions";

export interface DashboardStats {
  totalSpent: bigint;
  totalEarned: bigint;
  activeSubscriptions: number;
  walletCount: number;
  paymentCount: bigint;
  userBalance: bigint;
}

export function useDashboardStats(userAddress: `0x${string}` | undefined) {
  // PaymentManager stats (pay-per-use)
  const { data: providerEarnings } = useReadContract({
    ...paymentManagerContract,
    functionName: "getProviderEarnings",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: walletCount } = useReadContract({
    ...agentWalletFactoryContract,
    functionName: "getWalletCount",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: paymentCount } = useReadContract({
    ...paymentManagerContract,
    functionName: "getPaymentCount",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: userBalance } = useReadContract({
    ...paymentManagerContract,
    functionName: "getUserBalance",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: payPerUseSpent } = useReadContract({
    ...paymentManagerContract,
    functionName: "getTotalSpent",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  // SubscriptionManager stats (subscription payments)
  const { data: subSpent } = useReadContract({
    ...subscriptionManagerContract,
    functionName: "getTotalSpent",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: subEarnings } = useReadContract({
    ...subscriptionManagerContract,
    functionName: "getProviderEarnings",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { events, isLoading: eventsLoading, refresh: refreshEvents } = usePaymentEvents(userAddress);
  const { activeCount, isLoading: subsLoading } = useUserSubscriptions(userAddress);

  // Combine pay-per-use + subscription totals
  const totalSpent = ((payPerUseSpent as bigint) || 0n) + ((subSpent as bigint) || 0n);
  const totalEarned = ((providerEarnings as bigint) || 0n) + ((subEarnings as bigint) || 0n);

  return {
    stats: {
      totalSpent,
      totalEarned,
      activeSubscriptions: activeCount,
      walletCount: Number(walletCount || 0n),
      paymentCount: (paymentCount as bigint) || 0n,
      userBalance: (userBalance as bigint) || 0n,
    },
    events,
    isLoading: eventsLoading || subsLoading,
    isStatsLoading: subsLoading,
    isEventsLoading: eventsLoading,
    refreshEvents,
  };
}
