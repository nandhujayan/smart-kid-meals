import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center bg-background">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="text-destructive" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              An unexpected error occurred. Your data is safe — please refresh to continue.
            </p>
          </div>
          <Button onClick={() => window.location.reload()} className="rounded-2xl gap-2">
            <RefreshCw size={16} /> Refresh App
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
