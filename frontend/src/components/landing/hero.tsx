import { ArrowRight, Sparkles, GitPullRequest, ShieldCheck, Check, Star } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const activityData = [
  { d: "Mon", v: 24 },
  { d: "Tue", v: 38 },
  { d: "Wed", v: 31 },
  { d: "Thu", v: 52 },
  { d: "Fri", v: 47 },
  { d: "Sat", v: 64 },
  { d: "Sun", v: 73 },
];

interface HeroProps {
  onBookDemo?: () => void;
}

export function Hero({ onBookDemo }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden bg-hero-glow pt-32 pb-20 sm:pt-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in mb-6 flex justify-center">
            <Badge variant="brand" className="gap-1.5 px-3 py-1 text-[13px]">
              <Sparkles className="h-3.5 w-3.5" />
              Now with GPT-powered PR reviews
            </Badge>
          </div>

          <h1 className="animate-fade-up font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Engineering Intelligence,
            <br />
            <span className="text-gradient">Powered by AI</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            DevInsight automatically reviews pull requests, triages issues, monitors repository
            health, and surfaces security risks — so your team ships faster with total confidence.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
              <Link to="/signup">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onBookDemo}>
              Book a demo
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-success" /> No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-success" /> 14-day Pro trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-warning text-warning" /> 4.9/5 on G2
            </span>
          </div>
        </div>

        {/* Product mockup */}
        <div className="animate-fade-up relative mx-auto mt-16 max-w-5xl">
          <div className="absolute -inset-x-8 -top-8 bottom-0 -z-10 bg-gradient-brand-soft blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-warning/70" />
                <span className="h-3 w-3 rounded-full bg-success/70" />
              </div>
              <div className="ml-3 hidden rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground sm:block">
                app.devinsight.ai/dashboard
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
              {/* Left: AI PR review card */}
              <div className="sm:col-span-2 space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
                        <GitPullRequest className="h-4 w-4 text-primary" />
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">
                          #2841 · Add rate limiting to API
                        </p>
                        <p className="text-xs text-muted-foreground">
                          opened by @maya · 3 files changed
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Approved</Badge>
                  </div>
                  <div className="mt-3 space-y-2 rounded-lg bg-muted/60 p-3 text-left">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> AI Review Summary
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Clean implementation. Suggested adding a test for the 429 path and memoizing
                      the limiter. No security concerns detected.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Merge activity</p>
                    <Badge variant="brand">+38% this week</Badge>
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={activityData}
                        margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="d"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        />
                        <Tooltip
                          cursor={{ stroke: "var(--border)" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            fontSize: 12,
                            boxShadow: "var(--shadow-md)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          fill="url(#heroFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right: stats */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-background p-4 text-left">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <p className="text-sm font-medium text-muted-foreground">Repo health</p>
                  </div>
                  <p className="mt-2 font-display text-3xl font-extrabold text-foreground">94</p>
                  <p className="text-xs text-success">Excellent · +6 pts</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4 text-left">
                  <p className="text-sm font-medium text-muted-foreground">Open issues triaged</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-foreground">128</p>
                  <p className="text-xs text-muted-foreground">Auto-classified by AI</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4 text-left">
                  <p className="text-sm font-medium text-muted-foreground">Risks blocked</p>
                  <p className="mt-2 font-display text-3xl font-extrabold text-foreground">12</p>
                  <p className="text-xs text-destructive">3 critical resolved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
