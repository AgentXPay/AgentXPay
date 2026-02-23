import { ethers } from "ethers";
import AgentWalletABI from "../abi/AgentWallet.json";
import AgentWalletFactoryABI from "../abi/AgentWalletFactory.json";

export class WalletModule {
  private factoryContract: ethers.Contract | null = null;
  private signerOrProvider: ethers.Signer | ethers.Provider;

  constructor(factoryAddress: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    if (factoryAddress && factoryAddress !== "") {
      this.factoryContract = new ethers.Contract(factoryAddress, AgentWalletFactoryABI, signerOrProvider);
    }
    this.signerOrProvider = signerOrProvider;
  }

  private getContract(): ethers.Contract {
    if (!this.factoryContract) {
      throw new Error("AgentWalletFactory contract address not configured");
    }
    return this.factoryContract;
  }

  async createWallet(dailyLimit: bigint): Promise<{ txHash: string; walletAddress: string }> {
    const contract = this.getContract();
    const tx = await contract.createWallet(dailyLimit);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log: any) => contract.interface.parseLog(log)?.name === "WalletCreated"
    );
    const parsed = event ? contract.interface.parseLog(event) : null;
    const walletAddress = parsed ? parsed.args[1] : "";
    return { txHash: receipt.hash, walletAddress };
  }

  async getWallets(owner: string): Promise<string[]> {
    const contract = this.getContract();
    return contract.getWallets(owner);
  }

  getWalletInstance(walletAddress: string): AgentWalletClient {
    return new AgentWalletClient(walletAddress, this.signerOrProvider);
  }
}

export class AgentWalletClient {
  private contract: ethers.Contract;

  constructor(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    this.contract = new ethers.Contract(address, AgentWalletABI, signerOrProvider);
  }

  async execute(to: string, value: bigint, data: string = "0x"): Promise<string> {
    const tx = await this.contract.execute(to, value, data);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async setDailySpendingLimit(limit: bigint): Promise<string> {
    const tx = await this.contract.setDailySpendingLimit(limit);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async authorizeAgent(agent: string): Promise<string> {
    const tx = await this.contract.authorizeAgent(agent);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async revokeAgent(agent: string): Promise<string> {
    const tx = await this.contract.revokeAgent(agent);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async withdrawFunds(amount: bigint): Promise<string> {
    const tx = await this.contract.withdrawFunds(amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async deposit(amount: bigint): Promise<string> {
    const signer = this.contract.runner as ethers.Signer;
    const tx = await signer.sendTransaction({
      to: await this.contract.getAddress(),
      value: amount,
    });
    const receipt = await tx.wait();
    return receipt!.hash;
  }

  async isAuthorizedAgent(agent: string): Promise<boolean> {
    return this.contract.isAuthorizedAgent(agent);
  }

  async getDailySpendingLimit(): Promise<bigint> {
    return this.contract.getDailySpendingLimit();
  }

  async getDailySpent(): Promise<bigint> {
    return this.contract.getDailySpent();
  }

  async getRemainingDailyAllowance(): Promise<bigint> {
    return this.contract.getRemainingDailyAllowance();
  }

  async getOwner(): Promise<string> {
    return this.contract.getOwner();
  }
}
