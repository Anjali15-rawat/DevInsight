import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Search,
  ChevronDown,
  Plus,
  Sparkles,
  GitPullRequest,
  Check,
  Settings,
  Trash2,
  Copy,
} from "lucide-react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/design-system")({
  head: () => ({
    meta: [
      { title: "Design System — DevInsight" },
      {
        name: "description",
        content:
          "The DevInsight design system: color tokens, typography, spacing, radius, shadows, components, and guidelines.",
      },
    ],
  }),
  component: DesignSystem,
});

function DesignSystem() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <span className="flex items-center gap-2 font-display text-base font-extrabold text-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand">
              <GitPullRequest className="h-4 w-4 text-primary-foreground" />
            </span>
            DevInsight DS
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="max-w-2xl">
          <Badge variant="brand">Design System v1.0</Badge>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-foreground">
            DevInsight Design System
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A complete, production-ready foundation — tokens, components, and guidelines that power
            every surface of the DevInsight product.
          </p>
        </div>

        <div className="mt-16 space-y-20">
          <ColorPalette />
          <Typography />
          <Spacing />
          <RadiusSection />
          <Shadows />
          <Buttons />
          <Inputs />
          <Dropdowns />
          <BadgesTags />
          <Cards />
          <Tables />
          <Charts />
          <AnimationGuidelines />
          <ResponsiveSection />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ColorPalette() {
  const tokens = [
    { name: "Primary", hex: "#4F46E5", className: "bg-primary", fg: "text-primary-foreground" },
    {
      name: "Secondary",
      hex: "#3B82F6",
      className: "bg-secondary",
      fg: "text-secondary-foreground",
    },
    { name: "Accent", hex: "#8B5CF6", className: "bg-accent", fg: "text-accent-foreground" },
    { name: "Success", hex: "#22C55E", className: "bg-success", fg: "text-success-foreground" },
    {
      name: "Warning",
      hex: "#F59E0B",
      className: "bg-warning",
      fg: "[color:var(--warning-foreground)]",
    },
    {
      name: "Danger",
      hex: "#EF4444",
      className: "bg-destructive",
      fg: "text-destructive-foreground",
    },
  ];
  const neutrals = [
    { name: "Background", hex: "#F8FAFC", className: "bg-background" },
    { name: "Card", hex: "#FFFFFF", className: "bg-card" },
    { name: "Muted", hex: "#F1F5F9", className: "bg-muted" },
    { name: "Border", hex: "#E2E8F0", className: "bg-border" },
    { name: "Text", hex: "#0F172A", className: "bg-foreground" },
  ];
  return (
    <Section
      title="Color Palette"
      description="Semantic tokens defined in oklch. Never hardcode colors in components."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map((t) => (
          <div key={t.name} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className={`flex h-24 items-end p-4 ${t.className}`}>
              <span className={`font-display text-sm font-bold ${t.fg}`}>{t.name}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium text-foreground">{t.name}</span>
              <span className="font-mono text-muted-foreground">{t.hex}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {neutrals.map((n) => (
          <div key={n.name} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className={`h-16 ${n.className}`} />
            <div className="px-3 py-2.5 text-xs">
              <p className="font-medium text-foreground">{n.name}</p>
              <p className="font-mono text-muted-foreground">{n.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Typography() {
  return (
    <Section title="Typography" description="Plus Jakarta Sans for display, Inter for body and UI.">
      <div className="space-y-5 rounded-2xl border border-border bg-card p-8">
        {[
          {
            label: "Display / H1 · Plus Jakarta 800",
            cls: "font-display text-5xl font-extrabold tracking-tight",
            text: "Engineering Intelligence",
          },
          {
            label: "Heading / H2 · Plus Jakarta 700",
            cls: "font-display text-3xl font-bold tracking-tight",
            text: "Powered by AI",
          },
          {
            label: "Heading / H3 · Plus Jakarta 700",
            cls: "font-display text-xl font-bold",
            text: "Ship with confidence",
          },
          {
            label: "Body Large · Inter 400",
            cls: "text-lg text-muted-foreground",
            text: "DevInsight automatically reviews pull requests and surfaces risks.",
          },
          {
            label: "Body · Inter 400",
            cls: "text-base text-foreground",
            text: "Every PR gets an instant, context-aware AI review before merge.",
          },
          {
            label: "Small / Caption · Inter 500",
            cls: "text-sm font-medium text-muted-foreground",
            text: "Updated 3 minutes ago · 12 files changed",
          },
          {
            label: "Mono · code",
            cls: "font-mono text-sm text-foreground",
            text: "const limiter = createRateLimiter({ max: 100 })",
          },
        ].map((row) => (
          <div
            key={row.label}
            className="grid gap-1 border-b border-border pb-5 last:border-0 last:pb-0 sm:grid-cols-[200px_1fr] sm:gap-6"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {row.label}
            </span>
            <p className={row.cls}>{row.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Spacing() {
  const steps = [
    { name: "xs", size: "0.25rem", px: "4px", w: "w-1" },
    { name: "sm", size: "0.5rem", px: "8px", w: "w-2" },
    { name: "md", size: "1rem", px: "16px", w: "w-4" },
    { name: "lg", size: "1.5rem", px: "24px", w: "w-6" },
    { name: "xl", size: "2rem", px: "32px", w: "w-8" },
    { name: "2xl", size: "3rem", px: "48px", w: "w-12" },
    { name: "3xl", size: "4rem", px: "64px", w: "w-16" },
  ];
  return (
    <Section
      title="Spacing"
      description="A consistent 4px base scale keeps rhythm across the product."
    >
      <div className="space-y-3 rounded-2xl border border-border bg-card p-8">
        {steps.map((s) => (
          <div key={s.name} className="flex items-center gap-4">
            <span className="w-10 font-mono text-sm text-muted-foreground">{s.name}</span>
            <span className={`${s.w} h-6 rounded bg-gradient-brand`} />
            <span className="font-mono text-sm text-foreground">{s.size}</span>
            <span className="font-mono text-xs text-muted-foreground">{s.px}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RadiusSection() {
  const radii = [
    { name: "sm", cls: "rounded-sm" },
    { name: "md", cls: "rounded-md" },
    { name: "lg", cls: "rounded-lg" },
    { name: "xl", cls: "rounded-xl" },
    { name: "2xl", cls: "rounded-2xl" },
    { name: "full", cls: "rounded-full" },
  ];
  return (
    <Section title="Radius" description="Base radius of 0.75rem creates a soft, modern feel.">
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
        {radii.map((r) => (
          <div key={r.name} className="text-center">
            <div className={`mx-auto h-20 w-20 border-2 border-primary bg-primary/10 ${r.cls}`} />
            <p className="mt-2 font-mono text-xs text-muted-foreground">{r.name}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Shadows() {
  const shadows = [
    { name: "xs", cls: "shadow-xs" },
    { name: "sm", cls: "shadow-sm" },
    { name: "md", cls: "shadow-md" },
    { name: "lg", cls: "shadow-lg" },
    { name: "xl", cls: "shadow-xl" },
    { name: "glow", cls: "shadow-glow" },
  ];
  return (
    <Section
      title="Shadows"
      description="Layered elevation tokens, plus a branded glow for key CTAs."
    >
      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-muted/40 p-8 sm:grid-cols-3 lg:grid-cols-6">
        {shadows.map((s) => (
          <div key={s.name} className="text-center">
            <div
              className={`mx-auto grid h-20 w-20 place-items-center rounded-xl bg-card ${s.cls}`}
            >
              <span className="font-mono text-xs text-muted-foreground">{s.name}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Buttons() {
  return (
    <Section title="Buttons" description="Variants and sizes for every interaction context.">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="hero">
            <Sparkles className="h-4 w-4" /> Hero
          </Button>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
    </Section>
  );
}

function Inputs() {
  return (
    <Section title="Inputs" description="Accessible form controls with clear focus states.">
      <div className="grid gap-6 rounded-2xl border border-border bg-card p-8 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="you@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="search" className="pl-9" placeholder="Search repositories..." />
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="msg">Message</Label>
          <Textarea id="msg" placeholder="Describe the issue..." rows={3} />
        </div>
        <div className="flex items-center gap-3">
          <Switch id="notify" defaultChecked />
          <Label htmlFor="notify">Enable AI review notifications</Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="agree" defaultChecked />
          <Label htmlFor="agree">Auto-merge approved PRs</Label>
        </div>
      </div>
    </Section>
  );
}

function Dropdowns() {
  return (
    <Section title="Dropdowns & Selects" description="Menus and pickers built on Radix primitives.">
      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-card p-8">
        <div className="w-56">
          <Select defaultValue="health">
            <SelectTrigger>
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="health">Repository health</SelectItem>
              <SelectItem value="cycle">Cycle time</SelectItem>
              <SelectItem value="deploys">Deploy frequency</SelectItem>
              <SelectItem value="risks">Security risks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Actions <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Repository</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Section>
  );
}

function BadgesTags() {
  const tags = ["bug", "feature", "security", "performance", "docs", "good first issue"];
  return (
    <Section
      title="Badges & Tags"
      description="Status indicators and labels with semantic meaning."
    >
      <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">
            <Check className="h-3 w-3" /> Approved
          </Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Critical</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="muted">Draft</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Cards() {
  return (
    <Section title="Cards" description="The core container for grouping related content.">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
            <GitPullRequest className="h-5 w-5 text-primary" />
          </span>
          <h3 className="mt-4 font-display font-bold text-foreground">Basic card</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Border, soft shadow, rounded corners.
          </p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-lg">
          <Badge variant="brand">Featured</Badge>
          <h3 className="mt-4 font-display font-bold text-foreground">Elevated card</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Highlighted with primary border and lift.
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-gradient-brand p-6 shadow-glow">
          <h3 className="font-display font-bold text-primary-foreground">Gradient card</h3>
          <p className="mt-1 text-sm text-primary-foreground/85">
            For high-emphasis CTAs and banners.
          </p>
        </div>
      </div>
    </Section>
  );
}

function Tables() {
  const rows = [
    { repo: "core-api", health: 94, prs: 12, status: "success" as const, label: "Healthy" },
    { repo: "web-app", health: 81, prs: 8, status: "warning" as const, label: "Watch" },
    { repo: "billing", health: 67, prs: 5, status: "danger" as const, label: "At risk" },
    { repo: "mobile", health: 89, prs: 3, status: "success" as const, label: "Healthy" },
  ];
  return (
    <Section title="Tables" description="Dense, scannable data displays with status indicators.">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Repository</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Open PRs</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.repo}>
                <TableCell className="font-mono text-sm font-medium text-foreground">
                  {r.repo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand"
                        style={{ width: `${r.health}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{r.health}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.prs}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      r.status === "success"
                        ? "success"
                        : r.status === "warning"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {r.label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}

const lineData = [
  { d: "Mon", a: 24, b: 18 },
  { d: "Tue", a: 38, b: 28 },
  { d: "Wed", a: 31, b: 34 },
  { d: "Thu", a: 52, b: 40 },
  { d: "Fri", a: 47, b: 52 },
  { d: "Sat", a: 64, b: 48 },
  { d: "Sun", a: 73, b: 60 },
];

function Charts() {
  const tooltip = {
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontSize: 12,
    boxShadow: "var(--shadow-md)",
  };
  return (
    <Section title="Charts" description="Data visualization using the brand palette via recharts.">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Line</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip contentStyle={tooltip} />
                <Line
                  type="monotone"
                  dataKey="a"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="b"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Bar</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={tooltip} />
                <Bar dataKey="a" fill="var(--secondary)" radius={[5, 5, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Area</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dsArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="d"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip contentStyle={tooltip} />
                <Area
                  type="monotone"
                  dataKey="a"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#dsArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Section>
  );
}

function AnimationGuidelines() {
  const [hover, setHover] = useState(false);
  return (
    <Section
      title="Animation Guidelines"
      description="Motion should be purposeful, fast, and consistent."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-8">
          <Principle label="Duration" value="150–250ms for UI, 400–600ms for entrances" />
          <Principle label="Easing" value="cubic-bezier(0.16, 1, 0.3, 1) — smooth, natural" />
          <Principle label="Hover" value="Subtle lift (-translate-y) + shadow increase" />
          <Principle label="Entrance" value="fade-up on scroll, never jarring" />
          <Principle label="Respect" value="Honor prefers-reduced-motion" />
        </div>
        <div className="grid place-items-center gap-6 rounded-2xl border border-border bg-muted/40 p-8">
          <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={`rounded-xl bg-gradient-brand px-6 py-4 font-display font-bold text-primary-foreground transition-all duration-200 ${
              hover ? "-translate-y-1 shadow-glow" : "shadow-sm"
            }`}
          >
            Hover me
          </button>
          <div className="flex gap-4">
            <span className="grid h-12 w-12 animate-float place-items-center rounded-xl bg-card shadow-md">
              <Sparkles className="h-5 w-5 text-accent" />
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-card shadow-md">
              <span className="h-6 w-6 animate-pulse rounded-full bg-gradient-brand" />
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Float · Pulse · Lift on hover</p>
        </div>
      </div>
    </Section>
  );
}

function Principle({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      <div>
        <span className="font-semibold text-foreground">{label}: </span>
        <span className="text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function ResponsiveSection() {
  const breakpoints = [
    { name: "sm", size: "640px", use: "Large phones" },
    { name: "md", size: "768px", use: "Tablets" },
    { name: "lg", size: "1024px", use: "Laptops" },
    { name: "xl", size: "1280px", use: "Desktops" },
    { name: "2xl", size: "1536px", use: "Large displays" },
  ];
  return (
    <Section
      title="Responsive Design"
      description="Mobile-first breakpoints with fluid, content-aware layouts."
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Breakpoint</TableHead>
              <TableHead>Min width</TableHead>
              <TableHead>Typical device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakpoints.map((b) => (
              <TableRow key={b.name}>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                    {b.name}
                  </code>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{b.size}</TableCell>
                <TableCell className="text-sm text-foreground">{b.use}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Layouts use CSS grid and flexbox with{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">min-w-0</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">truncate</code> guards so
        text and widgets survive every viewport.
      </p>
    </Section>
  );
}
