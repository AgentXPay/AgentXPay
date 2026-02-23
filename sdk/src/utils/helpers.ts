import { ethers } from "ethers";

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEther(wei: bigint): string {
  return ethers.formatEther(wei);
}

export function parseEther(ether: string): bigint {
  return ethers.parseEther(ether);
}

export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export async function waitForTx(
  tx: ethers.TransactionResponse,
  confirmations = 1
): Promise<ethers.TransactionReceipt> {
  const receipt = await tx.wait(confirmations);
  if (!receipt) throw new Error("Transaction receipt is null");
  return receipt;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
