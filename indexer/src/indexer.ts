import { ethers } from "ethers";
import {
  config,
  PAYMENT_MADE_EVENT,
  SUBSCRIPTION_PAID_EVENT,
} from "./config.js";
import {
  getLastIndexedBlock,
  updateLastIndexedBlock,
  insertEvents,
  type InsertEventParams,
} from "./db.js";

export class EventIndexer {
  private provider: ethers.JsonRpcProvider;
  private paymentContract: ethers.Contract;
  private subscriptionContract: ethers.Contract;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    const paymentIface = new ethers.Interface([PAYMENT_MADE_EVENT]);
    this.paymentContract = new ethers.Contract(
      config.paymentManagerAddress,
      paymentIface,
      this.provider
    );

    const subIface = new ethers.Interface([SUBSCRIPTION_PAID_EVENT]);
    this.subscriptionContract = new ethers.Contract(
      config.subscriptionManagerAddress,
      subIface,
      this.provider
    );
  }

  async start(): Promise<void> {
    this.running = true;
    console.log("[Indexer] Starting event indexer...");

    // Determine start block
    const lastIndexed = await getLastIndexedBlock();
    const startBlock =
      lastIndexed > 0n ? lastIndexed + 1n : config.startBlock;
    console.log(`[Indexer] Resuming from block ${startBlock}`);

    this.poll();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log("[Indexer] Stopped");
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      await this.pollOnce();
    } catch (err) {
      console.error("[Indexer] Poll error:", err);
    }

    if (this.running) {
      this.timer = setTimeout(() => this.poll(), config.pollIntervalMs);
    }
  }

  private async pollOnce(): Promise<void> {
    const latestBlock = BigInt(await this.provider.getBlockNumber());
    const safeBlock = latestBlock - config.confirmationBlocks;

    const lastIndexed = await getLastIndexedBlock();
    const fromBlock = lastIndexed > 0n ? lastIndexed + 1n : config.startBlock;

    if (fromBlock > safeBlock) {
      return; // Already up to date
    }

    // Process in chunks of chunkSize
    let current = fromBlock;
    while (current <= safeBlock && this.running) {
      const toBlock =
        current + config.chunkSize - 1n > safeBlock
          ? safeBlock
          : current + config.chunkSize - 1n;

      const events = await this.fetchAndParseEvents(current, toBlock);

      if (events.length > 0) {
        const inserted = await insertEvents(events);
        console.log(
          `[Indexer] Blocks ${current}-${toBlock}: ${inserted} new events`
        );
      }

      await updateLastIndexedBlock(toBlock);
      current = toBlock + 1n;
    }
  }

  private async fetchAndParseEvents(
    fromBlock: bigint,
    toBlock: bigint
  ): Promise<InsertEventParams[]> {
    const events: InsertEventParams[] = [];

    // Fetch PaymentMade events
    try {
      const paymentFilter = this.paymentContract.filters.PaymentMade();
      const paymentLogs = await this.paymentContract.queryFilter(
        paymentFilter,
        Number(fromBlock),
        Number(toBlock)
      );

      for (const log of paymentLogs) {
        const eventLog = log as ethers.EventLog;
        const block = await this.getBlockTimestamp(eventLog.blockNumber);
        events.push({
          event_type: "payment",
          service_id: eventLog.args[0].toString(),
          payer: eventLog.args[1].toLowerCase(),
          provider: eventLog.args[2].toLowerCase(),
          amount: eventLog.args[3].toString(),
          platform_fee: eventLog.args[4].toString(),
          block_number: eventLog.blockNumber.toString(),
          transaction_hash: eventLog.transactionHash,
          log_index: eventLog.index,
          block_timestamp: block ? block.toString() : null,
        });
      }
    } catch (err) {
      console.warn(
        `[Indexer] Failed to fetch PaymentMade events for blocks ${fromBlock}-${toBlock}:`,
        err
      );
    }

    // Fetch SubscriptionPaid events
    try {
      const subFilter =
        this.subscriptionContract.filters.SubscriptionPaid();
      const subLogs = await this.subscriptionContract.queryFilter(
        subFilter,
        Number(fromBlock),
        Number(toBlock)
      );

      for (const log of subLogs) {
        const eventLog = log as ethers.EventLog;
        const block = await this.getBlockTimestamp(eventLog.blockNumber);
        events.push({
          event_type: "subscription",
          service_id: eventLog.args[0].toString(),
          payer: eventLog.args[1].toLowerCase(),
          provider: eventLog.args[2].toLowerCase(),
          amount: eventLog.args[3].toString(),
          platform_fee: eventLog.args[4].toString(),
          block_number: eventLog.blockNumber.toString(),
          transaction_hash: eventLog.transactionHash,
          log_index: eventLog.index,
          block_timestamp: block ? block.toString() : null,
        });
      }
    } catch (err) {
      console.warn(
        `[Indexer] Failed to fetch SubscriptionPaid events for blocks ${fromBlock}-${toBlock}:`,
        err
      );
    }

    return events;
  }

  // Simple block timestamp cache
  private blockTimestampCache = new Map<number, number>();

  private async getBlockTimestamp(
    blockNumber: number
  ): Promise<number | null> {
    if (this.blockTimestampCache.has(blockNumber)) {
      return this.blockTimestampCache.get(blockNumber)!;
    }
    try {
      const block = await this.provider.getBlock(blockNumber);
      if (block) {
        this.blockTimestampCache.set(blockNumber, block.timestamp);
        return block.timestamp;
      }
    } catch {
      // ignore
    }
    return null;
  }
}
