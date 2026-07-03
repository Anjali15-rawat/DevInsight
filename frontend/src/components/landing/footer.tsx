import { ArrowRight, GitPullRequest, Github, Twitter, Linkedin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const columns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Security", "Integrations", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Customers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Community", "Status", "Guides"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "DPA", "SOC 2"],
  },
];

interface FooterProps {
  onBookDemo?: () => void;
}

export function Footer({ onBookDemo }: FooterProps) {
  return (
    <footer className="border-t border-border bg-background">
      {/* CTA */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="relative -mt-px overflow-hidden rounded-3xl bg-gradient-brand px-8 py-14 text-center shadow-glow sm:px-16 sm:py-20">
          <div className="bg-hero-glow pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Ship better software, faster
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
              Join thousands of engineering teams using DevInsight to automate reviews, catch risks,
              and understand their codebase.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="w-full border border-primary-foreground/20 bg-card text-foreground hover:bg-card/90 sm:w-auto"
                asChild
              >
                <Link to="/signup">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
                onClick={onBookDemo}
              >
                Book a demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="#top" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand">
                <GitPullRequest className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
                DevInsight
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Engineering Intelligence, Powered by AI. Automate reviews, monitor health, and
              understand your codebase.
            </p>
            <div className="mt-5 flex gap-2">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-bold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DevInsight, Inc. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">Built for engineering teams worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
