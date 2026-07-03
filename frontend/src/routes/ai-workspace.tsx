import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Upload,
  FileCode,
  Terminal,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Play,
  Settings,
  ArrowRight,
  Database,
  ExternalLink,
  Plus,
  Compass,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/ai-workspace")({
  component: AiWorkspaceComponent,
});

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: "idle" | "active" | "error";
  currentTask: string;
  confidence: number;
  jobsToday: number;
  successRate: number;
  latency: string;
  description: string;
}

const initialAgents: Agent[] = [
  {
    id: "ag-code",
    name: "Code Quality Agent",
    type: "lint_triage",
    status: "idle",
    currentTask: "Monitoring devinsight-corp/core-api commit webhooks.",
    confidence: 98,
    jobsToday: 42,
    successRate: 99.4,
    latency: "450ms",
    description:
      "Performs static syntax audits and checks for cyclomatic code complexity standards.",
  },
  {
    id: "ag-sec",
    name: "Security Agent",
    type: "vulnerability_scan",
    status: "active",
    currentTask: "Analyzing dependency trees in package.json for Axios prototypes leakage.",
    confidence: 96,
    jobsToday: 88,
    successRate: 100,
    latency: "820ms",
    description:
      "Audits codebase dependencies and queries for secrets leakage, SQL exposure, and prototype pollutions.",
  },
  {
    id: "ag-perf",
    name: "Performance Agent",
    type: "latency_optimization",
    status: "idle",
    currentTask: "Checking core-api DB queries index locks scheduler.",
    confidence: 92,
    jobsToday: 24,
    successRate: 95.8,
    latency: "1.2s",
    description: "Flags redundant loops, missing indexes, and context blocking deadlocks.",
  },
  {
    id: "ag-bug",
    name: "Bug Agent",
    type: "incident_triage",
    status: "idle",
    currentTask: "Triage monitoring on active repository issue backlogs.",
    confidence: 94,
    jobsToday: 62,
    successRate: 97.2,
    latency: "650ms",
    description: "Matches open incident trace templates against active repository files.",
  },
  {
    id: "ag-root",
    name: "Root Cause Agent",
    type: "stack_triage",
    status: "idle",
    currentTask: "Awaiting new panic logs context hooks from prod Sentry.",
    confidence: 95,
    jobsToday: 18,
    successRate: 98.1,
    latency: "950ms",
    description: "Traces call stacks to highlight exact code failures and suggested fixes.",
  },
  {
    id: "ag-know",
    name: "Knowledge Agent",
    type: "doc_retrieval",
    status: "active",
    currentTask: "Ingesting newly uploaded API endpoints architecture docs.",
    confidence: 99,
    jobsToday: 114,
    successRate: 99.8,
    latency: "250ms",
    description:
      "Indexes engineering files to resolve code guidelines questions via semantic search.",
  },
];

const mockKnowledgeFiles = [
  {
    id: "doc-1",
    name: "architecture_overview.md",
    type: "Markdown",
    size: "42 KB",
    uploaded: "2 hours ago",
    status: "Indexed",
  },
  {
    id: "doc-2",
    name: "db_pooling_guidelines.pdf",
    type: "PDF",
    size: "1.2 MB",
    uploaded: "Yesterday",
    status: "Indexed",
  },
  {
    id: "doc-3",
    name: "api_v2_spec.json",
    type: "JSON",
    size: "180 KB",
    uploaded: "3 days ago",
    status: "Indexing",
  },
];

const mockTelemetry = [
  { time: "15:50", requests: 12, tokens: 45000 },
  { time: "15:52", requests: 19, tokens: 68000 },
  { time: "15:54", requests: 28, tokens: 104000 },
  { time: "15:56", requests: 22, tokens: 89000 },
];

function AiWorkspaceComponent() {
  const [activeTab, setActiveTab] = useState<"agents" | "knowledge" | "telemetry">("agents");
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [searchDoc, setSearchDoc] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: remoteKnowledge } = useQuery({
    queryKey: queryKeys.knowledge.list(1),
    queryFn: () => apiFetch<any[]>("/api/v1/knowledge?workspace_id=1"),
    staleTime: 60 * 1000,
  });

  const handleUploadSimulate = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert(
        "Document uploaded & processed successfully! Parsed under OpenAI text-embedding-3 vectors.",
      );
    }, 2000);
  };

  const triggerAgentRun = (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "active", currentTask: "Initiating live scan audit cycle..." }
          : a,
      ),
    );
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: "idle", currentTask: "Triage monitoring complete. 0 warnings." }
            : a,
        ),
      );
    }, 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left font-sans">
        {/* Header (OpenAI internal layout) */}
        <div className="border-b border-border/40 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <Terminal className="h-3.5 w-3.5" />
              <span>ORG_ID: devinsight-corp · API_VER: v1.8.4-beta</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 mt-1">
              AI Agent Workspace <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </h1>
            <p className="text-sm text-muted-foreground">
              Autonomous pipelines status logs, embeddings knowledge ingest, and telemetry monitors.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert("Simulation: Reset workspace credentials")}
              className="cursor-pointer font-mono text-xs border-border/80 bg-background/50 hover:bg-muted"
            >
              Reset Tokens
            </Button>
          </div>
        </div>

        {/* Navigation Subnav */}
        <div className="flex items-center border-b border-border/50 pb-px scrollbar-none overflow-x-auto">
          <nav className="flex space-x-2">
            {[
              { id: "agents", label: "Autonomous Agents", count: agents.length },
              { id: "knowledge", label: "Knowledge Base Files" },
              { id: "telemetry", label: "Telemetry & Logs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === tab.id
                    ? "border-primary text-foreground font-bold font-mono"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border font-mono"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content area */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: AUTONOMOUS AGENTS */}
              {activeTab === "agents" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className="border-border/50 bg-card/30 hover:bg-card hover:border-border transition-all duration-300 shadow-2xs hover:shadow-xs flex flex-col justify-between"
                    >
                      <CardHeader className="pb-3 border-b border-border/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-left space-y-0.5">
                            <span className="font-mono text-3xs text-muted-foreground font-bold uppercase tracking-wider">
                              {agent.type}
                            </span>
                            <CardTitle className="text-sm font-bold">{agent.name}</CardTitle>
                          </div>
                          <Badge
                            variant={agent.status === "active" ? "brand" : "outline"}
                            className="text-[9px] font-mono py-px px-1.5"
                          >
                            {agent.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-muted-foreground text-left leading-relaxed">
                          {agent.description}
                        </p>

                        {/* Telemetry panel */}
                        <div className="bg-muted/30 border border-border/40 rounded-lg p-2.5 space-y-2 text-3xs font-mono text-left leading-normal">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Task:</span>
                            <span className="text-foreground font-semibold truncate w-[160px] text-right">
                              {agent.currentTask}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-border/10 pt-1">
                            <span className="text-muted-foreground">Jobs Today / Latency:</span>
                            <span className="text-foreground font-semibold">
                              {agent.jobsToday} / {agent.latency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Success Rate / Conf:</span>
                            <span className="text-foreground font-semibold">
                              {agent.successRate}% / {agent.confidence}%
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 justify-end pt-1">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => alert(`Simulating agent settings for: ${agent.name}`)}
                            className="cursor-pointer text-[10px] h-7 px-2.5 border-border/80 hover:bg-muted"
                          >
                            <Settings className="mr-1 h-3.5 w-3.5" /> Params
                          </Button>
                          <Button
                            variant="hero"
                            size="xs"
                            disabled={agent.status === "active"}
                            onClick={() => triggerAgentRun(agent.id)}
                            className="cursor-pointer text-[10px] h-7 px-2.5"
                          >
                            <Play className="mr-1 h-3 w-3" /> Invoke Agent
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* TAB 2: KNOWLEDGE BASE */}
              {activeTab === "knowledge" && (
                <div className="space-y-6">
                  {/* Upload & search area */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="md:col-span-2 border-border/50 bg-card/30 backdrop-blur-md">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">Knowledge File Search</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Query knowledge base articles..."
                            value={searchDoc}
                            onChange={(e) => setSearchDoc(e.target.value)}
                            className="pl-9 bg-background/50 border-border/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="border-dashed border-border/80 bg-card/10 cursor-pointer flex flex-col items-center justify-center p-5 text-center transition-colors hover:bg-card/20 hover:border-border"
                      onClick={handleUploadSimulate}
                    >
                      <Upload
                        className={`h-6 w-6 text-muted-foreground ${isUploading ? "animate-bounce" : ""}`}
                      />
                      <span className="font-bold text-xs text-foreground mt-2 block">
                        {isUploading ? "Uploading..." : "Upload Document"}
                      </span>
                      <span className="text-3xs text-muted-foreground mt-0.5 block">
                        Markdown, PDF, or JSON config files
                      </span>
                    </Card>
                  </div>

                  {/* Documents Grid */}
                  <div className="space-y-3 text-left">
                    <h2 className="font-display text-sm font-bold text-foreground font-mono">
                      Recent Documents Ingested
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {mockKnowledgeFiles.map((doc) => (
                        <Card
                          key={doc.id}
                          className="group border-border/50 bg-card/40 hover:bg-card hover:border-border transition-all duration-300 cursor-pointer"
                          onClick={() => alert(`Opening Document Viewer for ${doc.name}`)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                                <CardTitle className="text-xs font-bold truncate max-w-[130px] group-hover:text-primary transition-colors">
                                  {doc.name}
                                </CardTitle>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[8px] py-0 px-1 font-mono uppercase scale-90"
                              >
                                {doc.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3.5 text-3xs font-mono text-muted-foreground">
                            <div className="flex justify-between border-b border-border/10 pb-1.5">
                              <span>Size / Uploaded:</span>
                              <span className="text-foreground">
                                {doc.size} · {doc.uploaded}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className="text-success font-bold">{doc.status}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TELEMETRY & LOGS */}
              {activeTab === "telemetry" && (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Chart and raw logs */}
                  <Card className="md:col-span-2 border-border/50 bg-card/30 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold font-mono">
                        Token Consumptions & Request Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[220px] pr-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mockTelemetry}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="time"
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs font-mono"
                          />
                          <YAxis
                            stroke="currentColor"
                            className="text-muted-foreground opacity-50 text-3xs font-mono"
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
                            dataKey="requests"
                            stroke="var(--primary)"
                            strokeWidth={2.5}
                            name="Requests/min"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Telemetry live feed logs */}
                  <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold font-mono">Live Event logs</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 font-mono text-[9px] text-muted-foreground space-y-3 leading-relaxed max-h-[220px] overflow-y-auto">
                      <div className="text-muted-foreground border-b border-border/10 pb-2">
                        <span className="text-success">[15:58:12]</span> [Security Agent] Completed
                        scan. Axios package.json checked. 0 CVEs found.
                      </div>
                      <div className="text-muted-foreground border-b border-border/10 pb-2">
                        <span className="text-primary">[15:56:45]</span> [Knowledge Agent] Parsed
                        guidelines document. Added 42 embeddings vectors.
                      </div>
                      <div className="text-muted-foreground pb-1">
                        <span className="text-warning">[15:55:10]</span> [Root Cause Agent] Sentry
                        panic captured. Initializing trace pipeline.
                      </div>
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
