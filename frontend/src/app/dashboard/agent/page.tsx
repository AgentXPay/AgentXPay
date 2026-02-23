"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Bot, Plus, Shield, Wallet, ArrowUpRight, ArrowDownRight, Loader2, X, UserCheck, AlertCircle } from "lucide-react";
import { useAgentWallets } from "@/hooks/useAgentWallets";
import { useCreateWallet } from "@/hooks/useCreateWallet";
import { useWalletDeposit, useWalletWithdraw, useAuthorizeAgent, useRevokeAgent } from "@/hooks/useWalletActions";
import { useAuthorizedAgents } from "@/hooks/useAuthorizedAgents";
import { formatToken, shortenAddress } from "@/lib/utils";
import { isAddress } from "viem";

function WalletBalanceDisplay({ address }: { address: `0x${string}` }) {
  const { data: balance } = useBalance({ address });
  return (
    <p className="text-lg font-bold text-text">
      {balance ? formatToken(balance.value) : "0.0000"} <span className="text-xs text-text-muted">MON</span>
    </p>
  );
}

export default function AgentPage() {
  const { address } = useAccount();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState("0.5");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [authorizeDialogOpen, setAuthorizeDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<`0x${string}` | null>(null);
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [withdrawAmount, setWithdrawAmount] = useState("0.1");
  const [agentAddress, setAgentAddress] = useState("");

  const { wallets, walletCount, isLoading, refetch } = useAgentWallets(address);
  const { createWallet, isPending: isCreating, isConfirming: isCreateConfirming, isSuccess: isCreateSuccess, reset: resetCreate } = useCreateWallet();
  const { deposit, isPending: isDepositing, isConfirming: isDepositConfirming, isSuccess: isDepositSuccess, reset: resetDeposit } = useWalletDeposit();
  const { withdraw, isPending: isWithdrawing, isConfirming: isWithdrawConfirming, isSuccess: isWithdrawSuccess, reset: resetWithdraw } = useWalletWithdraw();
  const { authorizeAgent, isPending: isAuthorizing, isConfirming: isAuthConfirming, isSuccess: isAuthSuccess, error: authError, reset: resetAuth } = useAuthorizeAgent();
  const { revokeAgent, isPending: isRevoking, isConfirming: isRevokeConfirming, isSuccess: isRevokeSuccess, reset: resetRevoke } = useRevokeAgent();
  const { agents: authorizedAgents, isLoading: isLoadingAgents, refetch: refetchAgents } = useAuthorizedAgents(selectedWallet);
  const [revokingAddress, setRevokingAddress] = useState<string | null>(null);

  const handleCreate = () => {
    if (!dailyLimit) return;
    createWallet(dailyLimit);
  };

  if (isCreateSuccess && createDialogOpen) {
    setTimeout(() => {
      setCreateDialogOpen(false);
      resetCreate();
      refetch();
      setDailyLimit("0.5");
    }, 1000);
  }

  if (isDepositSuccess && depositDialogOpen) {
    setTimeout(() => {
      setDepositDialogOpen(false);
      resetDeposit();
      refetch();
    }, 1000);
  }

  if (isWithdrawSuccess && withdrawDialogOpen) {
    setTimeout(() => {
      setWithdrawDialogOpen(false);
      resetWithdraw();
      refetch();
    }, 1000);
  }

  if (isAuthSuccess && authorizeDialogOpen) {
    if (agentAddress) setAgentAddress("");
    setTimeout(() => {
      resetAuth();
      refetch();
      refetchAgents();
    }, 1000);
  }

  if (isRevokeSuccess) {
    setTimeout(() => {
      resetRevoke();
      refetch();
      refetchAgents();
      setRevokingAddress(null);
    }, 1000);
  }

  return (
    <div>
      <Header title="Agent Wallets" subtitle="Manage smart contract wallets for your AI agents" />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Card className="px-4 py-2 bg-background-secondary border-white/5 flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm text-text">{walletCount} Wallets</span>
          </Card>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Create Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-text">Create Agent Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Daily Spending Limit (MON)</label>
                <Input
                  placeholder="0.5"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="bg-background-secondary border-white/10 text-text"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
                onClick={handleCreate}
                disabled={isCreating || isCreateConfirming}
              >
                {isCreating || isCreateConfirming ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isCreateConfirming ? "Confirming..." : "Deploying..."}</>
                ) : isCreateSuccess ? "Created!" : "Deploy Wallet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-text-secondary">Loading wallets from chain...</span>
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-20">
          <Wallet className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">No agent wallets yet. Create one to get started!</p>
          <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => setCreateDialogOpen(true)}>
            Create Wallet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wallets.map((w) => {
            const dailyLimitNum = Number(w.dailyLimit) / 1e18;
            const dailySpentNum = Number(w.dailySpent) / 1e18;
            const spentPercent = dailyLimitNum > 0 ? (dailySpentNum / dailyLimitNum) * 100 : 0;
            return (
              <Card key={w.address} className="p-6 bg-background-secondary border-white/5 hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-mono text-sm text-text">{shortenAddress(w.address, 6)}</p>
                      <Badge className="mt-1 text-[10px] bg-success/10 text-success border-success/20">active</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Balance</p>
                    <WalletBalanceDisplay address={w.address} />
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Daily Limit</p>
                    <p className="text-lg font-bold text-text">{formatToken(w.dailyLimit)} <span className="text-xs text-text-muted">MON</span></p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                    <span>Daily Spent</span>
                    <span>{dailySpentNum.toFixed(4)} / {dailyLimitNum.toFixed(4)} MON</span>
                  </div>
                  <Progress value={Math.min(spentPercent, 100)} className="h-2" />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 text-text-secondary"
                    onClick={() => { setSelectedWallet(w.address); setDepositDialogOpen(true); }}
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Deposit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 text-text-secondary"
                    onClick={() => { setSelectedWallet(w.address); setWithdrawDialogOpen(true); }}
                  >
                    <ArrowDownRight className="w-3 h-3 mr-1" /> Withdraw
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => { setSelectedWallet(w.address); setAuthorizeDialogOpen(true); }}
                  >
                    <Shield className="w-3 h-3 mr-1" /> Authorize
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="bg-background-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-text">Deposit to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-xs text-text-muted font-mono">{selectedWallet}</p>
            <Input
              placeholder="Amount (MON)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="bg-background-secondary border-white/10 text-text"
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isDepositing || isDepositConfirming}
              onClick={() => selectedWallet && deposit(selectedWallet, depositAmount)}
            >
              {isDepositing || isDepositConfirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isDepositConfirming ? "Confirming..." : isDepositing ? "Sending..." : isDepositSuccess ? "Deposited!" : "Deposit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="bg-background-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-text">Withdraw from Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-xs text-text-muted font-mono">{selectedWallet}</p>
            <Input
              placeholder="Amount (MON)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="bg-background-secondary border-white/10 text-text"
            />
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isWithdrawing || isWithdrawConfirming}
              onClick={() => selectedWallet && withdraw(selectedWallet, withdrawAmount)}
            >
              {isWithdrawing || isWithdrawConfirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isWithdrawConfirming ? "Confirming..." : isWithdrawing ? "Sending..." : isWithdrawSuccess ? "Withdrawn!" : "Withdraw"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authorize Agent Dialog */}
      <Dialog open={authorizeDialogOpen} onOpenChange={(open) => {
        setAuthorizeDialogOpen(open);
        if (!open) {
          setAgentAddress("");
          resetAuth();
          setRevokingAddress(null);
        }
      }}>
        <DialogContent className="bg-background-card border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text">Manage Authorized Agents</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <p className="text-xs text-text-muted font-mono">Wallet: {selectedWallet}</p>

            {/* Authorized Agents List */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-text">Authorized Agents</span>
                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 ml-auto">
                  {authorizedAgents.length}
                </Badge>
              </div>

              {isLoadingAgents ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
                  <span className="text-xs text-text-muted">Loading authorized agents...</span>
                </div>
              ) : authorizedAgents.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-white/10 rounded-lg">
                  <Shield className="w-6 h-6 text-text-muted mx-auto mb-2" />
                  <p className="text-xs text-text-muted">No agents authorized yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {authorizedAgents.map((agent) => {
                    const isThisRevoking = revokingAddress === agent && (isRevoking || isRevokeConfirming);
                    const isThisRevoked = revokingAddress === agent && isRevokeSuccess;
                    return (
                      <div
                        key={agent}
                        className="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
                            <UserCheck className="w-3.5 h-3.5 text-success" />
                          </div>
                          <span className="font-mono text-xs text-text">{shortenAddress(agent, 6)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          disabled={isThisRevoking}
                          onClick={() => {
                            if (selectedWallet) {
                              setRevokingAddress(agent);
                              revokeAgent(selectedWallet, agent as `0x${string}`);
                            }
                          }}
                        >
                          {isThisRevoking ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" />{isRevokeConfirming ? "Confirming" : "Revoking"}</>
                          ) : isThisRevoked ? (
                            "Revoked!"
                          ) : (
                            <><X className="w-3 h-3 mr-1" />Revoke</>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/5" />

            {/* Add New Agent */}
            <div>
              <label className="text-sm font-medium text-text mb-2 block">Authorize New Agent</label>
              {(() => {
                const trimmedAddress = agentAddress.trim();
                const isDuplicate = !isAuthSuccess && trimmedAddress !== "" && authorizedAgents.some(
                  (agent) => agent.toLowerCase() === trimmedAddress.toLowerCase()
                );
                const isInvalidAddress = trimmedAddress !== "" && !isAddress(trimmedAddress);
                return (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Agent address (0x...)"
                        value={agentAddress}
                        onChange={(e) => {
                          setAgentAddress(e.target.value);
                          if (authError) resetAuth();
                        }}
                        className={`bg-background-secondary border-white/10 text-text flex-1 ${(isDuplicate || isInvalidAddress || authError) ? "border-red-500/50 focus-visible:ring-red-500/30" : ""}`}
                      />
                      <Button
                        className="bg-primary hover:bg-primary/90 shrink-0"
                        disabled={isAuthorizing || isAuthConfirming || !trimmedAddress || isDuplicate || isInvalidAddress}
                        onClick={() => {
                          if (selectedWallet && isAddress(trimmedAddress)) {
                            authorizeAgent(selectedWallet, trimmedAddress as `0x${string}`);
                          }
                        }}
                      >
                        {isAuthorizing || isAuthConfirming ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{isAuthConfirming ? "Confirming" : "Sending"}</>
                        ) : isAuthSuccess ? "Authorized!" : (
                          <><Shield className="w-4 h-4 mr-1" />Authorize</>
                        )}
                      </Button>
                    </div>
                    {isDuplicate && (
                      <div className="flex items-center gap-1.5 mt-2 text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">This agent is already authorized</span>
                      </div>
                    )}
                    {isInvalidAddress && !isDuplicate && (
                      <div className="flex items-center gap-1.5 mt-2 text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">Invalid Ethereum address format</span>
                      </div>
                    )}
                    {authError && !isDuplicate && !isInvalidAddress && (
                      <div className="flex items-center gap-1.5 mt-2 text-red-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs">{(authError as Error).message?.includes("User rejected") ? "Transaction rejected by user" : "Authorization failed. Please try again."}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
