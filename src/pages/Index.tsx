import { useState, useEffect } from "react";
import { CookingPot, Bookmark, Calendar, Users, Bell, BellOff, Droplet, ChevronDown, Plus, Milk, Home } from "lucide-react";
import HomePage from "./HomePage";
import MealForm from "@/components/MealForm";
import MealResult from "@/components/MealResult";
import SavedMeals from "@/components/SavedMeals";
import SavedWeeklyPlans from "@/components/SavedWeeklyPlans";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import AuthModal from "@/components/AuthModal";
import Pricing from "@/components/Pricing";
import ChildProfiles from "@/components/ChildProfiles";
import WaterTracker from "@/components/WaterTracker";
import LiquidNutrition from "@/components/LiquidNutrition";
import SystemStatus from "@/components/SystemStatus";
import UsageProgress from "@/components/UsageProgress";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Sparkles, Star, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  generateMeal, generateWeeklyPlan,
  getNotificationSetting, setNotificationSetting,
  getSavedWeeklyPlan, saveWeeklyPlan,
  getChildProfiles, migrateLocalData, getUserUsage,
  FREE_MEAL_LIMIT, PRO_MEAL_LIMIT,
  type Meal, type MealForm as MealFormType, type DayPlan, type ChildProfile,
} from "@/lib/meal-data";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "home" | "generate" | "weekly" | "water" | "liquid" | "saved" | "profiles";
type View = "tabs" | "result" | "weekly-view";

export default function Index() {
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<View>("tabs");
  const [meal, setMeal] = useState<Meal | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    const loadSaved = async () => {
      const plan = await getSavedWeeklyPlan();
      if (plan) setWeeklyPlan(plan);
      
      const projs = await getChildProfiles();
      setProfiles(projs);
      if (projs.length > 0 && !activeProfile) {
        setActiveProfile(projs[0]);
      }
    };
    loadSaved();
  }, []);

  const refreshProfiles = async () => {
    const projs = await getChildProfiles();
    setProfiles(projs);
    return projs;
  };

  const { user, isPro, expiresAt } = useAuth();

  const getSubscriptionDaysLeft = () => {
    if (!isPro || !expiresAt) return null;
    try {
      const days = differenceInDays(parseISO(expiresAt), new Date());
      return days;
    } catch (e) {
      return null;
    }
  };

  const shouldShowPricing = () => {
    if (!isPro) return true;
    const days = getSubscriptionDaysLeft();
    return days !== null && days <= 3;
  };

  const fetchUsage = async () => {
    if (user) {
      const stats = await getUserUsage(user.id);
      if (stats) setUsageCount(stats.generation_count);
    } else {
      setUsageCount(getGuestGenerations());
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user]);

  useEffect(() => {
    if (user) {
      const runMigration = async () => {
        // If guest limit was reached, show pricing after login
        if (getGuestGenerations() >= 3 && shouldShowPricing()) {
          setIsPricingModalOpen(true);
        }

        toast.promise(migrateLocalData(), {
          loading: 'Syncing your local data to cloud...',
          success: 'Data synced successfully! ☁️',
          error: 'Failed to sync some data.',
        });

        // Refresh profiles after migration
        const plan = await getSavedWeeklyPlan();
        if (plan) setWeeklyPlan(plan);
        await refreshProfiles();
      };
      runMigration();
    }
  }, [user]);

  const [notifications, setNotifications] = useState(getNotificationSetting());
  const [lastForm, setLastForm] = useState<MealFormType | null>(null);
  const [isFromWeekly, setIsFromWeekly] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ dayIndex: number; mealType: string } | null>(null);

  const [savedSubTab, setSavedSubTab] = useState<"meals" | "plans">("meals");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ title: "", description: "" });

  const { signOut, subscriptionTier } = useAuth();

  const getGuestGenerations = () => {
    return parseInt(localStorage.getItem("smartkids-guest-gens") || "0");
  };

  const incrementGuestGenerations = () => {
    localStorage.setItem("smartkids-guest-gens", (getGuestGenerations() + 1).toString());
  };

  const checkAuthAndUsage = (action: string) => {
    // If they are a guest and trying to generate, block after 3
    if (!user && action === "generate") {
      if (usageCount >= FREE_MEAL_LIMIT) {
        setIsPricingModalOpen(true);
        toast.error("Free Limit Reached", {
          description: `You have generated ${FREE_MEAL_LIMIT} free meals. Please subscribe to unlock more!`
        });
        return false;
      }
    }

    // Pro Limit enforcement
    if (user && action === "generate") {
      const limit = isPro ? PRO_MEAL_LIMIT : FREE_MEAL_LIMIT;
      if (usageCount >= limit) {
        if (!isPro) {
          setIsPricingModalOpen(true);
        } else {
          toast.error("Monthly Limit Reached", {
            description: `You have reached your limit of ${PRO_MEAL_LIMIT} meals this month.`
          });
        }
        return false;
      }
    }

    if (!user) {
      if (action === "save" || action === "profiles") {
        setAuthModalConfig({
          title: "Sign In Required",
          description: `Please sign in to ${action === "save" ? "save meals" : "manage child profiles"}.`
        });
        setIsAuthModalOpen(true);
        return false;
      }
    }
    return true;
  };

  const handleGenerate = async (form: MealFormType) => {
    if (!checkAuthAndUsage("generate")) return;

    setIsLoading(true);
    setLastForm(form);
    try {
      const result = await generateMeal(form);
      setMeal(result);
      setView("result");
      setIsFromWeekly(false);
      setActiveSlot(null);
      
      // Increment usage in DB if user is logged in
      if (user) {
        await import("@/lib/meal-data").then(m => m.incrementUsage(user.id));
      } else {
        incrementGuestGenerations();
      }
      
      // Refresh usage
      fetchUsage();
    } catch (error: any) {
      console.error(error);
      if ((error.message?.includes("free meal limit") || error.message?.includes("429")) && shouldShowPricing()) {
        toast.error("Free Limit Reached", {
          description: "You have generated 3 free meals. Please subscribe to unlock unlimited meals!"
        });
        // Modal will open via the dispatched event
      } else {
        toast.error("Failed to generate meal. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWeekly = async (form: MealFormType) => {
    if (!checkAuthAndUsage("generate")) return;

    if (!user) {
      setAuthModalConfig({ title: "Sign In Required", description: "Please sign in to generate weekly plans." });
      setIsAuthModalOpen(true);
      return;
    }
    if (!isPro && shouldShowPricing()) {
      setIsPricingModalOpen(true);
      return;
    }
    setIsLoading(true);
    setLastForm(form);
    try {
      const plan = await generateWeeklyPlan(form);
      setWeeklyPlan(plan);
      await saveWeeklyPlan(plan);
      setView("weekly-view");
      if (user) await import("@/lib/meal-data").then(m => m.incrementUsage(user.id));
      
      // Refresh usage
      fetchUsage();
    } catch (error: any) {
      if (error.message?.includes('limit reached') && shouldShowPricing()) {
        setIsPricingModalOpen(true);
      } else {
        toast.error("Failed to generate weekly plan.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (view === "result" && isFromWeekly && weeklyPlan) {
      setView("weekly-view");
      setIsFromWeekly(false);
      setActiveSlot(null);
    } else {
      setView("tabs");
      setMeal(null);
      setActiveSlot(null);
    }
  };

  const handleSelectSaved = (m: Meal) => {
    setMeal(m);
    setView("result");
    setIsFromWeekly(false);
    setActiveSlot(null);
  };

  const handleWeeklyMealView = (m: Meal, dayIndex?: number, mealType?: string) => {
    setMeal(m);
    setView("result");
    setIsFromWeekly(true);
    if (dayIndex !== undefined && mealType !== undefined) {
      setActiveSlot({ dayIndex, mealType });
    }
  };

  const handleUpdateMeal = (newMeal: Meal) => {
    setMeal(newMeal);

    if (isFromWeekly && weeklyPlan && activeSlot) {
      const nextPlan = [...weeklyPlan];
      const day = nextPlan[activeSlot.dayIndex];
      if (activeSlot.mealType === "breakfast") day.breakfast = newMeal;
      else if (activeSlot.mealType === "lunch") day.lunch = newMeal;
      else if (activeSlot.mealType === "dinner") day.dinner = newMeal;
      setWeeklyPlan(nextPlan);
      saveWeeklyPlan(nextPlan);
    }
  };

  const handleToggleNotifications = async () => {
    const next = !notifications;
    if (next && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Notification permission denied", { description: "Please enable notifications in your browser settings." });
        return;
      }
      // Schedule a sample reminder to confirm it works
      setTimeout(() => {
        new Notification("Mom's Kitchen 🍽️", { body: "Don't forget to plan today's meals for your little one!", icon: "/favicon.ico" });
      }, 3000);
    }
    setNotifications(next);
    setNotificationSetting(next);
    toast.success(next ? "Daily reminders enabled 🔔" : "Reminders turned off");
  };

  const handleSelectProfile = (profile: ChildProfile) => {
    setActiveProfile(profile);
    toast.success(`Switched to ${profile.name}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-background shadow-xl overflow-x-hidden pt-4 sm:pt-0">
      <LoadingOverlay isVisible={isLoading} formData={lastForm} />

      {/* Header */}
      <header className="animate-slide-up sticky top-0 z-20 bg-background/80 backdrop-blur-md px-5 py-4 border-b sm:border-none">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors btn-press">
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 border-r-2 border-primary/10">
                <div className="flex flex-col h-full bg-background">
                  <SheetHeader className="p-6 border-b bg-muted/30">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-light">
                        <CookingPot className="text-peach" size={22} />
                      </div>
                      <span className="font-black text-xl tracking-tight">Mom's Kitchen</span>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
                    {/* Saved Kids Section */}
                    <section>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Saved Kids</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] font-bold uppercase tracking-wider text-sky hover:bg-sky/10"
                          onClick={() => { setTab("profiles"); setIsDrawerOpen(false); }}
                        >
                          Manage
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {profiles.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { handleSelectProfile(p); setIsDrawerOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all border-2 ${
                              activeProfile?.id === p.id 
                              ? "bg-primary/5 border-primary/20 text-primary font-bold shadow-sm" 
                              : "border-transparent hover:bg-muted/50 text-muted-foreground"
                            }`}
                          >
                            <span className="text-lg">👶</span>
                            <span className="flex-1 text-left text-sm">{p.name}</span>
                            {activeProfile?.id === p.id && <Star size={12} className="fill-primary text-primary" />}
                          </button>
                        ))}
                        {profiles.length === 0 && (
                          <p className="text-center py-4 text-xs text-muted-foreground font-medium">No profiles yet.</p>
                        )}
                      </div>
                    </section>

                    {/* Quick Access Section */}
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 mb-4 px-2">Saved Items</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => { setTab("saved"); setIsDrawerOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            tab === "saved" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Bookmark size={18} />
                          <span className="text-sm">Saved Meals</span>
                        </button>
                        <button
                          onClick={() => { setTab("weekly"); setIsDrawerOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            view === "weekly-view" ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Calendar size={18} />
                          <span className="text-sm">Weekly Plans</span>
                        </button>
                      </div>
                    </section>

                    {/* AI Usage Section */}
                    <section className="px-2">
                      <UsageProgress 
                        count={usageCount} 
                        isPro={isPro} 
                        onUpgrade={() => {
                          setIsPricingModalOpen(true);
                          setIsDrawerOpen(false);
                        }}
                      />
                    </section>
                  </div>

                  <div className="p-4 border-t bg-muted/20">
                    <SystemStatus />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-foreground sm:text-lg">Mom's Kitchen</span>
              {isPro ? (
                <div className="flex items-center gap-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full border border-primary/20">
                  <Sparkles size={8} className="fill-primary" />
                  Pro
                </div>
              ) : (
                <span className="text-xs">🌱</span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mt-0.5">Kids</span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-all border border-transparent hover:border-primary/10 btn-press focus:outline-none">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeProfile?.name || 'child'}`} 
                      alt="avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground hidden xs:inline-block">
                    {activeProfile ? activeProfile.name : "Profile"}
                  </span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-2 border-primary/20">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 px-3 py-2">Switch Kid</DropdownMenuLabel>
                {profiles.map(p => (
                  <DropdownMenuItem 
                    key={p.id} 
                    onClick={() => handleSelectProfile(p)}
                    className={`rounded-xl px-3 py-2.5 mb-1 cursor-pointer transition-all ${activeProfile?.id === p.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted font-medium"}`}
                  >
                    <span className="mr-2">👶</span> {p.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                   onClick={() => { setTab("profiles"); }}
                   className="rounded-xl px-3 py-2.5 font-bold text-sky hover:bg-sky/10 cursor-pointer"
                >
                  <Plus size={14} className="mr-2" /> New Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem onClick={signOut} className="rounded-xl px-3 py-2.5 font-bold text-destructive hover:bg-destructive/10 cursor-pointer">
                    <LogOut size={14} className="mr-2" /> Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setIsAuthModalOpen(true)} className="rounded-xl px-3 py-2.5 font-bold text-primary hover:bg-primary/10 cursor-pointer">
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button
              onClick={handleToggleNotifications}
              className="rounded-xl p-2 text-muted-foreground hover:bg-muted transition-colors btn-press relative"
            >
              {notifications ? <Bell className="text-peach" size={18} /> : <BellOff size={18} />}
              {notifications && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />}
            </button>
          </div>
        </div>

        {/* Tabs - Only show core navigation */}
        {view === "tabs" && (
          <div className="mx-auto max-w-2xl mt-4 px-0 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 rounded-2xl bg-muted p-1 min-w-max sm:min-w-0">
              <TabBtn active={tab === "home"} onClick={() => setTab("home")} icon={<Home size={14} />} label="Home" />
              <TabBtn active={tab === "generate"} onClick={() => setTab("generate")} icon={<CookingPot size={14} />} label="Meal" />
              <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")} icon={<Calendar size={14} />} label="Weekly" />
              <TabBtn active={tab === "water"} onClick={() => setTab("water")} icon={<Droplet size={14} />} label="Water" />
              <TabBtn active={tab === "liquid"} onClick={() => setTab("liquid")} icon={<Milk size={14} />} label="Drinks" />
              <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark size={14} />} label="Saved" />
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className={`flex-1 px-5 pb-8 pt-2 ${view === "result" ? "" : "mx-auto w-full max-w-2xl"}`}>
        {view === "tabs" && (
          <div className="mb-6 mt-4 px-2 animate-slide-up text-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              {tab === "home" && "Welcome to Smart Kids Meals"}
              {tab === "generate" && "Create a Healthy Meal"}
              {tab === "weekly" && "Weekly Nutrition Planner"}
              {tab === "water" && "Water Intake Tracker"}
              {tab === "liquid" && "Liquid Nutrition Guide"}
              {tab === "saved" && "Your Saved Collections"}
              {tab === "profiles" && "Manage Kid Profiles"}
            </h1>
          </div>
        )}

        {view === "result" && meal ? (
          <MealResult
            meal={meal}
            onBack={handleBack}
            lastForm={lastForm}
            activeProfileName={activeProfile?.name}
            onViewMeal={handleUpdateMeal}
            setIsLoading={setIsLoading}
            onAuthRequired={checkAuthAndUsage}
          />
        ) : view === "weekly-view" && weeklyPlan ? (
          <WeeklyPlanner plan={weeklyPlan} onViewMeal={handleWeeklyMealView} onBack={handleBack} />
        ) : tab === "home" ? (
          <HomePage childName={activeProfile?.name} onGenerateClick={() => setTab("generate")} />
        ) : tab === "generate" ? (
          <div className="space-y-8 animate-slide-up">
            {getSubscriptionDaysLeft() !== null && getSubscriptionDaysLeft()! <= 3 && (
              <SubscriptionBanner 
                daysLeft={getSubscriptionDaysLeft()!} 
                onRenew={() => setIsPricingModalOpen(true)} 
              />
            )}
            <UsageProgress 
              count={usageCount} 
              isPro={isPro} 
              onUpgrade={() => setIsPricingModalOpen(true)}
            />
            <div className="premium-3d-card p-4 sm:p-6">
              <MealForm onGenerate={handleGenerate} onGenerateWeekly={handleGenerateWeekly} isLoading={isLoading} activeProfile={activeProfile} />
            </div>
          </div>
        ) : tab === "weekly" ? (
          <div className="space-y-8 animate-slide-up">
             {getSubscriptionDaysLeft() !== null && getSubscriptionDaysLeft()! <= 3 && (
               <SubscriptionBanner 
                 daysLeft={getSubscriptionDaysLeft()!} 
                 onRenew={() => setIsPricingModalOpen(true)} 
               />
             )}
             <UsageProgress 
              count={usageCount} 
              isPro={isPro} 
              onUpgrade={() => setIsPricingModalOpen(true)}
            />
            <div className="premium-3d-card p-4 sm:p-6">
              <MealForm onGenerate={handleGenerate} onGenerateWeekly={handleGenerateWeekly} isLoading={isLoading} activeProfile={activeProfile} weeklyMode />
            </div>
          </div>
        ) : tab === "water" ? (
          <div className="space-y-8">
            <div className="premium-3d-card p-4 sm:p-6">
              <WaterTracker activeProfile={activeProfile} />
            </div>
          </div>
        ) : tab === "liquid" ? (
          <div className="space-y-8">
            <div className="premium-3d-card p-4 sm:p-6">
             <LiquidNutrition activeProfile={activeProfile} />
            </div>
          </div>
        ) : tab === "saved" ? (
          <div className="space-y-8">
            <div className="premium-3d-card p-4 sm:p-6">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setSavedSubTab("meals")} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${savedSubTab === "meals" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Meals</button>
                <button onClick={() => setSavedSubTab("plans")} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${savedSubTab === "plans" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Weekly Plans</button>
              </div>
              {savedSubTab === "meals" ? (
                <SavedMeals onSelect={handleSelectSaved} />
              ) : (
                <SavedWeeklyPlans 
                  onLoad={(plan) => {
                    setWeeklyPlan(plan);
                    setView("weekly-view");
                  }} 
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="premium-3d-card p-4 sm:p-6">
              <ChildProfiles
                activeProfileId={activeProfile?.id ?? null}
                onSelect={handleSelectProfile}
                onAuthRequired={checkAuthAndUsage}
                isPro={isPro}
                onUpgradeRequired={() => {
                  if (shouldShowPricing()) setIsPricingModalOpen(true);
                  else toast.success("You are already on the Pro plan!");
                }}
                onProfilesChange={refreshProfiles}
              />
            </div>
            <div className="h-px w-full border-t-2 border-dashed border-muted-foreground/20 my-4" />
            <div className="premium-3d-card p-4 sm:p-6"><SystemStatus /></div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authModalConfig.title}
        description={authModalConfig.description}
      />
      <Pricing
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition-all btn-press ${active ? "bg-background text-foreground shadow-md ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
    >
      {icon} <span>{label}</span>
    </button>
  );
}
