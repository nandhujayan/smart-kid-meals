import { Carrot, Milk, Wheat, Drumstick, Package } from "lucide-react";
import type { GroceryList } from "@/lib/meal-data";

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
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <span key={i} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
