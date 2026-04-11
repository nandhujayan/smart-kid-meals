import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Check, ChefHat, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/lib/meal-data";
import { toast } from "sonner";

interface Props {
  meal: Meal;
  onClose: () => void;
}

export default function CookingMode({ meal, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const steps = meal.steps || [];
  const total = steps.length;
  const isLast = currentStep === total - 1;
  const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0;

  const markDone = () => {
    setDoneSteps(prev => {
      const next = new Set(prev);
      next.add(currentStep);
      return next;
    });
    toast.success(`Step ${currentStep + 1} done! ✅`);
    if (!isLast) setCurrentStep(currentStep + 1);
  };

  const handleReadAloud = () => {
    toast.info("🔊 Read aloud feature coming soon!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm sm:p-6 md:p-12">
      <div className="flex h-full w-full flex-col bg-background shadow-2xl transition-all sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:border border-border overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-peach-light">
              <ChefHat className="text-peach" size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-foreground">{meal.mealName}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Cooking Mode</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors btn-press"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10">
          {/* Progress Section */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progress</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Step {currentStep + 1} / {total}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_15px_rgba(255,138,101,0.4)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Step Dots */}
            <div className="flex justify-center gap-1.5 pt-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? "w-6 bg-primary" : doneSteps.has(i) ? "w-1.5 bg-green-400" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Instruction */}
          <div key={currentStep} className="animate-slide-up flex flex-col items-center text-center space-y-6">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner transition-all duration-500 ${
              doneSteps.has(currentStep) ? "bg-green-100 rotate-[360deg]" : "bg-peach-light"
            }`}>
              {doneSteps.has(currentStep) ? (
                <Check className="text-green-600" size={32} />
              ) : (
                <span className="text-2xl font-black text-peach">{currentStep + 1}</span>
              )}
            </div>
            <p className="text-lg sm:text-2xl font-bold leading-tight text-foreground balance-text">
              {steps[currentStep] || "No instructions provided."}
            </p>
            
            <button
              onClick={handleReadAloud}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-muted-foreground hover:bg-muted bg-muted/20 transition-all btn-press"
            >
              <Volume2 size={14} /> Read Aloud
            </button>
          </div>
        </div>

        {/* Navigation Bar - Sticky at Bottom */}
        <div className="border-t bg-card/50 px-4 py-4 pb-safe sm:px-6 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl border-2 hover:bg-muted btn-press"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={20} />
            </Button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant={doneSteps.has(currentStep) ? "secondary" : "outline"}
                className={`h-12 flex-1 min-w-0 rounded-xl border-2 font-black text-xs transition-all btn-press ${
                  doneSteps.has(currentStep) ? "bg-green-100 border-green-200 text-green-700 hover:bg-green-200" : "hover:bg-muted"
                }`}
                onClick={markDone}
              >
                <div className="flex items-center justify-center gap-1.5 truncate">
                  <Check size={16} className="shrink-0" />
                  <span className="truncate">{doneSteps.has(currentStep) ? "Done" : "Mark Done"}</span>
                </div>
              </Button>

              {isLast ? (
                <Button
                  variant="generate"
                  className="h-12 flex-1 min-w-0 rounded-xl font-black text-xs shadow-lg shadow-primary/20 transition-all btn-press"
                  onClick={onClose}
                >
                  <div className="flex items-center justify-center gap-1.5 truncate">
                    <Check size={16} className="shrink-0" />
                    <span className="truncate">Finish</span>
                  </div>
                </Button>
              ) : (
                <Button
                  variant="generate"
                  className="h-12 flex-1 min-w-0 rounded-xl font-black text-xs shadow-lg shadow-primary/20 transition-all btn-press"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  <div className="flex items-center justify-center gap-1.5 truncate">
                    <span className="truncate">Next</span>
                    <ChevronRight size={16} className="shrink-0" />
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
