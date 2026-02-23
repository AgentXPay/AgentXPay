"use client";

import { useAccount } from "wagmi";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Store, Bot, CreditCard, Loader2, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useServices } from "@/hooks/useServices";
import { formatToken, shortenAddress, timeAgo } from "@/lib/utils";

export default function DashboardOverview() {
  const { address } = useAccount();
  const { stats, events, isStatsLoading, isEventsLoading } = useDashboardStats(address);
  const { services } = useServices();

  const serviceMap = new Map(services.map((s) => [Number(s.id), s.name]));

  const statCards = [
    { label: "Total Spent", value: `${formatToken(stats.totalSpent)} MON`, icon: DollarSign, color: "from-blue-500 to-indigo-500", hint: "Total amount you paid as a subscriber (before platform fee deduction)" },
    { label: "Total Earned", value: `${formatToken(stats.totalEarned)} MON`, icon: TrendingUp, color: "from-green-500 to-emerald-500", hint: "Net earnings as a service provider (after 2.5% platform fee)" },
    { label: "Active Subs", value: `${stats.activeSubscriptions}`, icon: Store, color: "from-purple-500 to-pink-500" },
    { label: "Agent Wallets", value: `${stats.walletCount}`, icon: Bot, color: "from-orange-500 to-red-500" },
  ];

  const chartData = (() => {
    if (events.length === 0) return [];
    const dayMap = new Map<string, { spent: number; earned: number }>();
    events.forEach((e) => {
      if (!e.timestamp) return;
      const date = new Date(e.timestamp * 1000);
      const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
      const existing = dayMap.get(dayKey) || { spent: 0, earned: 0 };
      const amount = Number(e.amount) / 1e18;
      if (e.payer.toLowerCase() === address?.toLowerCase()) {
        existing.spent += amount;
      }
      if (e.provider.toLowerCase() === address?.toLowerCase()) {
        existing.earned += amount;
      }
      dayMap.set(dayKey, existing);
    });
    return Array.from(dayMap.entries()).map(([day, data]) => ({ day, ...data }));
  })();

  const recentTxs = events.slice(0, 8).map((e) => ({
    hash: shortenAddress(e.transactionHash, 4),
    service: serviceMap.get(Number(e.serviceId)) || `Service #${Number(e.serviceId)}`,
    type: e.payer.toLowerCase() === address?.toLowerCase() ? "Pay" : "Earn",
    subType: e.eventType === "subscription" ? "Sub" : "Call",
    amount: `${formatToken(e.amount)} MON`,
    time: e.timestamp ? timeAgo(e.timestamp) : "Unknown",
  }));

  if (!address) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Overview of your AgentXPay activity" />
        <div className="text-center py-20">
          <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">Connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of your AgentXPay activity" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <Card key={i} className="p-5 bg-background-secondary border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm text-text-secondary">{s.label}</p>
                  {s.hint && (
                    <TooltipProvider delayDuration={200}>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3.5 h-3.5 text-text-muted cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          <p>{s.hint}</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-2xl font-bold text-text">
                  {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : s.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 p-6 bg-background-secondary border-white/5">
          <h3 className="text-lg font-semibold text-text mb-4">Spending & Earnings Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232333" />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1A1A24", border: "1px solid #333", borderRadius: "8px" }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <Line type="monotone" dataKey="spent" stroke="#6366F1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="earned" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-text-muted">
              {isEventsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "No payment data yet"}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-background-secondary border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text">Recent Transactions</h3>
          </div>
          {isEventsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentTxs.length > 0 ? (
            <div className="space-y-3">
              {recentTxs.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-text-muted" />
                    <div>
                      <p className="text-sm text-text">{tx.service}</p>
                      <p className="text-xs text-text-muted">{tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text">{tx.amount}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Badge className={`text-[10px] ${tx.type === "Pay" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-success/10 text-success border-success/20"}`}>{tx.type}</Badge>
                      <Badge className="text-[10px] bg-white/5 text-text-muted border-white/10">{tx.subType}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-text-muted text-sm">No transactions yet</div>
          )}
        </Card>
      </div>
    </div>
  );
}
