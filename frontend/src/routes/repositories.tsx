import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Star,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  BookOpen,
  Settings,
  Folder,
  GitBranch,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockRepositories } from "@/lib/mock-data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/repositories")({
  component: RepositoriesComponent,
});

function RepositoriesComponent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "health" | "stars" | "updated">("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState("");

  const {
    data: discoverableRepos,
    isLoading: isDiscoverLoading,
    refetch: refetchDiscover,
  } = useQuery({
    queryKey: ["repositories", "discover"],
    queryFn: () => apiFetch<any[]>("/api/v1/repositories/github-discover"),
    enabled: isConnectModalOpen,
    retry: false,
  });

  const filteredDiscoverable = useMemo(() => {
    if (!discoverableRepos) return [];
    if (!discoverSearch) return discoverableRepos;
    return discoverableRepos.filter((repo) =>
      repo.full_name.toLowerCase().includes(discoverSearch.toLowerCase()),
    );
  }, [discoverableRepos, discoverSearch]);

  const connectMutation = useMutation({
    mutationFn: (githubFullName: string) =>
      apiFetch("/api/v1/repositories/connect?workspace_id=1", {
        method: "POST",
        body: JSON.stringify({ github_full_name: githubFullName }),
      }),
    onSuccess: () => {
      toast.success("Repository connected successfully! Initial sync queued.");
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories.list(1) });
      refetchDiscover();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to connect repository.");
    },
  });

  const { data: remoteRepos } = useQuery({
    queryKey: queryKeys.repositories.list(1),
    queryFn: () => apiFetch<any[]>("/api/v1/repositories?workspace_id=1"),
    staleTime: 60 * 1000,
  });

  const activeRepos = useMemo(() => {
    if (!remoteRepos || remoteRepos.length === 0) return mockRepositories;
    return remoteRepos.map((r: any) => ({
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
    }));
  }, [remoteRepos]);

  // Get unique languages for filter dropdown
  const languages = useMemo(() => {
    const list = activeRepos.map((r: any) => r.language);
    return ["all", ...Array.from(new Set(list))];
  }, [activeRepos]);

  // Filter & sort logic
  const filteredRepos = useMemo(() => {
    let result = [...activeRepos];

    // Filter by search
    if (search) {
      result = result.filter(
        (repo) =>
          repo.name.toLowerCase().includes(search.toLowerCase()) ||
          repo.description.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by language
    if (langFilter !== "all") {
      result = result.filter((repo) => repo.language === langFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "health") {
        comparison = a.healthScore - b.healthScore;
      } else if (sortBy === "stars") {
        comparison = a.stars - b.stars;
      } else if (sortBy === "updated") {
        // Simple comparison since mock data uses string, we approximate order based on specific items
        comparison = a.updatedAt.localeCompare(b.updatedAt);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [search, langFilter, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5 gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Repositories
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor coverage, analysis pipelines, and security standards for connected codebase
              projects.
            </p>
          </div>
          <Button
            variant="hero"
            size="sm"
            onClick={() => setIsConnectModalOpen(true)}
            className="cursor-pointer shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Repository
          </Button>
        </div>

        {/* Filter Controls (GitHub style layout) */}
        <div className="flex flex-col md:flex-row items-center gap-3 bg-card/30 p-3 rounded-lg border border-border/40 backdrop-blur-md">
          {/* Search */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Language Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Language:</span>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                className="bg-background/80 border border-border/60 rounded-md px-2.5 py-1.5 font-semibold text-foreground text-xs cursor-pointer focus:outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "all" ? "All Languages" : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-background/80 border border-border/60 rounded-md px-2.5 py-1.5 font-semibold text-foreground text-xs cursor-pointer focus:outline-none"
              >
                <option value="updated">Recent updates</option>
                <option value="name">Alphabetical</option>
                <option value="health">Health score</option>
                <option value="stars">Stars</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="h-8 px-2 border-border/60 hover:bg-muted"
                title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Repositories Cards Grid (GitHub Enterprise layout) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRepos.length === 0 ? (
            <div className="sm:col-span-2 py-16 text-center border-2 border-dashed border-border/60 rounded-xl bg-card/10">
              <Folder className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2.5" />
              <p className="text-sm font-semibold text-foreground">No repositories found</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Adjust your filters or try a different search phrase.
              </p>
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="group"
              >
                <Card className="h-full border-border/50 bg-card/40 hover:bg-card hover:border-border transition-all duration-300 shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/repository/${repo.id}`}
                            className="font-display text-base font-bold text-foreground hover:text-primary transition-colors hover:underline truncate block cursor-pointer"
                          >
                            {repo.name}
                          </Link>
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1 font-semibold uppercase scale-90"
                          >
                            Public
                          </Badge>
                        </div>
                        <CardDescription className="text-3xs">{repo.owner}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          repo.healthScore >= 90
                            ? "success"
                            : repo.healthScore >= 80
                              ? "brand"
                              : "destructive"
                        }
                        className="text-3xs font-semibold px-2 shrink-0"
                      >
                        {repo.healthScore}% health
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>

                    <div className="space-y-3 pt-3 border-t border-border/30">
                      {/* Metric lines */}
                      <div className="grid grid-cols-2 gap-2 text-2xs font-semibold">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>AI Reviews:</span>
                          <span className="text-foreground">{repo.insights.prReviewTime}</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Coverage:</span>
                          <span className="text-foreground">{repo.insights.codeCoverage}</span>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-1 text-3xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-black/10"
                              style={{ backgroundColor: repo.languageColor }}
                            />
                            {repo.language}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3.5 w-3.5" /> {repo.stars}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <GitFork className="h-3.5 w-3.5" /> {repo.forks}
                          </span>
                        </div>
                        <span>Updated {repo.updatedAt}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Connect Repository Dialog */}
      <Dialog open={isConnectModalOpen} onOpenChange={setIsConnectModalOpen}>
        <DialogContent className="max-w-md border-border/80 bg-popover/98 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Connect a GitHub Repository
            </DialogTitle>
            <DialogDescription className="text-2xs">
              Select a repository from your GitHub account to connect to this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter GitHub repositories..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {isDiscoverLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground font-semibold flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Fetching repositories from GitHub...
                </div>
              ) : filteredDiscoverable.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                  No repositories found.
                </div>
              ) : (
                filteredDiscoverable.map((repo: any) => (
                  <div
                    key={repo.github_repo_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-foreground truncate">{repo.full_name}</p>
                      <p className="text-3xs text-muted-foreground truncate">
                        {repo.description || "No description"}
                      </p>
                    </div>
                    <div>
                      {repo.is_connected ? (
                        <Badge
                          variant="outline"
                          className="text-3xs font-semibold scale-90 select-none"
                        >
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          size="2xs"
                          disabled={connectMutation.isPending}
                          onClick={() => connectMutation.mutate(repo.full_name)}
                          className="text-3xs font-bold px-3"
                        >
                          {connectMutation.isPending &&
                          connectMutation.variables === repo.full_name ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                          ) : (
                            "Connect"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
