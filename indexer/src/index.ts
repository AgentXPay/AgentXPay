import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initDatabase } from "./db.js";
import { EventIndexer } from "./indexer.js";
import { apiRouter } from "./api.js";

async function main() {
  console.log("=== AgentXPay Event Indexer ===");
  console.log(`RPC: ${config.rpcUrl}`);
  console.log(`PaymentManager: ${config.paymentManagerAddress}`);
  console.log(`SubscriptionManager: ${config.subscriptionManagerAddress}`);
  console.log(`Poll interval: ${config.pollIntervalMs}ms`);

  // Initialize database
  await initDatabase();

  // Start the event indexer
  const indexer = new EventIndexer();
  await indexer.start();

  // Start the API server
  const app = express();
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
      ],
    })
  );
  app.use(express.json());
  app.use(apiRouter);

  app.listen(config.port, () => {
    console.log(`[API] Server listening on http://localhost:${config.port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down...");
    indexer.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
