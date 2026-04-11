import React, { useEffect, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const themes = [
  { name: "Peach", hue: 16, color: "hsl(16, 80%, 65%)" },
  { name: "Ocean", hue: 200, color: "hsl(200, 70%, 55%)" },
  { name: "Forest", hue: 145, color: "hsl(145, 50%, 45%)" },
  { name: "Royal", hue: 260, color: "hsl(260, 60%, 65%)" },
  { name: "Amber", hue: 40, color: "hsl(40, 80%, 55%)" },
  { name: "Rose", hue: 340, color: "hsl(340, 70%, 65%)" },
];

export default function ThemePicker() {
  const [currentHue, setCurrentHue] = useState<number>(() => {
    return parseInt(localStorage.getItem("smartkids-theme-hue") || "16");
  });

  const applyTheme = (hue: number) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", `${hue} 80% 65%`);
    root.style.setProperty("--peach", `${hue} 80% 65%`);
    root.style.setProperty("--peach-light", `${hue} 90% 92%`);
    root.style.setProperty("--ring", `${hue} 80% 65%`);
    localStorage.setItem("smartkids-theme-hue", hue.toString());
  };

  useEffect(() => {
    applyTheme(currentHue);
  }, [currentHue]);

  const handleSelect = (hue: number) => {
    setCurrentHue(hue);
  };

  const handleReset = () => {
    setCurrentHue(16);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors btn-press"
          title="Change Theme"
        >
          <Palette size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-3xl p-4 border-none shadow-2xl bg-card">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm">Theme Colors</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-[10px] uppercase tracking-widest font-black"
            >
              <RotateCcw size={12} className="mr-1" /> Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <button
                key={theme.hue}
                onClick={() => handleSelect(theme.hue)}
                className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all ${
                  currentHue === theme.hue 
                    ? "bg-primary/10 shadow-inner scale-95" 
                    : "hover:bg-muted"
                }`}
              >
                <div 
                  className="h-8 w-8 rounded-full shadow-md transition-transform group-hover:scale-110" 
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-[10px] font-bold text-muted-foreground">{theme.name}</span>
                {currentHue === theme.hue && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
