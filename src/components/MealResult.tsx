import { useState } from "react";
import { ChefHat, ShoppingBasket, ListChecks, Lightbulb, Bookmark, BookmarkCheck, ArrowLeft, Check, Clock, Play, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Meal, MealForm as MealFormType } from "@/lib/meal-data";
import { saveMeal, generateMeal, generateAlternatives } from "@/lib/meal-data";
import { toast } from "sonner";
import GroceryListCard from "./GroceryListCard";
import CookingMode from "./CookingMode";
import NutritionCard from "./NutritionCard";

interface Props {
  meal: Meal;
  onBack: () => void;
  lastForm?: MealFormType | null;
  activeProfileName?: string;
  onViewMeal?: (meal: Meal) => void;
}

export default function MealResult({ meal, onBack, lastForm, activeProfileName, onViewMeal }: Props) {
  const [saved, setSaved] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [cookingMode, setCookingMode] = useState(false);
  const [alternatives, setAlternatives] = useState<Meal[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = () => {
    saveMeal(meal, activeProfileName);
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

  const handleRegenerate = () => {
    if (!lastForm || !onViewMeal) return;
    setIsRegenerating(true);
    setTimeout(() => {
      const newMeal = generateMeal(lastForm, [meal.id]);
      onViewMeal(newMeal);
      setIsRegenerating(false);
    }, 800);
  };

  const handleShowAlternatives = () => {
    if (!lastForm) return;
    const alts = generateAlternatives(lastForm, meal.id);
    setAlternatives(alts);
  };

  if (cookingMode) {
    return <CookingMode meal={meal} onClose={() => setCookingMode(false)} />;
  }

  return (
    <div className="space-y-5">
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
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {meal.mealType}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            <Clock size={12} /> {meal.cookingTime}
          </span>
        </div>
      </div>

      {/* Regenerate & alternatives */}
      {lastForm && onViewMeal && (
        <div className="animate-slide-up-delay-1 flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-2xl border-2"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Generating...
              </span>
            ) : (
              <>
                <RefreshCw size={18} /> Suggest Another
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-2xl border-2"
            onClick={handleShowAlternatives}
          >
            <Zap size={18} /> Quick Alternatives
          </Button>
        </div>
      )}

      {/* Alternative cards */}
      {alternatives.length > 0 && (
        <div className="animate-slide-up space-y-2">
          <p className="text-xs font-bold text-muted-foreground">⚡ Quick Alternatives</p>
          {alternatives.map(alt => (
            <div
              key={alt.id}
              onClick={() => onViewMeal?.(alt)}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 border border-border hover:shadow-md transition-all btn-press"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky">
                <ChefHat className="text-sky-foreground" size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{alt.name}</p>
                <p className="text-xs text-muted-foreground">{alt.cookingTime} · {alt.nutrition.calories} kcal</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cooking mode button */}
      <div className="animate-slide-up-delay-1">
        <Button
          variant="generate"
          size="lg"
          className="w-full rounded-2xl"
          onClick={() => setCookingMode(true)}
        >
          <Play size={20} /> Start Cooking Mode
        </Button>
      </div>

      {/* Nutrition */}
      <div className="animate-slide-up-delay-1">
        <NutritionCard nutrition={meal.nutrition} />
      </div>

      {/* Ingredients */}
      <Section icon={<ShoppingBasket className="text-sage" size={22} />} title="Ingredients" delay="2">
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

      {/* Grocery list */}
      <div className="animate-slide-up-delay-3">
        <GroceryListCard groceryList={meal.groceryList} />
      </div>

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
