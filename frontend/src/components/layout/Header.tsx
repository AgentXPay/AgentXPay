"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-white/5 text-text-secondary cursor-pointer">
          <Bell className="w-5 h-5" />
        </button>
        <ConnectButton showBalance={true} chainStatus="icon" accountStatus="address" />
      </div>
    </header>
  );
}
