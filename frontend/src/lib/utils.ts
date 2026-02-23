import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatEther } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatToken(value: bigint, decimals = 4): string {
  const formatted = formatEther(value);
  const num = parseFloat(formatted);
  return num.toFixed(decimals);
}

export function formatTokenSymbol(value: bigint, decimals = 4): string {
  return `${formatToken(value, decimals)} MON`;
}

export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
