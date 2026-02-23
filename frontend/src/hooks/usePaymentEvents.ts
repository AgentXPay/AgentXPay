"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface PaymentEvent {
  serviceId: bigint;
  payer: `0x${string}`;
  provider: `0x${string}`;
  amount: bigint;
  platformFee: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  timestamp?: number;
  eventType: "payment" | "subscription";
}

const INDEXER_API_URL =
  process.env.NEXT_PUBLIC_INDEXER_API_URL || "http://localhost:3002";

interface ApiEventRow {
  event_type: "payment" | "subscription";
  service_id: string;
  payer: string;
  provider: string;
  amount: string;
  platform_fee: string;
  block_number: string;
  transaction_hash: string;
  block_timestamp: string | null;
}

function toPaymentEvent(row: ApiEventRow): PaymentEvent {
  return {
    serviceId: BigInt(row.service_id),
    payer: row.payer as `0x${string}`,
    provider: row.provider as `0x${string}`,
    amount: BigInt(row.amount),
    platformFee: BigInt(row.platform_fee),
    blockNumber: BigInt(row.block_number),
    transactionHash: row.transaction_hash as `0x${string}`,
    timestamp: row.block_timestamp ? Number(row.block_timestamp) : undefined,
    eventType: row.event_type,
  };
}

export function usePaymentEvents(userAddress: `0x${string}` | undefined) {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setRefreshCounter((c) => c + 1), []);

  useEffect(() => {
    if (!userAddress) return;

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const url = `${INDEXER_API_URL}/api/events?address=${userAddress}&limit=500`;
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const parsed: PaymentEvent[] = (data.events || []).map(toPaymentEvent);
        setEvents(parsed);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to fetch payment events from indexer:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    return () => {
      controller.abort();
    };
  }, [userAddress, refreshCounter]);

  return { events, isLoading, refresh };
}
