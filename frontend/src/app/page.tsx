"use client";

import Link from "next/link";
import { Zap, Search, CreditCard, Bot, Shield, ArrowRight, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Search,
    title: "Service Discovery",
    desc: "AI Agents autonomously discover and evaluate on-chain registered AI services by category, price, and reputation.",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: CreditCard,
    title: "x402 Auto-Payment",
    desc: "Inspired by HTTP 402, agents automatically detect payment requirements and complete on-chain settlement seamlessly.",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    icon: Bot,
    title: "Agent Wallets",
    desc: "Smart contract wallets with daily spending limits and granular permission controls for autonomous AI agents.",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: Shield,
    title: "Subscription & Escrow",
    desc: "Flexible payment models including per-call, subscription plans, and escrow-based conditional settlements.",
    gradient: "from-pink-500 to-rose-600",
  },
];

const flowSteps = [
  { step: "1", label: "Agent Requests API", icon: Bot, color: "text-blue-400" },
  { step: "2", label: "402 Payment Required", icon: Lock, color: "text-yellow-400" },
  { step: "3", label: "On-Chain Payment", icon: CreditCard, color: "text-purple-400" },
  { step: "4", label: "Service Delivered", icon: Globe, color: "text-green-400" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              AgentXPay
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-secondary hover:text-text transition">Features</a>
            <a href="#architecture" className="text-sm text-text-secondary hover:text-text transition">Architecture</a>
            <a href="#flow" className="text-sm text-text-secondary hover:text-text transition">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/playground">
              <Button variant="outline" className="border-white/10 text-text-secondary hover:text-text hover:bg-white/5">
                Playground
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary">Built on Monad — 10,000+ TPS</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-text">AI Agent Native</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Payment Infrastructure
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            The first protocol enabling AI agents to autonomously discover services,
            negotiate pricing, and settle payments on-chain — all without human intervention.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 px-8 py-6 text-lg font-semibold animate-glow">
                Start Building
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard/playground">
              <Button size="lg" variant="outline" className="border-white/20 text-text hover:bg-white/5 px-8 py-6 text-lg">
                Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Everything Agents Need to <span className="text-primary">Pay & Get Paid</span>
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              A complete payment infrastructure stack designed from the ground up for autonomous AI agents
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-background-secondary border border-white/5 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* x402 Flow */}
      <section id="flow" className="py-24 px-6 bg-background-secondary/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              The <span className="text-primary">x402</span> Payment Flow
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Inspired by HTTP 402 Payment Required — seamless machine-to-machine payments
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {flowSteps.map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-background border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className={`w-8 h-8 ${s.color}`} />
                </div>
                <div className={`text-sm font-bold ${s.color} mb-1`}>Step {s.step}</div>
                <div className="text-text font-medium">{s.label}</div>
                {i < flowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)]">
                    <div className="h-px bg-gradient-to-r from-white/20 to-white/5" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 rounded-2xl bg-background border border-white/10">
            <pre className="text-sm text-text-secondary overflow-x-auto">
              <code>{`const agent = new AgentXPayClient({ rpcUrl, privateKey });

// Agent discovers AI services on-chain
const services = await agent.discoverServices({ category: "llm" });

// x402 auto-payment: request → 402 → pay → retry → success
const response = await agent.fetch("https://ai-service.com/api/chat", {
  method: "POST",
  body: JSON.stringify({ prompt: "Analyze this data..." }),
  autoPayment: true,  // Automatically handles 402 responses
});

console.log(await response.json()); // AI response received!`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Modular <span className="text-primary">Architecture</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-12">
            Five independent smart contracts working together to power the full agent payment lifecycle
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "ServiceRegistry", desc: "Discover & register", color: "from-blue-500/20 to-blue-600/5" },
              { name: "PaymentManager", desc: "Pay per use & batch", color: "from-indigo-500/20 to-indigo-600/5" },
              { name: "Subscription", desc: "Plans & auto-renew", color: "from-purple-500/20 to-purple-600/5" },
              { name: "Escrow", desc: "Conditional settlement", color: "from-pink-500/20 to-pink-600/5" },
              { name: "AgentWallet", desc: "Smart accounts", color: "from-rose-500/20 to-rose-600/5" },
            ].map((c, i) => (
              <div key={i} className={`p-4 rounded-xl bg-gradient-to-b ${c.color} border border-white/5 hover:border-white/20 transition-all`}>
                <div className="text-sm font-semibold text-text mb-1">{c.name}</div>
                <div className="text-xs text-text-muted">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-text">AgentXPay</span>
          </div>
          <p className="text-sm text-text-muted">
            AI Agent Native Payment Infrastructure - Made with ❤️ by JasonRUAN
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-text-secondary hover:text-text transition">Docs</a>
            <a href="#" className="text-sm text-text-secondary hover:text-text transition">GitHub</a>
            <a href="#" className="text-sm text-text-secondary hover:text-text transition">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
