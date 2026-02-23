import express from "express";
import cors from "cors";
import { createPaymentGate } from "./paymentGate";
import { PaymentGateConfig } from "./types";

const PORT = process.env.PORT || 3001;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PAYMENT_MANAGER = process.env.PAYMENT_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000";

const config: PaymentGateConfig = {
  rpcUrl: RPC_URL,
  paymentManagerAddress: PAYMENT_MANAGER,
  chainId: Number(process.env.CHAIN_ID || 10143),
  routes: [
    {
      path: "/api/chat",
      method: "POST",
      serviceId: 1,
      priceWei: "10000000000000000", // 0.01 MON
      token: "native",
    },
    {
      path: "/api/image",
      method: "POST",
      serviceId: 2,
      priceWei: "20000000000000000", // 0.02 MON
      token: "native",
    },
  ],
};

const app = express();
app.use(cors());
app.use(express.json());

app.use(createPaymentGate(config));

app.post("/api/chat", (req, res) => {
  const prompt = req.body?.prompt || "Hello";
  res.json({
    response: `AI Response to: "${prompt}" — This is a simulated AI response powered by AgentXPay x402 protocol.`,
    model: "gpt-4-simulated",
    usage: { tokens: 150 },
    payment: (req as any).payment,
  });
});

app.post("/api/image", (req, res) => {
  const prompt = req.body?.prompt || "A sunset";
  res.json({
    imageUrl: `https://placehold.co/512x512/6366F1/ffffff?text=${encodeURIComponent(prompt)}`,
    model: "dall-e-simulated",
    payment: (req as any).payment,
  });
});

app.get("/api/services", (_req, res) => {
  res.json({
    services: config.routes.map((r) => ({
      path: r.path,
      method: r.method,
      serviceId: r.serviceId,
      price: r.priceWei,
      token: r.token,
    })),
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`AgentXPay x402 Middleware running on http://localhost:${PORT}`);
  console.log(`Payment Manager: ${PAYMENT_MANAGER}`);
});
