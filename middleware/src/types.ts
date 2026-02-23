export interface PaymentGateConfig {
  rpcUrl: string;
  paymentManagerAddress: string;
  subscriptionManagerAddress?: string;
  routes: RoutePrice[];
  cacheTtl?: number;
  chainId?: number;
}

export interface RoutePrice {
  path: string;
  method: string;
  serviceId: number;
  priceWei: string;
  token: "native" | string;
}

export interface VerifyResult {
  valid: boolean;
  txHash?: string;
  payer?: string;
  amount?: bigint;
  error?: string;
}

export interface FacilitatorConfig {
  serviceId: number;
  priceWei: string;
  token: "native" | string;
  paymentAddress: string;
}
