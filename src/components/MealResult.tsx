import { useState } from "react";
import { ChefHat, ShoppingBasket, ListChecks, Lightbulb, Bookmark, BookmarkCheck, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal } from "@/lib/meal-data";
import { saveMeal } from "@/lib/meal-data";
import { toast } from "sonner";

interface Props {
  meal: Meal;
  onBack: () => void;
}

export default function MealResult({ meal, onBack }: Props) {
  const [saved, setSaved] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const handleSave = () => {
    saveMeal(meal);
    setSaved(true);
    toast.success("Meal saved! 🎉");
  };

  const toggleStep = (i: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors btn-press">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Meal name card */}
      <div className="animate-slide-up rounded-2xl bg-peach-light p-5 text-center shadow-sm">
        <div className="mb-2 flex justify-center">
          <ChefHat className="text-peach" size={36} />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">{meal.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{meal.description}</p>
        <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {meal.mealType}
        </span>
      </div>

      {/* Ingredients */}
      <Section icon={<ShoppingBasket className="text-sage" size={22} />} title="Ingredients" delay="1">
        <ul className="space-y-2">
          {meal.ingredients.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sage" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Steps */}
      <Section icon={<ListChecks className="text-sky-foreground" size={22} />} title="Step-by-Step Guide" delay="2">
        <ol className="space-y-3">
          {meal.steps.map((step, i) => (
            <li
              key={i}
              onClick={() => toggleStep(i)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all btn-press ${
                checkedSteps.has(i) ? "bg-secondary/60" : "bg-muted/40"
              }`}
            >
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                checkedSteps.has(i) ? "bg-sage text-sage-foreground" : "bg-primary/15 text-primary"
              }`}>
                {checkedSteps.has(i) ? <Check size={14} /> : i + 1}
              </span>
              <span className={`text-sm leading-relaxed ${checkedSteps.has(i) ? "line-through text-muted-foreground" : ""}`}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Tips */}
      <Section icon={<Lightbulb className="text-accent-foreground" size={22} />} title="Tips" delay="3">
        <ul className="space-y-2">
          {meal.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-accent-foreground">💡</span>
              {tip}
            </li>
          ))}
        </ul>
      </Section>

      {/* Save button */}
      <div className="animate-slide-up-delay-4 pt-1 pb-6">
        <Button
          variant={saved ? "secondary" : "save"}
          size="lg"
          className="w-full rounded-2xl"
          onClick={handleSave}
          disabled={saved}
        >
          {saved ? (
            <><BookmarkCheck size={20} /> Meal Saved</>
          ) : (
            <><Bookmark size={20} /> Save This Meal</>
          )}
        </Button>
      </div>
    </div>
  );
}

function Section({ icon, title, delay, children }: { icon: React.ReactNode; title: string; delay: string; children: React.ReactNode }) {
  return (
    <div className={`animate-slide-up-delay-${delay} rounded-2xl bg-card p-4 shadow-sm border border-border`}>
      <h3 className="mb-3 flex items-center gap-2 font-extrabold text-foreground">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
