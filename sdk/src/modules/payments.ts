import { ethers } from "ethers";
import PaymentManagerABI from "../abi/PaymentManager.json";
import { PaymentResult } from "../types";

export class PaymentsModule {
  private contract: ethers.Contract | null = null;
  private address: string;
  private signerOrProvider: ethers.Signer | ethers.Provider;

  constructor(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    this.address = address;
    this.signerOrProvider = signerOrProvider;
    if (address && address !== "") {
      this.contract = new ethers.Contract(address, PaymentManagerABI, signerOrProvider);
    }
  }

  private getContract(): ethers.Contract {
    if (!this.contract) {
      throw new Error("PaymentManager contract address not configured");
    }
    return this.contract;
  }

  async payPerUse(serviceId: bigint, amount: bigint): Promise<PaymentResult> {
    const contract = this.getContract();
    const tx = await contract.payPerUse(serviceId, { value: amount });
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      serviceId,
      amount,
      provider: "",
    };
  }

  async batchPay(serviceIds: bigint[], totalAmount: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.batchPay(serviceIds, { value: totalAmount });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async deposit(amount: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.deposit({ value: amount });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async withdraw(amount: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.withdraw(amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async payFromBalance(serviceId: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.payFromBalance(serviceId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async withdrawProviderEarnings(): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.withdrawProviderEarnings();
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getUserBalance(address: string): Promise<bigint> {
    const contract = this.getContract();
    return contract.getUserBalance(address);
  }

  async getProviderEarnings(address: string): Promise<bigint> {
    const contract = this.getContract();
    return contract.getProviderEarnings(address);
  }

  async getPaymentCount(address: string): Promise<bigint> {
    const contract = this.getContract();
    return contract.getPaymentCount(address);
  }

  async getTotalSpent(address: string): Promise<bigint> {
    const contract = this.getContract();
    return contract.getTotalSpent(address);
  }

  getContractAddress(): string {
    const contract = this.getContract();
    return contract.target as string;
  }
}
