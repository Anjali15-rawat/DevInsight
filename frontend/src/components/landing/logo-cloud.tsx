const logos = ["Vercel", "Linear", "Stripe", "Notion", "GitHub", "Supabase", "Datadog", "Ramp"];

export function LogoCloud() {
  return (
    <section className="border-y border-border bg-card/50 py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Trusted by engineering teams at fast-moving companies
        </p>
        <div className="mt-8 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-center font-display text-xl font-bold text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
