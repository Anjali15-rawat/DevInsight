import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ArrowUpRight,
  Terminal,
  RefreshCw,
  Eye,
  GitCommit,
  Split,
  FileCode,
  Layers,
  Flame,
  Info,
  Send,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mockBugs, MockBug } from "./bugs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export const Route = createFileRoute("/bug/$bugId")({
  component: BugDetailsComponent,
});

// Mock detailed stack traces and fixes
interface DetailedBugDiag {
  stackTrace: string;
  rootCause: string;
  suggestedFix: string;
  docTitle: string;
  docUrl: string;
  relatedBugs: Array<{ id: string; number: string; title: string; similarity: string }>;
  timeline: Array<{ action: string; user: string; time: string; details?: string }>;
}

const mockDiagnostics: Record<string, DetailedBugDiag> = {
  "bug-1": {
    stackTrace: `panic: database connection timeout context
  at github.com/devinsight/core-api/db/connection.go:42
  at github.com/devinsight/core-api/api/context.VerifyContext:124
  at github.com/devinsight/core-api/api/middleware.AuthMiddleware:88
  at net/http.HandlerFunc.ServeHTTP:2044`,
    rootCause:
      "Database context limits locking queues. Under concurrent loads, connection pools locked indefinitely due to transaction select queries running without timeouts.",
    suggestedFix: `// Add context constraint parameters
ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
defer cancel()`,
    docTitle: "Golang context timeout documentation",
    docUrl: "https://go.dev/doc/database/cancel-operations",
    relatedBugs: [
      {
        id: "bug-5",
        number: "BUG-105",
        title: "API timeout under checkout load test in db connection pool",
        similarity: "94%",
      },
      {
        id: "bug-8",
        number: "BUG-108",
        title: "Go goroutine deadlock inside pool queries wrapper",
        similarity: "88%",
      },
    ],
    timeline: [
      {
        action: "Bug detected in production via Sentry webhook",
        user: "Sentry Integration",
        time: "1 day ago",
        details: "Vulnerability warning: Deadlock trigger locked 10 instances",
      },
      {
        action: "AI diagnostic analysis pipeline completed",
        user: "DevInsight AI",
        time: "23 hrs ago",
        details: "Isolated deadlock thread stack frame at connection.go:42",
      },
      { action: "Issue assigned and set to In Progress", user: "David Chen", time: "18 hrs ago" },
    ],
  },
  "bug-2": {
    stackTrace: `Warning: Prop className did not match. 
  Server: "bg-background flex flex-col w-60 h-screen" 
  Client: "bg-background flex flex-col w-16 h-screen collapsed"
  at Sidebar (http://localhost:8080/src/components/sidebar.tsx:42)`,
    rootCause:
      "Vite dev server SSR loads the layout context before LocalStorage is hydrated, leading to mismatched layout classes during hydration.",
    suggestedFix: `// Delay loading classes until component is mounted on client
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const sidebarClass = mounted && collapsed ? "w-16" : "w-60";`,
    docTitle: "React SSR Hydration client-side checks guide",
    docUrl: "https://react.dev/link/hydration-mismatch",
    relatedBugs: [],
    timeline: [
      {
        action: "Bug detected in local environment during test run",
        user: "Github Runner",
        time: "3 days ago",
      },
      {
        action: "Issue triaged and tagged as Hydration category",
        user: "Anjali Sharma",
        time: "3 days ago",
      },
    ],
  },
};

function BugDetailsComponent() {
  const queryClient = useQueryClient();
  const { bugId } = useParams({ from: "/bug/$bugId" });

  const { data: realBug } = useQuery({
    queryKey: queryKeys.bugs.detail(Number(bugId)),
    queryFn: () => apiFetch<any>(`/api/v1/bugs/${bugId}`),
    staleTime: 30 * 1000,
  });

  const bug = useMemo(() => {
    if (realBug) {
      return {
        id: String(realBug.id),
        number: `BUG-${realBug.issue_number}`,
        title: realBug.title,
        priority: realBug.priority,
        category: realBug.category,
        repo: realBug.repository,
        status: realBug.status,
        assignee: {
          name: realBug.assignee?.name || "Unassigned",
          avatar:
            realBug.assignee?.avatar_url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        },
      };
    }
    return mockBugs.find((b) => b.id === bugId) || mockBugs[0];
  }, [realBug, bugId]);

  const diag = useMemo(() => {
    if (realBug?.root_cause) {
      const rc = realBug.root_cause;
      return {
        stackTrace: `Likely Cause: ${rc.likely_cause}\nAffected File: ${rc.affected_file || "N/A"}\nAffected Function: ${rc.affected_function || "N/A"}`,
        rootCause: rc.likely_cause,
        suggestedFix: rc.suggested_fix || "// Code correction pending AI audit.",
        docTitle: "Documentation Index",
        docUrl: "https://github.com",
        relatedBugs: [],
        timeline: [
          { action: "Incident created", user: "GitHub", time: "recently" },
          {
            action: "AI analysis finished",
            user: "DevInsight AI",
            time: "recently",
            details: `Confidence: ${rc.confidence}`,
          },
        ],
      };
    }
    return (
      mockDiagnostics[bugId] || {
        stackTrace: "No stack trace logs captured.",
        rootCause: "Under evaluation.",
        suggestedFix: "// Code correction pending AI audit.",
        docTitle: "Documentation Index",
        docUrl: "https://github.com",
        relatedBugs: [],
        timeline: [{ action: "Incident created", user: "Admin", time: "Just now" }],
      }
    );
  }, [realBug, bugId]);

  const statusMutation = useMutation({
    mutationFn: (newStatus: "Triage" | "Backlog" | "In Progress" | "Resolved") =>
      apiFetch(`/api/v1/bugs/${bugId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: (_, newStatus) => {
      toast.success(`Bug status updated to '${newStatus}'`);
      queryClient.invalidateQueries({ queryKey: queryKeys.bugs.detail(Number(bugId)) });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status.");
    },
  });

  const [activeTab, setActiveTab] = useState<"rootcause" | "timeline" | "notes" | "related">(
    "rootcause",
  );
  const [notes, setNotes] = useState<string[]>([
    "Assigned to David. Running diagnostic traces to ensure lock timeout fixes won't break database replication pipelines.",
  ]);
  const [newNote, setNewNote] = useState("");

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes((prev) => [...prev, newNote]);
    setNewNote("");
  };

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left">
        {/* Breadcrumbs */}
        <Link
          to="/bugs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Incident List
        </Link>

        {/* Issue Header */}
        <div className="border-b border-border/40 pb-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <code className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {bug.number}
            </code>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              {bug.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-muted-foreground font-semibold">
            <Badge
              variant={bug.priority === "P0" ? "destructive" : "warning"}
              className="scale-90 px-2 uppercase shrink-0"
            >
              {bug.priority} Incident
            </Badge>
            <Badge variant="outline" className="scale-90 px-2 uppercase shrink-0">
              {bug.category}
            </Badge>
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <img
                src={bug.assignee.avatar}
                alt={bug.assignee.name}
                className="h-5 w-5 rounded-full border border-border/40"
              />
              {bug.assignee.name}
            </span>
            <span className="flex items-center gap-1">
              Status:
              <select
                value={bug.status}
                disabled={statusMutation.isPending}
                onChange={(e) => statusMutation.mutate(e.target.value as any)}
                className="bg-card border border-border/60 rounded px-1.5 py-0.5 text-3xs text-foreground font-semibold cursor-pointer focus:outline-none"
              >
                <option value="Triage">Triage</option>
                <option value="Backlog">Backlog</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </span>
            <span>
              · Repo: <strong className="text-foreground">{bug.repo}</strong>
            </span>
          </div>
        </div>

        {/* Sub nav tabs */}
        <div className="flex items-center border-b border-border/50 pb-px scrollbar-none overflow-x-auto">
          <nav className="flex space-x-2">
            {[
              { id: "rootcause", label: "Root Cause & Diagnosis" },
              { id: "timeline", label: "Incident Timeline" },
              { id: "notes", label: "Engineering Notes", count: notes.length },
              { id: "related", label: "Related Duplicate Bugs", count: diag.relatedBugs.length },
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

        {/* Tab content switcher */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: ROOT CAUSE & DIAGNOSIS */}
              {activeTab === "rootcause" && (
                <div className="space-y-6">
                  {/* Analysis Cards */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                      {/* Root cause text */}
                      <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                        <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center gap-2">
                          <Info className="h-4.5 w-4.5 text-primary" />
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            AI Diagnostic Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                          <div className="space-y-1 text-left">
                            <span className="text-3xs font-bold text-muted-foreground uppercase tracking-widest block">
                              Incident Explanation
                            </span>
                            <p className="text-xs text-foreground leading-relaxed">
                              {diag.rootCause}
                            </p>
                          </div>

                          <div className="space-y-1 text-left border-t border-border/10 pt-4">
                            <span className="text-3xs font-bold text-muted-foreground uppercase tracking-widest block flex items-center gap-1">
                              AI Suggested Fix{" "}
                              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                            </span>
                            <pre className="bg-success/5 border border-success/10 rounded-lg p-3 font-mono text-3xs text-success-foreground overflow-x-auto whitespace-pre">
                              {diag.suggestedFix}
                            </pre>
                            <div className="flex justify-end pt-2">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(diag.suggestedFix);
                                  alert("Fix code copied to clipboard!");
                                }}
                                className="cursor-pointer text-[10px] border-border/60 hover:bg-muted"
                              >
                                <Check className="mr-1 h-3.5 w-3.5" /> Copy Suggested Fix
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Stack trace panel */}
                    <div className="space-y-6">
                      <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                        <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center gap-2">
                          <Terminal className="h-4.5 w-4.5 text-muted-foreground" />
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Crash Log Stack Trace
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <pre className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 font-mono text-[9px] text-destructive leading-relaxed overflow-x-auto whitespace-pre">
                            {diag.stackTrace}
                          </pre>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                        <CardHeader>
                          <CardTitle className="text-sm font-bold">Diagnostics Index</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-3xs font-semibold space-y-3">
                          <a
                            href={diag.docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center justify-between border-b border-border/10 pb-2"
                          >
                            <span>Reference documentation:</span>
                            <span className="flex items-center gap-0.5">
                              {diag.docTitle} <ArrowUpRight className="h-3 w-3" />
                            </span>
                          </a>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INCIDENT TIMELINE */}
              {activeTab === "timeline" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Issue Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 relative pl-8 border-l border-border/60 space-y-6 ml-5 sm:ml-8">
                    {diag.timeline.map((item, idx) => (
                      <div key={idx} className="relative space-y-1">
                        <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background shadow-sm" />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{item.action}</span>
                          <span className="text-3xs text-muted-foreground font-medium">
                            {item.time}
                          </span>
                        </div>
                        {item.details && (
                          <p className="text-2xs text-muted-foreground">{item.details}</p>
                        )}
                        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          Action by: <span className="text-foreground">{item.user}</span>
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* TAB 3: ENGINEERING NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-6">
                  {/* Note List */}
                  <div className="space-y-4">
                    {notes.map((note, idx) => (
                      <Card
                        key={idx}
                        className="border-border/50 bg-card/30 backdrop-blur-md text-left"
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-3xs text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1">
                              <img
                                src={bug.assignee.avatar}
                                alt="Author"
                                className="h-4 w-4 rounded-full"
                              />
                              {bug.assignee.name}
                            </span>
                            <span>Posted {idx === 0 ? "1 hr ago" : "Just now"}</span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed leading-normal">
                            {note}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Note Form */}
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Add Engineering Note</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <form onSubmit={addNote} className="space-y-3">
                        <Textarea
                          placeholder="Attach diagnostic logs, reproduction steps, or database query results..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="text-xs focus-visible:ring-0 focus-visible:ring-offset-0 bg-background/50 border-border/60"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            size="sm"
                            className="cursor-pointer text-xs h-8 px-4"
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" /> Post Note
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 4: RELATED DUPLICATE BUGS */}
              {activeTab === "related" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">
                      Related & Potential Duplicates
                    </CardTitle>
                    <CardDescription>
                      AI grouped crash incidents based on stack trace similarity
                    </CardDescription>
                  </CardHeader>
                  <div className="divide-y divide-border/20">
                    {diag.relatedBugs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        No related duplicate incidents isolated.
                      </div>
                    ) : (
                      diag.relatedBugs.map((dup) => (
                        <div
                          key={dup.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-3xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                {dup.number}
                              </code>
                              <span className="font-bold text-xs text-foreground">{dup.title}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="brand" className="text-3xs font-semibold px-2 py-0.5">
                              {dup.similarity} similarity
                            </Badge>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                alert(`Merged ${dup.number} under parent ${bug.number}`)
                              }
                              className="cursor-pointer text-[10px] h-7"
                            >
                              Merge Duplicate
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
