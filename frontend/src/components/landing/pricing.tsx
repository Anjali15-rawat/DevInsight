import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    desc: "For individuals and small side projects.",
    cta: "Start free",
    variant: "outline" as const,
    features: [
      "Up to 3 repositories",
      "AI PR reviews (100/mo)",
      "Issue classification",
      "Basic repo health score",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/user/mo",
    desc: "For growing teams shipping fast.",
    cta: "Start 14-day trial",
    variant: "hero" as const,
    popular: true,
    features: [
      "Unlimited repositories",
      "Unlimited AI PR reviews",
      "Security risk detection",
      "AI knowledge search",
      "Engineering analytics & DORA",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For organizations with scale and compliance needs.",
    cta: "Contact sales",
    variant: "outline" as const,
    features: [
      "Everything in Pro",
      "SSO/SAML & SCIM",
      "SOC 2 & audit logs",
      "Self-hosted option",
      "Dedicated success manager",
      "Custom AI model controls",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="brand">Pricing</Badge>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when your team is ready. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-8 transition-all",
                plan.popular
                  ? "border-primary/40 shadow-xl lg:-translate-y-3"
                  : "border-border shadow-xs",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-4xl font-extrabold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <Button variant={plan.variant} size="lg" className="mt-6">
                {plan.cta}
              </Button>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
