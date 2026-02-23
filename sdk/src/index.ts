export { AgentXPayClient } from "./AgentXPayClient";
export { ServicesModule } from "./modules/services";
export { PaymentsModule } from "./modules/payments";
export { SubscriptionsModule } from "./modules/subscriptions";
export { EscrowModule } from "./modules/escrow";
export { WalletModule, AgentWalletClient } from "./modules/wallet";

export type {
  AgentXPayConfig,
  ContractAddresses,
  Service,
  SubscriptionPlan,
  Subscription,
  EscrowData,
  DiscoverFilter,
  PaymentResult,
  X402PaymentInfo,
  X402FetchOptions,
} from "./types";

export { EscrowStatus } from "./types";

export {
  MONAD_TESTNET_CHAIN_ID,
  MONAD_TESTNET_RPC,
  DEFAULT_CONTRACTS,
} from "./utils/constants";

export {
  shortenAddress,
  formatEther,
  parseEther,
  isValidAddress,
} from "./utils/helpers";
