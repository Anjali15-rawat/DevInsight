import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Code2,
  Lock,
  GitBranch,
  Search,
  ExternalLink,
  RefreshCw,
  Plus,
  Zap,
  Activity,
  Bug,
  BookOpen,
  ArrowUpRight,
  Users,
  Terminal,
  Play,
  Check,
  ChevronRight,
  FileCode,
  Flame,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Line,
  LineChart,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mockRepositories, mockPullRequests, mockActivities } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/dashboard")({
  component: DashboardComponent,
});

// Mock Analytics Data
const trendData = [
  { day: "Mon", prs: 14, bugs: 4, activity: 112 },
  { day: "Tue", prs: 19, bugs: 5, activity: 140 },
  { day: "Wed", prs: 28, bugs: 2, activity: 204 },
  { day: "Thu", prs: 22, bugs: 6, activity: 165 },
  { day: "Fri", prs: 31, bugs: 3, activity: 220 },
  { day: "Sat", prs: 8, bugs: 1, activity: 75 },
  { day: "Sun", prs: 12, bugs: 2, activity: 90 },
];

const mockAiAgents = [
  {
    id: "ag-1",
    name: "PR Review Agent",
    status: "idle",
    description: "Scans new pull requests for logic errors and style alignment.",
    lastActive: "5 mins ago",
  },
  {
    id: "ag-2",
    name: "Security Scanner",
    status: "running",
    description: "Auditing dependencies and code patterns for secret leakage or vulnerabilities.",
    lastActive: "Active now",
  },
  {
    id: "ag-3",
    name: "Issue Triager",
    status: "idle",
    description: "Classifies, labels, and assigns incoming issues based on repository context.",
    lastActive: "1 hr ago",
  },
];

const mockAiRecommendations = [
  {
    id: "rec-1",
    title: "Optimize DB Queries in core-api",
    severity: "high",
    description:
      "We identified redundant SELECT operations inside loops on `get_user.go:88`. Suggest refactoring to batch load.",
    savings: "8h review time",
  },
  {
    id: "rec-2",
    title: "Upgrade dependency minimist",
    severity: "medium",
    description:
      "Prototype pollution vulnerability detected. Upgrade minimist to version v1.2.8 or above.",
    savings: "Security patch",
  },
  {
    id: "rec-3",
    title: "Reduce cognitive complexity",
    severity: "low",
    description:
      "`auth_helper.py` has cyclomatic complexity of 18. Split nested authentication loops into pure utility functions.",
    savings: "Clean code",
  },
];

const mockDeveloperActivity = [
  {
    name: "Anjali Sharma",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    reviews: 24,
    prs: 11,
    time: "45m avg",
  },
  {
    name: "Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    reviews: 18,
    prs: 8,
    time: "1.2h avg",
  },
  {
    name: "David Chen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    reviews: 15,
    prs: 14,
    time: "1.8h avg",
  },
];

// Heat map grid for repository health map (Linear style)
const mockHealthMap = [
  { name: "/core/auth", score: 98, status: "healthy" },
  { name: "/core/db", score: 76, status: "warning" },
  { name: "/api/v1", score: 92, status: "healthy" },
  { name: "/api/v2", score: 94, status: "healthy" },
  { name: "/ui/components", score: 88, status: "healthy" },
  { name: "/ui/hooks", score: 62, status: "critical" },
  { name: "/utils/crypto", score: 99, status: "healthy" },
  { name: "/utils/logger", score: 90, status: "healthy" },
  { name: "/jobs/cron", score: 82, status: "warning" },
  { name: "/tests/mock", score: 95, status: "healthy" },
];

function DashboardComponent() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState(mockAiAgents);
  const [activeMetric, setActiveMetric] = useState<"prs" | "bugs">("prs");

  const { data: bffData, refetch: refetchBff } = useQuery({
    queryKey: queryKeys.bff.dashboard(1),
    queryFn: () => apiFetch<any>("/api/v1/bff/dashboard?workspace_id=1"),
    staleTime: 60 * 1000,
  });

  const healthMapData = useMemo(() => {
    if (bffData?.health_map && bffData.health_map.length > 0) {
      return bffData.health_map.map((r: any) => ({
        name: r.name,
        score: Math.round(r.health_score || 0),
        status: r.health_score >= 90 ? "healthy" : r.health_score >= 80 ? "warning" : "critical",
      }));
    }
    return mockHealthMap;
  }, [bffData]);

  const activeRecommendations = useMemo(() => {
    if (bffData?.ai_recommendations && bffData.ai_recommendations.length > 0) {
      return bffData.ai_recommendations.map((rec: any) => ({
        id: String(rec.id),
        title: rec.title,
        severity: rec.severity,
        description: rec.description,
        savings: rec.savings || "AI Analysis",
      }));
    }
    return mockAiRecommendations;
  }, [bffData]);

  const monitoredRepos = useMemo(() => {
    if (bffData?.health_map && bffData.health_map.length > 0) {
      return bffData.health_map.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        healthScore: Math.round(r.health_score || 0),
        openPRs: r.open_prs_count || 0,
        insights: {
          prReviewTime: "1.2h avg",
        },
        stars: r.stars || 0,
        languageColor: r.language_color || "#3178C6",
      }));
    }
    return mockRepositories;
  }, [bffData]);

  const activeDevelopers = useMemo(() => {
    if (bffData?.developer_activity && bffData.developer_activity.length > 0) {
      return bffData.developer_activity.map((d: any) => ({
        name: d.display_name || d.github_login,
        avatar: d.avatar_url || `https://github.com/${d.github_login}.png`,
        reviews: d.reviews_given || 0,
        prs: d.prs_merged || 0,
        time: d.avg_response_time_minutes
          ? `${Math.round(d.avg_response_time_minutes)}m avg`
          : "45m avg",
      }));
    }
    return mockDeveloperActivity;
  }, [bffData]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  };

  const runAgentScan = (id: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id ? { ...agent, status: "running", lastActive: "Active now" } : agent,
      ),
    );
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === id ? { ...agent, status: "idle", lastActive: "Just completed scan" } : agent,
        ),
      );
    }, 3000);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 p-5 sm:p-8 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[320px]" />
            </div>
            <Skeleton className="h-9 w-[120px]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left"
      >
        {/* Page Title & Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-3xs font-bold uppercase tracking-wider text-muted-foreground">
                AI Pipeline Status: All Scans Active
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 mt-1">
              Engineering Intelligence Dashboard{" "}
              <Sparkles className="h-5 w-5 text-accent animate-float" />
            </h1>
            <p className="text-sm text-muted-foreground">
              Automated PR analysis, repository health, security warnings, and developer cycles.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                simulateLoading();
                refetchBff();
              }}
              className="cursor-pointer border-border/80 bg-background/50 hover:bg-muted"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reload Data
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => alert("Quick scan analysis triggered on repositories.")}
              className="cursor-pointer"
            >
              <Play className="mr-2 h-4 w-4" /> Run Quick Audit
            </Button>
          </div>
        </div>

        {/* TOP LEVEL INDEX WIDGETS (Linear & Vercel grid style) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants} className="group">
            <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-border hover:bg-card shadow-2xs hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                  Repository Health Score
                </CardTitle>
                <div className="grid h-6 w-6 place-items-center rounded-md bg-success/15">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                  {bffData?.overview?.avg_health_score !== undefined
                    ? `${Math.round(bffData.overview.avg_health_score)}%`
                    : "92%"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-3xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="font-semibold text-success">+1.5%</span> this sprint
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-border hover:bg-card shadow-2xs hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                  Technical Debt
                </CardTitle>
                <div className="grid h-6 w-6 place-items-center rounded-md bg-warning/15">
                  <Flame className="h-4 w-4 text-warning" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                  {bffData?.overview?.avg_health_score !== undefined
                    ? bffData.overview.avg_health_score >= 90
                      ? "A Grade"
                      : bffData.overview.avg_health_score >= 80
                        ? "B Grade"
                        : "C Grade"
                    : "A- Grade"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-3xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {bffData?.overview?.estimated_hours_saved_this_month !== undefined
                      ? `${bffData.overview.estimated_hours_saved_this_month}h`
                      : "22.4h"}
                  </span>{" "}
                  saved this month
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-border hover:bg-card shadow-2xs hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                  Security Risks
                </CardTitle>
                <div className="grid h-6 w-6 place-items-center rounded-md bg-destructive/15">
                  <Lock className="h-4 w-4 text-destructive animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                  {bffData?.overview?.total_security_alerts_unresolved !== undefined
                    ? `${bffData.overview.total_security_alerts_unresolved} Alerts`
                    : "1 CVE"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-3xs text-muted-foreground">
                  <span className="font-semibold text-destructive">
                    {bffData?.overview?.critical_findings_unresolved !== undefined
                      ? `${bffData.overview.critical_findings_unresolved} critical`
                      : "Medium impact"}
                  </span>{" "}
                  vulnerability risk
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-border hover:bg-card shadow-2xs hover:shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">
                  Open PRs / Connected Repos
                </CardTitle>
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/15">
                  <GitPullRequest className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold font-display tracking-tight text-foreground">
                  {bffData?.overview?.total_open_prs !== undefined
                    ? `${bffData.overview.total_open_prs} Open`
                    : "19 / 4"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-3xs text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {bffData?.overview?.total_repositories !== undefined
                      ? `${bffData.overview.total_repositories} connected`
                      : "3 critical bugs"}
                  </span>{" "}
                  repositories
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* INTERACTIVE TREND GRAPH & HEALTH MAP */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart Card */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-border/50 bg-card/40 backdrop-blur-md h-full flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-bold">
                    Repository Activity & Trends
                  </CardTitle>
                  <CardDescription>
                    Visualizing code contribution velocity and bugs resolved
                  </CardDescription>
                </div>
                <div className="flex bg-muted p-0.5 rounded-lg border border-border/40 shrink-0">
                  <button
                    onClick={() => setActiveMetric("prs")}
                    className={`px-2.5 py-1 text-3xs font-semibold rounded-md transition-all ${
                      activeMetric === "prs"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    Pull Requests
                  </button>
                  <button
                    onClick={() => setActiveMetric("bugs")}
                    className={`px-2.5 py-1 text-3xs font-semibold rounded-md transition-all ${
                      activeMetric === "bugs"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    Bugs Logged
                  </button>
                </div>
              </CardHeader>
              <CardContent className="h-[260px] pr-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="activityGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
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
                    <Area
                      type="monotone"
                      dataKey={activeMetric === "prs" ? "prs" : "bugs"}
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fill="url(#metricGlow)"
                      name={activeMetric === "prs" ? "Pull Requests" : "Critical Bugs"}
                    />
                    <Area
                      type="monotone"
                      dataKey="activity"
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                      fill="url(#activityGlow)"
                      name="Commit Velocity"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Repository Health Map (Linear style code module grid) */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 bg-card/40 backdrop-blur-md h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold">Repository Health Map</CardTitle>
                <CardDescription>
                  Code modules coverage and complex functions risk level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {healthMapData.map((mod, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1 text-left ${
                        mod.status === "healthy"
                          ? "bg-success/5 border-success/20 hover:bg-success/10"
                          : mod.status === "warning"
                            ? "bg-warning/5 border-warning/20 hover:bg-warning/10"
                            : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                      } transition-all duration-300 cursor-pointer`}
                      onClick={() =>
                        alert(`Reviewing path coverage for ${mod.name}: Coverage ${mod.score}%`)
                      }
                    >
                      <span className="font-mono text-3xs text-muted-foreground truncate">
                        {mod.name}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">{mod.score}%</span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            mod.status === "healthy"
                              ? "bg-success"
                              : mod.status === "warning"
                                ? "bg-warning"
                                : "bg-destructive animate-pulse"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI AGENTS, RECOMMENDATIONS & QUICK ACTIONS */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* AI recommendations */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <Card className="border-border/50 bg-card/40 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-base font-bold">
                  AI Agent Insights & Recommendations
                </CardTitle>
                <CardDescription>
                  Contextual cleanup rules raised by scanning codebases
                </CardDescription>
              </CardHeader>
              <div className="divide-y divide-border/20">
                {activeRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 flex items-start justify-between gap-3 text-left hover:bg-muted/10 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{rec.title}</span>
                        <Badge
                          variant={
                            rec.severity === "high"
                              ? "destructive"
                              : rec.severity === "medium"
                                ? "brand"
                                : "outline"
                          }
                          className="text-[10px] py-0 px-1.5 scale-90 uppercase"
                        >
                          {rec.severity}
                        </Badge>
                      </div>
                      <p className="text-2xs text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                    <Badge variant="brand" className="text-3xs text-primary shrink-0 py-0.5 px-2">
                      {rec.savings}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Pipelines / Agent Status */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 bg-card/40 backdrop-blur-md h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold">AI Analyzer Agent Status</CardTitle>
                <CardDescription>Autonomous scanning triggers and pipeline states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between text-left border-b border-border/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="space-y-1 pr-2">
                      <span className="font-semibold text-xs text-foreground block">
                        {agent.name}
                      </span>
                      <span className="text-3xs text-muted-foreground block line-clamp-1">
                        {agent.description}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3 text-muted-foreground/60" /> Updated{" "}
                        {agent.lastActive}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        variant={agent.status === "running" ? "brand" : "outline"}
                        className="text-3xs font-semibold scale-90"
                      >
                        {agent.status}
                      </Badge>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={agent.status === "running"}
                        onClick={() => runAgentScan(agent.id)}
                        className="cursor-pointer text-[10px] h-6 px-2.5"
                      >
                        Scan
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* LEADERBOARD & RECENT REVIEWS */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Top Repositories Table */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-border/50 bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  Monitored Repositories & Coverage
                </CardTitle>
                <CardDescription>
                  Top projects list metrics and commit review history
                </CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                      <th className="p-3">Repository</th>
                      <th className="p-3">Health Score</th>
                      <th className="p-3">Open PRs</th>
                      <th className="p-3">AI Reviews</th>
                      <th className="p-3">Stars</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {monitoredRepos.map((repo) => (
                      <tr
                        key={repo.id}
                        className="hover:bg-muted/10 cursor-pointer transition-colors"
                        onClick={() => alert(`Showing repo analysis data: ${repo.name}`)}
                      >
                        <td className="p-3 font-semibold text-foreground flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: repo.languageColor }}
                          />
                          {repo.name}
                        </td>
                        <td className="p-3 font-semibold">
                          <Badge
                            variant={repo.healthScore >= 90 ? "success" : "brand"}
                            className="scale-90 px-1.5"
                          >
                            {repo.healthScore}%
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{repo.openPRs}</td>
                        <td className="p-3 text-muted-foreground font-medium">
                          {repo.insights.prReviewTime}
                        </td>
                        <td className="p-3 text-muted-foreground">{repo.stars} stars</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* Dev Leaderboard */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 bg-card/40 backdrop-blur-md h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold">Team Review Velocity</CardTitle>
                <CardDescription>Activity leaderboard and PR response cycles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeDevelopers.map((dev, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-left pb-3 border-b border-border/10 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={dev.avatar}
                        alt={dev.name}
                        className="h-8 w-8 rounded-full border border-border/40"
                      />
                      <div>
                        <span className="font-semibold text-xs text-foreground block">
                          {dev.name}
                        </span>
                        <span className="text-3xs text-muted-foreground block">
                          {dev.reviews} reviews completed
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-foreground block">{dev.time}</span>
                      <span className="text-3xs text-muted-foreground block">
                        {dev.prs} PRs opened
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* QUICK ACTIONS & BOTTOM STATISTICS PANEL */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/30 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">
                Developer Command Center & Quick Actions
              </CardTitle>
              <CardDescription>Common admin workflow shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 pt-2">
              <Button
                variant="outline"
                onClick={() => alert("Invite developers workflow")}
                className="cursor-pointer py-3 h-auto flex flex-col items-center gap-1.5 border-border/50 bg-background/50 hover:bg-muted text-center"
              >
                <Users className="h-5 w-5 text-primary" />
                <div className="text-xs font-bold text-foreground">Invite Developers</div>
                <div className="text-3xs text-muted-foreground">Add team members to Acme org</div>
              </Button>

              <Button
                variant="outline"
                onClick={() => alert("Write custom analysis rule")}
                className="cursor-pointer py-3 h-auto flex flex-col items-center gap-1.5 border-border/50 bg-background/50 hover:bg-muted text-center"
              >
                <Code2 className="h-5 w-5 text-accent" />
                <div className="text-xs font-bold text-foreground">Custom Scan Rules</div>
                <div className="text-3xs text-muted-foreground">
                  Define custom lint or regex triggers
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => alert("Triage alerts history logs")}
                className="cursor-pointer py-3 h-auto flex flex-col items-center gap-1.5 border-border/50 bg-background/50 hover:bg-muted text-center"
              >
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="text-xs font-bold text-foreground">Triage Alerts</div>
                <div className="text-3xs text-muted-foreground">
                  Label active security CVE warnings
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => window.open("/design-system", "_self")}
                className="cursor-pointer py-3 h-auto flex flex-col items-center gap-1.5 border-border/50 bg-background/50 hover:bg-muted text-center"
              >
                <Terminal className="h-5 w-5 text-success" />
                <div className="text-xs font-bold text-foreground">Design Tokens</div>
                <div className="text-3xs text-muted-foreground">
                  Review components design metrics
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
