import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Terminal,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  ArrowLeft,
  BookOpen,
  ArrowUpRight,
  Database,
  ExternalLink,
  Plus,
  ArrowRight,
  User,
  Sliders,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/agent/$agentId")({
  component: AgentDetailsComponent,
});

// Mock detail logs & telemetry history metrics per agent
interface AgentTelemetry {
  latencyHistory: Array<{ sprint: string; latency: number }>;
  consoleLogs: string[];
  parameters: Array<{ name: string; value: number; unit: string; description: string }>;
}

const mockAgentTelemetry: Record<string, AgentTelemetry> = {
  "ag-code": {
    latencyHistory: [
      { sprint: "Run 1", latency: 520 },
      { sprint: "Run 2", latency: 480 },
      { sprint: "Run 3", latency: 430 },
      { sprint: "Run 4", latency: 450 },
    ],
    consoleLogs: [
      "[15:50:10] Code Quality Agent initializing...",
      "[15:50:12] Subscribing to github:devinsight-corp/core-api commit webhook listener.",
      "[15:50:14] Processing commit hash 8f7c9e2.",
      "[15:50:15] Completed static code review. Index health score set to 94%.",
    ],
    parameters: [
      {
        name: "Max token chunk limit",
        value: 4096,
        unit: "tokens",
        description: "Limits size of codebase sections analyzed in single context windows.",
      },
      {
        name: "Severity Threshold",
        value: 3.5,
        unit: "score",
        description:
          "Lints under this score trigger warning alerts rather than block pipeline merges.",
      },
    ],
  },
  "ag-sec": {
    latencyHistory: [
      { sprint: "Run 1", latency: 950 },
      { sprint: "Run 2", latency: 890 },
      { sprint: "Run 3", latency: 810 },
      { sprint: "Run 4", latency: 820 },
    ],
    consoleLogs: [
      "[15:52:05] Security Agent initializing dependency audit pipeline...",
      "[15:52:08] Scanning lock and json files for Axios package references.",
      "[15:52:10] Identified axios version v1.2.1. Prototypes vulnerabilities alert raised.",
      "[15:52:12] Ingesting fix parameters and suggestions log details.",
    ],
    parameters: [
      {
        name: "Audit Recursion Depth",
        value: 5,
        unit: "levels",
        description: "Recursion depth used when scanning package dependency branch paths.",
      },
      {
        name: "Vulnerability Severity filter",
        value: 2.0,
        unit: "score",
        description: "Minimum CVE rating threshold to trigger warning tags.",
      },
    ],
  },
};

function AgentDetailsComponent() {
  const { agentId } = useParams({ from: "/agent/$agentId" });

  const agentName = useMemo(() => {
    switch (agentId) {
      case "ag-code":
        return "Code Quality Agent";
      case "ag-sec":
        return "Security Agent";
      case "ag-perf":
        return "Performance Agent";
      case "ag-bug":
        return "Bug Agent";
      case "ag-root":
        return "Root Cause Agent";
      default:
        return "Knowledge Agent";
    }
  }, [agentId]);

  const tel = useMemo(() => {
    return (
      mockAgentTelemetry[agentId] || {
        latencyHistory: [
          { sprint: "Run 1", latency: 320 },
          { sprint: "Run 2", latency: 280 },
          { sprint: "Run 3", latency: 250 },
        ],
        consoleLogs: [
          "[15:54:12] Agent initialized successfully.",
          "[15:54:15] Completed semantic index scan. Zero warnings found.",
        ],
        parameters: [
          {
            name: "Chunk overlap factor",
            value: 200,
            unit: "characters",
            description: "Overlapping characters between markdown sections during parsing.",
          },
        ],
      }
    );
  }, [agentId]);

  const [activeTab, setActiveTab] = useState<"logs" | "parameters" | "telemetry">("logs");

  return (
    <AppShell>
      <div className="space-y-6 p-5 sm:p-8 max-w-7xl mx-auto text-left font-sans">
        {/* Navigation Breadcrumb */}
        <Link
          to="/ai-workspace"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Agent Workspace
        </Link>

        {/* Agent Header (OpenAI console layout style) */}
        <div className="border-b border-border/40 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Cpu className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground">
              {agentName}{" "}
              <span className="text-muted-foreground font-mono font-normal text-xs">{agentId}</span>
            </h1>
            <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono uppercase">
              Model: GPT-4o-mini
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            Configure prompt parameters, weights, and inspect detailed live event streaming console
            terminal logs.
          </p>
        </div>

        {/* Navigation Subnav tabs */}
        <div className="flex items-center border-b border-border/50 pb-px scrollbar-none overflow-x-auto">
          <nav className="flex space-x-2">
            {[
              { id: "logs", label: "Console Terminal Logs" },
              { id: "parameters", label: "Agent Model Parameters" },
              { id: "telemetry", label: "Latency Telemetry Graphs" },
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
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content panel */}
        <div className="py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: TERMINAL LOGS */}
              {activeTab === "logs" && (
                <Card className="border-border/50 bg-black/90 dark:bg-black/95 text-left font-mono">
                  <CardHeader className="border-b border-white/10 p-3 bg-white/5 flex flex-row items-center gap-2">
                    <Terminal className="h-4.5 w-4.5 text-success" />
                    <CardTitle className="text-[10px] text-white font-bold uppercase tracking-widest">
                      Live Streaming Logs (Pipes Active)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 text-[10px] leading-relaxed text-white/80 overflow-x-auto whitespace-pre space-y-2">
                    {tel.consoleLogs.map((log, idx) => (
                      <div key={idx} className="border-b border-white/5 pb-1">
                        {log}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* TAB 2: PARAMETERS */}
              {activeTab === "parameters" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md text-left">
                  <CardHeader className="pb-3 border-b border-border/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-primary" /> Parameters & Temperature weights
                    </CardTitle>
                    <CardDescription>
                      Configure hyperparameters used during model inference
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-6">
                    {tel.parameters.map((param, idx) => (
                      <div
                        key={idx}
                        className="space-y-2 border-b border-border/10 pb-4 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-xs text-foreground block">
                              {param.name}
                            </span>
                            <span className="text-3xs text-muted-foreground block max-w-xl">
                              {param.description}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              defaultValue={param.value}
                              className="bg-background border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none w-20 text-right"
                            />
                            <span className="text-3xs font-semibold text-muted-foreground mt-2 shrink-0">
                              {param.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={() => alert("Model parameters configuration saved!")}
                        className="cursor-pointer"
                      >
                        Save Configurations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TAB 3: TELEMETRY */}
              {activeTab === "telemetry" && (
                <Card className="border-border/50 bg-card/30 backdrop-blur-md pr-2 text-left">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold font-mono">
                      Agent Performance & Inference Latency (ms)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={tel.latencyHistory}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="sprint"
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
                          dataKey="latency"
                          stroke="var(--primary)"
                          strokeWidth={2.5}
                          name="Latency (ms)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
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
