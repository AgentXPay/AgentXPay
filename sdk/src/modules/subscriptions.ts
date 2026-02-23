import { ethers } from "ethers";
import SubscriptionManagerABI from "../abi/SubscriptionManager.json";
import { Subscription } from "../types";

export class SubscriptionsModule {
  private contract: ethers.Contract | null = null;

  constructor(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    if (address && address !== "") {
      this.contract = new ethers.Contract(address, SubscriptionManagerABI, signerOrProvider);
    }
  }

  private getContract(): ethers.Contract {
    if (!this.contract) {
      throw new Error("SubscriptionManager contract address not configured");
    }
    return this.contract;
  }

  async subscribe(serviceId: bigint, planId: bigint, amount: bigint): Promise<{ txHash: string; subscriptionId: bigint }> {
    const contract = this.getContract();
    const tx = await contract.subscribe(serviceId, planId, { value: amount });
    const receipt = await tx.wait();
    return { txHash: receipt.hash, subscriptionId: 0n };
  }

  async cancelSubscription(subscriptionId: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.cancelSubscription(subscriptionId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async renewSubscription(subscriptionId: bigint, amount: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.renewSubscription(subscriptionId, { value: amount });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async toggleAutoRenew(subscriptionId: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.toggleAutoRenew(subscriptionId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getSubscription(subscriptionId: bigint): Promise<Subscription> {
    const contract = this.getContract();
    const s = await contract.getSubscription(subscriptionId);
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
  }

  async getUserSubscriptions(address: string): Promise<bigint[]> {
    const contract = this.getContract();
    return contract.getUserSubscriptions(address);
  }

  async isActive(subscriptionId: bigint): Promise<boolean> {
    const contract = this.getContract();
    return contract.isSubscriptionActive(subscriptionId);
  }

  async checkAccess(userAddress: string, serviceId: bigint): Promise<boolean> {
    const contract = this.getContract();
    return contract.checkAccess(userAddress, serviceId);
  }
}
