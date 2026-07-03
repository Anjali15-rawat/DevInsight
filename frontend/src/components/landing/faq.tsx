import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    q: "How does DevInsight connect to our repositories?",
    a: "Install the DevInsight GitHub App, choose which repos to grant access to, and you're live in under two minutes. We support both single repos and large multi-repo organizations.",
  },
  {
    q: "Will our source code be used to train AI models?",
    a: "Never. Your code is processed in isolated, encrypted contexts and is never used to train shared or public models. Enterprise plans add self-hosted inference and custom model controls.",
  },
  {
    q: "Which languages and frameworks are supported?",
    a: "DevInsight works with all major languages including TypeScript, Python, Go, Java, Rust, Ruby, and C#. The AI review and search capabilities are language-aware across your entire stack.",
  },
  {
    q: "How accurate are the AI pull request reviews?",
    a: "Our reviews focus on high-signal feedback — real bugs, security issues, performance problems, and missing tests. Teams typically see a 60% reduction in review time while catching more issues than manual review alone.",
  },
  {
    q: "Is DevInsight secure and compliant?",
    a: "Yes. We're SOC 2 Type II certified, support SSO/SAML and SCIM provisioning, provide full audit logs, and offer a self-hosted deployment option for the most sensitive environments.",
  },
  {
    q: "Can I change or cancel my plan anytime?",
    a: "Absolutely. Upgrade, downgrade, or cancel at any time directly from your dashboard. There are no long-term contracts on Starter or Pro plans.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-card py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <div className="text-center">
          <Badge variant="brand">FAQ</Badge>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about DevInsight. Can't find an answer?{" "}
            <a href="#" className="font-medium text-primary hover:underline">
              Talk to our team.
            </a>
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border border-border bg-background px-5"
            >
              <AccordionTrigger className="text-left text-[15px] font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
