import { ethers } from "ethers";
import EscrowABI from "../abi/Escrow.json";
import { EscrowData, EscrowStatus } from "../types";

export class EscrowModule {
  private contract: ethers.Contract | null = null;

  constructor(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    if (address && address !== "") {
      this.contract = new ethers.Contract(address, EscrowABI, signerOrProvider);
    }
  }

  private getContract(): ethers.Contract {
    if (!this.contract) {
      throw new Error("Escrow contract address not configured");
    }
    return this.contract;
  }

  async createEscrow(
    serviceId: bigint,
    provider: string,
    deadline: bigint,
    description: string,
    amount: bigint
  ): Promise<{ txHash: string; escrowId: bigint }> {
    const contract = this.getContract();
    const tx = await contract.createEscrow(serviceId, provider, deadline, description, { value: amount });
    const receipt = await tx.wait();
    return { txHash: receipt.hash, escrowId: 0n };
  }

  async releaseEscrow(escrowId: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.releaseEscrow(escrowId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async disputeEscrow(escrowId: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.disputeEscrow(escrowId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async refundEscrow(escrowId: bigint): Promise<string> {
    const contract = this.getContract();
    const tx = await contract.refundEscrow(escrowId);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getEscrow(escrowId: bigint): Promise<EscrowData> {
    const contract = this.getContract();
    const e = await contract.getEscrow(escrowId);
    return {
      escrowId: e.escrowId,
      serviceId: e.serviceId,
      payer: e.payer,
      provider: e.provider,
      amount: e.amount,
      status: Number(e.status) as EscrowStatus,
      createdAt: e.createdAt,
      deadline: e.deadline,
      description: e.description,
    };
  }

  async getUserEscrows(address: string): Promise<bigint[]> {
    const contract = this.getContract();
    return contract.getUserEscrows(address);
  }
}
