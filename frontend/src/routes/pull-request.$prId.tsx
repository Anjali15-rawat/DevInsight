import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Sparkles,
  GitBranch,
  Check,
  X,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  Terminal,
  RefreshCw,
  Eye,
  GitCommit,
  Split,
  FileCode,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockPullRequests } from "@/lib/mock-data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export const Route = createFileRoute("/pull-request/$prId")({
  component: PullRequestDetailsComponent,
});

// Mock detailed AI findings for the review queue
interface AiFinding {
  id: string;
  filePath: string;
  line: number;
  severity: "critical" | "warning" | "optimization";
  confidence: "high" | "medium" | "low";
  explanation: string;
  suggestedFix: string;
  relatedDoc: string;
  docUrl: string;
  estimatedImpact: string;
  status: "pending" | "accepted" | "ignored";
  codeSnippet: string;
}

const mockAiFindings: Record<string, AiFinding[]> = {
  "pr-1": [
    {
      id: "f-1",
      filePath: "mfa_verify.go",
      line: 124,
      severity: "critical",
      confidence: "high",
      explanation:
        "Direct database row queries inside high-frequency API routes missing context deadlines will cause transaction locking under burst volume.",
      suggestedFix: `// Introduce query context deadline
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()
row := db.QueryRowContext(ctx, "SELECT secret FROM users_mfa WHERE user_id = ?", uid)`,
      relatedDoc: "Golang Database Timeout & Locking Mitigation Guide",
      docUrl: "https://go.dev/doc/database/cancel-operations",
      estimatedImpact:
        "Prevents API worker starvation and reduces high-concurrency latencies by 45%.",
      status: "pending",
      codeSnippet: `row := db.QueryRow("SELECT secret FROM users_mfa WHERE user_id = ?", uid)`,
    },
    {
      id: "f-2",
      filePath: "mfa_verify.go",
      line: 138,
      severity: "optimization",
      confidence: "medium",
      explanation:
        "Crypto secret comparators are compared using standard equivalence checks. This makes the verify module susceptible to timing attacks.",
      suggestedFix: `// Use constant-time comparison
if subtle.ConstantTimeCompare([]byte(userSecret), []byte(dbSecret)) == 1 {`,
      relatedDoc: "Constant-time Cryptography Guidelines",
      docUrl: "https://pkg.go.dev/crypto/subtle",
      estimatedImpact: "Fixes potential timing attacks in hardware MFA signature validation.",
      status: "pending",
      codeSnippet: `if userSecret == dbSecret {`,
    },
  ],
  "pr-2": [
    {
      id: "f-3",
      filePath: "sidebar.tsx",
      line: 42,
      severity: "warning",
      confidence: "high",
      explanation:
        "LocalStorage items are exposed to local variables without parsing hooks. Hydration mismatches will occur if server context resolves layout toggles differently.",
      suggestedFix: `// Add safety defaults & parsing check
const rawTheme = localStorage.getItem("theme");
const currentTheme = rawTheme === "dark" || rawTheme === "light" ? rawTheme : "system";`,
      relatedDoc: "React SSR Hydration & LocalStorage Hooks guide",
      docUrl: "https://react.dev/reference/react-dom/client/hydrateRoot",
      estimatedImpact:
        "Resolves layout flicker & hydration console errors during server-side renders.",
      status: "pending",
      codeSnippet: `const currentTheme = localStorage.getItem("theme") || "system";`,
    },
  ],
};

// Mock code diff structures (GitHub style)
const mockDiffs: Record<
  string,
  Array<{ filePath: string; oldLines: string[]; newLines: string[] }>
> = {
  "pr-1": [
    {
      filePath: "mfa_verify.go",
      oldLines: [
        "121: func VerifyHardwareKey(uid string, token string) bool {",
        "122: \t// Fetch hardware secret reference",
        "123: \tvar secret string",
        '124: - \trow := db.QueryRow("SELECT secret FROM users_mfa WHERE user_id = ?", uid)',
        "125: \terr := row.Scan(&secret)",
      ],
      newLines: [
        "121: func VerifyHardwareKey(uid string, token string) bool {",
        "122: \t// Fetch hardware secret reference",
        "123: \tvar secret string",
        "124: + \tctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)",
        "124: + \tdefer cancel()",
        '124: + \trow := db.QueryRowContext(ctx, "SELECT secret FROM users_mfa WHERE user_id = ?", uid)',
        "125: \terr := row.Scan(&secret)",
      ],
    },
  ],
  "pr-2": [
    {
      filePath: "sidebar.tsx",
      oldLines: [
        "40: export function Sidebar() {",
        "41: \t// Get theme value",
        '42: - \tconst currentTheme = localStorage.getItem("theme") || "system";',
        "43: \tconst [collapsed, setCollapsed] = useState(false);",
      ],
      newLines: [
        "40: export function Sidebar() {",
        "41: \t// Get theme value",
        '42: + \tconst rawTheme = localStorage.getItem("theme");',
        '42: + \tconst currentTheme = rawTheme === "dark" || rawTheme === "light" ? rawTheme : "system";',
        "43: \tconst [collapsed, setCollapsed] = useState(false);",
      ],
    },
  ],
};

function PullRequestDetailsComponent() {
  const queryClient = useQueryClient();
  const { prId } = useParams({ from: "/pull-request/$prId" });

  const { data: bffData } = useQuery({
    queryKey: queryKeys.bff.pullRequest(Number(prId)),
    queryFn: () => apiFetch<any>(`/api/v1/bff/pull-request/${prId}`),
    staleTime: 30 * 1000,
  });

  const pr = useMemo(() => {
    if (bffData?.pull_request) {
      const p = bffData.pull_request;
      return {
        id: String(p.id),
        title: p.title,
        number: p.number,
        status:
          p.review_status === "approved"
            ? "success"
            : p.review_status === "reviewing"
              ? "warning"
              : "destructive",
        branch: p.head_branch,
        targetBranch: p.base_branch,
        author: {
          name: p.author?.name || p.author?.username || "Developer",
          avatar:
            p.author?.avatar_url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        },
      };
    }
    return mockPullRequests.find((p) => p.id === prId) || mockPullRequests[0];
  }, [bffData, prId]);

  const activeFindings = useMemo(() => {
    if (bffData?.pull_request?.findings) {
      return bffData.pull_request.findings.map((f: any) => ({
        id: String(f.id),
        filePath: f.file_path,
        line: f.line_number || 1,
        severity: f.severity,
        confidence: f.confidence,
        explanation: f.explanation,
        suggestedFix: f.suggested_fix || "",
        relatedDoc: f.related_doc || "",
        docUrl: f.doc_url || "",
        estimatedImpact: f.estimated_impact || "",
        status: f.status === "false_positive" ? "ignored" : f.status,
        codeSnippet: f.code_snippet || "",
      }));
    }
    return mockAiFindings[prId] || mockAiFindings["pr-1"];
  }, [bffData, prId]);

  const feedbackMutation = useMutation({
    mutationFn: ({ findingId, action }: { findingId: string; action: "accepted" | "ignored" }) =>
      apiFetch(`/api/v1/pull-requests/${prId}/findings/${findingId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ status: action }),
      }),
    onSuccess: (_, variables) => {
      toast.success(`Finding marked as '${variables.action}'`);
      queryClient.invalidateQueries({ queryKey: queryKeys.bff.pullRequest(Number(prId)) });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit feedback.");
    },
  });

  const [activeTab, setActiveTab] = useState<"findings" | "diff" | "timeline" | "comparison">(
    "findings",
  );
  const findings = activeFindings;
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [feedbackOpen, setFeedbackOpen] = useState<Record<string, boolean>>({});

  const handleAction = (id: string, action: "accepted" | "ignored") => {
    feedbackMutation.mutate({ findingId: id, action });
  };

  const handleFeedbackSubmit = (id: string) => {
    const text = feedbackText[id];
    if (!text) return;
    toast.success(`Feedback submitted for AI learning: "${text}"`);
    setFeedbackOpen((prev) => ({ ...prev, [id]: false }));
    setFeedbackText((prev) => ({ ...prev, [id]: "" }));
  };

  const diffs = mockDiffs[pr.id] || [];

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left">
        {/* Navigation Breadcrumb */}
        <Link
          to="/pull-requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Review Queue
        </Link>

        {/* PR Info Header (GitHub style) */}
        <div className="border-b border-border/40 pb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              {pr.title} <span className="text-muted-foreground font-normal">#{pr.number}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-muted-foreground font-semibold">
            <Badge
              variant={
                pr.status === "success"
                  ? "success"
                  : pr.status === "warning"
                    ? "warning"
                    : "destructive"
              }
              className="text-[9px] py-0.5 px-2 uppercase font-semibold shrink-0"
            >
              Open
            </Badge>
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <img
                src={pr.author.avatar}
                alt={pr.author.name}
                className="h-5 w-5 rounded-full border border-border/40"
              />
              {pr.author.name}
            </span>
            <span>wants to merge modifications into</span>
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" /> {pr.branch}
            </span>
            <span>from</span>
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" /> {pr.targetBranch}
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center border-b border-border/50 pb-px scrollbar-none overflow-x-auto">
          <nav className="flex space-x-2">
            {[
              {
                id: "findings",
                label: "AI Findings",
                count: findings.filter((f) => f.status === "pending").length,
              },
              { id: "diff", label: "Files & Diff Viewer" },
              { id: "timeline", label: "Timeline History" },
              { id: "comparison", label: "Commit Comparison" },
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
                  <span className="bg-destructive/15 text-destructive px-1.5 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB SWITCH CONTENTS */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: AI FINDINGS */}
              {activeTab === "findings" && (
                <div className="space-y-6">
                  {findings.length === 0 ? (
                    <Card className="border-border/50 bg-success/5 dark:bg-success/2 py-16 px-6 text-center max-w-xl mx-auto border shadow-sm">
                      <CardContent className="space-y-5">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 border border-success/30 shadow-2xs">
                          <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="font-display text-lg font-bold text-success-foreground">
                            All findings resolved
                          </CardTitle>
                          <CardDescription className="max-w-sm mx-auto text-xs leading-relaxed">
                            No critical issues, code warnings, or optimization alerts remain. You
                            are fully ready to merge this PR.
                          </CardDescription>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    findings.map((finding) => (
                      <Card
                        key={finding.id}
                        className={`border-border/50 transition-all duration-300 ${
                          finding.status === "accepted"
                            ? "bg-success/5 border-success/20 opacity-75"
                            : finding.status === "ignored"
                              ? "bg-muted/10 opacity-50"
                              : "bg-card/40 hover:border-border shadow-xs"
                        }`}
                      >
                        <CardHeader className="pb-3 border-b border-border/20">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1.5 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                                  {finding.filePath}:{finding.line}
                                </span>
                                <Badge
                                  variant={
                                    finding.severity === "critical"
                                      ? "destructive"
                                      : finding.severity === "warning"
                                        ? "warning"
                                        : "outline"
                                  }
                                  className="text-[9px] py-0 px-1.5 uppercase font-semibold scale-90"
                                >
                                  {finding.severity}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1.5 uppercase font-semibold scale-90"
                                >
                                  {finding.confidence} confidence
                                </Badge>
                              </div>
                            </div>
                            {finding.status === "pending" && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  variant="outline"
                                  size="xs"
                                  onClick={() => handleAction(finding.id, "ignored")}
                                  className="cursor-pointer border-border hover:bg-muted text-[10px]"
                                >
                                  <X className="mr-1 h-3.5 w-3.5 text-destructive" /> Ignore
                                </Button>
                                <Button
                                  variant="hero"
                                  size="xs"
                                  onClick={() => handleAction(finding.id, "accepted")}
                                  className="cursor-pointer text-[10px]"
                                >
                                  <Check className="mr-1 h-3.5 w-3.5 text-primary-foreground" />{" "}
                                  Accept Fix
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4 text-left">
                          {/* Explanation */}
                          <div className="space-y-1">
                            <span className="text-3xs font-bold text-muted-foreground uppercase tracking-widest block">
                              AI Diagnosis
                            </span>
                            <p className="text-xs text-foreground leading-relaxed">
                              {finding.explanation}
                            </p>
                          </div>

                          {/* Impact */}
                          <div className="space-y-1">
                            <span className="text-3xs font-bold text-muted-foreground uppercase tracking-widest block">
                              Estimated Impact
                            </span>
                            <p className="text-xs text-foreground font-medium leading-relaxed">
                              {finding.estimatedImpact}
                            </p>
                          </div>

                          {/* Code Blocks comparison */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <span className="text-3xs font-bold text-muted-foreground uppercase tracking-widest block">
                                Current Code
                              </span>
                              <pre className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 font-mono text-3xs text-destructive overflow-x-auto whitespace-pre">
                                {finding.codeSnippet}
                              </pre>
                            </div>
                            <div className="space-y-1">
                              <span className="text-3xs font-bold text-muted-foreground uppercase tracking-widest block flex items-center gap-1">
                                Suggested Fix{" "}
                                <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                              </span>
                              <pre className="bg-success/5 border border-success/10 rounded-lg p-3 font-mono text-3xs text-success-foreground overflow-x-auto whitespace-pre">
                                {finding.suggestedFix}
                              </pre>
                            </div>
                          </div>

                          {/* Documentation Link & Feedback */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/20 pt-4 text-3xs font-semibold">
                            <a
                              href={finding.docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <BookOpen className="h-3.5 w-3.5" /> Documentation:{" "}
                              {finding.relatedDoc} <ArrowUpRight className="h-3 w-3" />
                            </a>

                            <div className="relative">
                              <button
                                onClick={() =>
                                  setFeedbackOpen((prev) => ({
                                    ...prev,
                                    [finding.id]: !prev[finding.id],
                                  }))
                                }
                                className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Submit feedback to AI
                              </button>
                              {feedbackOpen[finding.id] && (
                                <div className="absolute right-0 bottom-6 z-10 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg space-y-2">
                                  <Textarea
                                    placeholder="Tell the AI why this suggestion is incorrect or helpful..."
                                    value={feedbackText[finding.id] || ""}
                                    onChange={(e) =>
                                      setFeedbackText((prev) => ({
                                        ...prev,
                                        [finding.id]: e.target.value,
                                      }))
                                    }
                                    className="text-xs focus-visible:ring-0 focus-visible:ring-offset-0 bg-background/50 h-16 min-h-[60px]"
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      onClick={() =>
                                        setFeedbackOpen((prev) => ({
                                          ...prev,
                                          [finding.id]: false,
                                        }))
                                      }
                                      className="text-[10px] cursor-pointer"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="xs"
                                      onClick={() => handleFeedbackSubmit(finding.id)}
                                      className="text-[10px] cursor-pointer"
                                    >
                                      Submit
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: FILES & DIFF VIEWER */}
              {activeTab === "diff" && (
                <div className="space-y-6 text-left">
                  {diffs.map((diff, idx) => (
                    <Card
                      key={idx}
                      className="border-border/60 overflow-hidden bg-card/25 backdrop-blur-md"
                    >
                      <CardHeader className="bg-muted/40 p-3 border-b border-border/40 flex flex-row items-center gap-2">
                        <FileCode className="h-4.5 w-4.5 text-muted-foreground" />
                        <CardTitle className="text-xs font-mono text-foreground font-bold">
                          {diff.filePath}
                        </CardTitle>
                      </CardHeader>
                      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/40 font-mono text-3xs leading-relaxed overflow-x-auto whitespace-pre">
                        {/* Old (Deletions) */}
                        <div className="p-3 bg-destructive/2 text-destructive overflow-x-auto whitespace-pre">
                          <span className="font-sans font-bold text-3xs text-muted-foreground border-b border-border/10 pb-1 mb-2 block uppercase">
                            Original Code
                          </span>
                          {diff.oldLines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className={
                                line.startsWith("-") || line.includes("-")
                                  ? "bg-destructive/10 font-bold"
                                  : ""
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </div>

                        {/* New (Additions) */}
                        <div className="p-3 bg-success/2 text-success-foreground overflow-x-auto whitespace-pre">
                          <span className="font-sans font-bold text-3xs text-muted-foreground border-b border-border/10 pb-1 mb-2 block uppercase">
                            Modified Code
                          </span>
                          {diff.newLines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className={
                                line.startsWith("+") || line.includes("+")
                                  ? "bg-success/15 font-bold"
                                  : ""
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* TAB 3: TIMELINE HISTORY */}
              {activeTab === "timeline" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Review Pipeline Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 relative pl-8 border-l border-border/60 space-y-6 ml-5 sm:ml-8">
                    <div className="relative space-y-1">
                      <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background shadow-sm" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">
                          PR Scanned by AI Agent
                        </span>
                        <span className="text-3xs text-muted-foreground font-medium">Just now</span>
                      </div>
                      <p className="text-2xs text-muted-foreground">
                        Scanned 1 codebase file. Raised 2 potential diagnostics.
                      </p>
                    </div>

                    <div className="relative space-y-1">
                      <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-muted border-2 border-background shadow-sm" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">
                          Commit `8f7c9e2` pushed
                        </span>
                        <span className="text-3xs text-muted-foreground font-medium">
                          3 hrs ago
                        </span>
                      </div>
                      <p className="text-2xs text-muted-foreground">
                        Pushed by Marcus Vance into branch token-verify.
                      </p>
                    </div>

                    <div className="relative space-y-1">
                      <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-muted border-2 border-background shadow-sm" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">
                          PR opened on GitHub
                        </span>
                        <span className="text-3xs text-muted-foreground font-medium">
                          3 hrs ago
                        </span>
                      </div>
                      <p className="text-2xs text-muted-foreground">
                        Pull Request index #452 synced successfully.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 4: COMMIT COMPARISON */}
              {activeTab === "comparison" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Compare Commits</CardTitle>
                    <CardDescription>
                      View side-by-side modifications between commits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between border border-border/60 bg-muted/40 rounded-lg p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">Base Commit:</span>
                        <code className="font-mono text-3xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                          f39d10e
                        </code>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">Head Commit:</span>
                        <code className="font-mono text-3xs text-foreground bg-muted px-1.5 py-0.5 rounded">
                          8f7c9e2
                        </code>
                      </div>
                    </div>
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      <Split className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="font-semibold">
                        Review comparison matches active file changes.
                      </p>
                      <p className="text-3xs mt-0.5">
                        Click the "Files & Diff Viewer" tab above to view the exact changes.
                      </p>
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
