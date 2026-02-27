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

    // 验证收款地址是否为服务提供方指定的地址，防止攻击者将交易发送到其他地址后用该交易哈希来通过验证。
    if (tx.to?.toLowerCase() !== expectedTo.toLowerCase()) {
      return {
        valid: false,
        txHash,
        error: `Invalid recipient: expected ${expectedTo}, got ${tx.to}`,
      };
    }

    // 验证支付金额是否满足服务提供方要求的最低金额，确保实际支付金额不低于服务提供方要求的最低金额，防止攻击者用极小金额（如 1 wei）的交易通过验证
    if (tx.value < expectedMinAmount) {
      return {
        valid: false,
        txHash,
        error: `Insufficient payment: expected at least ${expectedMinAmount.toString()} wei, got ${tx.value.toString()} wei`,
      };
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
