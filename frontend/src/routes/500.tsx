import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  ServerCrash,
  ArrowLeft,
  RefreshCw,
  Terminal,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/500")({
  component: Error500Component,
});

function Error500Component() {
  const router = useRouter();
  const [showTrace, setShowTrace] = useState(false);

  const mockStackTrace = `Error: Internal Server Connection Failure
    at connectDatabase (db.go:42:11)
    at runTriagePipeline (pipeline.go:88:5)
    at analyzeRepoCommits (analyzer.go:121:24)
    at processPRRequest (server.go:204:8)
    at serveHTTP (server.go:94:2)
    at src/runtime/proc.go:250:21
    at src/runtime/asm_amd64.s:1594:5`;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 text-center">
      {/* Background radial highlight */}
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-30 dark:opacity-20" />
      <div className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/5 blur-3xl" />

      <div className="w-full max-w-lg space-y-6">
        {/* Visual Element */}
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive shadow-glow shadow-destructive/10">
          <ServerCrash className="h-10 w-10" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
            500
          </h1>
          <h2 className="font-display text-xl font-bold text-foreground">Internal Server Error</h2>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">
            Something went wrong on our end. The AI engine analysis thread was interrupted. Please
            try again.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            className="cursor-pointer border-border/80 bg-background/50 hover:bg-muted"
            onClick={() => router.invalidate()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try reloading
          </Button>
          <Button variant="hero" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Developer Diagnostics Accordion */}
        <div className="rounded-xl border border-border bg-card/65 text-left shadow-xs backdrop-blur-md overflow-hidden">
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="flex w-full items-center justify-between p-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Diagnostic Stack Trace
            </span>
            {showTrace ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {showTrace && (
            <div className="border-t border-border bg-muted/50 p-4 font-mono text-[10px] leading-relaxed text-muted-foreground overflow-x-auto whitespace-pre">
              {mockStackTrace}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
