import { useState, useEffect } from "react";
import { ChefHat, CookingPot, Utensils, Zap, Sparkles, Apple, Brain, Activity, Heart, Shield } from "lucide-react";
import type { MealForm } from "@/lib/meal-data";

// Importing images directly for reliable Vite handling
import loader1 from "@/assets/illustrations/loader-1.png";
import loader2 from "@/assets/illustrations/loader-2.png";

interface Props {
  isVisible: boolean;
  formData?: MealForm | null;
}

const messages = [
  "Preparing a healthy meal...",
  "Selecting the best ingredients...",
  "Calculating nutrition values...",
  "Optimizing for your child...",
  "Finalizing recipe...",
];

const icons = [
  <ChefHat className="text-peach" size={32} />,
  <div className="relative">
    <CookingPot className="text-sage" size={32} />
    <span className="absolute -top-4 left-2 animate-steam text-xs">💨</span>
    <span className="absolute -top-6 left-5 animate-steam delay-300 text-[10px]">💨</span>
  </div>,
  <Utensils className="text-sky" size={32} />,
  <Apple className="text-peach" size={32} />,
  <Sparkles className="text-lavender-foreground" size={32} />,
];

const goalIcons: Record<string, any> = {
  "Brain boost": <Brain className="text-sky" size={14} />,
  "Physical growth": <Activity className="text-peach" size={14} />,
  "Healthy gut": <Heart className="text-sage" size={14} />,
  "Immunity": <Shield className="text-lavender-foreground" size={14} />,
};

export default function LoadingOverlay({ isVisible, formData }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    const imgInterval = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % 2);
    }, 4000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(imgInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const images = [loader1, loader2];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl animate-in fade-in duration-500 overflow-y-auto pt-10 pb-10">
      <div className="w-full max-w-sm space-y-8 px-6 text-center">
        
        {/* Dynamic Context Header */}
        {formData && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="mb-2 flex justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase text-primary">
                {formData.diet}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-3 py-1 text-[10px] font-black uppercase text-sky-foreground">
                {formData.mealType}
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-foreground">
              Drafting for {formData.childAge} year old
            </h3>
            {formData.goal && (
              <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
                {goalIcons[formData.goal]}
                <span>Targeting {formData.goal}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Illustration */}
        <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-3xl border-4 border-white shadow-2xl animate-float">
          <img 
            key={imgIndex} 
            src={images[imgIndex]} 
            alt="Loading animation" 
            className="h-full w-full object-cover animate-in fade-in zoom-in-95 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-peach/20 to-transparent" />
        </div>

        {/* Message and Icon */}
        <div className="space-y-4">
          <div className="flex justify-center h-8">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 duration-1500" />
              {icons[msgIndex]}
            </div>
          </div>
          <div className="h-10">
            <p key={msgIndex} className="animate-in fade-in slide-in-from-bottom-2 text-xl font-black text-foreground duration-500 tracking-tight leading-none">
              {messages[msgIndex]}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}
