import { useState } from "react";
import {
  GitPullRequest,
  ShieldAlert,
  BarChart3,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "review", label: "PR Review", icon: GitPullRequest },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "search", label: "AI Search", icon: Search },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

const analyticsData = [
  { name: "W1", deploys: 18 },
  { name: "W2", deploys: 27 },
  { name: "W3", deploys: 24 },
  { name: "W4", deploys: 41 },
  { name: "W5", deploys: 36 },
  { name: "W6", deploys: 52 },
];

export function ProductDemo() {
  const [active, setActive] = useState<TabId>("review");

  return (
    <section id="product" className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="accent">Product</Badge>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            See DevInsight in action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A unified workspace where AI does the heavy lifting and your team stays in flow.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                active === tab.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
          <div className="border-b border-border bg-muted/40 px-5 py-3 text-sm font-medium text-muted-foreground">
            {tabs.find((t) => t.id === active)?.label} workspace
          </div>
          <div className="p-6 sm:p-8">
            {active === "review" && <ReviewPanel />}
            {active === "security" && <SecurityPanel />}
            {active === "search" && <SearchPanel />}
            {active === "analytics" && <AnalyticsPanel />}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewPanel() {
  return (
    <div className="grid gap-4 animate-fade-in">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-foreground">#3120 · Refactor auth middleware</p>
          <Badge variant="warning">Changes requested</Badge>
        </div>
        <div className="mt-4 space-y-3">
          <ReviewLine
            tone="danger"
            icon={AlertTriangle}
            file="auth.ts:42"
            text="Token compared with == instead of timing-safe equality. Potential side-channel."
          />
          <ReviewLine
            tone="warning"
            icon={AlertTriangle}
            file="session.ts:88"
            text="Session TTL not refreshed on activity — users may be logged out mid-task."
          />
          <ReviewLine
            tone="success"
            icon={CheckCircle2}
            file="auth.test.ts"
            text="Good coverage added for expired-token path. Nice work."
          />
        </div>
      </div>
      <div className="rounded-xl bg-gradient-brand-soft p-4 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> AI recommendation
        </p>
        <p className="mt-1 text-muted-foreground">
          Block merge until the timing-safe comparison is fixed. Estimated review time saved: 22
          minutes.
        </p>
      </div>
    </div>
  );
}

function ReviewLine({
  tone,
  icon: Icon,
  file,
  text,
}: {
  tone: "danger" | "warning" | "success";
  icon: typeof AlertTriangle;
  file: string;
  text: string;
}) {
  const toneMap = {
    danger: "text-destructive",
    warning: "text-warning",
    success: "text-success",
  };
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background p-3">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", toneMap[tone])} />
      <div>
        <p className="font-mono text-xs text-muted-foreground">{file}</p>
        <p className="text-sm text-foreground">{text}</p>
      </div>
    </div>
  );
}

function SecurityPanel() {
  const risks = [
    { sev: "Critical", label: "Hardcoded AWS secret key", file: "config/prod.ts", v: "danger" },
    {
      sev: "High",
      label: "lodash 4.17.11 — prototype pollution",
      file: "package.json",
      v: "danger",
    },
    {
      sev: "Medium",
      label: "Missing CSRF token on /transfer",
      file: "routes/api.ts",
      v: "warning",
    },
    { sev: "Low", label: "Verbose error stack exposed", file: "server.ts", v: "muted" },
  ] as const;
  return (
    <div className="space-y-3 animate-fade-in">
      {risks.map((r) => (
        <div
          key={r.label}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert
              className={cn(
                "h-5 w-5 shrink-0",
                r.v === "danger"
                  ? "text-destructive"
                  : r.v === "warning"
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{r.label}</p>
              <p className="font-mono text-xs text-muted-foreground">{r.file}</p>
            </div>
          </div>
          <Badge variant={r.v === "danger" ? "danger" : r.v === "warning" ? "warning" : "muted"}>
            {r.sev}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function SearchPanel() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-foreground">How do we handle Stripe webhook retries?</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Answer
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Webhook retries are idempotent via the{" "}
          <span className="font-mono text-foreground">event.id</span> dedupe table in{" "}
          <span className="font-mono text-foreground">billing/webhooks.ts</span>. Failed events
          retry with exponential backoff for 72 hours before alerting #payments.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["billing/webhooks.ts", "PR #2204", "docs/payments.md"].map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground"
            >
              {s}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const stats = [
    { label: "Deploy frequency", value: "52/wk", change: "+44%" },
    { label: "Lead time", value: "3.2h", change: "-28%" },
    { label: "Change fail rate", value: "4.1%", change: "-1.6pt" },
  ];
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-foreground">{s.value}</p>
            <p className="text-xs text-success">{s.change} vs last quarter</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Deployments per week</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                  boxShadow: "var(--shadow-md)",
                }}
              />
              <Bar dataKey="deploys" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
