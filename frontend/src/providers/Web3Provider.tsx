"use client";

import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { monadTestnet, anvilLocalChain, ACTIVE_CHAIN } from "@/lib/monadChain";

// Put the active chain first so wagmi uses it as the default for usePublicClient() etc.
const chains = ACTIVE_CHAIN.id === monadTestnet.id
  ? [monadTestnet, anvilLocalChain] as const
  : [anvilLocalChain, monadTestnet] as const;

const config = createConfig({
  chains,
  transports: {
    [anvilLocalChain.id]: http(),
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#6366F1",
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
