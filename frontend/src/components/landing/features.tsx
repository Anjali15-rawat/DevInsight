import { GitPullRequest, Tags, Activity, ShieldAlert, Search, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: GitPullRequest,
    title: "AI Pull Request Reviews",
    desc: "Every PR gets an instant, context-aware review — bugs, style, performance, and test gaps flagged before a human even looks.",
    accent: "primary",
  },
  {
    icon: Tags,
    title: "Smart Issue Classification",
    desc: "Incoming GitHub issues are auto-labeled, prioritized, and routed to the right team based on content and history.",
    accent: "secondary",
  },
  {
    icon: Activity,
    title: "Repository Health Monitoring",
    desc: "A live health score from coverage, churn, review latency, and flaky tests — so regressions surface early.",
    accent: "success",
  },
  {
    icon: ShieldAlert,
    title: "Security Risk Detection",
    desc: "Scan diffs for leaked secrets, vulnerable dependencies, and risky patterns with severity-ranked alerts.",
    accent: "destructive",
  },
  {
    icon: Search,
    title: "AI Knowledge Search",
    desc: "Ask questions in plain English across code, PRs, docs, and discussions. Get cited answers in seconds.",
    accent: "accent",
  },
  {
    icon: BarChart3,
    title: "Engineering Analytics",
    desc: "Cycle time, deployment frequency, and DORA metrics in dashboards your whole org can actually trust.",
    accent: "warning",
  },
] as const;

const accentMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  success: "bg-success/12 text-success",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/15 text-warning",
};

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="brand">Features</Badge>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            One platform for the entire engineering workflow
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Six AI capabilities working together to remove busywork and keep quality high — from the
            first commit to production.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-xl ${accentMap[f.accent]} transition-transform duration-300 group-hover:scale-110`}
              >
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
