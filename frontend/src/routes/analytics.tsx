import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Sparkles,
  Activity,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Database,
  BarChart2,
  Calendar,
  Flame,
  Award,
  ArrowUpRight,
  RefreshCw,
  Compass,
  GitPullRequest,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Cpu,
  BarChart3,
  GitCommit,
  Bug,
  Layout,
  GitBranch,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsComponent,
});

// Rich mock data for telemetry
const mockQualityHistory = [
  {
    sprint: "Sprint 20",
    debt: 28,
    vulnerabilities: 6,
    accuracy: 94,
    latency: 120,
    coverage: 78,
    reviewTime: 3.2,
  },
  {
    sprint: "Sprint 21",
    debt: 24,
    vulnerabilities: 4,
    accuracy: 96,
    latency: 105,
    coverage: 80,
    reviewTime: 2.8,
  },
  {
    sprint: "Sprint 22",
    debt: 22,
    vulnerabilities: 3,
    accuracy: 95,
    latency: 98,
    coverage: 82,
    reviewTime: 2.1,
  },
  {
    sprint: "Sprint 23",
    debt: 18,
    vulnerabilities: 1,
    accuracy: 98,
    latency: 85,
    coverage: 85,
    reviewTime: 1.4,
  },
  {
    sprint: "Sprint 24",
    debt: 15,
    vulnerabilities: 0,
    accuracy: 99,
    latency: 74,
    coverage: 88,
    reviewTime: 0.9,
  },
];

const mockDeveloperMetrics = [
  {
    name: "Anjali Sharma",
    commits: 64,
    reviews: 32,
    responseTime: "24m",
    score: 98.6,
    avatarColor: "bg-indigo-500/20 text-indigo-400",
  },
  {
    name: "Marcus Vance",
    commits: 48,
    reviews: 22,
    responseTime: "1.1h",
    score: 95.2,
    avatarColor: "bg-emerald-500/20 text-emerald-400",
  },
  {
    name: "David Chen",
    commits: 52,
    reviews: 18,
    responseTime: "1.5h",
    score: 93.8,
    avatarColor: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "Sarah Jenkins",
    commits: 41,
    reviews: 29,
    responseTime: "48m",
    score: 96.4,
    avatarColor: "bg-purple-500/20 text-purple-400",
  },
  {
    name: "AI Reviewer Agent",
    commits: 0,
    reviews: 284,
    responseTime: "4m",
    score: 99.8,
    avatarColor: "bg-amber-500/20 text-amber-400",
  },
];

const mockTeams = {
  "Frontend Team": {
    velocity: 88,
    security: 92,
    coverage: 84,
    response: 80,
    accuracy: 94,
    health: 91,
  },
  "Backend Team": {
    velocity: 94,
    security: 85,
    coverage: 88,
    response: 75,
    accuracy: 92,
    health: 87,
  },
  "AI & Core": { velocity: 99, security: 98, coverage: 92, response: 99, accuracy: 99, health: 97 },
  "SRE & Infra": {
    velocity: 82,
    security: 95,
    coverage: 90,
    response: 88,
    accuracy: 96,
    health: 93,
  },
};

const mockRepoComparisons: Record<
  string,
  {
    stars: number;
    openPrs: number;
    testCoverage: number;
    techDebt: string;
    healthScore: number;
    securityAlerts: number;
  }
> = {
  "devinsight-core": {
    stars: 240,
    openPrs: 14,
    testCoverage: 91,
    techDebt: "12h",
    healthScore: 96,
    securityAlerts: 0,
  },
  "design-system": {
    stars: 85,
    openPrs: 3,
    testCoverage: 88,
    techDebt: "4h",
    healthScore: 98,
    securityAlerts: 0,
  },
  "web-portal": {
    stars: 152,
    openPrs: 24,
    testCoverage: 76,
    techDebt: "48h",
    healthScore: 78,
    securityAlerts: 5,
  },
  "ai-agents-pipeline": {
    stars: 310,
    openPrs: 8,
    testCoverage: 94,
    techDebt: "8h",
    healthScore: 95,
    securityAlerts: 1,
  },
};

const mockBugAnalytics = [
  { month: "Jan", raised: 32, resolved: 28, duplicate: 4 },
  { month: "Feb", raised: 45, resolved: 41, duplicate: 7 },
  { month: "Mar", raised: 28, resolved: 33, duplicate: 2 },
  { month: "Apr", raised: 55, resolved: 48, duplicate: 9 },
  { month: "May", raised: 38, resolved: 42, duplicate: 3 },
  { month: "Jun", raised: 24, resolved: 26, duplicate: 1 },
];

const mockSecurityTrends = [
  { week: "W1", critical: 2, high: 8, medium: 15, low: 22 },
  { week: "W2", critical: 1, high: 5, medium: 18, low: 20 },
  { week: "W3", critical: 0, high: 4, medium: 12, low: 18 },
  { week: "W4", critical: 0, high: 2, medium: 9, low: 14 },
  { week: "W5", critical: 0, high: 0, medium: 6, low: 10 },
];

const mockForecasts = [
  { label: "Sprint 24 (Actual)", actual: 15, predicted: 15 },
  { label: "Sprint 25 (AI)", actual: null, predicted: 12 },
  { label: "Sprint 26 (AI)", actual: null, predicted: 8 },
  { label: "Sprint 27 (AI)", actual: null, predicted: 5 },
  { label: "Sprint 28 (AI)", actual: null, predicted: 3 },
];

// 7 days x 24 hours Git Commit heatmap data generator
const generateHeatmapData = () => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const data = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h += 2) {
      // Simulate higher activity during mid-week office hours
      let val = Math.floor(Math.random() * 5);
      if (d > 0 && d < 6) {
        if (h >= 9 && h <= 18) {
          val += Math.floor(Math.random() * 15) + 8;
        } else {
          val += Math.floor(Math.random() * 5);
        }
      }
      data.push({ day: days[d], hour: `${h}:00`, value: val });
    }
  }
  return data;
};

const heatmapData = generateHeatmapData();

function AnalyticsComponent() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "productivity" | "security-perf" | "comparisons" | "forecasts"
  >("overview");
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedRepo, setSelectedRepo] = useState<string>("All Repositories");

  const { data: analyticsData } = useQuery({
    queryKey: queryKeys.analytics.overview(1),
    queryFn: () => apiFetch<any>("/api/v1/analytics/overview?workspace_id=1"),
    staleTime: 60 * 1000,
  });

  // States for comparisons
  const [compRepoA, setCompRepoA] = useState<string>("devinsight-core");
  const [compRepoB, setCompRepoB] = useState<string>("web-portal");
  const [compTeamA, setCompTeamA] = useState<string>("Frontend Team");
  const [compTeamB, setCompTeamB] = useState<string>("Backend Team");

  // Performance simulation metrics
  const performanceMetrics = useMemo(() => {
    return [
      {
        name: "CI Build Time",
        val: "4m 12s",
        status: "ok",
        diff: "-45s",
        color: "text-emerald-500",
      },
      {
        name: "Inference Latency",
        val: "74ms",
        status: "ok",
        diff: "-11ms",
        color: "text-emerald-500",
      },
      {
        name: "API Response Speed",
        val: "185ms",
        status: "warning",
        diff: "+12ms",
        color: "text-amber-500",
      },
      {
        name: "Review Accuracy Rate",
        val: "99.8%",
        status: "ok",
        diff: "+0.8%",
        color: "text-emerald-500",
      },
    ];
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto text-left font-sans dark:bg-background">
        {/* Datadog / Grafana Premium Telemetry Header */}
        <div className="border-b border-border/40 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>LIVE TELEMETRY // ENG_INTEL_SYSTEM_v4.2</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 mt-1">
              DevInsight Telemetry Analytics{" "}
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Deep organization diagnostics, cross-repository comparisons, predictive failure
              models, and real-time developer productivity index.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Repo Filter */}
            <div className="flex items-center gap-1.5 bg-card/60 border border-border/60 rounded-md px-2 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="bg-transparent border-none text-foreground font-semibold text-xs cursor-pointer focus:outline-none"
              >
                <option value="All Repositories">All Repositories</option>
                {Object.keys(mockRepositories).map((repo) => (
                  <option key={repo} value={repo}>
                    {repo}
                  </option>
                ))}
              </select>
            </div>

            {/* Time range selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-card/60 border border-border/60 rounded-md px-2.5 py-1.5 font-semibold text-foreground text-xs cursor-pointer focus:outline-none"
            >
              <option value="24h">Past 24 hours</option>
              <option value="7d">Past 7 days</option>
              <option value="30d">Past 30 days</option>
              <option value="90d">Past 90 days</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Exporting report with format YAML/JSON Telemetry specs...")}
              className="cursor-pointer font-semibold text-xs h-9 border-border bg-card/30 hover:bg-muted font-mono"
            >
              <Database className="h-3.5 w-3.5 mr-1" /> Export Spec
            </Button>
          </div>
        </div>

        {/* Grafana-style Quick Stats Telemetry Panels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceMetrics.map((stat, i) => (
            <Card
              key={i}
              className="border-border/50 bg-card/30 hover:bg-card/40 transition-colors"
            >
              <CardContent className="p-4 flex flex-col justify-between h-24">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                    {stat.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-foreground">
                    {stat.val}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${stat.color}`}>
                    {stat.diff}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subnavigation Tabs */}
        <div className="flex items-center border-b border-border/50 pb-px overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1">
            {[
              { id: "overview", label: "Overview & Engineering Health", icon: Layout },
              { id: "productivity", label: "Developer Productivity Index", icon: Users },
              { id: "security-perf", label: "Security & Performance Trends", icon: ShieldCheck },
              { id: "comparisons", label: "Repo & Team Comparisons", icon: BarChart3 },
              { id: "forecasts", label: "Predictive AI Forecasts", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? "border-primary text-foreground font-bold font-mono"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border font-mono"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Display Area Grid */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: OVERVIEW & ENGINEERING HEALTH */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Row 1: Core Metrics (Debt & Coverage Trends) */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-border/50 bg-card/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                          <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-primary" /> Technical Debt & Test
                            Coverage Progress
                          </CardTitle>
                          <CardDescription>
                            Visualizing code quality metrics over the last 5 sprints
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs text-primary">
                          Target: &lt;10h
                        </Badge>
                      </CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={mockQualityHistory}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="covGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="5%"
                                  stopColor="oklch(0.7227 0.192 149.58)"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="oklch(0.7227 0.192 149.58)"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="opacity-10"
                            />
                            <XAxis
                              dataKey="sprint"
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <YAxis
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-popover)",
                                borderColor: "var(--color-border)",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontFamily: "monospace",
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="debt"
                              stroke="var(--primary)"
                              strokeWidth={2}
                              fill="url(#debtGrad)"
                              name="Tech Debt (Hrs)"
                            />
                            <Area
                              type="monotone"
                              dataKey="coverage"
                              stroke="oklch(0.7227 0.192 149.58)"
                              strokeWidth={2}
                              fill="url(#covGrad)"
                              name="Code Coverage (%)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* PR Cycle Time telemetries */}
                    <Card className="border-border/50 bg-card/30">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-amber-500" /> Cycle Time Diagnostics
                        </CardTitle>
                        <CardDescription>Average review time speed stats</CardDescription>
                      </CardHeader>
                      <CardContent className="h-[280px] flex flex-col justify-between">
                        <div className="h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={mockQualityHistory}
                              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="currentColor"
                                className="opacity-10"
                              />
                              <XAxis
                                dataKey="sprint"
                                stroke="currentColor"
                                className="text-muted-foreground opacity-50 text-[10px] font-mono"
                              />
                              <YAxis
                                stroke="currentColor"
                                className="text-muted-foreground opacity-50 text-[10px] font-mono"
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--color-popover)",
                                  borderColor: "var(--color-border)",
                                  fontSize: "11px",
                                }}
                              />
                              <Bar
                                dataKey="reviewTime"
                                fill="var(--accent)"
                                radius={[4, 4, 0, 0]}
                                name="PR Review Speed (Days)"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="border-t border-border/40 pt-3 flex items-center justify-between text-xs font-mono">
                          <span className="text-muted-foreground">Current Avg PR Lifetime:</span>
                          <span className="font-bold text-foreground">0.9 Days</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Row 2: Bug Analytics - Raised vs Resolved */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-border/50 bg-card/30">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                          <Bug className="h-4 w-4 text-destructive" /> Bug Analytics & Resolution
                          Speed
                        </CardTitle>
                        <CardDescription>
                          Incidents raised vs. resolved by the engineering team
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={mockBugAnalytics}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="opacity-10"
                            />
                            <XAxis
                              dataKey="month"
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <YAxis
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-popover)",
                                borderColor: "var(--color-border)",
                                fontSize: "11px",
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                            <Line
                              type="monotone"
                              dataKey="raised"
                              stroke="var(--destructive)"
                              strokeWidth={2.5}
                              name="Bugs Raised"
                            />
                            <Line
                              type="monotone"
                              dataKey="resolved"
                              stroke="oklch(0.7227 0.192 149.58)"
                              strokeWidth={2.5}
                              name="Bugs Resolved"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Repository Health Scorecard */}
                    <Card className="border-border/50 bg-card/30">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground">
                          Repository Overview Metrics
                        </CardTitle>
                      </CardHeader>
                      <div className="px-6 pb-6 space-y-4">
                        {Object.entries(mockRepositories).map(([name, data]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between text-xs border-b border-border/20 pb-2"
                          >
                            <div>
                              <div className="font-semibold text-foreground">{name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                Cov: {data.testCoverage}% | Debt: {data.techDebt}
                              </div>
                            </div>
                            <Badge
                              className="font-mono"
                              variant={
                                data.healthScore >= 90
                                  ? "success"
                                  : data.healthScore >= 75
                                    ? "warning"
                                    : "destructive"
                              }
                            >
                              {data.healthScore}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 2: DEVELOPER PRODUCTIVITY INDEX */}
              {activeTab === "productivity" && (
                <div className="space-y-6">
                  {/* Leaderboard and metrics */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-border/50 bg-card/30 text-left">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                          <Award className="h-4.5 w-4.5 text-yellow-500" /> Contributor Velocity &
                          Quality Score
                        </CardTitle>
                      </CardHeader>
                      <div className="overflow-x-auto px-4 pb-4">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                              <th className="p-3">Developer</th>
                              <th className="p-3 font-mono">Commits</th>
                              <th className="p-3 font-mono">PR Reviews</th>
                              <th className="p-3 font-mono">Avg Response</th>
                              <th className="p-3 font-mono">Quality Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/20">
                            {mockDeveloperMetrics.map((dev, idx) => (
                              <tr key={idx} className="hover:bg-muted/10">
                                <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                                  <div
                                    className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${dev.avatarColor}`}
                                  >
                                    {dev.name[0]}
                                  </div>
                                  {dev.name}
                                </td>
                                <td className="p-3 text-muted-foreground font-mono">
                                  {dev.commits}
                                </td>
                                <td className="p-3 text-muted-foreground font-mono">
                                  {dev.reviews}
                                </td>
                                <td className="p-3 font-semibold font-mono">{dev.responseTime}</td>
                                <td className="p-3">
                                  <Badge variant="brand" className="scale-90 px-1.5 font-mono">
                                    {dev.score}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    {/* Developer Activity frequency Heatmap */}
                    <Card className="border-border/50 bg-card/30 text-left">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                          <Calendar className="h-4.5 w-4.5 text-primary" /> Commit Heatmap Frequency
                        </CardTitle>
                        <CardDescription>Intensity of Git pushes across week days</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        {/* Grid heatmap simulation */}
                        <div className="grid grid-cols-12 gap-1 text-[9px] font-mono text-center">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="text-muted-foreground">
                              {i * 2}h
                            </div>
                          ))}
                        </div>
                        {["Mon", "Wed", "Fri"].map((day) => {
                          const points = heatmapData.filter((d) => d.day === day);
                          return (
                            <div key={day} className="flex items-center gap-1">
                              <span className="w-6 text-[10px] font-mono text-muted-foreground">
                                {day}
                              </span>
                              <div className="grid grid-cols-12 gap-1 w-full">
                                {points.map((pt, index) => {
                                  const intensity =
                                    pt.value > 15
                                      ? "bg-primary"
                                      : pt.value > 8
                                        ? "bg-primary/60"
                                        : pt.value > 3
                                          ? "bg-primary/30"
                                          : "bg-card border border-border/30";
                                  return (
                                    <div
                                      key={index}
                                      className={`h-4.5 rounded-sm transition-all duration-200 cursor-pointer ${intensity}`}
                                      title={`${day} ${pt.hour}: ${pt.value} commits`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center justify-end gap-2 mt-2 text-[10px] font-mono text-muted-foreground">
                          <span>Less</span>
                          <div className="h-3.5 w-3.5 bg-primary/10 rounded-sm" />
                          <div className="h-3.5 w-3.5 bg-primary/30 rounded-sm" />
                          <div className="h-3.5 w-3.5 bg-primary/60 rounded-sm" />
                          <div className="h-3.5 w-3.5 bg-primary rounded-sm" />
                          <span>More</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 3: SECURITY & PERFORMANCE TRENDS */}
              {activeTab === "security-perf" && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Security Trend */}
                    <Card className="border-border/50 bg-card/30 text-left">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" /> Active Security
                          Vulnerabilities (CVEs)
                        </CardTitle>
                        <CardDescription>
                          Security alert telemetry and patches status
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={mockSecurityTrends}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="opacity-10"
                            />
                            <XAxis
                              dataKey="week"
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <YAxis
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-popover)",
                                borderColor: "var(--color-border)",
                                fontSize: "11px",
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                            <Bar
                              dataKey="critical"
                              stackId="sec"
                              fill="oklch(0.6368 0.2078 25.33)"
                              name="Critical"
                            />
                            <Bar
                              dataKey="high"
                              stackId="sec"
                              fill="oklch(0.7686 0.1647 70.08)"
                              name="High"
                            />
                            <Bar
                              dataKey="medium"
                              stackId="sec"
                              fill="var(--primary)"
                              name="Medium"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* CI/CD Performance Build Speeds */}
                    <Card className="border-border/50 bg-card/30 text-left">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                          <Cpu className="h-4.5 w-4.5 text-indigo-400" /> CI/CD Automation
                          Performance
                        </CardTitle>
                        <CardDescription>
                          Webhook check latency vs build success metrics
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={mockQualityHistory}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="currentColor"
                              className="opacity-10"
                            />
                            <XAxis
                              dataKey="sprint"
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <YAxis
                              stroke="currentColor"
                              className="text-muted-foreground opacity-50 text-[10px] font-mono"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-popover)",
                                borderColor: "var(--color-border)",
                                fontSize: "11px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="latency"
                              stroke="var(--accent)"
                              strokeWidth={2.5}
                              name="Review Trigger (ms)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 4: REPOSITORY & TEAM COMPARISONS */}
              {activeTab === "comparisons" && (
                <div className="space-y-6">
                  {/* Repo Selector comparisons */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-border/50 bg-card/30 text-left">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center justify-between">
                          <span>Repository Head-to-Head</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            TELEMETRY COMPARATOR
                          </span>
                        </CardTitle>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground uppercase">
                              Repo A
                            </label>
                            <select
                              value={compRepoA}
                              onChange={(e) => setCompRepoA(e.target.value)}
                              className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground mt-1 font-semibold"
                            >
                              {Object.keys(mockRepositories).map((repo) => (
                                <option key={repo} disabled={repo === compRepoB} value={repo}>
                                  {repo}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground uppercase">
                              Repo B
                            </label>
                            <select
                              value={compRepoB}
                              onChange={(e) => setCompRepoB(e.target.value)}
                              className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground mt-1 font-semibold"
                            >
                              {Object.keys(mockRepositories).map((repo) => (
                                <option key={repo} disabled={repo === compRepoA} value={repo}>
                                  {repo}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Comparison metric grids */}
                        {[
                          { label: "Test Coverage (%)", key: "testCoverage" },
                          { label: "Health Score (%)", key: "healthScore" },
                          { label: "Open Pull Requests", key: "openPrs" },
                          { label: "Security Alerts Count", key: "securityAlerts" },
                        ].map((m) => {
                          const valA = (mockRepositories as any)[compRepoA][m.key];
                          const valB = (mockRepositories as any)[compRepoB][m.key];
                          const progressA =
                            (valA /
                              (m.key === "openPrs" || m.key === "securityAlerts" ? 30 : 100)) *
                            100;
                          const progressB =
                            (valB /
                              (m.key === "openPrs" || m.key === "securityAlerts" ? 30 : 100)) *
                            100;
                          return (
                            <div key={m.label} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-muted-foreground">{m.label}</span>
                                <span className="text-foreground font-semibold">
                                  {valA} vs {valB}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 h-2.5 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary rounded-full h-full"
                                  style={{ width: `${Math.min(progressA, 100)}%` }}
                                />
                                <div
                                  className="bg-accent rounded-full h-full"
                                  style={{ width: `${Math.min(progressB, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Team radar comparator */}
                    <Card className="border-border/50 bg-card/30 text-left">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold font-mono text-foreground font-semibold">
                          Team Performance Radar Comparator
                        </CardTitle>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground uppercase">
                              Team A
                            </label>
                            <select
                              value={compTeamA}
                              onChange={(e) => setCompTeamA(e.target.value)}
                              className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground mt-1 font-semibold"
                            >
                              {Object.keys(mockTeams).map((team) => (
                                <option key={team} disabled={team === compTeamB} value={team}>
                                  {team}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-muted-foreground uppercase">
                              Team B
                            </label>
                            <select
                              value={compTeamB}
                              onChange={(e) => setCompTeamB(e.target.value)}
                              className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs text-foreground mt-1 font-semibold"
                            >
                              {Object.keys(mockTeams).map((team) => (
                                <option key={team} disabled={team === compTeamA} value={team}>
                                  {team}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            cx="50%"
                            cy="50%"
                            r="70%"
                            data={[
                              {
                                metric: "Velocity",
                                teamA: (mockTeams as any)[compTeamA].velocity,
                                teamB: (mockTeams as any)[compTeamB].velocity,
                              },
                              {
                                metric: "Security Compliance",
                                teamA: (mockTeams as any)[compTeamA].security,
                                teamB: (mockTeams as any)[compTeamB].security,
                              },
                              {
                                metric: "Coverage",
                                teamA: (mockTeams as any)[compTeamA].coverage,
                                teamB: (mockTeams as any)[compTeamB].coverage,
                              },
                              {
                                metric: "Response Time",
                                teamA: (mockTeams as any)[compTeamA].response,
                                teamB: (mockTeams as any)[compTeamB].response,
                              },
                              {
                                metric: "Accuracy",
                                teamA: (mockTeams as any)[compTeamA].accuracy,
                                teamB: (mockTeams as any)[compTeamB].accuracy,
                              },
                            ]}
                          >
                            <PolarGrid stroke="currentColor" className="opacity-15" />
                            <PolarAngleAxis
                              dataKey="metric"
                              className="text-muted-foreground text-[8px] font-mono"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-popover)",
                                borderColor: "var(--color-border)",
                                fontSize: "11px",
                              }}
                            />
                            <Radar
                              name={compTeamA}
                              dataKey="teamA"
                              stroke="var(--primary)"
                              fill="var(--primary)"
                              fillOpacity={0.25}
                            />
                            <Radar
                              name={compTeamB}
                              dataKey="teamB"
                              stroke="var(--accent)"
                              fill="var(--accent)"
                              fillOpacity={0.15}
                            />
                            <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB 5: PREDICTIVE AI FORECASTS */}
              {activeTab === "forecasts" && (
                <div className="space-y-6">
                  <Card className="border-border/50 bg-card/30 text-left">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-4.5 w-4.5 text-primary" /> Predictive Tech Debt
                        Remediation Projection
                      </CardTitle>
                      <CardDescription>
                        AI forecasting model predicting hours required to address current debt
                        backlogs through Sprint 28.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mockForecasts}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="currentColor"
                            className="opacity-10"
                          />
                          <XAxis
                            dataKey="label"
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-[10px] font-mono"
                          />
                          <YAxis
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-[10px] font-mono"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-popover)",
                              borderColor: "var(--color-border)",
                              fontSize: "11px",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "monospace" }} />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            name="Actual Tech Debt"
                          />
                          <Line
                            type="dashed"
                            dataKey="predicted"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Projected Debt Trend"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
