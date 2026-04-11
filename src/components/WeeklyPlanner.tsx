import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, ShoppingCart, UtensilsCrossed, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DayPlan, Meal, GroceryList } from "@/lib/meal-data";
import { combineGroceryLists } from "@/lib/meal-data";
import GroceryListCard from "./GroceryListCard";

interface Props {
  plan: DayPlan[];
  onViewMeal: (meal: Meal) => void;
  onBack: () => void;
}

export default function WeeklyPlanner({ plan, onViewMeal, onBack }: Props) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showGrocery, setShowGrocery] = useState(false);

  const day = plan[selectedDay];
  const allMeals = plan.flatMap(d => [d.breakfast, d.lunch, d.dinner]);
  const groceryList = combineGroceryLists(allMeals);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors btn-press">
        <ChevronLeft size={18} /> Back
      </button>

      <div className="animate-slide-up flex items-center gap-2">
        <Calendar className="text-peach" size={22} />
        <h2 className="text-lg font-extrabold text-foreground">7-Day Meal Plan</h2>
      </div>

      {/* Day selector */}
      <div className="animate-slide-up-delay-1 flex items-center gap-2">
        <button onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))} className="rounded-xl p-2 text-muted-foreground hover:bg-muted btn-press" disabled={selectedDay === 0}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
          {plan.map((d, i) => (
            <button
              key={d.day}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all btn-press ${
                i === selectedDay ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
              }`}
            >
              {d.day.slice(0, 3)}
            </button>
          ))}
        </div>
        <button onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))} className="rounded-xl p-2 text-muted-foreground hover:bg-muted btn-press" disabled={selectedDay === 6}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day title */}
      <div className="animate-slide-up-delay-1 text-center">
        <span className="inline-block rounded-full bg-peach-light px-4 py-1.5 text-sm font-extrabold text-foreground">
          {day.day}
        </span>
      </div>

      {/* Meal cards */}
      <div className="space-y-3">
        <MealCard meal={day.breakfast} label="🌅 Breakfast" delay="1" onView={onViewMeal} />
        <MealCard meal={day.lunch} label="☀️ Lunch" delay="2" onView={onViewMeal} />
        <MealCard meal={day.dinner} label="🌙 Dinner" delay="3" onView={onViewMeal} />
      </div>

      {/* Grocery list toggle */}
      <div className="animate-slide-up-delay-4 pt-2">
        <Button
          variant="outline"
          size="lg"
          className="w-full rounded-2xl border-2"
          onClick={() => setShowGrocery(!showGrocery)}
        >
          <ShoppingCart size={20} />
          {showGrocery ? "Hide Grocery List" : "View Full Grocery List"}
        </Button>
      </div>

      {showGrocery && (
        <div className="animate-slide-up">
          <GroceryListCard groceryList={groceryList} />
        </div>
      )}
    </div>
  );
}

function MealCard({ meal, label, delay, onView }: { meal: Meal; label: string; delay: string; onView: (m: Meal) => void }) {
  return (
    <div
      onClick={() => onView(meal)}
      className={`animate-slide-up-delay-${delay} flex cursor-pointer items-center gap-3 rounded-2xl bg-card p-4 shadow-sm border border-border transition-all hover:shadow-md btn-press`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-extrabold text-foreground">{meal.name}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          {meal.cookingTime}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
    </div>
  );
}
