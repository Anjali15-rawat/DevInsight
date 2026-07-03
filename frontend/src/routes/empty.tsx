import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GitPullRequest,
  FolderPlus,
  ShieldCheck,
  Search,
  CheckCircle,
  Inbox,
  FilterX,
  History,
  ArrowRight,
  Plus,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/empty")({
  component: EmptyStatesComponent,
});

function EmptyStatesComponent() {
  const [activeTab, setActiveTab] = useState<"repos" | "prs" | "logs" | "security">("repos");

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Empty States Templates
            </h1>
            <p className="text-sm text-muted-foreground">
              A curated collection of visually premium, contextual empty and success states.
            </p>
          </div>

          {/* Quick tab switchers */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg border border-border/40">
            {[
              { id: "repos", label: "Repositories" },
              { id: "prs", label: "Pull Requests" },
              { id: "logs", label: "Audit Logs" },
              { id: "security", label: "Security Clean" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="py-4">
          {activeTab === "repos" && (
            <Card className="border-dashed border-border/80 bg-card/25 py-12 px-6 text-center max-w-xl mx-auto backdrop-blur-md shadow-2xs">
              <CardContent className="space-y-5">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand-soft border border-primary/20 shadow-xs">
                  <FolderPlus className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-display text-lg font-bold">
                    Connect your first repository
                  </CardTitle>
                  <CardDescription className="max-w-sm mx-auto text-xs leading-relaxed">
                    DevInsight needs a repository connection to begin code analysis, triaging
                    issues, and auditing commits. Connect your GitHub or GitLab org to start.
                  </CardDescription>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast.info("Opening documentation...", {
                        description:
                          "Taking you to the DevInsight guide on repository connections.",
                      })
                    }
                  >
                    Read documentation
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => {
                      const toastId = toast.loading("Connecting repository...", {
                        description: "Initiating secure handshake with your VCS organization.",
                      });
                      setTimeout(() => {
                        toast.success("Repository connected successfully!", {
                          id: toastId,
                          description: "Your workspace is now ready for analysis.",
                        });
                      }, 2000);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Connect Repository
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "prs" && (
            <Card className="border-border/50 bg-card/40 py-16 px-6 text-center max-w-xl mx-auto backdrop-blur-md shadow-2xs">
              <CardContent className="space-y-5">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted border border-border/40">
                  <FilterX className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-display text-lg font-bold">
                    No matching pull requests
                  </CardTitle>
                  <CardDescription className="max-w-sm mx-auto text-xs leading-relaxed">
                    We couldn't find any pull requests matching the current filters. Try adjusting
                    your query or resetting filters.
                  </CardDescription>
                </div>
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => {
                      toast.success("Filters cleared", {
                        description: "All active search filters have been reset.",
                      });
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4 text-muted-foreground" /> Clear active
                    filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "logs" && (
            <Card className="border-border/50 bg-card/40 py-16 px-6 text-center max-w-xl mx-auto backdrop-blur-md shadow-2xs">
              <CardContent className="space-y-5">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted border border-border/40">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-display text-lg font-bold">
                    Audit logs are empty
                  </CardTitle>
                  <CardDescription className="max-w-sm mx-auto text-xs leading-relaxed">
                    Workspace actions, billing adjustments, and security configurations will be
                    logged here. No events have occurred in this range.
                  </CardDescription>
                </div>
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => {
                      toast.info("Navigating to setup logs...", {
                        description: "Fetching deployment and build pipeline logs.",
                      });
                    }}
                  >
                    View setup logs <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-border/40 bg-success/5 dark:bg-success/2 py-16 px-6 text-center max-w-xl mx-auto border shadow-sm">
              <CardContent className="space-y-5">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 border border-success/30 shadow-2xs">
                  <ShieldCheck className="h-8 w-8 text-success" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="font-display text-lg font-bold text-success-foreground">
                    You are fully protected
                  </CardTitle>
                  <CardDescription className="max-w-sm mx-auto text-xs leading-relaxed">
                    AI Scan complete. Zero vulnerabilities, prototype exposures, or database locking
                    conditions were detected inside the core workspace.
                  </CardDescription>
                </div>
                <div className="flex justify-center pt-2">
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => {
                      const scanToast = toast.loading("Re-running full security scan...", {
                        description: "Analyzing code layout, APIs and database model definitions.",
                      });
                      setTimeout(() => {
                        toast.success("Security scan completed", {
                          id: scanToast,
                          description: "Verified: zero vulnerabilities or exposure paths detected.",
                        });
                      }, 2500);
                    }}
                  >
                    Re-run Security Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
