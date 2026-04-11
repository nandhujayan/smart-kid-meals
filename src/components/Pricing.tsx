import React from "react";
import { Check, Sparkles, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Pricing({ isOpen, onClose }: Props) {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying us out",
      features: [
        "Unlimited AI Generations (BETA)",
        "Save up to 2 Kids Profiles",
        "Common Ingredient Filters",
        "Mobile App Access"
      ],
      buttonText: "Current Plan",
      premium: false
    },
    {
      name: "Pro",
      price: "$4.99",
      period: "/month",
      description: "Best for busy families",
      features: [
        "Unlimited AI Generations",
        "Unlimited Kids Profiles",
        "Full Weekly Meal Planning",
        "Advanced Allergy Detection",
        "Priority AI Processing",
        "Smart Grocery Lists"
      ],
      buttonText: "Go Premium",
      premium: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-peach/5 via-background to-sage/5 p-8">
          <DialogHeader className="mb-8 text-center">
            <DialogTitle className="text-3xl font-black">Choose Your Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Unlock the full potential of AI-powered healthy eating.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`flex flex-col rounded-3xl p-6 border-2 transition-all ${
                  plan.premium 
                    ? "border-primary bg-primary/5 shadow-xl scale-105" 
                    : "border-border bg-card"
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {plan.name}
                    {plan.premium && <Sparkles size={18} className="text-primary fill-primary/20" />}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground text-sm font-bold">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-xs font-semibold">
                      <div className={`mt-0.5 rounded-full p-0.5 ${plan.premium ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className={`w-full rounded-2xl py-6 font-bold shadow-md ${
                    plan.premium ? "bg-primary hover:bg-primary/90" : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                  disabled={!plan.premium}
                >
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Cancel anytime · No hidden fees · 24/7 Support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
