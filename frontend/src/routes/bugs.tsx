import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Flame,
  ChevronRight,
  Layers,
  BarChart2,
  Users,
  Copy,
  AlertCircle,
  FileCode,
  Tag,
  Plus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/bugs")({
  component: BugsComponent,
});

// Mock realistic engineering bugs data
export interface MockBug {
  id: string;
  number: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "Triage" | "Backlog" | "In Progress" | "Resolved";
  category: "Database" | "Hydration" | "Security" | "Performance" | "Auth";
  repo: string;
  assignee: {
    name: string;
    avatar: string;
  };
  resolutionTime: string;
  createdAt: string;
  description: string;
}

export const mockBugs: MockBug[] = [
  {
    id: "bug-1",
    number: "BUG-101",
    title: "Database transaction lock occurs under high API concurrent volume",
    priority: "P0",
    status: "In Progress",
    category: "Database",
    repo: "core-api",
    assignee: {
      name: "David Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    resolutionTime: "Pending",
    createdAt: "1 day ago",
    description:
      "Concurrent select statements with locking in context verification lead to transaction queue locking under heavy load.",
  },
  {
    id: "bug-2",
    number: "BUG-102",
    title: "Hydration mismatch warning on toggling collapsed sidebar layout",
    priority: "P2",
    status: "Triage",
    category: "Hydration",
    repo: "web-dashboard",
    assignee: {
      name: "Anjali Sharma",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    resolutionTime: "45m est",
    createdAt: "3 days ago",
    description:
      "Vite dev server SSR loads the layout context before LocalStorage is hydrated, leading to mismatched layout classes.",
  },
  {
    id: "bug-3",
    number: "BUG-103",
    title: "Axios prototype vulnerability in package.json dependencies list",
    priority: "P1",
    status: "Backlog",
    category: "Security",
    repo: "web-dashboard",
    assignee: {
      name: "Marcus Vance",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    resolutionTime: "15m est",
    createdAt: "4 days ago",
    description:
      "CVE-2023-4585 allows Server-Side Request Forgery inside axios client library. Upgrade to version >= 1.6.0 required.",
  },
  {
    id: "bug-4",
    number: "BUG-104",
    title: "Redundant indexing loop delays repository triage actions",
    priority: "P3",
    status: "Resolved",
    category: "Performance",
    repo: "ai-analyst-agent",
    assignee: {
      name: "Marcus Vance",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    resolutionTime: "2.4 hrs",
    createdAt: "Yesterday",
    description:
      "Redundant loop check over commits history indexing inside scheduling script was refactored with map cache lookups.",
  },
];

const mockAnalytics = [
  { sprint: "Sprint 1", fixed: 12, logged: 14, resolutionAvg: 3.4 },
  { sprint: "Sprint 2", fixed: 18, logged: 15, resolutionAvg: 2.8 },
  { sprint: "Sprint 3", fixed: 16, logged: 20, resolutionAvg: 4.1 },
  { sprint: "Sprint 4", fixed: 22, logged: 12, resolutionAvg: 1.9 },
];

const mockDuplicates = [
  {
    original: "BUG-101 (Database transaction lock)",
    duplicates: [
      {
        id: "dup-1",
        number: "BUG-105",
        title: "API timeout under checkout load test in db connection pool",
        similarity: "94%",
        created: "2 hrs ago",
      },
      {
        id: "dup-2",
        number: "BUG-108",
        title: "Go goroutine deadlock inside pool queries wrapper",
        similarity: "88%",
        created: "5 mins ago",
      },
    ],
  },
];

function BugsComponent() {
  const [activeTab, setActiveTab] = useState<"issues" | "analytics" | "duplicates">("issues");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: remoteBugs } = useQuery({
    queryKey: queryKeys.bugs.list(1),
    queryFn: () => apiFetch<any[]>("/api/v1/bugs?workspace_id=1"),
    staleTime: 60 * 1000,
  });

  const activeBugs = useMemo(() => {
    if (!remoteBugs || remoteBugs.length === 0) return mockBugs;
    return remoteBugs.map((b: any) => ({
      id: `bug-${b.id}`,
      number: `BUG-${b.issue_number}`,
      title: b.title,
      priority: b.priority || "P1",
      status: b.status || "Triage",
      category: b.category || "Database",
      repo: b.repository || "core-api",
      assignee: {
        name: b.assignee?.name || "Developer",
        avatar:
          b.assignee?.avatar_url ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      resolutionTime: "Pending",
      createdAt: "Recently",
      description: b.body || "AI triage analysis completed.",
    }));
  }, [remoteBugs]);

  const filteredBugs = useMemo(() => {
    let result = [...activeBugs];

    if (search) {
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.number.toLowerCase().includes(search.toLowerCase()) ||
          b.repo.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (priorityFilter !== "all") {
      result = result.filter((b) => b.priority === priorityFilter);
    }

    return result;
  }, [search, priorityFilter]);

  const p0Count = mockBugs.filter((b) => b.priority === "P0").length;
  const p1Count = mockBugs.filter((b) => b.priority === "P1").length;

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5 gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Bug Intelligence
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor active crashes, diagnostic errors, duplicate Sentry logs, and tracking
              analytics.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {p0Count > 0 && (
              <Badge
                variant="destructive"
                className="animate-pulse py-1 px-2.5 flex items-center gap-1"
              >
                <Flame className="h-3.5 w-3.5" /> {p0Count} P0 Incident
              </Badge>
            )}
            <Button
              variant="hero"
              size="sm"
              onClick={() => alert("Simulation: Log new bug issue form")}
              className="cursor-pointer font-semibold text-xs h-9"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create Issue
            </Button>
          </div>
        </div>

        {/* Sub nav tabs */}
        <div className="flex items-center border-b border-border/50 pb-px scrollbar-none overflow-x-auto">
          <nav className="flex space-x-2">
            {[
              {
                id: "issues",
                label: "Active Issues",
                count: mockBugs.filter((b) => b.status !== "Resolved").length,
              },
              { id: "analytics", label: "Bug Diagnostics Analytics" },
              {
                id: "duplicates",
                label: "Duplicate Detections",
                count: mockDuplicates.reduce((acc, curr) => acc + curr.duplicates.length, 0),
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Dynamic Display Grid */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: ACTIVE ISSUES */}
              {activeTab === "issues" && (
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-card/30 p-3 rounded-lg border border-border/40 backdrop-blur-md">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search bugs by code or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-background/50 border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
                      <span className="text-muted-foreground font-medium shrink-0">Priority:</span>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-background/80 border border-border/60 rounded-md px-2.5 py-1.5 font-semibold text-foreground text-xs cursor-pointer focus:outline-none w-full sm:w-auto"
                      >
                        <option value="all">All Priorities</option>
                        <option value="P0">P0 Critical</option>
                        <option value="P1">P1 High</option>
                        <option value="P2">P2 Medium</option>
                        <option value="P3">P3 Low</option>
                      </select>
                    </div>
                  </div>

                  {/* List / Table (Linear style) */}
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md overflow-hidden">
                    <div className="divide-y divide-border/20">
                      {filteredBugs.length === 0 ? (
                        <div className="py-16 text-center">
                          <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-foreground">
                            No bug incidents found
                          </p>
                        </div>
                      ) : (
                        filteredBugs.map((bug) => (
                          <div
                            key={bug.id}
                            className="p-4 hover:bg-muted/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                            onClick={() =>
                              alert(`Navigating to bug details simulator for ${bug.number}`)
                            }
                          >
                            <div className="space-y-1.5 text-left min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <code className="font-mono text-3xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {bug.number}
                                </code>
                                <Badge
                                  variant={
                                    bug.priority === "P0"
                                      ? "destructive"
                                      : bug.priority === "P1"
                                        ? "warning"
                                        : "outline"
                                  }
                                  className="text-[9px] py-0 px-1.5 uppercase font-semibold scale-90"
                                >
                                  {bug.priority}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1.5 uppercase font-semibold scale-90"
                                >
                                  {bug.category}
                                </Badge>
                                <span className="text-3xs text-muted-foreground">{bug.repo}</span>
                              </div>
                              <Link
                                to={`/bug/${bug.id}`}
                                className="font-display text-sm font-bold text-foreground hover:text-primary transition-colors hover:underline truncate block"
                              >
                                {bug.title}
                              </Link>
                              <div className="flex items-center gap-2 text-3xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5">
                                  <img
                                    src={bug.assignee.avatar}
                                    alt={bug.assignee.name}
                                    className="h-4.5 w-4.5 rounded-full border border-border/40"
                                  />
                                  {bug.assignee.name}
                                </span>
                                <span>· Opened {bug.createdAt}</span>
                                {bug.status === "Resolved" && (
                                  <span className="text-success font-semibold flex items-center gap-0.5">
                                    <CheckCircle2 className="h-3 w-3" /> Resolved in{" "}
                                    {bug.resolutionTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end w-full sm:w-auto border-t sm:border-t-0 border-border/10 pt-2 sm:pt-0">
                              <Badge variant="outline" className="text-3xs font-semibold">
                                {bug.status}
                              </Badge>
                              <Button
                                variant="outline"
                                size="xs"
                                asChild
                                className="cursor-pointer font-semibold text-[10px] h-7 px-2"
                              >
                                <Link to={`/bug/${bug.id}`}>
                                  Diag Code <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 2: BUG DIAGNOSTICS ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md pr-2">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Bug Resolution Trends</CardTitle>
                      <CardDescription>Bugs logged vs fixed per active sprints</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mockAnalytics}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="sprint"
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs"
                          />
                          <YAxis
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-popover)",
                              borderColor: "var(--color-border)",
                              fontSize: "12px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="logged"
                            stroke="var(--destructive)"
                            strokeWidth={2.5}
                            name="Logged"
                          />
                          <Line
                            type="monotone"
                            dataKey="fixed"
                            stroke="var(--success)"
                            strokeWidth={2.5}
                            name="Fixed"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/30 backdrop-blur-md pr-2">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">
                        Average Resolution Time (hrs)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={mockAnalytics}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="sprint"
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs"
                          />
                          <YAxis
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-popover)",
                              borderColor: "var(--color-border)",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="resolutionAvg"
                            fill="var(--accent)"
                            name="Resolution Hours"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 3: DUPLICATE DETECTIONS */}
              {activeTab === "duplicates" && (
                <div className="space-y-6">
                  {mockDuplicates.map((group, idx) => (
                    <Card
                      key={idx}
                      className="border-border/50 bg-card/30 backdrop-blur-md text-left"
                    >
                      <CardHeader className="border-b border-border/20 bg-muted/20">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-primary" /> Target Reference Alert:{" "}
                          {group.original}
                        </CardTitle>
                        <CardDescription className="text-3xs">
                          AI grouping has isolated highly related Sentry crashes containing
                          identical stack signatures.
                        </CardDescription>
                      </CardHeader>
                      <div className="divide-y divide-border/20">
                        {group.duplicates.map((dup) => (
                          <div
                            key={dup.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-3xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {dup.number}
                                </span>
                                <span className="font-bold text-xs text-foreground">
                                  {dup.title}
                                </span>
                              </div>
                              <span className="text-3xs text-muted-foreground block">
                                Logged {dup.created}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant="brand" className="text-3xs font-semibold px-2 py-0.5">
                                {dup.similarity} similarity
                              </Badge>
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() =>
                                  alert(
                                    `Merging issue ${dup.number} under parent ${group.original}`,
                                  )
                                }
                                className="cursor-pointer text-[10px] h-7 px-2.5"
                              >
                                Merge Duplicate
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
