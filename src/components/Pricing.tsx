import React, { useState } from "react";
import { Check, X, Sparkles, Monitor, Infinity, Zap, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Pricing({ isOpen, onClose }: Props) {
  const [activePlan, setActivePlan] = useState<"Starter" | "Unlimited">("Unlimited");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const features = [
    {
      title: "Smart AI Meals",
      desc: "Access AI generated meals",
      starter: "3 per month",
      unlimited: "50 per month",
      icon: <Zap size={18} />
    },
    {
      title: "Child Profiles",
      desc: "Track multiple children",
      starter: "Up to 2",
      unlimited: "Unlimited",
      icon: <Monitor size={18} />
    },
    {
      title: "Full Weekly Planning",
      desc: "Auto-generate 7 days of meals",
      starter: false,
      unlimited: true,
      icon: <Infinity size={18} />
    },
    {
      title: "Priority AI Processing",
      desc: "Faster meal generation",
      starter: false,
      unlimited: true,
      icon: <Clock size={18} />
    },
    {
      title: "Advanced Allergies",
      desc: "Deep ingredient filtering",
      starter: false,
      unlimited: true,
      icon: <ShieldCheck size={18} />
    }
  ];

  const handleSubscribe = () => {
    toast.info("Payment integration coming soon!", {
      description: "Contact us at hello@momskitchen.app to upgrade early.",
      duration: 5000,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[850px] rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-gradient-to-br from-orange-50 via-white to-orange-100/30">
        <div className="grid md:grid-cols-2 h-full">
          {/* Left Column: Info & Features */}
          <div className="p-8 md:p-10 bg-white/40">
            {/* Header */}
            <div className="mb-8">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-600/80 mb-2">Special Offer</p>
              <h2 className="text-4xl font-black text-foreground mb-3 tracking-tight">Go Unlimited</h2>
              <p className="text-sm font-semibold text-muted-foreground leading-relaxed">Supercharge your family's health and<br className="hidden md:block" /> simplify mealtime forever!</p>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between bg-black/5 rounded-2xl p-1.5 mb-8 max-w-[320px]">
              <div className="flex w-full gap-1">
                <button 
                  onClick={() => setActivePlan("Starter")}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlan === "Starter" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Starter
                </button>
                <button 
                  onClick={() => setActivePlan("Unlimited")}
                  className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlan === "Unlimited" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Unlimited
                </button>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-5">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center justify-between gap-4 group">
                  <div className="flex gap-3">
                    <div className="mt-1 text-orange-500 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-foreground">{feature.title}</h4>
                      <p className="text-[11px] font-medium text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center shrink-0">
                    {activePlan === "Starter" ? (
                      typeof feature.starter === "string" ? (
                        <span className="text-[10px] font-black text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">{feature.starter}</span>
                      ) : feature.starter ? (
                        <div className="bg-orange-500 rounded-full p-1 text-white shadow-sm"><Check size={12} strokeWidth={4} /></div>
                      ) : (
                        <div className="bg-black/5 rounded-full p-1 text-muted-foreground/30"><X size={12} strokeWidth={3} /></div>
                      )
                    ) : (
                      typeof feature.unlimited === "string" ? (
                        <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-lg">{feature.unlimited}</span>
                      ) : feature.unlimited ? (
                        <div className="bg-orange-500 rounded-full p-1 text-white shadow-md shadow-orange-500/20"><Check size={12} strokeWidth={4} /></div>
                      ) : (
                        <div className="bg-black/5 rounded-full p-1 text-muted-foreground/30"><X size={12} strokeWidth={3} /></div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Pricing & CTA */}
          <div className="p-8 md:p-10 bg-orange-500/5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-orange-200/50">
            <div className={`transition-all duration-500 ${activePlan === "Unlimited" ? "opacity-100 scale-100" : "opacity-40 scale-95 pointer-events-none"}`}>
              <div className="flex justify-center mb-6">
                <div className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-orange-500/20 animate-pulse">
                  <Infinity size={14} /> Most Popular
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <button 
                  onClick={() => setBillingCycle("monthly")}
                  className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${billingCycle === "monthly" ? "bg-white border-orange-500 shadow-xl" : "bg-white/40 border-transparent hover:bg-white/60"}`}
                >
                  <div className="text-left">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">Monthly</span>
                    <span className="text-2xl font-black text-foreground">₹199</span>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${billingCycle === "monthly" ? "border-orange-500 bg-orange-500" : "border-muted-foreground/30"}`}>
                    {billingCycle === "monthly" && <Check size={14} className="text-white" strokeWidth={4} />}
                  </div>
                </button>

                <button 
                  onClick={() => setBillingCycle("yearly")}
                  className={`relative w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${billingCycle === "yearly" ? "bg-white border-orange-500 shadow-xl" : "bg-white/40 border-transparent hover:bg-white/60"}`}
                >
                  <div className="absolute -top-3 right-8 bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md">Best Value</div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">Yearly Plan</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-foreground">₹1790</span>
                      <span className="text-xs font-bold text-orange-600">Save 25%</span>
                    </div>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${billingCycle === "yearly" ? "border-orange-500 bg-orange-500" : "border-muted-foreground/30"}`}>
                    {billingCycle === "yearly" && <Check size={14} className="text-white" strokeWidth={4} />}
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                className={`w-full rounded-[2rem] py-8 flex flex-col items-center justify-center gap-1 shadow-2xl transition-all duration-300 btn-press ${activePlan === "Unlimited" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30" : "bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200"}`}
                onClick={activePlan === "Unlimited" ? handleSubscribe : onClose}
              >
                <span className="text-lg font-black tracking-tight">{activePlan === "Unlimited" ? "Unlock Unlimited Now" : "Continue with Starter"}</span>
                {activePlan === "Unlimited" && (
                  <span className="text-[11px] font-bold opacity-90 tracking-wide">Starting at only ₹149/month</span>
                )}
              </Button>
              
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={onClose}
                  className="text-xs font-bold text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  {activePlan === "Unlimited" ? "Maybe later, continue with Starter" : "Close and go back"}
                </button>
                <p className="text-[9px] font-semibold text-muted-foreground/50 text-center leading-relaxed max-w-[200px]">
                  Secure checkout. Cancel anytime.<br />Terms and Privacy apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
