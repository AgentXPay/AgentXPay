"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { serviceRegistryContract } from "@/constants/contracts";

export interface Service {
  id: bigint;
  provider: `0x${string}`;
  name: string;
  description: string;
  endpoint: string;
  category: string;
  pricePerCall: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface SubscriptionPlan {
  planId: bigint;
  serviceId: bigint;
  price: bigint;
  duration: bigint;
  name: string;
}

export function useServiceCount() {
  return useReadContract({
    ...serviceRegistryContract,
    functionName: "getServiceCount",
  });
}

export function useServices() {
  const { data: count, isLoading: countLoading } = useServiceCount();

  const serviceCount = count ? Number(count) : 0;

  const contracts = Array.from({ length: serviceCount }, (_, i) => ({
    ...serviceRegistryContract,
    functionName: "getServiceDetails" as const,
    args: [BigInt(i + 1)] as const,
  }));

  const {
    data: servicesData,
    isLoading: servicesLoading,
    error,
    refetch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: serviceCount > 0,
    },
  });

  const services: Service[] = (servicesData || [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => {
      const s = r.result as any;
      return {
        id: s.id,
        provider: s.provider,
        name: s.name,
        description: s.description,
        endpoint: s.endpoint,
        category: s.category,
        pricePerCall: s.pricePerCall,
        isActive: s.isActive,
        createdAt: s.createdAt,
      };
    });

  return {
    services,
    isLoading: countLoading || servicesLoading,
    error,
    refetch,
  };
}

export function useSubscriptionPlans(serviceId: bigint | undefined) {
  return useReadContract({
    ...serviceRegistryContract,
    functionName: "getSubscriptionPlans",
    args: serviceId !== undefined ? [serviceId] : undefined,
    query: {
      enabled: serviceId !== undefined,
    },
  });
}
