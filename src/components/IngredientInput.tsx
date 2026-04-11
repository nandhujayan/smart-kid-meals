import { useState } from "react";
import { ChevronDown, ChevronUp, Package, X, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Props {
  ingredients: string[];
  onlyAvailable: boolean;
  onIngredientsChange: (ingredients: string[]) => void;
  onToggleOnly: (val: boolean) => void;
}

export default function IngredientInput({ ingredients, onlyAvailable, onIngredientsChange, onToggleOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const addIngredient = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      onIngredientsChange([...ingredients, trimmed]);
    }
    setInput("");
  };

  const addMultiple = (text: string) => {
    const items = text.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const unique = items.filter(i => !ingredients.includes(i));
    if (unique.length > 0) onIngredientsChange([...ingredients, ...unique]);
    setInput("");
  };

  const remove = (item: string) => {
    onIngredientsChange(ingredients.filter(i => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.includes(",")) addMultiple(input);
      else addIngredient();
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left btn-press"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Package className="text-lavender-foreground" size={18} />
          What ingredients do you have?
        </span>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="animate-slide-up px-4 pb-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. milk, rice, egg, banana"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-xl border-2 border-input bg-background px-3 py-2.5 text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
            />
            <button
              onClick={() => input.includes(",") ? addMultiple(input) : addIngredient()}
              className="rounded-xl bg-primary px-3 text-primary-foreground btn-press"
            >
              <Plus size={18} />
            </button>
          </div>

          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map(item => (
                <span key={item} className="flex items-center gap-1 rounded-lg bg-lavender px-2.5 py-1 text-xs font-semibold text-lavender-foreground">
                  {item}
                  <button onClick={() => remove(item)} className="hover:text-destructive">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
            <label className="text-xs font-bold text-muted-foreground">
              Generate meal only using these ingredients
            </label>
            <Switch checked={onlyAvailable} onCheckedChange={onToggleOnly} />
          </div>
        </div>
      )}
    </div>
  );
}
