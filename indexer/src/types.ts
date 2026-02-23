export interface PaymentEventRow {
  id: number;
  event_type: "payment" | "subscription";
  service_id: string;
  payer: string;
  provider: string;
  amount: string;
  platform_fee: string;
  block_number: string;
  transaction_hash: string;
  log_index: number;
  block_timestamp: string;
  created_at: string;
}

export interface IndexerState {
  id: number;
  last_indexed_block: string;
  updated_at: string;
}

export interface EventsQueryParams {
  address?: string;
  eventType?: "payment" | "subscription";
  limit?: number;
  offset?: number;
}

export interface EventsApiResponse {
  events: PaymentEventRow[];
  total: number;
  page: number;
  pageSize: number;
}
