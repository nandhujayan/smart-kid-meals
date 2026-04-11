import { useState } from "react";
import { X, Plus, AlertTriangle } from "lucide-react";

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  colorScheme?: "sage" | "destructive" | "lavender";
  conflictItems?: string[];
  delay?: string;
}

export default function TagInput({ 
  items, 
  onChange, 
  icon, 
  label, 
  placeholder, 
  colorScheme = "lavender", 
  conflictItems = [],
  delay = "3" 
}: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInput("");
  };

  const addMultiple = (text: string) => {
    const newItems = text.split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    const unique = newItems.filter(i => !items.includes(i));
    if (unique.length > 0) onChange([...items, ...unique]);
    setInput("");
  };

  const remove = (item: string) => {
    onChange(items.filter(i => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.includes(",")) addMultiple(input);
      else add();
    }
  };

  const colors = {
    sage: "bg-sage/10 text-sage-foreground border-sage/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    lavender: "bg-lavender/10 text-lavender-foreground border-lavender/20"
  };

  const tagColors = {
    sage: "bg-sage text-sage-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    lavender: "bg-lavender text-lavender-foreground"
  };

  return (
    <div className={`animate-slide-up-delay-${delay} space-y-2`}>
      <label className="flex items-center gap-2 text-sm font-bold text-foreground/80">
        {icon}
        {label}
      </label>
      
      <div className={`rounded-2xl border-2 bg-card p-4 transition-all focus-within:border-primary/50 shadow-sm ${
        conflictItems.length > 0 ? "border-destructive/30" : "border-input"
      }`}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => input.includes(",") ? addMultiple(input) : add()}
            className="rounded-xl bg-primary px-3 py-1.5 text-primary-foreground btn-press"
          >
            <Plus size={18} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map(item => {
              const hasConflict = conflictItems.includes(item);
              return (
                <span 
                  key={item} 
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    hasConflict ? "bg-destructive text-destructive-foreground animate-pulse" : tagColors[colorScheme]
                  }`}
                >
                  {hasConflict && <AlertTriangle size={12} />}
                  {item}
                  <button 
                    type="button" 
                    onClick={() => remove(item)} 
                    className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
