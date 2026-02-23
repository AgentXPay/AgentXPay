import { ethers } from "ethers";
import { AgentXPayConfig, DiscoverFilter, Service, X402FetchOptions, X402PaymentInfo } from "./types";
import { ServicesModule } from "./modules/services";
import { PaymentsModule } from "./modules/payments";
import { SubscriptionsModule } from "./modules/subscriptions";
import { EscrowModule } from "./modules/escrow";
import { WalletModule } from "./modules/wallet";
import { DEFAULT_CONTRACTS, MONAD_TESTNET_RPC } from "./utils/constants";

export class AgentXPayClient {
  public services: ServicesModule;
  public payments: PaymentsModule;
  public subscriptions: SubscriptionsModule;
  public escrow: EscrowModule;
  public wallet: WalletModule;

  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;

  constructor(config: AgentXPayConfig) {
    const rpcUrl = config.rpcUrl || MONAD_TESTNET_RPC;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (config.signer) {
      this.signer = config.signer;
    } else if (config.privateKey) {
      this.signer = new ethers.Wallet(config.privateKey, this.provider);
    }

    const signerOrProvider = this.signer || this.provider;
    const network = config.network || "testnet";
    const defaultContracts = DEFAULT_CONTRACTS[network] || {};
    const contracts = {
      serviceRegistry: config.contracts?.serviceRegistry || defaultContracts.serviceRegistry || "",
      paymentManager: config.contracts?.paymentManager || defaultContracts.paymentManager || "",
      subscriptionManager: config.contracts?.subscriptionManager || defaultContracts.subscriptionManager || "",
      escrow: config.contracts?.escrow || defaultContracts.escrow || "",
      agentWalletFactory: config.contracts?.agentWalletFactory || defaultContracts.agentWalletFactory || "",
    };

    // Validate required contract addresses
    if (!contracts.serviceRegistry) {
      throw new Error("ServiceRegistry address is required");
    }

    this.services = new ServicesModule(
      contracts.serviceRegistry,
      signerOrProvider
    );
    this.payments = new PaymentsModule(
      contracts.paymentManager,
      signerOrProvider
    );
    this.subscriptions = new SubscriptionsModule(
      contracts.subscriptionManager,
      signerOrProvider
    );
    this.escrow = new EscrowModule(
      contracts.escrow,
      signerOrProvider
    );
    this.wallet = new WalletModule(
      contracts.agentWalletFactory,
      signerOrProvider
    );
  }

  async discoverServices(filter?: DiscoverFilter): Promise<Service[]> {
    return this.services.discoverServices(filter);
  }

  async payAndCall(serviceId: bigint, amount: bigint): Promise<string> {
    const result = await this.payments.payPerUse(serviceId, amount);
    return result.txHash;
  }

  async subscribe(serviceId: bigint, planId: bigint, amount: bigint) {
    return this.subscriptions.subscribe(serviceId, planId, amount);
  }

  /**
   * x402-aware fetch: automatically handles HTTP 402 Payment Required responses
   */
  async fetch(url: string, options?: X402FetchOptions): Promise<Response> {
    const autoPayment = options?.autoPayment ?? true;
    const maxRetries = options?.maxRetries ?? 1;

    let response = await globalThis.fetch(url, options);

    if (response.status === 402 && autoPayment) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const paymentInfo = this._parsePaymentHeaders(response);
        if (!paymentInfo) throw new Error("Invalid 402 response: missing payment headers");

        const result = await this.payments.payPerUse(
          BigInt(paymentInfo.serviceId),
          BigInt(paymentInfo.amount)
        );

        const retryHeaders = new Headers(options?.headers);
        retryHeaders.set("X-Payment-TxHash", result.txHash);
        retryHeaders.set("X-Payment-ChainId", paymentInfo.chainId);

        response = await globalThis.fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        if (response.status !== 402) break;
      }
    }

    return response;
  }

  private _parsePaymentHeaders(response: Response): X402PaymentInfo | null {
    const address = response.headers.get("X-Payment-Address");
    const amount = response.headers.get("X-Payment-Amount");
    const token = response.headers.get("X-Payment-Token") || "native";
    const serviceId = response.headers.get("X-Payment-ServiceId");
    const chainId = response.headers.get("X-Payment-ChainId") || "10143";

    if (!address || !amount || !serviceId) return null;

    return { address, amount, token, serviceId, chainId };
  }

  getProvider(): ethers.Provider {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }
}
