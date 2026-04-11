import { Trash2, ChefHat, BookmarkX, Play, User } from "lucide-react";
import type { Meal } from "@/lib/meal-data";
import { getSavedMeals, removeSavedMeal } from "@/lib/meal-data";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  onSelect: (meal: Meal) => void;
}

export default function SavedMeals({ onSelect }: Props) {
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    const fetchMeals = async () => {
      const data = await getSavedMeals();
      setMeals(data);
    };
    fetchMeals();
  }, []);

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeSavedMeal(id);
    const updated = await getSavedMeals();
    setMeals(updated);
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
          className={`animate-slide-up-delay-${Math.min(i + 1, 4)} rounded-2xl bg-card p-4 shadow-sm border border-border transition-all hover:shadow-md`}
        >
          <div className="flex items-center gap-3 cursor-pointer btn-press" onClick={() => onSelect(meal)}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-peach-light">
              <ChefHat className="text-peach" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-foreground">{meal.mealName}</p>
              <p className="text-xs text-muted-foreground">
                {meal.mealType} · {meal.savedAt}
                {meal.childProfileName && (
                  <span className="inline-flex items-center gap-0.5 ml-1">
                    <User size={10} /> {meal.childProfileName}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={(e) => handleRemove(meal.id, e)}
              className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl text-xs"
              onClick={() => onSelect(meal)}
            >
              <Play size={14} /> Cook Again
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
