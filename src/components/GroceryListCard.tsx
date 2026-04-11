import { useState } from "react";
import { Carrot, Milk, Wheat, Drumstick, Package, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GroceryList, GroceryAvailability } from "@/lib/meal-data";
import { toast } from "sonner";

interface Props {
  groceryList: GroceryList;
}

const categories: { key: keyof GroceryList; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "vegetables", label: "Vegetables", icon: <Carrot size={18} />, color: "text-sage" },
  { key: "dairy", label: "Dairy", icon: <Milk size={18} />, color: "text-sky-foreground" },
  { key: "grains", label: "Grains", icon: <Wheat size={18} />, color: "text-accent-foreground" },
  { key: "proteins", label: "Proteins", icon: <Drumstick size={18} />, color: "text-peach" },
  { key: "others", label: "Others", icon: <Package size={18} />, color: "text-lavender-foreground" },
];

export default function GroceryListCard({ groceryList }: Props) {
  const allItems = Object.values(groceryList).flat();
  const [availability, setAvailability] = useState<GroceryAvailability>(
    () => Object.fromEntries(allItems.map(item => [item, true]))
  );

  const toggleItem = (item: string) => {
    setAvailability(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const unavailableCount = allItems.filter(item => !availability[item]).length;

  const handleSuggestAlternative = () => {
    toast.info("💡 Try substituting with what you have — the app will adapt!");
  };

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm border border-border space-y-4">
      <h3 className="font-extrabold text-foreground flex items-center gap-2">
        🛒 Grocery List
      </h3>
      {categories.map(cat => {
        const items = groceryList[cat.key];
        if (items.length === 0) return null;
        return (
          <div key={cat.key}>
            <p className={`flex items-center gap-1.5 text-sm font-bold ${cat.color}`}>
              {cat.icon} {cat.label}
            </p>
            <div className="mt-1.5 space-y-1">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleItem(item)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all hover:bg-muted/50 btn-press"
                >
                  {availability[item] ? (
                    <CheckCircle2 size={16} className="shrink-0 text-sage" />
                  ) : (
                    <XCircle size={16} className="shrink-0 text-destructive/60" />
                  )}
                  <span className={`text-xs font-semibold ${availability[item] ? "text-foreground" : "text-muted-foreground line-through"}`}>
                    {item}
                  </span>
                  <span className={`ml-auto text-[10px] font-bold ${availability[item] ? "text-sage" : "text-destructive/60"}`}>
                    {availability[item] ? "Available" : "Missing"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {unavailableCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl border-2 text-xs"
          onClick={handleSuggestAlternative}
        >
          <Sparkles size={14} /> Suggest alternative ({unavailableCount} missing)
        </Button>
      )}
    </div>
  );
}
