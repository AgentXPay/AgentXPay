"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import Header from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Zap, Globe, Image, Music, Code, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { useServices, useSubscriptionPlans, type Service, type SubscriptionPlan } from "@/hooks/useServices";
import { useRegisterService } from "@/hooks/useRegisterService";
import { useAddSubscriptionPlan } from "@/hooks/useAddSubscriptionPlan";
import { useSubscribe } from "@/hooks/useSubscribe";
import { subscriptionManagerContract } from "@/constants/contracts";
import { formatToken, shortenAddress } from "@/lib/utils";
import TryServiceDialog from "@/components/TryServiceDialog";
import { formatEther } from "viem";

interface PlanFormData {
  name: string;
  price: string;
}

const PLAN_DURATION_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

type RegisterStep = "form" | "registering" | "plans" | "adding-plan" | "done";

const categoryIcons: Record<string, any> = { LLM: Zap, Image: Image, Audio: Music, Code: Code, all: Globe };

const categories = ["all", "LLM", "Image", "Audio", "Code"];

export default function ServicesPage() {
  const { address } = useAccount();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [formData, setFormData] = useState({
    name: "", description: "", endpoint: "", category: "LLM", pricePerCall: "0.01",
  });
  const [plansList, setPlansList] = useState<PlanFormData[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  const [tryService, setTryService] = useState<Service | null>(null);
  const [tryOpen, setTryOpen] = useState(false);
  const [subscribingServiceId, setSubscribingServiceId] = useState<bigint | null>(null);
  const [subscribeDialogService, setSubscribeDialogService] = useState<Service | null>(null);

  const { services, isLoading, refetch } = useServices();
  const {
    registerService, isPending: isRegistering, isConfirming: isRegConfirming,
    isSuccess: isRegSuccess, reset: resetReg, registeredServiceId,
  } = useRegisterService();
  const {
    addPlan, isPending: isPlanPending, isConfirming: isPlanConfirming,
    isSuccess: isPlanSuccess, reset: resetPlan,
  } = useAddSubscriptionPlan();
  const { subscribe: rawSubscribe, isPending: isSubscribing, isConfirming: isSubConfirming, isSuccess: isSubSuccess, reset: resetSub } = useSubscribe();

  // Batch check subscription status for all services
  const accessContracts = services.map((s) => ({
    ...subscriptionManagerContract,
    functionName: "checkAccess" as const,
    args: [address || "0x0000000000000000000000000000000000000000", s.id] as const,
  }));

  const { data: accessData } = useReadContracts({
    contracts: accessContracts,
    query: { enabled: services.length > 0 && !!address },
  });

  const subscribedServiceIds = new Set<string>(
    (accessData || [])
      .map((r, i) => (r.status === "success" && r.result === true ? services[i]?.id?.toString() : null))
      .filter((id): id is string => id !== null)
  );

  const { data: plansData } = useSubscriptionPlans(subscribeDialogService?.id);
  const plans: SubscriptionPlan[] = plansData
    ? (plansData as any[]).map((p: any) => ({
        planId: p.planId,
        serviceId: p.serviceId,
        price: p.price,
        duration: p.duration,
        name: p.name,
      }))
    : [];

  const handleTry = (service: Service) => {
    setTryService(service);
    setTryOpen(true);
  };

  const handleSubscribeClick = (service: Service) => {
    resetSub();
    setSubscribeDialogService(service);
  };

  const subscribe = (params: { serviceId: bigint; planId: bigint; price: bigint }) => {
    setSubscribingServiceId(params.serviceId);
    rawSubscribe(params);
  };

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    if (days >= 365) return `${Math.round(days / 365)} year(s)`;
    if (days >= 30) return `${Math.round(days / 30)} month(s)`;
    return `${Math.round(days)} day(s)`;
  };

  const filtered = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "all" || s.category.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCat && s.isActive;
  });

  const handleRegister = () => {
    if (!formData.name || !formData.endpoint || !formData.pricePerCall) return;
    setRegisterStep("registering");
    registerService(formData);
  };

  // After service registration succeeds, move to plans step
  useEffect(() => {
    if (isRegSuccess && registeredServiceId !== null && registerStep === "registering") {
      if (plansList.length > 0 && plansList.some(p => p.name && p.price)) {
        setRegisterStep("plans");
        setCurrentPlanIndex(0);
      } else {
        setRegisterStep("done");
      }
    }
  }, [isRegSuccess, registeredServiceId, registerStep, plansList]);

  // When in plans step, add plans one by one
  useEffect(() => {
    if (registerStep === "plans" && registeredServiceId !== null && currentPlanIndex < plansList.length) {
      const plan = plansList[currentPlanIndex];
      if (plan.name && plan.price && PLAN_DURATION_DAYS[plan.name]) {
        resetPlan();
        setRegisterStep("adding-plan");
        addPlan({
          serviceId: registeredServiceId,
          name: plan.name,
          price: plan.price,
          duration: BigInt(PLAN_DURATION_DAYS[plan.name] * 86400),
        });
      } else {
        // Skip invalid plan
        if (currentPlanIndex + 1 < plansList.length) {
          setCurrentPlanIndex(currentPlanIndex + 1);
        } else {
          setRegisterStep("done");
        }
      }
    }
  }, [registerStep, registeredServiceId, currentPlanIndex, plansList]);

  // After a plan is added, move to next plan or finish
  useEffect(() => {
    if (isPlanSuccess && registerStep === "adding-plan") {
      const nextIndex = currentPlanIndex + 1;
      if (nextIndex < plansList.length) {
        setCurrentPlanIndex(nextIndex);
        setRegisterStep("plans");
      } else {
        setRegisterStep("done");
      }
    }
  }, [isPlanSuccess, registerStep, currentPlanIndex, plansList]);

  // When done, close dialog after delay
  useEffect(() => {
    if (registerStep === "done" && registerOpen) {
      const timer = setTimeout(() => {
        setRegisterOpen(false);
        resetReg();
        resetPlan();
        refetch();
        setFormData({ name: "", description: "", endpoint: "", category: "LLM", pricePerCall: "0.01" });
        setPlansList([]);
        setRegisterStep("form");
        setCurrentPlanIndex(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [registerStep, registerOpen, resetReg, resetPlan, refetch]);

  const addPlanRow = () => {
    setPlansList([...plansList, { name: "", price: "" }]);
  };

  const removePlanRow = (index: number) => {
    setPlansList(plansList.filter((_, i) => i !== index));
  };

  const updatePlanRow = (index: number, field: keyof PlanFormData, value: string) => {
    const updated = [...plansList];
    updated[index] = { ...updated[index], [field]: value };
    setPlansList(updated);
  };

  const handleRegisterDialogClose = (open: boolean) => {
    if (!open && registerStep !== "form" && registerStep !== "done") {
      return; // Don't allow closing while in progress
    }
    setRegisterOpen(open);
    if (!open) {
      setRegisterStep("form");
      resetReg();
      resetPlan();
    }
  };

  return (
    <div>
      <Header title="Service Marketplace" subtitle="Discover and subscribe to AI services" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background-secondary border-white/10 text-text placeholder:text-text-muted"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 bg-background-secondary border-white/10 text-text">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background-card border-white/10">
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-text hover:bg-white/5">
                {c === "all" ? "All Categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={registerOpen} onOpenChange={handleRegisterDialogClose}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Register Service
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background-card border-white/10 text-text max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Service</DialogTitle>
            </DialogHeader>

            {registerStep === "done" ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="text-lg font-semibold text-text">Service Registered!</p>
                <p className="text-sm text-text-muted">
                  {plansList.filter(p => p.name && p.price).length > 0
                    ? `${plansList.filter(p => p.name && p.price).length} subscription plan(s) added.`
                    : "No subscription plans added."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {/* Service Info */}
                <Input
                  placeholder="Service Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-background-secondary border-white/10 text-text"
                  disabled={registerStep !== "form"}
                />
                <Input
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background-secondary border-white/10 text-text"
                  disabled={registerStep !== "form"}
                />
                <Input
                  placeholder="Endpoint URL (e.g. http://localhost:3001/api/chat)"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="bg-background-secondary border-white/10 text-text"
                  disabled={registerStep !== "form"}
                />
                <div className="flex gap-3">
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                    disabled={registerStep !== "form"}
                  >
                    <SelectTrigger className="w-32 bg-background-secondary border-white/10 text-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background-card border-white/10">
                      {["LLM", "Image", "Audio", "Code"].map((c) => (
                        <SelectItem key={c} value={c} className="text-text hover:bg-white/5">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Price per call (MON)"
                    value={formData.pricePerCall}
                    onChange={(e) => setFormData({ ...formData, pricePerCall: e.target.value })}
                    className="bg-background-secondary border-white/10 text-text"
                    disabled={registerStep !== "form"}
                  />
                </div>

                {/* Subscription Plans Section */}
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-text">Subscription Plans</h4>
                    {registerStep === "form" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={addPlanRow}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Plan
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-3">
                    Add subscription plans so users can subscribe to your service. (Optional)
                  </p>
                  <div className="space-y-3">
                    {plansList.map((plan, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2 items-center p-3 rounded-lg border transition-all ${
                          registerStep === "adding-plan" && idx === currentPlanIndex
                            ? "border-primary/50 bg-primary/5"
                            : registerStep !== "form" && idx < currentPlanIndex
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-white/5 bg-background-secondary/50"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex gap-2 items-center">
                            <Select
                              value={plan.name}
                              onValueChange={(v) => updatePlanRow(idx, "name", v)}
                              disabled={registerStep !== "form"}
                            >
                              <SelectTrigger className="w-32 bg-background-secondary border-white/10 text-text text-xs h-8">
                                <SelectValue placeholder="Plan type" />
                              </SelectTrigger>
                              <SelectContent className="bg-background-card border-white/10">
                                {["weekly", "monthly", "quarterly", "yearly"].map((t) => (
                                  <SelectItem key={t} value={t} className="text-text hover:bg-white/5 text-xs capitalize">{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Price (MON)"
                              value={plan.price}
                              onChange={(e) => updatePlanRow(idx, "price", e.target.value)}
                              className="bg-background-secondary border-white/10 text-text text-xs h-8"
                              disabled={registerStep !== "form"}
                            />
                            {plan.name && PLAN_DURATION_DAYS[plan.name] && (
                              <span className="text-xs text-text-muted whitespace-nowrap">{PLAN_DURATION_DAYS[plan.name]}d</span>
                            )}
                          </div>
                        </div>
                        {registerStep === "form" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-text-muted hover:text-red-400 h-8 w-8 p-0 shrink-0"
                            onClick={() => removePlanRow(idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {registerStep !== "form" && idx < currentPlanIndex && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        )}
                        {registerStep === "adding-plan" && idx === currentPlanIndex && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleRegister}
                  disabled={registerStep !== "form" || isRegistering || isRegConfirming}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {registerStep === "registering" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isRegConfirming ? "Confirming Service..." : "Registering Service..."}</>
                  ) : registerStep === "plans" || registerStep === "adding-plan" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding Plan {currentPlanIndex + 1}/{plansList.length}...</>
                  ) : (
                    <>Register Service{plansList.filter(p => p.name && p.price).length > 0 ? ` + ${plansList.filter(p => p.name && p.price).length} Plan(s)` : ""}</>
                  )}
                </Button>

                {/* Progress indicator */}
                {registerStep !== "form" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      {isRegSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      )}
                      <span className={isRegSuccess ? "text-green-400" : "text-text-muted"}>
                        Register service {isRegSuccess ? "✓" : "..."}
                      </span>
                    </div>
                    {plansList.filter(p => p.name && p.price).map((plan, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {registerStep !== "registering" && idx < currentPlanIndex ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : registerStep === "adding-plan" && idx === currentPlanIndex ? (
                          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                        )}
                        <span className={
                          registerStep !== "registering" && idx < currentPlanIndex
                            ? "text-green-400"
                            : registerStep === "adding-plan" && idx === currentPlanIndex
                            ? "text-text-muted"
                            : "text-text-muted/50"
                        }>
                          Add &quot;{plan.name}&quot; plan {registerStep !== "registering" && idx < currentPlanIndex ? "✓" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-text-secondary">Loading services from chain...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const Icon = categoryIcons[s.category] || Globe;
            const isSubscribed = subscribedServiceIds.has(s.id.toString());
            return (
              <Card key={Number(s.id)} className="p-5 bg-background-secondary border-white/5 hover:border-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    {s.category}
                  </Badge>
                  <span className="text-xs text-text-muted">ID: {Number(s.id)}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text group-hover:text-primary transition">{s.name}</h3>
                    <p className="text-xs text-text-muted">{shortenAddress(s.provider)}</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-4 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-text">{formatToken(s.pricePerCall)}</span>
                    <span className="text-xs text-text-muted ml-1">MON / call</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-white/10 hover:bg-white/5"
                      disabled={!address}
                      onClick={() => handleTry(s)}
                    >
                      Try
                    </Button>
                    <Button
                      size="sm"
                      className={`text-xs ${isSubscribed ? "bg-green-600 hover:bg-green-600 cursor-default" : "bg-primary hover:bg-primary/90"}`}
                      disabled={isSubscribed || ((isSubscribing || isSubConfirming) && subscribingServiceId === s.id) || !address}
                      onClick={() => !isSubscribed && handleSubscribeClick(s)}
                    >
                      {(isSubscribing || isSubConfirming) && subscribingServiceId === s.id
                        ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />{isSubConfirming ? "Confirming..." : "Submitting..."}</>
                        : isSubscribed ? "Subscribed" : "Subscribe"}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-text-muted">Provider: {shortenAddress(s.provider)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">
            {services.length === 0 ? "No services registered yet. Be the first to register!" : "No services found matching your criteria"}
          </p>
          <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => setRegisterOpen(true)}>
            Register a Service
          </Button>
        </div>
      )}

      <TryServiceDialog
        service={tryService}
        open={tryOpen}
        onOpenChange={setTryOpen}
        isSubscribed={tryService ? subscribedServiceIds.has(tryService.id.toString()) : false}
      />

      <Dialog open={!!subscribeDialogService} onOpenChange={(open) => { if (!open) setSubscribeDialogService(null); }}>
        <DialogContent className="bg-background-card border-white/10 text-text">
          <DialogHeader>
            <DialogTitle>Subscribe to {subscribeDialogService?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {plans.length === 0 ? (
              <p className="text-text-secondary text-sm">No subscription plans available for this service.</p>
            ) : (
              plans.map((plan) => (
                <Card
                  key={Number(plan.planId)}
                  className="p-4 bg-background-secondary border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => {
                    if (subscribeDialogService) {
                      subscribe({
                        serviceId: subscribeDialogService.id,
                        planId: plan.planId,
                        price: plan.price,
                      });
                      setSubscribeDialogService(null);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text capitalize">{plan.name}</h4>
                      <p className="text-xs text-text-muted mt-1">Duration: {formatDuration(plan.duration)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-text">{formatEther(plan.price)}</span>
                      <span className="text-xs text-text-muted ml-1">MON</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
