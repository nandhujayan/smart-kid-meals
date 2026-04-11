import { useState } from "react";
import { CookingPot, Bookmark } from "lucide-react";
import MealForm from "@/components/MealForm";
import MealResult from "@/components/MealResult";
import SavedMeals from "@/components/SavedMeals";
import { generateMeal, type Meal, type MealForm as MealFormType } from "@/lib/meal-data";

type Tab = "generate" | "saved";
type View = "form" | "result";

export default function Index() {
  const [tab, setTab] = useState<Tab>("generate");
  const [view, setView] = useState<View>("form");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = (form: MealFormType) => {
    setIsLoading(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const result = generateMeal(form);
      setMeal(result);
      setView("result");
      setIsLoading(false);
    }, 1200);
  };

  const handleBack = () => setView("form");
  const handleSelectSaved = (m: Meal) => {
    setMeal(m);
    setView("result");
    setTab("generate");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {/* Header */}
      <header className="animate-slide-up sticky top-0 z-10 bg-background/80 backdrop-blur-md px-5 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-light">
            <CookingPot className="text-peach" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-foreground">Smart Kids Meal AI</h1>
            <p className="text-xs text-muted-foreground">Healthy meals made easy ✨</p>
          </div>
        </div>

        {/* Tabs */}
        {view === "form" && (
          <div className="mt-4 flex gap-2 rounded-2xl bg-muted p-1">
            <TabButton active={tab === "generate"} onClick={() => setTab("generate")} icon={<CookingPot size={16} />} label="Generate" />
            <TabButton active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark size={16} />} label="Saved" />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-8 pt-2">
        {view === "result" && meal ? (
          <MealResult meal={meal} onBack={handleBack} />
        ) : tab === "generate" ? (
          <MealForm onGenerate={handleGenerate} isLoading={isLoading} />
        ) : (
          <SavedMeals onSelect={handleSelectSaved} />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all btn-press ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}
