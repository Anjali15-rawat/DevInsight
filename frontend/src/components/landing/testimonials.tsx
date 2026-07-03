import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "DevInsight cut our PR review time in half. The AI catches real bugs, not just style nits — it feels like having a staff engineer review every change.",
    name: "Maya Chen",
    role: "VP Engineering, Northwind",
    initials: "MC",
  },
  {
    quote:
      "The security detection paid for itself in the first week. It flagged a leaked key in a draft PR before it ever hit our main branch.",
    name: "Daniel Okafor",
    role: "Staff Security Engineer, Volt",
    initials: "DO",
  },
  {
    quote:
      "Our DORA metrics finally live in one place the whole org trusts. Leadership stopped asking for spreadsheets.",
    name: "Priya Nair",
    role: "Director of Platform, Lumen",
    initials: "PN",
  },
  {
    quote:
      "New engineers used to take weeks to get productive. With AI knowledge search they're shipping meaningful PRs on day three.",
    name: "Tomas Berg",
    role: "Engineering Manager, Drift",
    initials: "TB",
  },
  {
    quote:
      "Issue triage was a daily chore. Now everything is labeled, prioritized, and routed automatically. It's quietly magical.",
    name: "Aisha Rahman",
    role: "Tech Lead, Cascade",
    initials: "AR",
  },
  {
    quote:
      "The repo health score gave us a shared language for tech debt. We went from arguing to actually fixing things.",
    name: "Lucas Moreau",
    role: "CTO, Fathom",
    initials: "LM",
  },
];

export function Testimonials() {
  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-warning text-warning" />
            ))}
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Loved by engineering leaders
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Thousands of teams rely on DevInsight to ship with confidence every day.
          </p>
        </div>

        <div className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="break-inside-avoid rounded-2xl border border-border bg-background p-6 shadow-xs"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <blockquote className="text-[15px] leading-relaxed text-foreground">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
