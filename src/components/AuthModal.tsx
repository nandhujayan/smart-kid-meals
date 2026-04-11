import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CookingPot, Github, Mail, Sparkles, UserPlus, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, title, description }: Props) {
  const { signInAsGuest } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Fallback: Ensure subscription/usage rows exist after login (in case trigger failed)
        if (data.user) {
          const { data: sub } = await supabase.from('user_subscriptions').select('id').eq('user_id', data.user.id).maybeSingle();
          if (!sub) {
            await supabase.from('user_subscriptions').insert({ user_id: data.user.id, tier: 'free' });
            await supabase.from('usage_stats').insert({ user_id: data.user.id, generation_count: 0 });
          }
        }
        
        toast.success("Welcome back! 👶");
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              membership_tier: 'free'
            }
          }
        });
        if (error) throw error;
        toast.success("Account created! Check your email. ✨");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return toast.error("Please enter a phone number");
    
    setLoading(true);
    // Mock simulation
    setTimeout(() => {
      setLoading(false);
      setPhoneStep("verify");
      toast.info("Mock OTP sent to " + phone);
    }, 1000);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === "12345") {
      setLoading(true);
      setTimeout(() => {
        signInAsGuest();
        toast.success("Correct OTP! Welcome back. 👶");
        setLoading(false);
        onSuccess?.();
        onClose();
        // Reset state for next time
        setPhoneStep("input");
        setOtp("");
      }, 800);
    } else {
      toast.error("Invalid OTP. Use 12345 for demo.");
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-br from-peach/10 via-background to-sage/10 p-8">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CookingPot size={32} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black">{title || (isLogin ? "Welcome Back" : "Start Growing")}</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">
                {description || (isLogin ? "Sign in to access your saved meals." : "Join thousands of parents making healthy meals.")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="email" value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="mt-6 w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="email" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Email</TabsTrigger>
              <TabsTrigger value="phone" className="rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-2 py-6 font-semibold focus:border-primary"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-2 py-6 font-semibold focus:border-primary"
                    required
                  />
                </div>

                <Button type="submit" className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg transition-all" disabled={loading}>
                  {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="mt-6">
              {phoneStep === "input" ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl border-2 pl-12 py-6 font-bold focus:border-primary"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg transition-all" disabled={loading}>
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce-gentle">
                      <Phone size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">Enter OTP sent to {phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">Hint: Use <span className="font-black text-primary">12345</span> for demo</p>
                    </div>
                    
                    <InputOTP
                      maxLength={5}
                      value={otp}
                      onChange={(v) => setOtp(v)}
                      className="gap-2"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-14 w-12 rounded-xl border-2 font-black text-lg" />
                        <InputOTPSlot index={1} className="h-14 w-12 rounded-xl border-2 font-black text-lg" />
                        <InputOTPSlot index={2} className="h-14 w-12 rounded-xl border-2 font-black text-lg" />
                        <InputOTPSlot index={3} className="h-14 w-12 rounded-xl border-2 font-black text-lg" />
                        <InputOTPSlot index={4} className="h-14 w-12 rounded-xl border-2 font-black text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg transition-all" disabled={loading || otp.length < 5}>
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      type="button" 
                      onClick={() => setPhoneStep("input")}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground"
                    >
                      Change Phone Number
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background px-4 text-muted-foreground font-bold">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
                variant="outline" 
                className="rounded-xl border-2 py-6 font-bold flex items-center justify-center gap-2 hover:bg-muted/5 transition-all"
                onClick={() => handleOAuth('google')}
            >
              <Mail size={18} className="text-red-500" /> Google
            </Button>
            <Button 
                variant="outline" 
                className="rounded-xl border-2 py-6 font-bold flex items-center justify-center gap-2 hover:bg-muted/5 transition-all"
                onClick={() => handleOAuth('github')}
            >
              <Github size={18} /> GitHub
            </Button>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            {authMethod === "phone" ? (
               <span className="flex items-center justify-center gap-1">
                 <Sparkles size={14} className="text-primary" />
                 Secure mobile login powered by OTP
               </span>
            ) : (
              <>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-primary underline-offset-4 hover:underline"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
