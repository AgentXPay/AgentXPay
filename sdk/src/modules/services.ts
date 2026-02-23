import { ethers } from "ethers";
import ServiceRegistryABI from "../abi/ServiceRegistry.json";
import { Service, SubscriptionPlan, DiscoverFilter } from "../types";

export class ServicesModule {
  private contract: ethers.Contract;

  constructor(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
    this.contract = new ethers.Contract(address, ServiceRegistryABI, signerOrProvider);
  }

  async registerService(
    name: string,
    description: string,
    endpoint: string,
    category: string,
    pricePerCall: bigint
  ): Promise<{ txHash: string; serviceId: bigint }> {
    const tx = await this.contract.registerService(name, description, endpoint, category, pricePerCall);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log: any) => this.contract.interface.parseLog(log)?.name === "ServiceRegistered"
    );
    const parsed = event ? this.contract.interface.parseLog(event) : null;
    const serviceId = parsed ? parsed.args[0] : 0n;
    return { txHash: receipt.hash, serviceId };
  }

  async addSubscriptionPlan(
    serviceId: bigint,
    name: string,
    price: bigint,
    duration: bigint
  ): Promise<{ txHash: string; planId: bigint }> {
    const tx = await this.contract.addSubscriptionPlan(serviceId, name, price, duration);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, planId: 0n };
  }

  async getServiceDetails(serviceId: bigint): Promise<Service> {
    const s = await this.contract.getServiceDetails(serviceId);
    return this._mapService(s);
  }

  async discoverServices(filter?: DiscoverFilter): Promise<Service[]> {
    if (filter?.category) {
      const services = await this.contract.getServicesByCategory(filter.category);
      let result = services.map((s: any) => this._mapService(s));
      if (filter.maxPrice) {
        result = result.filter((s: Service) => s.pricePerCall <= filter.maxPrice!);
      }
      return result;
    }

    const count = await this.contract.getServiceCount();
    const services: Service[] = [];
    for (let i = 1n; i <= count; i++) {
      const s = await this.contract.getServiceDetails(i).catch(() => null);
      if (s && s.isActive) {
        const service = this._mapService(s);
        if (!filter?.maxPrice || service.pricePerCall <= filter.maxPrice) {
          services.push(service);
        }
      }
    }
    return services;
  }

  async getSubscriptionPlans(serviceId: bigint): Promise<SubscriptionPlan[]> {
    const plans = await this.contract.getSubscriptionPlans(serviceId);
    return plans.map((p: any) => ({
      planId: p.planId,
      serviceId: p.serviceId,
      price: p.price,
      duration: p.duration,
      name: p.name,
    }));
  }

  async getServiceCount(): Promise<bigint> {
    return this.contract.getServiceCount();
  }

  private _mapService(s: any): Service {
    return {
      id: s.id,
      provider: s.provider,
      name: s.name,
      description: s.description,
      endpoint: s.endpoint,
      category: s.category,
      pricePerCall: s.pricePerCall,
      isActive: s.isActive,
      createdAt: s.createdAt,
    };
  }
}
