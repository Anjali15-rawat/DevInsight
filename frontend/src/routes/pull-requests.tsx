import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GitPullRequest,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  GitBranch,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockPullRequests } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/pull-requests")({
  component: PullRequestsComponent,
});

function PullRequestsComponent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: remotePRs } = useQuery({
    queryKey: queryKeys.pullRequests.list(1),
    queryFn: () => apiFetch<any[]>("/api/v1/pull-requests?workspace_id=1"),
    staleTime: 60 * 1000,
  });

  const activePRs = useMemo(() => {
    if (!remotePRs || remotePRs.length === 0) return mockPullRequests;
    return remotePRs.map((p: any) => ({
      id: `pr-${p.id}`,
      number: p.number,
      title: p.title,
      author: {
        name: p.author?.name || p.author?.username || "Developer",
        username: p.author?.username || "dev",
        avatar:
          p.author?.avatar_url ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      },
      repository: p.repository || "core-api",
      branch: p.head_branch || "feature",
      targetBranch: p.base_branch || "main",
      status: p.build_status || "success",
      reviewStatus: p.review_status || "Approved",
      additions: p.additions || 0,
      deletions: p.deletions || 0,
      createdAt: "Recently",
      aiInsightsSummary: p.ai_insights_summary || "Automated code analysis completed smoothly.",
    }));
  }, [remotePRs]);

  const filteredPRs = useMemo(() => {
    let result = [...activePRs];

    if (search) {
      result = result.filter(
        (pr) =>
          pr.title.toLowerCase().includes(search.toLowerCase()) ||
          pr.repository.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((pr) => pr.reviewStatus === statusFilter);
    }

    return result;
  }, [search, statusFilter, activePRs]);

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left">
        {/* Header */}
        <div className="border-b border-border/40 pb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Review Queue <Sparkles className="h-5 w-5 text-accent animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage pending AI code reviews, merge conflicts, and code quality audits across your
            repositories.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-card/30 p-3 rounded-lg border border-border/40 backdrop-blur-md">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pull requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
            <span className="text-muted-foreground font-medium shrink-0">Review Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background/80 border border-border/60 rounded-md px-2.5 py-1.5 font-semibold text-foreground text-xs cursor-pointer focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Reviews</option>
              <option value="Approved">Approved</option>
              <option value="Review Required">Review Required</option>
              <option value="Changes Requested">Changes Requested</option>
            </select>
          </div>
        </div>

        {/* Review Queue Cards */}
        <div className="space-y-4">
          {filteredPRs.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-border/60 rounded-xl bg-card/10">
              <GitPullRequest className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-foreground">No active pull requests</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                The queue is currently empty. Start by opening a branch PR on GitHub.
              </p>
            </div>
          ) : (
            filteredPRs.map((pr) => (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="group"
              >
                <Card className="border-border/50 bg-card/40 hover:bg-card hover:border-border transition-all duration-300 shadow-2xs hover:shadow-xs">
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {pr.repository} #{pr.number}
                        </span>
                        <Badge
                          variant={
                            pr.reviewStatus === "Approved"
                              ? "success"
                              : pr.reviewStatus === "Changes Requested"
                                ? "destructive"
                                : "brand"
                          }
                          className="text-[9px] py-0 px-1.5 font-semibold uppercase scale-90"
                        >
                          {pr.reviewStatus}
                        </Badge>
                      </div>

                      <Link
                        to={`/pull-request/${pr.id}`}
                        className="font-display text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors hover:underline block truncate cursor-pointer"
                      >
                        {pr.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-3xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <img
                            src={pr.author.avatar}
                            alt={pr.author.name}
                            className="h-4.5 w-4.5 rounded-full border border-border/40"
                          />
                          {pr.author.name}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[9px]">
                          <GitBranch className="h-3 w-3" /> {pr.branch} → {pr.targetBranch}
                        </span>
                        <span>Opened {pr.createdAt}</span>
                        <span className="text-success">+{pr.additions}</span>
                        <span className="text-destructive">-{pr.deletions}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
                      {/* AI brief preview box */}
                      <div className="w-full md:w-[260px] rounded-lg bg-primary/5 dark:bg-primary/2 border border-primary/10 p-2.5 text-3xs leading-relaxed text-muted-foreground text-left">
                        <span className="font-bold text-foreground block mb-0.5 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-accent animate-pulse" /> AI Triage Tally
                        </span>
                        {pr.aiInsightsSummary}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="cursor-pointer font-semibold"
                      >
                        <Link to={`/pull-request/${pr.id}`}>
                          Review Code <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
