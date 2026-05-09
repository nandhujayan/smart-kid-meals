import { useState } from "react";
import { ChefHat, ShoppingBasket, ListChecks, Lightbulb, Bookmark, BookmarkCheck, ArrowLeft, Check, Clock, Play, RefreshCw, Zap, Sparkles } from "lucide-react";
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
  setIsLoading?: (loading: boolean) => void;
  onAuthRequired?: (action: string) => boolean;
}

export default function MealResult({ meal, onBack, lastForm, activeProfileName, onViewMeal, setIsLoading, onAuthRequired }: Props) {
  const [saved, setSaved] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [cookingMode, setCookingMode] = useState(false);
  const [alternatives, setAlternatives] = useState<Meal[]>(meal.alternatives || []);
  const [showAlts, setShowAlts] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = async () => {
    if (onAuthRequired && !onAuthRequired("save")) return;
    await saveMeal(meal, activeProfileName);
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

  const handleRegenerate = async () => {
    if (!lastForm || !onViewMeal) return;
    if (onAuthRequired && !onAuthRequired("generate")) return;
    
    setIsLoading?.(true);
    setIsRegenerating(true);
    try {
      const newMeal = await generateMeal(lastForm, [meal.id]);
      onViewMeal(newMeal);
    } catch (error) {
      toast.error("Failed to generate a new meal.");
    } finally {
      setIsRegenerating(false);
      setIsLoading?.(false);
    }
  };

  const handleShowAlternatives = () => {
    setShowAlts(!showAlts);
  };

  const handleSelectAlternative = async (altName: string) => {
    if (!lastForm || !onViewMeal) return;
    if (onAuthRequired && !onAuthRequired("generate")) return;

    setIsLoading?.(true);
    setIsRegenerating(true);
    try {
      // Pass altName as a preferred meal name hint, keeping mealType intact
      const specificForm = { ...lastForm, preferredMealName: altName };
      const newMeal = await generateMeal(specificForm, [meal.id]);
      onViewMeal(newMeal);
      setShowAlts(false);
    } catch (error) {
      toast.error("Failed to load alternative meal.");
    } finally {
      setIsLoading?.(false);
      setIsRegenerating(false);
    }
  };

  if (cookingMode) {
    return <CookingMode meal={meal} onClose={() => setCookingMode(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors btn-press">
          <ArrowLeft size={18} /> Back
        </button>
        {meal.isAI && (
          <span className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary animate-pulse">
            <Sparkles size={10} /> AI Generated
          </span>
        )}
      </div>

      {/* Meal name card */}
      <div className="animate-slide-up rounded-3xl bg-peach-light p-6 text-center shadow-md">
        <div className="mb-3 flex justify-center">
          <ChefHat className="text-peach" size={42} />
        </div>
        <h2 className="text-2xl font-black text-foreground tracking-tight">{meal.mealName}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-muted-foreground leading-relaxed">
          {meal.description}
        </p>
        <div className="mt-4 flex items-center justify-center flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
            {meal.mealType}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-4 py-1.5 text-xs font-bold text-sky-foreground">
            {meal.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-4 py-1.5 text-xs font-bold text-muted-foreground">
            <Clock size={12} /> {meal.cookingTime}
          </span>
          {meal.costRank && (
            <span className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-black shadow-sm ${
              meal.costRank === 'Budget' ? 'bg-emerald-100 text-emerald-700' :
              meal.costRank === 'Premium' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {meal.costRank === 'Budget' ? '$' : meal.costRank === 'Premium' ? '$$$' : '$$'} {meal.costRank}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons & Alternatives */}
      <div className="max-w-2xl mx-auto w-full space-y-4">
        {lastForm && onViewMeal && (
          <div className="animate-slide-up-delay-1 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 rounded-3xl border-none shadow-sm flex flex-col items-center gap-1 hover:bg-muted/50 transition-all font-extrabold text-foreground"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={`h-5 w-5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="text-[11px] uppercase tracking-tighter">Suggest Another</span>
            </Button>
            <Button
              variant={showAlts ? "secondary" : "outline"}
              className={`h-auto py-4 rounded-3xl border-none shadow-sm flex flex-col items-center gap-1 transition-all font-extrabold text-foreground ${showAlts ? 'bg-primary/20 text-primary' : ''}`}
              onClick={handleShowAlternatives}
            >
              <Zap className={`h-5 w-5 ${showAlts ? "text-primary fill-primary/20" : ""}`} />
              <span className="text-[11px] uppercase tracking-tighter">Quick Alternatives</span>
            </Button>
          </div>
        )}

        {/* Alternative cards */}
        {showAlts && (
          <div className="animate-slide-up space-y-4 rounded-3xl bg-muted/30 p-5">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Try Something Else</p>
            </div>
            <div className="grid gap-3">
              {(alternatives || []).map((alt, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectAlternative(alt.mealName)}
                  className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer btn-press"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10 group-hover:bg-sky/20 transition-colors">
                    <ChefHat className="text-sky" size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-foreground">{alt.mealName}</p>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">{alt.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="animate-slide-up-delay-1">
            <NutritionCard nutrition={meal.nutrition} />
          </div>

          <Section icon={<ShoppingBasket className="text-sage" size={22} />} title="Ingredients" delay="2">
            <ul className="space-y-3">
              {(meal.ingredients || []).map((item, i) => {
                const isString = typeof item === 'string';
                const name = isString ? item : item.name;
                const quantity = isString ? '' : item.quantity;
                
                if (!name && !quantity) return null; // Skip truly empty items
                
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sage" />
                    <div className="flex flex-col">
                      {quantity && <span className="font-extrabold text-sage-foreground leading-none mb-0.5">{quantity}</span>}
                      <span className="text-foreground/90 font-medium">{name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section icon={<Lightbulb className="text-accent-foreground" size={22} />} title="Cooking Tips" delay="3">
            <ul className="space-y-3">
              {(meal.tips || []).map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm bg-accent/20 p-3 rounded-xl leading-relaxed font-semibold text-accent-foreground">
                  <span className="shrink-0">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Section>

          {meal.insight && (
            <div className="animate-slide-up-delay-3 rounded-2xl bg-primary/5 border border-primary/10 p-5 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-primary" size={20} />
                <h4 className="text-sm font-black uppercase tracking-wider text-primary">Smart Insight</h4>
              </div>
              <p className="text-sm font-bold text-foreground/80 leading-relaxed italic">
                "{meal.insight}"
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="animate-slide-up-delay-1">
            <Button
              variant="generate"
              size="lg"
              className="w-full rounded-2xl h-14 text-base font-black shadow-lg shadow-primary/20"
              onClick={() => setCookingMode(true)}
            >
              <Play size={22} /> Start Cooking Mode
            </Button>
          </div>

          {meal.kidActivity && (
            <div className="animate-slide-up-delay-1 overflow-hidden rounded-2xl border-2 border-dashed border-peach/30 bg-peach-light/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-peach rounded-lg p-2 text-white">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-peach/80">Mini Chef Opportunity</h4>
                  <p className="text-sm font-extrabold text-foreground">Let's Cook Together!</p>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-foreground/70 leading-relaxed bg-white/50 p-3 rounded-xl border border-peach/10">
                <strong className="text-peach">Your child can:</strong> {meal.kidActivity}
              </p>
            </div>
          )}

          <Section icon={<ListChecks className="text-sky-foreground" size={22} />} title="Step-by-Step Guide" delay="2">
            <ol className="space-y-3">
              {(meal.steps || []).map((step, i) => (
                <li
                  key={i}
                  onClick={() => toggleStep(i)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition-all btn-press ${
                    checkedSteps.has(i) 
                      ? "bg-secondary/40 shadow-sm" 
                      : "bg-muted/40 hover:bg-muted/60"
                  }`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                    checkedSteps.has(i) ? "bg-sage text-white scale-90" : "bg-primary/20 text-primary"
                  }`}>
                    {checkedSteps.has(i) ? <Check size={16} strokeWidth={4} /> : i + 1}
                  </span>
                  <span className={`text-[13px] font-semibold leading-relaxed ${checkedSteps.has(i) ? "line-through text-muted-foreground/60" : "text-foreground"}`}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <div className="animate-slide-up-delay-3">
            <GroceryListCard groceryList={meal.groceryList} />
          </div>
        </div>
      </div>

      {/* Save button - Large & Centered */}
      <div className="animate-slide-up-delay-4 pt-4 pb-10 flex justify-center">
        <Button
          variant={saved ? "secondary" : "save"}
          size="lg"
          className="w-full max-w-sm rounded-3xl h-16 text-base font-black shadow-xl"
          onClick={handleSave}
          disabled={saved}
        >
          {saved ? (
            <><BookmarkCheck size={24} /> Meal Saved</>
          ) : (
            <><Bookmark size={24} /> Save This Meal</>
          )}
        </Button>
      </div>
    </div>
  );
}

function Section({ icon, title, delay, children }: { icon: React.ReactNode; title: string; delay: string; children: React.ReactNode }) {
  return (
    <div className={`animate-slide-up-delay-${delay} rounded-2xl bg-card p-4 shadow-sm`}>
      <h3 className="mb-3 flex items-center gap-2 font-extrabold text-foreground">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
