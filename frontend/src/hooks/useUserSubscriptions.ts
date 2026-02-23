"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { subscriptionManagerContract, serviceRegistryContract } from "@/constants/contracts";

export interface UserSubscription {
  subscriptionId: bigint;
  serviceId: bigint;
  planId: bigint;
  subscriber: `0x${string}`;
  startTime: bigint;
  endTime: bigint;
  autoRenew: boolean;
  isActive: boolean;
}

export function useUserSubscriptions(userAddress: `0x${string}` | undefined) {
  const { data: subIds, isLoading: idsLoading } = useReadContract({
    ...subscriptionManagerContract,
    functionName: "getUserSubscriptions",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const subscriptionIds = (subIds as bigint[]) || [];

  const detailContracts = subscriptionIds.map((id) => ({
    ...subscriptionManagerContract,
    functionName: "getSubscription" as const,
    args: [id] as const,
  }));

  const { data: subsData, isLoading: subsLoading } = useReadContracts({
    contracts: detailContracts,
    query: { enabled: subscriptionIds.length > 0 },
  });

  const subscriptions: UserSubscription[] = (subsData || [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => {
      const s = r.result as any;
      return {
        subscriptionId: s.subscriptionId,
        serviceId: s.serviceId,
        planId: s.planId,
        subscriber: s.subscriber,
        startTime: s.startTime,
        endTime: s.endTime,
        autoRenew: s.autoRenew,
        isActive: s.isActive,
      };
    });

  const activeCount = subscriptions.filter((s) => s.isActive).length;

  return {
    subscriptions,
    activeCount,
    isLoading: idsLoading || subsLoading,
  };
}
