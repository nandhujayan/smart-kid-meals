import React from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Info } from "lucide-react";
import { FREE_MEAL_LIMIT, PRO_MEAL_LIMIT } from "@/lib/meal-data";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  count: number;
  isPro: boolean;
  onUpgrade?: () => void;
}

export default function UsageProgress({ count, isPro, onUpgrade }: Props) {
  const limit = isPro ? PRO_MEAL_LIMIT : FREE_MEAL_LIMIT;
  const percentage = Math.min(100, (count / limit) * 100);
  const remaining = Math.max(0, limit - count);
  
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-3 p-4 rounded-3xl bg-muted/30 border border-muted-foreground/10 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isPro ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-600"}`}>
            <Sparkles size={14} className={isPro ? "fill-primary" : ""} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">
            AI Quota
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info size={14} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="bg-black text-white text-[10px] font-bold border-none rounded-xl">
              {isPro ? "Monthly limit for Pro users" : "Trial limit for Free users"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-black text-foreground tracking-tight">
            {count} <span className="text-muted-foreground font-bold">/ {limit} meals</span>
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {remaining} left
          </p>
        </div>
        <Progress 
          value={percentage} 
          className={`h-1.5 rounded-full ${isPro ? "bg-primary/10" : "bg-orange-100"}`}
        />
      </div>

      {percentage >= 100 ? (
        <p className="text-[10px] font-bold text-destructive animate-pulse">
          Limit reached! {isPro ? "Please wait until next cycle." : "Upgrade to continue."}
        </p>
      ) : isNearLimit && !isPro && (
        <button 
          onClick={onUpgrade}
          className="w-full text-center text-[10px] font-black text-primary hover:underline transition-all"
        >
          Running low? Get Unlimited →
        </button>
      )}
    </div>
  );
}
