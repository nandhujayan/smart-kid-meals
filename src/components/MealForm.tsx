import { useState, useEffect } from "react";
import { Baby, Leaf, AlertTriangle, Target, UtensilsCrossed, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagInput from "@/components/TagInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MealForm as MealFormType, ChildProfile } from "@/lib/meal-data";

interface Props {
  onGenerate: (form: MealFormType) => void;
  onGenerateWeekly: (form: MealFormType) => void;
  isLoading: boolean;
  activeProfile: ChildProfile | null;
  weeklyMode?: boolean;
}

const ageOptions = ["6-12 months", "1-2 years", "3-5 years", "6-10 years", "11+ years"];
const dietOptions = ["Regular", "Vegetarian", "Vegan", "Halal", "Gluten-Free"];
const goalOptions = ["Balanced nutrition", "Weight gain", "Picky eater friendly", "Brain boost", "Energy boost"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const cuisineOptions = ["Global", "Indian", "Chinese", "American", "Mexican", "Italian", "Mediterranean", "Japanese"];

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  delay: string;
}

function FormField({ icon, label, children, delay }: FieldProps) {
  return (
    <div className={`animate-slide-up-delay-${delay} space-y-2`}>
      <label className="flex items-center gap-2 text-sm font-bold text-foreground/80">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all btn-press ${
            value === opt
              ? "bg-primary text-primary-foreground shadow-md scale-105"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function MealForm({ onGenerate, onGenerateWeekly, isLoading, activeProfile, weeklyMode }: Props) {
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [form, setForm] = useState<MealFormType>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem("smartkids-meal-form-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          childAge: activeProfile?.age || parsed.childAge || "3-5 years",
          diet: activeProfile?.diet || parsed.diet || "Regular",
          allergies: activeProfile?.allergies || parsed.allergies || [],
        };
      } catch (e) { console.error("Error parsing saved form", e); }
    }
    
    return {
      childAge: activeProfile?.age || "3-5 years",
      diet: activeProfile?.diet || "Regular",
      allergies: activeProfile?.allergies || [],
      goal: activeProfile?.goal || "Balanced nutrition",
      mealType: "Breakfast",
      cuisine: "Global",
      availableIngredients: [],
      onlyAvailable: false,
    };
  });

  // Persist form changes
  useEffect(() => {
    localStorage.setItem("smartkids-meal-form-draft", JSON.stringify(form));
  }, [form]);

  // Sync form with activeProfile when it changes
  useEffect(() => {
    if (activeProfile) {
      setForm(prev => ({
        ...prev,
        childAge: activeProfile.age,
        diet: activeProfile.diet,
        allergies: activeProfile.allergies,
        goal: activeProfile.goal,
      }));
    }
  }, [activeProfile]);

  const update = (key: keyof MealFormType, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const allergyConflicts = (form.availableIngredients || []).filter(ing => 
    (form.allergies || []).some(all => 
      all.toLowerCase() === ing.toLowerCase() ||
      ing.toLowerCase().includes(all.toLowerCase())
    )
  );

  const nonVegKeywords = ["chicken", "meat", "beef", "pork", "fish", "shrimp", "prawn", "crab", "bacon", "turkey", "lamb", "steak", "ham", "salmon", "tuna"];
  const nonVeganKeywords = [...nonVegKeywords, "milk", "cheese", "egg", "butter", "dairy", "yogurt", "honey", "cream"];

  const dietConflicts = (form.availableIngredients || []).filter(ing => {
    const i = ing.toLowerCase();
    if (form.diet === "Vegetarian") {
      return nonVegKeywords.some(kw => i.includes(kw));
    }
    if (form.diet === "Vegan") {
      return nonVeganKeywords.some(kw => i.includes(kw));
    }
    return false;
  });

  const hasAnyConflict = allergyConflicts.length > 0 || dietConflicts.length > 0;

  const handleSubmit = () => {
    if (hasAnyConflict) {
      setShowConflictDialog(true);
      return;
    }
    proceedWithGeneration();
  };

  const proceedWithGeneration = () => {
    setShowConflictDialog(false);
    if (weeklyMode) {
      onGenerateWeekly(form);
    } else {
      onGenerate(form);
    }
  };

  return (
    <div className="space-y-5">
      <FormField icon={<Baby className="text-peach" size={20} />} label="Child's Age" delay="1">
        <ChipSelect options={ageOptions} value={form.childAge} onChange={v => update("childAge", v)} />
      </FormField>

      <FormField icon={<Leaf className="text-sage" size={20} />} label="Diet Preference" delay="1">
        <ChipSelect options={dietOptions} value={form.diet} onChange={v => update("diet", v)} />
        {dietConflicts.length > 0 && (
          <p className="animate-in fade-in slide-in-from-top-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md mt-1 flex items-center gap-1">
            <AlertTriangle size={12} />
            Conflicts with: {dietConflicts.join(", ")}
          </p>
        )}
      </FormField>

      <TagInput
        items={form.allergies || []}
        onChange={tags => update("allergies", tags)}
        icon={<AlertTriangle className="text-accent-foreground" size={20} />}
        label="Allergies (Tags)"
        placeholder="e.g. nuts, dairy, eggs"
        colorScheme="destructive"
        delay="2"
      />
      
      {allergyConflicts.length > 0 && (
        <p className="animate-in fade-in slide-in-from-top-1 text-xs font-bold text-destructive flex items-center gap-1.5 px-2 py-1 bg-destructive/5 rounded-lg border border-destructive/10">
          <AlertTriangle size={14} className="animate-pulse" /> 
          Allergy Alert: {allergyConflicts.join(", ")} found in ingredients!
        </p>
      )}

      {dietConflicts.length > 0 && (
        <p className="animate-in fade-in slide-in-from-top-1 text-xs font-bold text-orange-600 flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-lg border border-orange-100">
          <AlertTriangle size={14} className="animate-pulse" /> 
          Diet Mismatch: {dietConflicts.join(", ")} is not {form.diet}!
        </p>
      )}

      <FormField icon={<Target className="text-lavender-foreground" size={20} />} label="Nutrition Goal" delay="3">
        <ChipSelect options={goalOptions} value={form.goal} onChange={v => update("goal", v)} />
      </FormField>

      {!weeklyMode && (
        <FormField icon={<UtensilsCrossed className="text-peach" size={20} />} label="Meal Type" delay="3">
          <ChipSelect options={mealTypes} value={form.mealType} onChange={v => update("mealType", v)} />
        </FormField>
      )}

      <FormField icon={<Sparkles className="text-sky" size={20} />} label="Cuisine Style" delay="3">
        <ChipSelect options={cuisineOptions} value={form.cuisine || "Global"} onChange={v => update("cuisine", v)} />
      </FormField>

      <TagInput
        items={form.availableIngredients || []}
        onChange={tags => update("availableIngredients", tags)}
        icon={<UtensilsCrossed className="text-sage" size={20} />}
        label="Ingredients you have"
        placeholder="e.g. rice, chicken, broccoli"
        colorScheme="sage"
        conflictItems={allergyConflicts}
        delay="3"
      />

      <div className="animate-slide-up-delay-4 pt-2">
        <Button
          variant="generate"
          size="lg"
          className="w-full rounded-2xl"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Generating...
            </span>
          ) : weeklyMode ? (
            <>
              <Calendar size={22} />
              Generate Weekly Plan
            </>
          ) : (
            <>
              <Sparkles size={22} />
              Generate Meal
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="animate-pulse" />
              Allergy Conflict Found
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70">
              {allergyConflicts.length > 0 && (
                <p className="mb-2">One or more ingredients ({allergyConflicts.join(", ")}) match your child's <strong>allergies</strong>.</p>
              )}
              {dietConflicts.length > 0 && (
                <p>One or more ingredients ({dietConflicts.join(", ")}) are not compatible with your <strong>{form.diet}</strong> diet choice.</p>
              )}
              <p className="mt-4 font-bold text-foreground">Are you sure you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl border-sage/20 bg-sage/10 hover:bg-sage/20 text-sage-foreground">
              Go back & Edit
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={proceedWithGeneration}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
