"use client";

import { useAccount } from "wagmi";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2 } from "lucide-react";
import { usePaymentEvents } from "@/hooks/usePaymentEvents";
import { useServices } from "@/hooks/useServices";
import { formatToken, shortenAddress } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  LLM: "#6366F1",
  Image: "#8B5CF6",
  Audio: "#A855F7",
  Code: "#D946EF",
  Other: "#F59E0B",
};

export default function BillingPage() {
  const { address } = useAccount();
  const { events, isLoading } = usePaymentEvents(address);
  const { services } = useServices();

  const serviceMap = new Map(services.map((s) => [Number(s.id), s]));

  const monthlyData = (() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap = new Map<number, { spent: number; earned: number }>();
    events.forEach((e) => {
      if (!e.timestamp) return;
      const month = new Date(e.timestamp * 1000).getMonth();
      const existing = monthMap.get(month) || { spent: 0, earned: 0 };
      const amount = Number(e.amount) / 1e18;
      if (e.payer.toLowerCase() === address?.toLowerCase()) {
        existing.spent += amount;
      }
      if (e.provider.toLowerCase() === address?.toLowerCase()) {
        existing.earned += amount;
      }
      monthMap.set(month, existing);
    });
    return months.map((m, i) => ({
      month: m,
      spent: Number((monthMap.get(i)?.spent || 0).toFixed(4)),
      earned: Number((monthMap.get(i)?.earned || 0).toFixed(4)),
    }));
  })();

  const pieData = (() => {
    const categoryAmounts = new Map<string, number>();
    events
      .filter((e) => e.payer.toLowerCase() === address?.toLowerCase())
      .forEach((e) => {
        const service = serviceMap.get(Number(e.serviceId));
        const cat = service?.category || "Other";
        categoryAmounts.set(cat, (categoryAmounts.get(cat) || 0) + Number(e.amount) / 1e18);
      });
    const total = Array.from(categoryAmounts.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return Array.from(categoryAmounts.entries()).map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other,
    }));
  })();

  const txHistory = events.slice(0, 20).map((e) => {
    const service = serviceMap.get(Number(e.serviceId));
    const isPayer = e.payer.toLowerCase() === address?.toLowerCase();
    return {
      hash: shortenAddress(e.transactionHash, 6),
      fullHash: e.transactionHash,
      service: service?.name || `Service #${Number(e.serviceId)}`,
      type: isPayer ? "Pay" : "Earn",
      amount: `${formatToken(e.amount)} MON`,
      time: e.timestamp ? new Date(e.timestamp * 1000).toLocaleString() : "Unknown",
      status: "success" as const,
    };
  });

  return (
    <div>
      <Header title="Billing & Analytics" subtitle="Track your payments and usage" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 p-6 bg-background-secondary border-white/5">
          <h3 className="text-lg font-semibold text-text mb-4">Monthly Spending & Earnings</h3>
          {isLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : events.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232333" />
                <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#1A1A24", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} itemStyle={{ color: "#fff" }} labelStyle={{ color: "#9CA3AF" }} />
                <Bar dataKey="spent" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earned" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">
              No payment data yet
            </div>
          )}
        </Card>

        <Card className="p-6 bg-background-secondary border-white/5">
          <h3 className="text-lg font-semibold text-text mb-4">Usage Distribution</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1A1A24", border: "1px solid #333", borderRadius: "8px", color: "#fff" }} itemStyle={{ color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-text-secondary">{d.name}</span>
                    </div>
                    <span className="text-text font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-text-muted text-sm">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "No usage data yet"}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-background-secondary border-white/5">
        <h3 className="text-lg font-semibold text-text mb-4">Transaction History</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : txHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-text-muted">Tx Hash</TableHead>
                <TableHead className="text-text-muted">Service</TableHead>
                <TableHead className="text-text-muted">Type</TableHead>
                <TableHead className="text-text-muted">Amount</TableHead>
                <TableHead className="text-text-muted">Time</TableHead>
                <TableHead className="text-text-muted">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txHistory.map((tx, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-white/[2%]">
                  <TableCell className="font-mono text-xs text-primary">{tx.hash}</TableCell>
                  <TableCell className="text-text">{tx.service}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-white/10 text-text-secondary">{tx.type}</Badge>
                  </TableCell>
                  <TableCell className="text-text font-medium">{tx.amount}</TableCell>
                  <TableCell className="text-text-muted text-xs">{tx.time}</TableCell>
                  <TableCell>
                    <Badge className="text-xs bg-success/10 text-success border-success/20">{tx.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 text-text-muted text-sm">No transactions found</div>
        )}
      </Card>
    </div>
  );
}
