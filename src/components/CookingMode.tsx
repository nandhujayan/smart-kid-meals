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
  const total = meal.steps.length;
  const isLast = currentStep === total - 1;
  const progress = ((currentStep + 1) / total) * 100;

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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <ChefHat className="text-peach" size={22} />
          <span className="font-extrabold text-foreground">{meal.name}</span>
        </div>
        <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted btn-press">
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-5 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <p className="mt-3 text-center text-sm font-bold text-muted-foreground">
        Step {currentStep + 1} of {total}
      </p>

      {/* Step indicators */}
      <div className="mt-2 flex justify-center gap-1.5 px-8">
        {meal.steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentStep ? "w-6 bg-primary" : doneSteps.has(i) ? "w-2 bg-sage" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div key={currentStep} className="animate-slide-up text-center">
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
            doneSteps.has(currentStep) ? "bg-secondary" : "bg-peach-light"
          }`}>
            {doneSteps.has(currentStep) ? (
              <Check className="text-secondary-foreground" size={28} />
            ) : (
              <span className="text-2xl font-extrabold text-peach">{currentStep + 1}</span>
            )}
          </div>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            {meal.steps[currentStep]}
          </p>
        </div>
      </div>

      {/* Read aloud */}
      <div className="flex justify-center pb-2">
        <button
          onClick={handleReadAloud}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted btn-press"
        >
          <Volume2 size={16} /> Read Aloud
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 px-5 pb-8">
        <Button
          variant="outline"
          size="lg"
          className="rounded-2xl"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
        </Button>

        <Button
          variant={doneSteps.has(currentStep) ? "secondary" : "outline"}
          size="lg"
          className="rounded-2xl"
          onClick={markDone}
        >
          <Check size={18} /> {doneSteps.has(currentStep) ? "Done" : "Mark Done"}
        </Button>

        {isLast ? (
          <Button
            variant="generate"
            size="lg"
            className="flex-1 rounded-2xl"
            onClick={onClose}
          >
            <Check size={20} />
            Finish!
          </Button>
        ) : (
          <Button
            variant="generate"
            size="lg"
            className="flex-1 rounded-2xl"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
            <ChevronRight size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
