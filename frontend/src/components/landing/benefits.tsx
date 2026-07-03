import { Clock, TrendingUp, ShieldCheck, Users } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    stat: "60%",
    title: "Less time in review",
    desc: "AI handles the first pass on every PR so engineers focus on judgment, not nitpicks.",
  },
  {
    icon: TrendingUp,
    stat: "2.4×",
    title: "Faster cycle time",
    desc: "Automated triage and routing means work flows to the right person instantly.",
  },
  {
    icon: ShieldCheck,
    stat: "98%",
    title: "Risks caught early",
    desc: "Security and quality issues surface in the diff — before they ever reach production.",
  },
  {
    icon: Users,
    stat: "10k+",
    title: "Engineers onboarded",
    desc: "New hires ship in days using AI knowledge search across your entire codebase.",
  },
];

export function Benefits() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Built to make great teams
              <span className="text-gradient"> measurably better</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              DevInsight doesn't just automate tasks — it changes the economics of engineering.
              Teams ship more, break less, and spend their energy on the work that matters.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Plugs into GitHub in under two minutes",
                "Works across mono-repos and multi-repo orgs",
                "SOC 2 Type II, SSO, and granular permissions",
                "Your code never trains shared models",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/15">
                    <span className="h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="text-[15px] text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className={`rounded-2xl border border-border bg-card p-6 shadow-xs ${
                  i % 2 === 1 ? "sm:mt-8" : ""
                }`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand">
                  <b.icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <p className="mt-4 font-display text-3xl font-extrabold text-foreground">
                  {b.stat}
                </p>
                <p className="mt-1 font-semibold text-foreground">{b.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
