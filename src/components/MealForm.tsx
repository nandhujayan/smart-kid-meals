import { useState } from "react";
import { Baby, Leaf, AlertTriangle, Target, UtensilsCrossed, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [form, setForm] = useState<MealFormType>({
    childAge: activeProfile?.age || "3-5 years",
    diet: activeProfile?.diet || "Regular",
    allergies: activeProfile?.allergies || "",
    goal: activeProfile?.goal || "Balanced nutrition",
    mealType: "Breakfast",
  });

  const update = (key: keyof MealFormType, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
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
      </FormField>

      <FormField icon={<AlertTriangle className="text-accent-foreground" size={20} />} label="Allergies" delay="2">
        <input
          type="text"
          placeholder="e.g. nuts, dairy, eggs (leave empty if none)"
          value={form.allergies}
          onChange={e => update("allergies", e.target.value)}
          className="w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
        />
      </FormField>

      <FormField icon={<Target className="text-lavender-foreground" size={20} />} label="Nutrition Goal" delay="3">
        <ChipSelect options={goalOptions} value={form.goal} onChange={v => update("goal", v)} />
      </FormField>

      {!weeklyMode && (
        <FormField icon={<UtensilsCrossed className="text-peach" size={20} />} label="Meal Type" delay="3">
          <ChipSelect options={mealTypes} value={form.mealType} onChange={v => update("mealType", v)} />
        </FormField>
      )}

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
    </div>
  );
}
