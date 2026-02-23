import { ethers } from "ethers";
import { VerifyResult } from "./types";

export class PaymentVerifier {
  private provider: ethers.Provider;
  private cache: Map<string, { result: VerifyResult; timestamp: number }>;
  private cacheTtl: number;
  private usedTxHashes: Set<string>;

  constructor(rpcUrl: string, cacheTtl: number = 300) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.cache = new Map();
    this.cacheTtl = cacheTtl * 1000;
    this.usedTxHashes = new Set();
  }

  async verifyPayment(
    txHash: string,
    expectedTo: string,
    expectedMinAmount: bigint
  ): Promise<VerifyResult> {
    if (this.usedTxHashes.has(txHash)) {
      return { valid: false, error: "Transaction hash already used" };
    }

    const cached = this.cache.get(txHash);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.result;
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { valid: false, txHash, error: "Transaction not found" };
    }

    if (receipt.status !== 1) {
      return { valid: false, txHash, error: "Transaction failed" };
    }

    const tx = await this.provider.getTransaction(txHash);
    if (!tx) {
      return { valid: false, txHash, error: "Transaction details not found" };
    }

    const result: VerifyResult = {
      valid: true,
      txHash,
      payer: tx.from,
      amount: tx.value,
    };

    this.cache.set(txHash, { result, timestamp: Date.now() });
    this.usedTxHashes.add(txHash);

    return result;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.cacheTtl) {
        this.cache.delete(key);
      }
    }
  }
}
