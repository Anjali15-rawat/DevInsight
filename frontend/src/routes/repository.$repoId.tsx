import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Star,
  GitFork,
  BookOpen,
  Settings,
  Users,
  Terminal,
  Play,
  Check,
  ChevronRight,
  GitBranch,
  ShieldAlert,
  Flame,
  Activity,
  History,
  Lock,
  Globe,
  Plus,
  Compass,
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
import { mockRepositories, mockPullRequests, Repository } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/repository/$repoId")({
  component: RepositoryDetailsComponent,
});

// Mock Additional data scoped per repository
const mockCommits = [
  {
    hash: "8f7c9e2",
    author: "Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    message: "feat(auth): integrate hardware MFA key verification hooks",
    date: "3 hrs ago",
    verified: true,
  },
  {
    hash: "aef3d11",
    author: "Anjali Sharma",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    message: "fix(dashboard): resolve layout hydration toggle discrepancies",
    date: "5 hrs ago",
    verified: true,
  },
  {
    hash: "2c2199f",
    author: "David Chen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    message: "perf(analyst): refactor database scheduler index lock pipeline",
    date: "Yesterday",
    verified: false,
  },
  {
    hash: "f39d10e",
    author: "Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    message: "chore(deps): bump vite to version 8.1.0 to resolve dependency warnings",
    date: "2 days ago",
    verified: true,
  },
];

const mockIssues = [
  {
    number: 89,
    title: "Database transaction lock occurs under high API concurrent volume",
    author: "David Chen",
    priority: "critical",
    state: "open",
    date: "1 day ago",
  },
  {
    number: 76,
    title: "Hydration mismatch warning on toggling collapsed sidebar layout",
    author: "Anjali Sharma",
    priority: "normal",
    state: "open",
    date: "3 days ago",
  },
  {
    number: 64,
    title: "Memory leak detected in FAISS vector store embedding indexer",
    author: "David Chen",
    priority: "critical",
    state: "closed",
    date: "1 week ago",
  },
];

const mockSecurityAlerts = [
  {
    id: "sec-1",
    severity: "high",
    title: "Prototype pollution in dependency minimist",
    package: "minimist",
    recommendation: "Upgrade to version >= 1.2.8",
  },
  {
    id: "sec-2",
    severity: "medium",
    title: "Cross-site scripting (XSS) vulnerability in marked parser",
    package: "marked",
    recommendation: "Sanitize Markdown before rendering",
  },
];

const mockContributors = [
  {
    name: "Marcus Vance",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    role: "Maintainer",
    commits: 142,
    additions: "+12.4k",
    deletions: "-4.1k",
  },
  {
    name: "Anjali Sharma",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    role: "Contributor",
    commits: 89,
    additions: "+8.2k",
    deletions: "-2.3k",
  },
  {
    name: "David Chen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    role: "Contributor",
    commits: 64,
    additions: "+6.1k",
    deletions: "-1.8k",
  },
];

const mockTimeline = [
  {
    type: "scan",
    title: "AI Scan Completed",
    description: "All core modules checked. Health score set to 94%",
    user: "DevInsight AI",
    time: "10 mins ago",
  },
  {
    type: "commit",
    title: "New commit pushed",
    description: "Marcus Vance pushed commit hash `8f7c9e2` to main",
    user: "Marcus Vance",
    time: "3 hrs ago",
  },
  {
    type: "pr",
    title: "Pull Request approved",
    description: "PR #452 has been reviewed and approved by AI reviewer",
    user: "DevInsight AI",
    time: "3 hrs ago",
  },
  {
    type: "release",
    title: "Release v1.2.4 deployed",
    description: "Production build deployed to staging environment successfully",
    user: "Github Action",
    time: "Yesterday",
  },
];

const analyticsHistory = [
  { sprint: "Sprint 1", health: 85, issues: 18, coverage: 74 },
  { sprint: "Sprint 2", health: 88, issues: 14, coverage: 76 },
  { sprint: "Sprint 3", health: 90, issues: 11, coverage: 78 },
  { sprint: "Sprint 4", health: 94, issues: 8, coverage: 82 },
];

function RepositoryDetailsComponent() {
  const { repoId } = useParams({ from: "/repository/$repoId" });
  const numericRepoId = parseInt(repoId.replace("repo-", ""), 10) || 1;

  const { data: bffRepoData } = useQuery({
    queryKey: queryKeys.bff.repository(numericRepoId),
    queryFn: () => apiFetch<any>(`/api/v1/bff/repository/${numericRepoId}`),
    staleTime: 60 * 1000,
  });

  // Find repo in mock repositories list or fallback
  const repo = useMemo(() => {
    if (bffRepoData?.repository) {
      const r = bffRepoData.repository;
      return {
        id: String(r.id),
        name: r.name,
        owner: r.owner,
        description: r.description || "",
        healthScore: r.health_score || 90,
        openPRs: r.open_prs_count || 0,
        openIssues: r.open_issues_count || 0,
        securityAlerts: r.security_alerts_count || 0,
        language: r.language || "TypeScript",
        languageColor: r.language_color || "#3178C6",
        updatedAt: "Recently",
        stars: r.stars || 0,
        forks: r.forks || 0,
        analyzedLines: `${Math.round((r.analyzed_lines || 10000) / 1000)}k`,
        insights: r.insights || {
          prReviewTime: "1.2h avg",
          codeCoverage: "88%",
          securityGrade: r.security_grade || "A",
          aiSavings: "20 hrs/mo",
        },
      };
    }
    return mockRepositories.find((r) => r.id === repoId) || mockRepositories[0];
  }, [repoId, bffRepoData]);

  const [starred, setStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "commits"
    | "prs"
    | "issues"
    | "security"
    | "contributors"
    | "health"
    | "analytics"
    | "timeline"
    | "settings"
  >("overview");

  // Tab configurations (labels and indicators)
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "commits", label: "Commits & Branches" },
    { id: "prs", label: "Pull Requests", count: mockPullRequests.length },
    { id: "issues", label: "Issues", count: mockIssues.filter((i) => i.state === "open").length },
    { id: "security", label: "Security", count: mockSecurityAlerts.length },
    { id: "contributors", label: "Contributors" },
    { id: "health", label: "Code Health" },
    { id: "analytics", label: "Analytics" },
    { id: "timeline", label: "Timeline" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/repositories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Repositories
          </Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setStarred(!starred)}
              className="cursor-pointer border-border hover:bg-muted"
            >
              <Star
                className={`mr-1 h-3.5 w-3.5 ${starred ? "fill-warning text-warning" : "text-muted-foreground"}`}
              />
              {starred ? "Starred" : "Star"}
              <span className="ml-1.5 font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {repo.stars + (starred ? 1 : 0)}
              </span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => alert("Simulation: Forked repository to personal namespace")}
              className="cursor-pointer border-border hover:bg-muted"
            >
              <GitFork className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              Fork
              <span className="ml-1.5 font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">
                {repo.forks}
              </span>
            </Button>
          </div>
        </div>

        {/* Repository Header Title (Github Enterprise style) */}
        <div className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground hover:text-primary transition-colors cursor-pointer">
              {repo.owner} / <span className="text-foreground">{repo.name}</span>
            </h1>
            <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase font-semibold">
              Public Repository
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            {repo.description}
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-border/50 pb-px scrollbar-none">
          <nav className="flex space-x-1 sm:space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-foreground font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB CONTENTS (Framer motion switch) */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Languages bar */}
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-bold">Languages Used</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Percent visual bar */}
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                        <div
                          className="h-full"
                          style={{ width: "70%", backgroundColor: repo.languageColor }}
                          title={`${repo.language}: 70%`}
                        />
                        <div
                          className="h-full bg-accent"
                          style={{ width: "20%" }}
                          title="CSS/Styles: 20%"
                        />
                        <div
                          className="h-full bg-warning"
                          style={{ width: "10%" }}
                          title="HTML/Configs: 10%"
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-3xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: repo.languageColor }}
                          />
                          {repo.language} (70%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-accent" />
                          Styles/UI (20%)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-warning" />
                          Configuration (10%)
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Readme Section */}
                    <Card className="md:col-span-2 border-border/50 bg-card/30 backdrop-blur-md">
                      <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center gap-2">
                        <BookOpen className="h-4.5 w-4.5 text-muted-foreground" />
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          README.md
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 font-sans text-xs text-foreground space-y-4 leading-relaxed">
                        <h2 className="font-display text-lg font-bold text-foreground">
                          🚀 {repo.name} API & Services
                        </h2>
                        <p>
                          This repository houses the core modules of the {repo.name} service layer.
                          It is scanned, audited, and reviewed autonomously by DevInsight's
                          multi-agent AI scanner.
                        </p>
                        <h3 className="font-bold text-sm text-foreground">Features Included:</h3>
                        <ul className="list-disc pl-5 space-y-1.5">
                          <li>Automatic pull request triage diagnostics.</li>
                          <li>
                            Real-time cyclomatic complexity alerts and cognitive code quality
                            monitoring.
                          </li>
                          <li>Integrated dependency scan CVE vulnerabilities alerts.</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Quick overview side info */}
                    <div className="space-y-6">
                      <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold">Repository Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3.5 text-xs">
                          <div className="flex justify-between font-semibold border-b border-border/10 pb-2">
                            <span className="text-muted-foreground">Code Health Score:</span>
                            <span className="text-foreground">{repo.healthScore}%</span>
                          </div>
                          <div className="flex justify-between font-semibold border-b border-border/10 pb-2">
                            <span className="text-muted-foreground">AI Triage Speed:</span>
                            <span className="text-foreground">{repo.insights.prReviewTime}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-b border-border/10 pb-2">
                            <span className="text-muted-foreground">Lines Scanned:</span>
                            <span className="text-foreground">{repo.analyzedLines}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COMMITS & BRANCHES */}
              {activeTab === "commits" && (
                <div className="space-y-6">
                  {/* Branch selector */}
                  <div className="flex items-center justify-between border-b border-border/20 pb-3">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4.5 w-4.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">Default Branch:</span>
                      <Badge variant="outline" className="text-2xs font-semibold lowercase">
                        main
                      </Badge>
                    </div>
                    <span className="text-2xs text-muted-foreground">Total branches: 4</span>
                  </div>

                  {/* Commits List */}
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Recent Commits</CardTitle>
                    </CardHeader>
                    <div className="divide-y divide-border/20">
                      {mockCommits.map((commit) => (
                        <div
                          key={commit.hash}
                          className="p-4 flex items-center justify-between gap-3 text-left"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <img
                              src={commit.avatar}
                              alt={commit.author}
                              className="h-7 w-7 rounded-full border border-border/40 shrink-0 mt-0.5"
                            />
                            <div className="min-w-0 space-y-0.5">
                              <span className="font-bold text-xs text-foreground hover:text-primary hover:underline cursor-pointer block truncate">
                                {commit.message}
                              </span>
                              <span className="text-3xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {commit.author}
                                </span>{" "}
                                committed {commit.date}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {commit.verified && (
                              <Badge
                                variant="success"
                                className="text-[8px] py-px px-1 font-semibold uppercase scale-90"
                              >
                                Verified
                              </Badge>
                            )}
                            <code className="font-mono text-3xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {commit.hash}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* TAB 3: PULL REQUESTS */}
              {activeTab === "prs" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Active Pull Requests</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                          <th className="p-3">Pull Request</th>
                          <th className="p-3">Branch</th>
                          <th className="p-3">Build</th>
                          <th className="p-3">Review Status</th>
                          <th className="p-3">Changes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {mockPullRequests
                          .filter((pr) => pr.repository === repo.name)
                          .map((pr) => (
                            <tr
                              key={pr.id}
                              className="hover:bg-muted/10 cursor-pointer transition-colors"
                              onClick={() => alert(`PR detail simulator for #${pr.number}`)}
                            >
                              <td className="p-3">
                                <div className="font-bold text-foreground">
                                  #{pr.number} {pr.title}
                                </div>
                                <span className="text-3xs text-muted-foreground mt-0.5 block">
                                  by {pr.author.name} · {pr.createdAt}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-3xs text-muted-foreground">
                                {pr.branch}
                              </td>
                              <td className="p-3">
                                <Badge
                                  variant={
                                    pr.status === "success"
                                      ? "success"
                                      : pr.status === "warning"
                                        ? "warning"
                                        : "destructive"
                                  }
                                  className="text-[9px] py-0 px-1 font-semibold uppercase scale-90"
                                >
                                  {pr.status}
                                </Badge>
                              </td>
                              <td className="p-3 font-semibold text-foreground">
                                {pr.reviewStatus}
                              </td>
                              <td className="p-3 font-semibold text-[10px] space-x-1">
                                <span className="text-success">+{pr.additions}</span>
                                <span className="text-destructive">-{pr.deletions}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* TAB 4: ISSUES */}
              {activeTab === "issues" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Open & Closed Issues</CardTitle>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                          <th className="p-3">Issue</th>
                          <th className="p-3">Priority</th>
                          <th className="p-3">Assignee</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {mockIssues.map((issue) => (
                          <tr
                            key={issue.number}
                            className="hover:bg-muted/10 cursor-pointer transition-colors"
                            onClick={() => alert(`Issue detail simulator for #${issue.number}`)}
                          >
                            <td className="p-3 font-bold text-foreground">
                              #{issue.number} {issue.title}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  issue.priority === "critical"
                                    ? "destructive"
                                    : issue.priority === "medium"
                                      ? "brand"
                                      : "outline"
                                }
                                className="text-[9px] py-0 px-1.5 uppercase scale-90"
                              >
                                {issue.priority}
                              </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground font-medium">
                              {issue.author}
                            </td>
                            <td className="p-3 font-semibold text-foreground capitalize">
                              {issue.state}
                            </td>
                            <td className="p-3 text-muted-foreground">{issue.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* TAB 5: SECURITY */}
              {activeTab === "security" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="text-sm font-bold">
                      Vulnerabilities & Dependency Audit
                    </CardTitle>
                    <CardDescription>Automated security pipelines scan alerts</CardDescription>
                  </CardHeader>
                  <div className="divide-y divide-border/20">
                    {mockSecurityAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">
                              Dependency: {alert.package}
                            </span>
                            <Badge
                              variant={alert.severity === "high" ? "destructive" : "brand"}
                              className="text-[8px] py-0 px-1 font-semibold uppercase scale-90"
                            >
                              {alert.severity} Risk
                            </Badge>
                          </div>
                          <p className="text-3xs text-muted-foreground font-mono">
                            {alert.vulnerability}
                          </p>
                        </div>
                        <div className="text-left sm:text-right font-medium text-3xs bg-primary/5 dark:bg-primary/2 border border-primary/10 rounded-lg p-2 max-w-xs shrink-0 leading-normal">
                          <span className="font-bold text-foreground block mb-0.5">
                            Recommended Action:
                          </span>
                          {alert.fix}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 6: CONTRIBUTORS */}
              {activeTab === "contributors" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Workspace Contributors</CardTitle>
                  </CardHeader>
                  <div className="divide-y divide-border/20">
                    {mockContributors.map((contrib, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={contrib.avatar}
                            alt={contrib.name}
                            className="h-8 w-8 rounded-full border border-border/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-foreground block truncate">
                              {contrib.name}
                            </span>
                            <span className="text-3xs text-muted-foreground">
                              {contrib.commits} commits completed
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-[10px] shrink-0">
                          <span className="text-success">+{contrib.additions}</span>
                          <span className="text-destructive">-{contrib.deletions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* TAB 7: CODE HEALTH */}
              {activeTab === "health" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md flex flex-col justify-between text-left">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Code Quality Grade</CardTitle>
                      <CardDescription>
                        Estimates derived from complex structures and patterns
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-4xl font-extrabold text-foreground">
                          A-
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          Quality Index
                        </span>
                      </div>
                      <p className="text-2xs text-muted-foreground leading-normal">
                        Your project code shows clean architectural patterns overall. Minor
                        technical debt was flagged in directory loops and recursive functions on
                        helper packages.
                      </p>
                      <div className="rounded-lg bg-success/5 border border-success/20 p-3 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                        <span className="text-3xs font-semibold text-foreground">
                          Scan completed successfully. Zero fatal complexity failures found.
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Complexity Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-2xs font-semibold">
                      <div className="flex justify-between border-b border-border/10 pb-2.5">
                        <span className="text-muted-foreground">Cyclomatic Complexity Avg:</span>
                        <span className="text-foreground">7.4</span>
                      </div>
                      <div className="flex justify-between border-b border-border/10 pb-2.5">
                        <span className="text-muted-foreground">
                          Technical Debt Estimated Hours:
                        </span>
                        <span className="text-foreground">22.4 hrs</span>
                      </div>
                      <div className="flex justify-between border-b border-border/10 pb-2.5">
                        <span className="text-muted-foreground">Code Duplication Index:</span>
                        <span className="text-foreground">1.8%</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-muted-foreground">Overall Code Coverage:</span>
                        <span className="text-foreground">{repo.insights.codeCoverage}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 8: ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md pr-2">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Health Score History</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analyticsHistory}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="sprint"
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs"
                          />
                          <YAxis
                            domain={[70, 100]}
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
                            dataKey="health"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            name="Health %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card/30 backdrop-blur-md pr-2">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Issues backlogs over time</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsHistory}
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
                            dataKey="issues"
                            fill="var(--accent)"
                            name="Issues Backlog"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 9: TIMELINE */}
              {activeTab === "timeline" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Repository History Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 relative pl-8 border-l border-border/60 space-y-6 text-left ml-5 sm:ml-8">
                    {mockTimeline.map((item, idx) => (
                      <div key={idx} className="relative space-y-1">
                        {/* Dot indicator */}
                        <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background ring-4 ring-primary/10 shadow-sm" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground">{item.title}</span>
                          <span className="text-3xs text-muted-foreground font-medium">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-2xs text-muted-foreground leading-normal">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          Action by: <span className="text-foreground">{item.user}</span>
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* TAB 10: SETTINGS */}
              {activeTab === "settings" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                  <CardHeader className="border-b border-border/20">
                    <CardTitle className="text-sm font-bold text-foreground">
                      Repository Settings
                    </CardTitle>
                    <CardDescription>
                      Configure webhook connections and quality analysis scope
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Input name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground block">
                        Rename Repository
                      </label>
                      <div className="flex gap-2 max-w-md">
                        <input
                          type="text"
                          defaultValue={repo.name}
                          className="bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none w-full"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert("Simulated rename successful")}
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Scanner rule switches */}
                    <div className="space-y-4 pt-4 border-t border-border/20">
                      <label className="text-xs font-bold text-foreground block">
                        AI Review Configuration
                      </label>
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between max-w-lg">
                          <div>
                            <span className="text-xs font-semibold text-foreground block">
                              Auto-scan new PRs
                            </span>
                            <span className="text-3xs text-muted-foreground block">
                              Run security check pipelines automatically on commit webhook updates.
                            </span>
                          </div>
                          <input type="checkbox" defaultChecked className="cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between max-w-lg">
                          <div>
                            <span className="text-xs font-semibold text-foreground block">
                              Comment suggestions inline
                            </span>
                            <span className="text-3xs text-muted-foreground block">
                              Post AI review optimization feedback directly on target PR code lines.
                            </span>
                          </div>
                          <input type="checkbox" defaultChecked className="cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    {/* Danger zone */}
                    <div className="space-y-3 pt-6 border-t border-destructive/20">
                      <label className="text-xs font-bold text-destructive block">
                        Danger Zone
                      </label>
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between gap-4 max-w-2xl">
                        <div>
                          <span className="text-xs font-semibold text-foreground block">
                            Delete this Repository
                          </span>
                          <span className="text-3xs text-muted-foreground block">
                            Once deleted, audit reports history logs cannot be recovered.
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/20 hover:bg-destructive/10"
                          onClick={() => alert("Repository delete simulation trigger")}
                        >
                          Delete Repository
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
