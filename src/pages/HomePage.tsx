import { Sun, Moon, Cloud, Apple, Banana, Grape, Citrus, Sandwich, Cookie, UtensilsCrossed } from "lucide-react";

interface MealCard {
  id: string;
  title: string;
  calories: number;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
}

const meals: MealCard[] = [
  {
    id: "breakfast",
    title: "Breakfast",
    calories: 450,
    description: "Pancakes & Fruit",
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    bgColor: "bg-amber-50",
  },
  {
    id: "lunch",
    title: "Lunch",
    calories: 470,
    description: "Food & Lunch",
    icon: <Sandwich className="w-5 h-5 text-emerald-500" />,
    bgColor: "bg-emerald-50",
  },
  {
    id: "dinner",
    title: "Dinner",
    calories: 730,
    description: "Pancakes & Fruit",
    icon: <UtensilsCrossed className="w-5 h-5 text-rose-500" />,
    bgColor: "bg-rose-50",
  },
  {
    id: "snacks",
    title: "Snacks",
    calories: 100,
    description: "Fruit & Yogurt",
    icon: <Cookie className="w-5 h-5 text-orange-500" />,
    bgColor: "bg-orange-50",
  },
];

interface HomePageProps {
  childName?: string;
  childAvatar?: string;
  onGenerateClick?: () => void;
}

export default function HomePage({ childName = "Melani", childAvatar, onGenerateClick }: HomePageProps) {
  const progress = 32;
  const tasksDone = 2;
  const totalTasks = 6;

  const avatarUrl = childAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${childName}&backgroundColor=ffdfbf`;

  return (
    <div className="bg-gradient-to-b from-green-300 via-green-200 to-green-100 font-sans -mx-5 -mt-2 pb-4 min-h-[calc(100vh-50px)]">
      {/* Header */}
      <header className="px-6 pt-1 pb-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-white shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src={avatarUrl}
              alt={childName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h1 className="text-xl font-bold text-green-900">Healthy Day, {childName}</h1>
      </header>

      {/* Progress Section */}
      <section className="px-6 py-1">
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative w-20 h-20">
            {/* Avatar inside ring */}
            <div className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-amber-100 border-2 border-white drop-shadow-lg flex items-center justify-center overflow-hidden z-10">
              <img
                src={avatarUrl}
                alt={childName}
                className="w-full h-full object-cover"
              />
            </div>
            {/* The Ring itself */}
            <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle cx="50" cy="50" r="40" fill="none" className="stroke-green-800/20" strokeWidth="6" />
              {/* Progress Tube (The "3D" part) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="stroke-green-400"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={`${251.2 * (1 - progress / 100)}`}
                style={{ filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.25))" }}
              />
            </svg>
          </div>

          {/* Progress Text */}
          <div className="flex-1">
            <div className="text-2xl font-bold text-green-900">{progress}%</div>
            <div className="text-base font-semibold text-green-800">My plan for today</div>
            <div className="text-xs text-green-700/80">{tasksDone} of {totalTasks} tasks done</div>
          </div>
        </div>
      </section>

      {/* 3D Cards Grid */}
      <section className="px-4 py-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Sleep Card */}
          <div className="relative h-28 bg-[#a59cf7] rounded-[1.5rem] shadow-clay cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200">
            <h3 className="absolute top-4 left-4 text-base font-extrabold text-slate-800/80">Sleep</h3>
            <div className="absolute -right-1 -bottom-1 w-24 h-24 drop-shadow-xl z-10">
              <div className="relative w-full h-full scale-90">
                {/* Sun */}
                <div className="absolute top-0 right-2 w-10 h-10 bg-amber-300 rounded-full shadow-lg flex items-center justify-center animate-pulse">
                  <Sun className="w-6 h-6 text-amber-600" />
                </div>
                {/* Clouds */}
                <div className="absolute bottom-4 left-0 w-14 h-9 bg-white rounded-full shadow-md flex items-center justify-center">
                  <Cloud className="w-8 h-8 text-gray-300" />
                </div>
                <div className="absolute bottom-2 right-4 w-10 h-7 bg-white/90 rounded-full shadow-sm" />
                {/* Moon */}
                <div className="absolute top-4 right-10">
                  <div className="w-8 h-8 bg-amber-100 rounded-full shadow-lg flex items-center justify-center">
                    <Moon className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Water Card */}
          <div className="relative h-28 bg-[#4fc3f7] rounded-[1.5rem] shadow-clay cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200">
            <h3 className="absolute top-4 left-4 text-base font-extrabold text-slate-800/80">Water</h3>
            <div className="absolute -right-1 -bottom-1 w-20 h-28 drop-shadow-xl z-10">
              <div className="relative w-full h-full scale-90">
                {/* Glass */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-200/40 to-blue-400/60 rounded-b-2xl rounded-t-sm border-2 border-white/50 backdrop-blur-sm shadow-xl">
                  {/* Water level */}
                  <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-blue-500 to-sky-400 rounded-b-xl opacity-80">
                    {/* Bubbles */}
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
                {/* Girl in water */}
                <div className="absolute -top-2 -right-2 w-9 h-9">
                  <div className="w-full h-full bg-amber-100 rounded-full border-2 border-amber-300 flex items-center justify-center shadow-lg">
                    <span className="text-lg">👧</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Food Card */}
          <div className="relative h-28 bg-[#ff8a7d] rounded-[1.5rem] shadow-clay cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200">
            <h3 className="absolute top-4 left-4 text-base font-extrabold text-slate-800/80">Food</h3>
            <div className="absolute -right-1 -bottom-1 w-24 h-24 drop-shadow-xl z-10">
              <div className="relative w-full h-full scale-90">
                {/* Bowl */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-gradient-to-b from-amber-100 to-amber-200 rounded-b-full shadow-xl border-b-4 border-amber-300" />
                {/* Fruits */}
                <div className="absolute bottom-7 left-2 w-6 h-6 bg-red-400 rounded-full shadow-md flex items-center justify-center">
                  <Apple className="w-4 h-4 text-red-600" />
                </div>
                <div className="absolute bottom-9 left-7 w-6 h-6 bg-purple-400 rounded-full shadow-md flex items-center justify-center">
                  <Grape className="w-4 h-4 text-purple-700" />
                </div>
                <div className="absolute bottom-5 right-4 w-7 h-8 bg-yellow-300 rounded-lg shadow-md transform rotate-12 flex items-center justify-center">
                  <Banana className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="absolute bottom-10 left-10 w-6 h-6 bg-orange-400 rounded-full shadow-md flex items-center justify-center">
                  <Citrus className="w-4 h-4 text-orange-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Card */}
          <div className="relative h-28 bg-[#fcd34d] rounded-[1.5rem] shadow-clay cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200">
            <h3 className="absolute top-4 left-4 text-base font-extrabold text-slate-800/80">Exercise</h3>
            <div className="absolute -right-1 -bottom-1 w-22 h-26 drop-shadow-xl z-10">
              <div className="relative w-full h-full scale-90">
                {/* Hula hoop ring */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 border-4 border-rose-400 rounded-full shadow-lg animate-spin" style={{ animationDuration: "3s" }} />
                {/* Kid */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11 h-12">
                  <div className="w-full h-full flex flex-col items-center">
                    {/* Head */}
                    <div className="w-6 h-6 bg-amber-100 rounded-full border-2 border-amber-300 shadow-md flex items-center justify-center">
                      <span className="text-xs">👦</span>
                    </div>
                    {/* Body */}
                    <div className="w-6 h-5 bg-emerald-400 rounded-lg shadow-sm mt-0.5" />
                    {/* Legs */}
                    <div className="flex gap-1 mt-0.5">
                      <div className="w-2.5 h-3.5 bg-blue-400 rounded-sm" />
                      <div className="w-2.5 h-3.5 bg-blue-400 rounded-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sheet - Meals */}
      <section className="mx-4 mt-1">
        <div className="bg-[hsl(40,60%,95%)]/90 bg-gradient-to-b from-[hsl(40,60%,96%)]/95 to-[hsl(40,60%,93%)]/90 backdrop-blur-sm rounded-[1.5rem] p-3 shadow-soft-3d border border-white/50">
          {/* Handle */}
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 bg-gray-300/80 rounded-full" />
          </div>

          {/* Meals Grid */}
          <div className="grid grid-cols-2 gap-2">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`${meal.bgColor} bg-gradient-to-b from-white/40 via-transparent to-black/5 rounded-xl p-2.5 cursor-pointer transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-soft-3d border border-white/60`}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center icon-soft-shadow">
                    {meal.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs">{meal.title}</h3>
                    <p className="text-[10px] text-gray-600 font-medium">{meal.calories} calories</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{meal.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Generate AI Meal Button */}
          {onGenerateClick && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={onGenerateClick}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold py-2 px-6 rounded-xl shadow-clay-dark transform transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                <span className="text-lg animate-pulse">✨</span>
                <span className="text-sm">Generate AI Meal</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
