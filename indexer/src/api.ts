import { Router, type Request, type Response } from "express";
import { pool } from "./db.js";

export const apiRouter = Router();

/**
 * GET /api/events?address=0x...&type=payment|subscription&limit=50&offset=0
 * Returns payment events where the given address is either payer or provider.
 */
apiRouter.get("/api/events", async (req: Request, res: Response) => {
  try {
    const address = (req.query.address as string)?.toLowerCase();
    if (!address) {
      res.status(400).json({ error: "address query parameter is required" });
      return;
    }

    const eventType = req.query.type as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Number(req.query.offset) || 0;

    let whereClause = "(payer = $1 OR provider = $1)";
    const params: (string | number)[] = [address];
    let paramIndex = 2;

    if (eventType && (eventType === "payment" || eventType === "subscription")) {
      whereClause += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payment_events WHERE ${whereClause}`,
      params
    );
    const total = Number(countResult.rows[0].count);

    // Fetch events
    const eventsResult = await pool.query(
      `SELECT * FROM payment_events WHERE ${whereClause} ORDER BY block_number DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      events: eventsResult.rows,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[API] Error fetching events:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/stats?address=0x...
 * Returns aggregated stats for the given address.
 */
apiRouter.get("/api/stats", async (req: Request, res: Response) => {
  try {
    const address = (req.query.address as string)?.toLowerCase();
    if (!address) {
      res.status(400).json({ error: "address query parameter is required" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE payer = $1) as total_payments_made,
        COUNT(*) FILTER (WHERE provider = $1) as total_payments_received,
        COALESCE(SUM(amount) FILTER (WHERE payer = $1), 0) as total_spent,
        COALESCE(SUM(amount) FILTER (WHERE provider = $1), 0) as total_earned,
        COALESCE(SUM(platform_fee) FILTER (WHERE payer = $1), 0) as total_fees_paid
      FROM payment_events
      WHERE payer = $1 OR provider = $1`,
      [address]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[API] Error fetching stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /health
 */
apiRouter.get("/health", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

/**
 * GET /api/indexer-status
 */
apiRouter.get("/api/indexer-status", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT last_indexed_block, updated_at FROM indexer_state WHERE id = 1"
    );
    res.json(result.rows[0] || { last_indexed_block: 0 });
  } catch (err) {
    console.error("[API] Error fetching indexer status:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
