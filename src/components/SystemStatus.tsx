import { useState } from "react";
import { ShieldCheck, ShieldAlert, Zap, RefreshCw, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runFullDiagnostic, DiagnosticResult } from "@/lib/diagnostics";
import { toast } from "sonner";

export default function SystemStatus() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const handleRunDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await runFullDiagnostic();
      setResult(res);
      if (res.status === "success") {
        toast.success("AI System is Healthy!");
      } else {
        toast.error(`AI Issue: ${res.message}`);
      }
    } catch (error) {
      toast.error("Failed to run diagnostic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-black text-sm uppercase tracking-wider text-muted-foreground">
          <Zap size={16} className="text-sky" /> System Health Check
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRunDiagnostic} 
          disabled={loading}
          className="rounded-xl h-8 text-[11px] font-bold"
        >
          {loading ? <RefreshCw size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
          Run Test
        </Button>
      </div>

      {!result ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <Info size={18} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-medium">
            Run a diagnostic test to verify your Gemini API connection on Vercel.
          </p>
        </div>
      ) : (
        <div className={`p-4 rounded-xl shadow-inner transition-all ${
          result.status === "success" 
            ? "bg-sage/10 text-sage-foreground" 
            : "bg-destructive/10 text-destructive-foreground"
        }`}>
          <div className="flex items-start gap-3">
            {result.status === "success" ? (
              <ShieldCheck className="shrink-0 text-sage" size={24} />
            ) : (
              <ShieldAlert className="shrink-0 text-destructive" size={24} />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm leading-tight">{result.message}</p>
              <p className="text-[11px] mt-1 opacity-80 font-medium leading-relaxed">
                {result.details}
              </p>
              
              {!result.hasKey && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-tight opacity-60">How to fix:</p>
                  <a 
                    href="https://vercel.com/docs/projects/environment-variables" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] font-black text-blue-500 hover:underline"
                  >
                    Add VITE_GEMINI_API_KEY to Vercel <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-dashed">
        <p className="text-[10px] text-center text-muted-foreground/60 font-bold">
          Note: This test only verifies the API connectivity, not your usage limits.
        </p>
      </div>
    </div>
  );
}
