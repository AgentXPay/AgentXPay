"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import {
  LayoutDashboard,
  Store,
  Bot,
  Receipt,
  Play,
  Menu,
  X,
  Zap,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/dashboard/services", label: "Services", icon: Store },
  { path: "/dashboard/agent", label: "Agent Wallets", icon: Bot },
  { path: "/dashboard/billing", label: "Billing", icon: Receipt },
  { path: "/dashboard/playground", label: "Playground", icon: Play },
];

const chainNames: Record<number, string> = {
  31337: "Anvil Local",
  10143: "Monad Testnet",
};

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const chainName = chainId ? (chainNames[chainId] || `Chain ${chainId}`) : "Not Connected";

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-background-secondary border-r border-white/5 z-40 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              AgentXPay
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary cursor-pointer"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-secondary hover:text-text hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-4 left-3 right-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary-dark/10 border border-primary/20">
            <p className="text-xs text-text-secondary mb-2">{chainName}</p>
            {isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-success inline-block mr-1" />
                <span className="text-xs text-success">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-warning inline-block mr-1" />
                <span className="text-xs text-warning">Not Connected</span>
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
