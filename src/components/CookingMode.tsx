import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Check, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/lib/meal-data";

interface Props {
  meal: Meal;
  onClose: () => void;
}

export default function CookingMode({ meal, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const total = meal.steps.length;
  const isLast = currentStep === total - 1;
  const progress = ((currentStep + 1) / total) * 100;

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

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center px-8">
        <div key={currentStep} className="animate-slide-up text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-peach-light">
            <span className="text-2xl font-extrabold text-peach">{currentStep + 1}</span>
          </div>
          <p className="text-lg font-bold leading-relaxed text-foreground">
            {meal.steps[currentStep]}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 px-5 pb-8">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 rounded-2xl"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={20} />
          Previous
        </Button>
        {isLast ? (
          <Button
            variant="generate"
            size="lg"
            className="flex-1 rounded-2xl"
            onClick={onClose}
          >
            <Check size={20} />
            Done!
          </Button>
        ) : (
          <Button
            variant="generate"
            size="lg"
            className="flex-1 rounded-2xl"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next Step
            <ChevronRight size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
