"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle, Zap, ArrowRight, Send, Copy, CheckCheck, Download, ImageIcon, Code2, CheckCircle2 } from "lucide-react";
import { paymentManagerContract } from "@/constants/contracts";
import { formatToken, shortenAddress } from "@/lib/utils";
import { toast } from "sonner";
import type { Service } from "@/hooks/useServices";

function highlightCode(code: string): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Tokenize first to avoid nested replacements corrupting span tags
  const tokens: { type: string; text: string }[] = [];
  let remaining = escaped;

  while (remaining.length > 0) {
    let match: RegExpMatchArray | null = null;

    // Single-line comments
    match = remaining.match(/^(\/\/.*)/);
    if (match) { tokens.push({ type: "comment", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Multi-line comments
    match = remaining.match(/^(\/\*[\s\S]*?\*\/)/);
    if (match) { tokens.push({ type: "comment", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Strings (double quotes)
    match = remaining.match(/^(&quot;(?:[^&]|&(?!quot;))*?&quot;)/);
    if (match) { tokens.push({ type: "string", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Strings (double quotes - raw)
    match = remaining.match(/^("(?:[^"\\]|\\.)*")/);
    if (match) { tokens.push({ type: "string", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Strings (single quotes)
    match = remaining.match(/^('(?:[^'\\]|\\.)*')/);
    if (match) { tokens.push({ type: "string", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Template literals
    match = remaining.match(/^(`(?:[^`\\]|\\.)*`)/);
    if (match) { tokens.push({ type: "string", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Keywords
    match = remaining.match(/^(import|export|from|const|let|var|function|async|await|return|if|else|new|class|extends|interface|type|struct|module|use|public|entry|fun|throw|try|catch|for|while|of|in|true|false|null|undefined|void|this)\b/);
    if (match && (tokens.length === 0 || /[\s;{(,=&]$/.test(tokens[tokens.length - 1].text) || tokens[tokens.length - 1].type !== "plain")) {
      tokens.push({ type: "keyword", text: match[0] }); remaining = remaining.slice(match[0].length); continue;
    }

    // Types & built-ins
    match = remaining.match(/^(string|number|boolean|any|Promise|Array|Record|Map|Set|console|process|document|window|JSON|Math|Date|Error|BigInt)\b/);
    if (match) { tokens.push({ type: "type", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Numbers
    match = remaining.match(/^(\d+\.?\d*)\b/);
    if (match) { tokens.push({ type: "number", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Plain text (one char at a time or a chunk of non-special chars)
    match = remaining.match(/^[^\/'"`a-zA-Z0-9&]+|^[a-zA-Z_]\w*|^&\w+;|^./);
    if (match) { tokens.push({ type: "plain", text: match[0] }); remaining = remaining.slice(match[0].length); continue; }

    // Fallback: single char
    tokens.push({ type: "plain", text: remaining[0] }); remaining = remaining.slice(1);
  }

  // Colorize tokens, also detect function calls
  const colorMap: Record<string, string> = {
    comment: "#6a9955",
    string: "#ce9178",
    keyword: "#c586c0",
    type: "#4ec9b0",
    number: "#b5cea8",
  };

  return tokens
    .map((token, i) => {
      const color = colorMap[token.type];
      if (color) return `<span style="color:${color}">${token.text}</span>`;
      // Detect function calls: identifier followed by (
      if (token.type === "plain" && /^[a-zA-Z_]\w*$/.test(token.text)) {
        const next = tokens.slice(i + 1).find((t) => t.text.trim() !== "");
        if (next && next.text.startsWith("(")) {
          return `<span style="color:#dcdcaa">${token.text}</span>`;
        }
      }
      return token.text;
    })
    .join("");
}

interface TryServiceDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubscribed?: boolean;
}

interface FlowStep {
  id: number;
  label: string;
  status: "pending" | "loading" | "success" | "error";
  detail?: string;
}

export default function TryServiceDialog({ service, open, onOpenChange, isSubscribed = false }: TryServiceDialogProps) {
  const { address } = useAccount();
  const [prompt, setPrompt] = useState("Explain how AI agents can use blockchain for payments");
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [response, setResponse] = useState("");
  const [responseType, setResponseType] = useState<"text" | "image" | "code">("text");
  const [responseLang, setResponseLang] = useState("typescript");
  const [phase, setPhase] = useState<"idle" | "paying" | "confirming" | "calling" | "done" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const resetAll = useCallback(() => {
    setSteps([]);
    setResponse("");
    setResponseType("text");
    setResponseLang("typescript");
    setPhase("idle");
    resetWrite();
  }, [resetWrite]);

  useEffect(() => {
    if (!open) {
      resetAll();
    }
  }, [open, resetAll]);

  const updateStep = (id: number, updates: Partial<FlowStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleTry = () => {
    if (!service || !address) return;

    resetAll();

    if (isSubscribed) {
      // Subscribed users skip payment, call service directly
      setPhase("calling");
      setSteps([
        { id: 1, label: "Subscription verified", status: "success", detail: "Active subscription detected — no payment needed" },
        { id: 2, label: "Calling AI service with subscription access", status: "loading", detail: `POST ${service.endpoint}` },
        { id: 3, label: "Receiving AI response", status: "pending" },
      ]);
      callServiceWithSubscription(service);
    } else {
      // Non-subscribed users go through pay-per-use flow
      setPhase("paying");
      setSteps([
        { id: 1, label: "Initiating on-chain payment", status: "loading", detail: `${formatToken(service.pricePerCall)} MON → PaymentManager` },
        { id: 2, label: "Waiting for transaction confirmation", status: "pending" },
        { id: 3, label: "Calling AI service with payment proof", status: "pending" },
        { id: 4, label: "Receiving AI response", status: "pending" },
      ]);

      writeContract({
        ...paymentManagerContract,
        functionName: "payPerUse",
        args: [service.id],
        value: service.pricePerCall,
      });
    }
  };

  // Handle write error
  useEffect(() => {
    if (writeError && phase === "paying") {
      updateStep(1, {
        status: "error",
        detail: writeError.message?.includes("User rejected")
          ? "Transaction rejected by user"
          : writeError.message?.slice(0, 100) || "Transaction failed",
      });
      setPhase("error");
      toast.error("Payment failed", {
        description: writeError.message?.includes("User rejected")
          ? "You rejected the transaction"
          : "Transaction submission failed",
      });
    }
  }, [writeError, phase]);

  // Handle tx submitted → confirming
  useEffect(() => {
    if (txHash && phase === "paying") {
      updateStep(1, { status: "success", detail: `tx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}` });
      updateStep(2, { status: "loading", detail: "Waiting for block confirmation..." });
      setPhase("confirming");
    }
  }, [txHash, phase]);

  // Handle tx confirmed → call service
  useEffect(() => {
    if (isConfirmed && phase === "confirming" && service) {
      updateStep(2, { status: "success", detail: "Transaction confirmed on-chain" });
      updateStep(3, { status: "loading", detail: `POST ${service.endpoint}` });
      setPhase("calling");

      // Call the AI service endpoint
      callService(service, txHash!);
    }
  }, [isConfirmed, phase, service, txHash]);

  // Handle confirm error
  useEffect(() => {
    if (confirmError && phase === "confirming") {
      updateStep(2, { status: "error", detail: "Transaction failed on-chain" });
      setPhase("error");
      toast.error("Transaction failed on-chain");
    }
  }, [confirmError, phase]);

  const callService = async (svc: Service, hash: string) => {
    try {
      const res = await fetch(svc.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment-TxHash": hash,
          "X-Payment-ServiceId": String(Number(svc.id)),
        },
        body: JSON.stringify({ prompt }),
      });

      updateStep(3, { status: "success", detail: `${res.status} ${res.statusText} — Headers sent with payment proof` });
      updateStep(4, { status: "loading", detail: "Parsing response..." });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        updateStep(4, { status: "error", detail: `Service returned ${res.status}: ${errText.slice(0, 100)}` });
        setPhase("error");
        toast.error(`Service returned ${res.status}`);
        return;
      }

      const data = await res.json();

      // Detect if response contains an image URL
      const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
      const isImageResponse = !!imageUrl ||
        svc.category.toLowerCase() === "image" && (data?.data?.[0]?.url || data?.data?.[0]?.revised_prompt);

      if (isImageResponse && imageUrl) {
        setResponseType("image");
        setResponse(imageUrl);
      } else if (data?.code || data?.language) {
        setResponseType("code");
        setResponseLang(data?.language || "typescript");
        setResponse(data.code || JSON.stringify(data, null, 2));
      } else {
        setResponseType("text");
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.result ||
          JSON.stringify(data, null, 2);
        setResponse(content);
      }
      updateStep(4, { status: "success", detail: "Response received successfully" });
      setPhase("done");
      toast.success("Service call completed!", {
        description: `${svc.name} responded successfully`,
      });
    } catch (err: any) {
      // Network error — still show payment success, simulate response
      updateStep(3, {
        status: "success",
        detail: `Payment verified on-chain (endpoint unreachable, showing simulated response)`,
      });
      updateStep(4, { status: "success", detail: "Simulated response generated" });

      setResponse(
        `✅ Payment successful! Transaction: ${hash}\n\n` +
          `The on-chain payment of ${formatToken(svc.pricePerCall)} MON has been confirmed.\n\n` +
          `⚠️ Note: The service endpoint (${svc.endpoint}) is currently unreachable.\n` +
          `In production, the AI service would verify your payment on-chain and deliver the response.\n\n` +
          `This demonstrates the x402 payment flow:\n` +
          `1. ✅ User pays on-chain via PaymentManager.payPerUse()\n` +
          `2. ✅ Transaction confirmed: ${hash.slice(0, 10)}...${hash.slice(-8)}\n` +
          `3. ⚠️ Service endpoint call (would include X-Payment-TxHash header)\n` +
          `4. → Service verifies payment and delivers AI response`
      );
      setPhase("done");
      toast.success("Payment confirmed!", {
        description: "Service endpoint unreachable, but payment was successful on-chain",
      });
    }
  };

  const callServiceWithSubscription = async (svc: Service) => {
    try {
      const res = await fetch(svc.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Subscription-Address": address!,
          "X-Payment-ServiceId": String(Number(svc.id)),
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        // Subscription verification failed on server side (e.g. 402)
        const errText = await res.text().catch(() => "Unknown error");
        updateStep(2, { status: "error", detail: `Subscription verification failed (${res.status}): ${errText.slice(0, 100)}` });
        setPhase("error");
        toast.error("Subscription verification failed on server", {
          description: "The service could not verify your subscription. Make sure the service provider's server is properly configured.",
        });
        return;
      }

      updateStep(2, { status: "success", detail: `${res.status} ${res.statusText} — Subscription access granted` });
      updateStep(3, { status: "loading", detail: "Parsing response..." });

      const data = await res.json();

      const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
      const isImageResponse = !!imageUrl ||
        svc.category.toLowerCase() === "image" && (data?.data?.[0]?.url || data?.data?.[0]?.revised_prompt);

      if (isImageResponse && imageUrl) {
        setResponseType("image");
        setResponse(imageUrl);
      } else if (data?.code || data?.language) {
        setResponseType("code");
        setResponseLang(data?.language || "typescript");
        setResponse(data.code || JSON.stringify(data, null, 2));
      } else {
        setResponseType("text");
        const content =
          data?.choices?.[0]?.message?.content ||
          data?.result ||
          JSON.stringify(data, null, 2);
        setResponse(content);
      }
      updateStep(3, { status: "success", detail: "Response received successfully" });
      setPhase("done");
      toast.success("Service call completed!", {
        description: `${svc.name} responded successfully (subscription access)`,
      });
    } catch (err: any) {
      updateStep(2, {
        status: "success",
        detail: `Subscription verified (endpoint unreachable, showing simulated response)`,
      });
      updateStep(3, { status: "success", detail: "Simulated response generated" });

      setResponse(
        `✅ Subscription access verified!\n\n` +
          `You have an active subscription to this service — no payment needed.\n\n` +
          `⚠️ Note: The service endpoint (${svc.endpoint}) is currently unreachable.\n` +
          `In production, the AI service would verify your subscription on-chain and deliver the response.\n\n` +
          `This demonstrates the subscription-based access flow:\n` +
          `1. ✅ Active subscription detected — payment skipped\n` +
          `2. ⚠️ Service endpoint call (would include X-Subscription-Address header)\n` +
          `3. → Service verifies subscription on-chain and delivers AI response`
      );
      setPhase("done");
      toast.success("Subscription verified!", {
        description: "Service endpoint unreachable, but subscription access is confirmed",
      });
    }
  };

  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-card border-white/10 text-text max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Try Service: {service.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2 overflow-y-auto flex-1 pr-1">
          {/* Service Info */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {service.category}
              </Badge>
              <span className="text-sm text-text-secondary">{shortenAddress(service.provider)}</span>
            </div>
            <div>
              {isSubscribed ? (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Subscribed — Free
                </Badge>
              ) : (
                <>
                  <span className="text-sm font-bold text-text">{formatToken(service.pricePerCall)} MON</span>
                  <span className="text-xs text-text-muted ml-1">/ call</span>
                </>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={phase !== "idle" && phase !== "done" && phase !== "error"}
              className="w-full h-20 px-3 py-2 rounded-md bg-background border border-white/10 text-text text-sm resize-none focus:outline-none focus:border-primary/50 disabled:opacity-50"
              placeholder="Enter your prompt..."
            />
          </div>

          {/* Action Button */}
          <Button
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
            onClick={handleTry}
            disabled={!address || (phase !== "idle" && phase !== "done" && phase !== "error")}
          >
            {phase === "idle" || phase === "done" || phase === "error" ? (
              <>
                <Send className="w-4 h-4 mr-2" />
                {phase === "done" || phase === "error"
                  ? "Try Again"
                  : isSubscribed
                  ? "Call Service (Free)"
                  : `Pay ${formatToken(service.pricePerCall)} MON & Call`}
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {phase === "paying" ? "Confirm in Wallet..." : phase === "confirming" ? "Confirming Tx..." : "Calling Service..."}
              </>
            )}
          </Button>

          {/* Flow Steps */}
          {steps.length > 0 && (
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
              <h4 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">
                {isSubscribed ? "Subscription Access Flow" : "x402 Payment Flow"}
              </h4>
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          step.status === "success"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : step.status === "loading"
                            ? "bg-primary/20 text-primary"
                            : step.status === "error"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-white/5 text-text-muted"
                        }`}
                      >
                        {step.status === "loading" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : step.status === "success" ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : step.status === "error" ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          step.id
                        )}
                      </div>
                      {i < steps.length - 1 && <div className="w-px h-4 bg-white/10 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{step.label}</p>
                      {step.detail && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">{step.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tx Hash */}
          {txHash && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-xs text-text-muted shrink-0">Tx:</span>
              <code className="text-xs text-primary font-mono truncate flex-1">{txHash}</code>
              <button onClick={copyTxHash} className="p-1 hover:bg-white/10 rounded shrink-0">
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
              </button>
            </div>
          )}

          {/* AI Response */}
          {response && (
            <div className="rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between p-3 border-b border-white/5">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5" /> Service Response
                </h4>
                <div className="flex items-center gap-2">
                  {responseType === "image" && (
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                      <ImageIcon className="w-3 h-3 mr-1" /> Image
                    </Badge>
                  )}
                  {responseType === "code" && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                      <Code2 className="w-3 h-3 mr-1" /> {responseLang}
                    </Badge>
                  )}
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                    Success
                  </Badge>
                </div>
              </div>
              {responseType === "image" ? (
                <div className="p-4 space-y-3">
                  <div className="relative group/img rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      id="try-service-img"
                      src={response}
                      alt="AI Generated Image"
                      crossOrigin="anonymous"
                      className="w-full h-auto max-h-80 object-contain"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.crossOrigin) {
                          img.crossOrigin = "";
                          img.src = response;
                          return;
                        }
                        img.style.display = "none";
                        img.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="hidden flex-col items-center justify-center py-8 text-text-muted">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Failed to load image</p>
                      <p className="text-xs mt-1 break-all px-4">{response}</p>
                    </div>
                    <button
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                      title="Download Image"
                      onClick={() => {
                        const img = document.getElementById("try-service-img") as HTMLImageElement | null;
                        if (!img || !img.naturalWidth) {
                          window.open(response, "_blank");
                          return;
                        }
                        const canvas = document.createElement("canvas");
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext("2d");
                        if (!ctx) {
                          window.open(response, "_blank");
                          return;
                        }
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob((blob) => {
                          if (!blob) {
                            window.open(response, "_blank");
                            return;
                          }
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `ai-generated-${Date.now()}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }, "image/png");
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : responseType === "code" ? (
                <div className="relative">
                  <button
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-text-muted hover:text-text transition-colors cursor-pointer"
                    title="Copy code"
                    onClick={() => {
                      navigator.clipboard.writeText(response);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <div className="overflow-x-auto">
                    <pre className="p-4 pr-10 text-[13px] leading-relaxed font-mono whitespace-pre break-normal">
                      <code dangerouslySetInnerHTML={{ __html: highlightCode(response) }} />
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {response}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
