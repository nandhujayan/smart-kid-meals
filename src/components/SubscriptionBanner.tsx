import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  daysLeft: number;
  onRenew: () => void;
}

export default function SubscriptionBanner({ daysLeft, onRenew }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-rose-500 p-5 text-white shadow-xl shadow-orange-500/20 animate-pulse-subtle">
      {/* Decorative background circles */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <Sparkles size={20} className="fill-white" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight">Subscription Ending Soon!</h4>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">
              Only {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining to renew
            </p>
          </div>
        </div>
        
        <Button 
          onClick={onRenew}
          variant="secondary" 
          size="sm" 
          className="w-full sm:w-auto h-9 rounded-xl bg-white text-orange-600 font-black text-[11px] hover:bg-orange-50 border-none shadow-lg transition-all btn-press"
        >
          RENEW NOW <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
