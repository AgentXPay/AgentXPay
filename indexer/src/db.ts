import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(20) NOT NULL,
        service_id BIGINT NOT NULL,
        payer VARCHAR(42) NOT NULL,
        provider VARCHAR(42) NOT NULL,
        amount NUMERIC NOT NULL,
        platform_fee NUMERIC NOT NULL,
        block_number BIGINT NOT NULL,
        transaction_hash VARCHAR(66) NOT NULL,
        log_index INTEGER NOT NULL,
        block_timestamp BIGINT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(transaction_hash, log_index)
      );

      CREATE INDEX IF NOT EXISTS idx_payment_events_payer ON payment_events(payer);
      CREATE INDEX IF NOT EXISTS idx_payment_events_provider ON payment_events(provider);
      CREATE INDEX IF NOT EXISTS idx_payment_events_block_number ON payment_events(block_number DESC);

      CREATE TABLE IF NOT EXISTS indexer_state (
        id INTEGER PRIMARY KEY DEFAULT 1,
        last_indexed_block BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      INSERT INTO indexer_state (id, last_indexed_block)
      VALUES (1, 0)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("[DB] Database initialized successfully");
  } finally {
    client.release();
  }
}

export async function getLastIndexedBlock(): Promise<bigint> {
  const result = await pool.query(
    "SELECT last_indexed_block FROM indexer_state WHERE id = 1"
  );
  return BigInt(result.rows[0]?.last_indexed_block || "0");
}

export async function updateLastIndexedBlock(blockNumber: bigint): Promise<void> {
  await pool.query(
    "UPDATE indexer_state SET last_indexed_block = $1, updated_at = NOW() WHERE id = 1",
    [blockNumber.toString()]
  );
}

export interface InsertEventParams {
  event_type: "payment" | "subscription";
  service_id: string;
  payer: string;
  provider: string;
  amount: string;
  platform_fee: string;
  block_number: string;
  transaction_hash: string;
  log_index: number;
  block_timestamp: string | null;
}

export async function insertEvents(events: InsertEventParams[]): Promise<number> {
  if (events.length === 0) return 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let inserted = 0;
    for (const e of events) {
      const result = await client.query(
        `INSERT INTO payment_events 
          (event_type, service_id, payer, provider, amount, platform_fee, block_number, transaction_hash, log_index, block_timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (transaction_hash, log_index) DO NOTHING`,
        [
          e.event_type,
          e.service_id,
          e.payer.toLowerCase(),
          e.provider.toLowerCase(),
          e.amount,
          e.platform_fee,
          e.block_number,
          e.transaction_hash,
          e.log_index,
          e.block_timestamp,
        ]
      );
      if (result.rowCount && result.rowCount > 0) inserted++;
    }

    await client.query("COMMIT");
    return inserted;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
