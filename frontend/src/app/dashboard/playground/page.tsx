"use client";

import { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Check, Loader2, AlertCircle, ArrowRight, Copy, Zap } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { formatToken } from "@/lib/utils";

interface LogEntry {
  step: number;
  label: string;
  status: "pending" | "loading" | "success" | "error";
  detail?: string;
  timestamp?: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PlaygroundPage() {
  const { services: chainServices, isLoading: servicesLoading } = useServices();
  const [selectedService, setSelectedService] = useState("");
  const [prompt, setPrompt] = useState("Explain how AI agents can use blockchain for payments");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [response, setResponse] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const services = chainServices.length > 0
    ? chainServices.map((s) => ({
        id: String(Number(s.id)),
        name: s.name,
        price: `${formatToken(s.pricePerCall)} MON`,
      }))
    : [
        { id: "1", name: "GPT-4 Turbo API", price: "0.01 MON" },
        { id: "2", name: "DALL-E 3 Generation", price: "0.02 MON" },
        { id: "3", name: "Whisper Transcription", price: "0.005 MON" },
      ];

  if (!selectedService && services.length > 0) {
    setSelectedService(services[0].id);
  }

  const addLog = (log: LogEntry) => {
    setLogs((prev) => [...prev, { ...log, timestamp: new Date().toLocaleTimeString() }]);
  };

  const updateLastLog = (status: LogEntry["status"], detail?: string) => {
    setLogs((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], status, detail };
      }
      return updated;
    });
  };

  const runDemo = async () => {
    setIsRunning(true);
    setLogs([]);
    setResponse("");

    const selected = services.find((s) => s.id === selectedService);

    addLog({ step: 1, label: "Sending request to AI Service", status: "loading" });
    await delay(1200);
    updateLastLog("success", `POST /api/chat → ${selected?.name}`);

    addLog({ step: 2, label: "Received HTTP 402 Payment Required", status: "loading" });
    await delay(800);
    updateLastLog("success", `Payment: ${selected?.price} to PaymentManager`);

    addLog({ step: 3, label: "Executing on-chain payment", status: "loading" });
    await delay(1500);
    updateLastLog("success", "tx: 0x7a8b...confirmed in 1.2s");

    addLog({ step: 4, label: "Retrying request with payment proof", status: "loading" });
    await delay(600);
    updateLastLog("success", "X-Payment-TxHash: 0x7a8b...9c0d attached");

    addLog({ step: 5, label: "Payment verified, service delivered", status: "loading" });
    await delay(1000);
    updateLastLog("success", "200 OK — AI response received");

    setResponse(
      `AI agents can leverage blockchain payment infrastructure in several powerful ways:\n\n1. **Autonomous Settlements**: Agents can independently discover services, negotiate prices, and execute payments without human intervention using protocols like AgentXPay's x402.\n\n2. **Micropayments at Scale**: With high-throughput chains, agents can make per-API-call payments economically viable, enabling true pay-per-use models.\n\n3. **Smart Contract Wallets**: Agent wallets with spending limits and permission controls ensure agents operate within predefined budgets while maintaining autonomy.\n\n4. **Trustless Service Discovery**: On-chain service registries provide transparent, verifiable information about available AI services, pricing, and reputation.\n\nThis infrastructure enables a new paradigm of machine-to-machine commerce where AI agents become first-class economic actors on the blockchain.`
    );
    setIsRunning(false);
  };

  return (
    <div>
      <Header title="Demo Playground" subtitle="Watch the x402 payment flow in action" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-background-secondary border-white/5">
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">AI Service</label>
              {servicesLoading ? (
                <div className="flex items-center gap-2 py-2 text-text-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading services...
                </div>
              ) : (
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="bg-background border-white/10 text-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background-card border-white/10">
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-text hover:bg-white/5">
                        {s.name} ({s.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-24 px-3 py-2 rounded-md bg-background border border-white/10 text-text text-sm resize-none focus:outline-none focus:border-primary/50"
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
              onClick={runDemo}
              disabled={isRunning}
            >
              {isRunning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Send Request</>
              )}
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <h4 className="text-xs text-text-muted mb-2">SDK Code</h4>
            <div className="relative">
              <pre className="text-[11px] text-text-secondary bg-background p-3 rounded-lg overflow-x-auto">
{`const agent = new AgentXPayClient({
  rpcUrl: "http://127.0.0.1:8545",
  privateKey: AGENT_KEY,
});

const res = await agent.fetch(
  "https://ai-service.com/api/chat",
  {
    method: "POST",
    body: JSON.stringify({
      prompt: "${prompt.slice(0, 30)}..."
    }),
    autoPayment: true,
  }
);`}
              </pre>
              <button className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 cursor-pointer">
                <Copy className="w-3 h-3 text-text-muted" />
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background-secondary border-white/5">
          <h3 className="text-sm font-semibold text-text mb-4">x402 Payment Flow</h3>
          <ScrollArea className="h-[500px]" ref={logRef}>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <Play className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Click &quot;Send Request&quot; to start the demo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.status === "success" ? "bg-success/20 text-success" :
                        log.status === "loading" ? "bg-primary/20 text-primary" :
                        log.status === "error" ? "bg-danger/20 text-danger" :
                        "bg-white/5 text-text-muted"
                      }`}>
                        {log.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                         log.status === "success" ? <Check className="w-4 h-4" /> :
                         log.status === "error" ? <AlertCircle className="w-4 h-4" /> :
                         <span className="text-xs">{log.step}</span>}
                      </div>
                      {i < logs.length - 1 && <div className="w-px h-8 bg-white/10 mt-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-text">{log.label}</p>
                        <span className="text-[10px] text-text-muted">{log.timestamp}</span>
                      </div>
                      {log.detail && <p className="text-xs text-text-muted mt-1">{log.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        <Card className="p-6 bg-background-secondary border-white/5">
          <h3 className="text-sm font-semibold text-text mb-4">AI Response</h3>
          <ScrollArea className="h-[500px]">
            {!response ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <ArrowRight className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Response will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge className="bg-success/10 text-success border-success/20 mb-3">200 OK</Badge>
                <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {response}
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
