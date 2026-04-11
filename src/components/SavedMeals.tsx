import { Trash2, ChefHat, BookmarkX } from "lucide-react";
import type { Meal } from "@/lib/meal-data";
import { getSavedMeals, removeSavedMeal } from "@/lib/meal-data";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onSelect: (meal: Meal) => void;
}

export default function SavedMeals({ onSelect }: Props) {
  const [meals, setMeals] = useState<Meal[]>(getSavedMeals());

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedMeal(id);
    setMeals(getSavedMeals());
    toast.info("Meal removed");
  };

  if (meals.length === 0) {
    return (
      <div className="animate-slide-up flex flex-col items-center gap-3 py-12 text-center">
        <BookmarkX className="text-muted-foreground" size={40} />
        <p className="font-bold text-muted-foreground">No saved meals yet</p>
        <p className="text-sm text-muted-foreground/70">Generate a meal and save it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {meals.map((meal, i) => (
        <div
          key={meal.id + i}
          onClick={() => onSelect(meal)}
          className={`animate-slide-up-delay-${Math.min(i + 1, 4)} flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-4 shadow-sm border border-border transition-all hover:shadow-md btn-press`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-peach-light">
            <ChefHat className="text-peach" size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-foreground">{meal.name}</p>
            <p className="text-xs text-muted-foreground">{meal.mealType} · {meal.savedAt}</p>
          </div>
          <button
            onClick={(e) => handleRemove(meal.id, e)}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
