import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CookingPot, Mail, Sparkles, Phone } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, title, description }: Props) {
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
        // Ensure subscription/usage rows exist after login
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
          email, password,
          options: { data: { membership_tier: 'free' } }
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify. ✨");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Phone Auth (requires Twilio configured in Supabase dashboard)
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return toast.error("Please enter a phone number");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setPhoneStep("verify");
      toast.success("OTP sent to " + phone);
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP. Ensure phone auth is enabled in Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (error) throw error;
      toast.success("Welcome! 👶");
      onSuccess?.();
      onClose();
      setPhoneStep("input");
      setOtp("");
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[400px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
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
                <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-2 py-6 font-semibold focus:border-primary" required />
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-2 py-6 font-semibold focus:border-primary" required />
                <Button type="submit" className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg" disabled={loading}>
                  {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="mt-6">
              {phoneStep === "input" ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input type="tel" placeholder="+91 00000 00000" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl border-2 pl-12 py-6 font-bold focus:border-primary" required />
                  </div>
                  <Button type="submit" className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg" disabled={loading}>
                    {loading ? "Sending..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Phone size={24} />
                    </div>
                    <p className="text-sm font-bold text-center">Enter the OTP sent to {phone}</p>
                    <InputOTP maxLength={6} value={otp} onChange={(v) => setOtp(v)} className="gap-2">
                      <InputOTPGroup>
                        {[0,1,2,3,4,5].map(i => (
                          <InputOTPSlot key={i} index={i} className="h-14 w-11 rounded-xl border-2 font-black text-lg" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full rounded-2xl py-6 text-sm font-bold shadow-lg" disabled={loading || otp.length < 6}>
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => setPhoneStep("input")} className="text-xs font-bold text-muted-foreground hover:text-foreground">
                      Change Phone Number
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted-foreground/20" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background px-4 text-muted-foreground font-bold">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" className="w-full rounded-xl border-2 py-6 font-bold flex items-center justify-center gap-2 hover:bg-muted/5" onClick={() => handleOAuth('google')}>
            <Mail size={18} className="text-red-500" /> Continue with Google
          </Button>

          {authMethod === "email" && (
            <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary underline-offset-4 hover:underline">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          )}
          {authMethod === "phone" && (
            <p className="mt-4 text-center text-xs font-medium text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-primary" /> Secure mobile login via OTP
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
