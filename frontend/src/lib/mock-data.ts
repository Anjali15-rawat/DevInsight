export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  healthScore: number;
  openPRs: number;
  openIssues: number;
  securityAlerts: number;
  language: string;
  languageColor: string;
  updatedAt: string;
  stars: number;
  forks: number;
  analyzedLines: string;
  insights: {
    prReviewTime: string;
    codeCoverage: string;
    securityGrade: "A" | "B" | "C" | "D" | "F";
    aiSavings: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoColor: string;
  plan: "Free" | "Pro" | "Enterprise";
  role: "Owner" | "Admin" | "Member";
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  repository: string;
  branch: string;
  targetBranch: string;
  status: "success" | "warning" | "error" | "pending";
  reviewStatus: "Approved" | "Changes Requested" | "Review Required" | "AI Analyzing";
  additions: number;
  deletions: number;
  createdAt: string;
  aiInsightsSummary: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: "security" | "pr_review" | "build" | "general";
  read: boolean;
  time: string;
  repoName?: string;
}

export interface Activity {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target: string;
  time: string;
}

export const mockWorkspaces: Workspace[] = [
  {
    id: "ws-1",
    name: "Acme Corporation",
    slug: "acme",
    logoColor: "bg-indigo-600 dark:bg-indigo-500",
    plan: "Enterprise",
    role: "Admin",
  },
  {
    id: "ws-2",
    name: "DevInsight Corp",
    slug: "devinsight-internal",
    logoColor: "bg-violet-600 dark:bg-violet-500",
    plan: "Pro",
    role: "Owner",
  },
  {
    id: "ws-3",
    name: "Open Source Sandbox",
    slug: "os-sandbox",
    logoColor: "bg-emerald-600 dark:bg-emerald-500",
    plan: "Free",
    role: "Member",
  },
];

export const mockRepositories: Repository[] = [
  {
    id: "repo-1",
    name: "core-api",
    owner: "devinsight-corp",
    description:
      "The primary high-performance API server powering the main DevInsight analysis engine. Built with Go.",
    healthScore: 94,
    openPRs: 6,
    openIssues: 14,
    securityAlerts: 0,
    language: "Go",
    languageColor: "#00ADD8",
    updatedAt: "10 mins ago",
    stars: 342,
    forks: 48,
    analyzedLines: "142k",
    insights: {
      prReviewTime: "1.2h avg",
      codeCoverage: "88.4%",
      securityGrade: "A",
      aiSavings: "32 hrs/mo",
    },
  },
  {
    id: "repo-2",
    name: "web-dashboard",
    owner: "devinsight-corp",
    description: "Next.js dashboard frontend utilizing Tailwind CSS and React Server Components.",
    healthScore: 88,
    openPRs: 11,
    openIssues: 32,
    securityAlerts: 3,
    language: "TypeScript",
    languageColor: "#3178C6",
    updatedAt: "2 hrs ago",
    stars: 189,
    forks: 23,
    analyzedLines: "89k",
    insights: {
      prReviewTime: "2.4h avg",
      codeCoverage: "79.1%",
      securityGrade: "B",
      aiSavings: "18 hrs/mo",
    },
  },
  {
    id: "repo-3",
    name: "ai-analyst-agent",
    owner: "devinsight-corp",
    description:
      "LangChain-powered multi-agent pipeline for analyzing repository architectures and providing code hints.",
    healthScore: 79,
    openPRs: 2,
    openIssues: 8,
    securityAlerts: 1,
    language: "Python",
    languageColor: "#3572A5",
    updatedAt: "Yesterday",
    stars: 512,
    forks: 74,
    analyzedLines: "24k",
    insights: {
      prReviewTime: "45 mins avg",
      codeCoverage: "92.0%",
      securityGrade: "A",
      aiSavings: "45 hrs/mo",
    },
  },
  {
    id: "repo-4",
    name: "docs-site",
    owner: "devinsight-corp",
    description:
      "Static documentation hub for API endpoints, integration guides, and custom rules configuration.",
    healthScore: 98,
    openPRs: 0,
    openIssues: 2,
    securityAlerts: 0,
    language: "MDX",
    languageColor: "#F97316",
    updatedAt: "3 days ago",
    stars: 45,
    forks: 12,
    analyzedLines: "8k",
    insights: {
      prReviewTime: "15 mins avg",
      codeCoverage: "100%",
      securityGrade: "A",
      aiSavings: "2 hrs/mo",
    },
  },
];

export const mockPullRequests: PullRequest[] = [
  {
    id: "pr-1",
    number: 452,
    title: "feat(auth): integrate multi-factor authentication with hardware security keys",
    author: {
      name: "Marcus Vance",
      username: "marcusv",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    repository: "core-api",
    branch: "feat/auth-mfa",
    targetBranch: "main",
    status: "success",
    reviewStatus: "Approved",
    additions: 342,
    deletions: 48,
    createdAt: "3 hrs ago",
    aiInsightsSummary:
      "No critical bugs detected. One secondary performance warning regarding database transaction locking time in `mfa_verify.go:124` was flagged and resolved.",
  },
  {
    id: "pr-2",
    number: 1012,
    title: "fix(dashboard): resolve state hydration mismatch in layout toggle sidebar",
    author: {
      name: "Anjali Sharma",
      username: "anjalis",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    repository: "web-dashboard",
    branch: "fix/hydration-sidebar",
    targetBranch: "main",
    status: "warning",
    reviewStatus: "Review Required",
    additions: 12,
    deletions: 8,
    createdAt: "5 hrs ago",
    aiInsightsSummary:
      "Vulnerability warning: React context is exposed to local Storage without sanitization. Recommended fix: Add Zod parsing helper on localStorage items.",
  },
  {
    id: "pr-3",
    number: 1015,
    title: "perf(analyst): rewrite indexing pipeline using async task queue",
    author: {
      name: "David Chen",
      username: "dchen-dev",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    repository: "ai-analyst-agent",
    branch: "perf/async-indexing",
    targetBranch: "main",
    status: "error",
    reviewStatus: "Changes Requested",
    additions: 890,
    deletions: 456,
    createdAt: "Yesterday",
    aiInsightsSummary:
      "Build failed: type discrepancy in multi-agent orchestrator. AI detected a potential race condition inside `scheduler.py`'s worker count lock.",
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Critical vulnerability detected",
    description:
      "Prototype pollution vulnerability found in dependency `minimist` under `web-dashboard`.",
    type: "security",
    read: false,
    time: "10m ago",
    repoName: "web-dashboard",
  },
  {
    id: "notif-2",
    title: "AI Review Completed",
    description: "PR #452 has been reviewed. AI suggests 3 minor cleanups in error handling.",
    type: "pr_review",
    read: false,
    time: "3h ago",
    repoName: "core-api",
  },
  {
    id: "notif-3",
    title: "Failed Build Alert",
    description: "Build failed for commit `8f7c9e` in repository `ai-analyst-agent`.",
    type: "build",
    read: true,
    time: "Yesterday",
    repoName: "ai-analyst-agent",
  },
  {
    id: "notif-4",
    title: "Billing Alert: Pro Plan Activated",
    description: "Your workspace has been successfully upgraded to the Pro Tier.",
    type: "general",
    read: true,
    time: "2 days ago",
  },
];

export const mockActivities: Activity[] = [
  {
    id: "act-1",
    user: {
      name: "Marcus Vance",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "pushed to branch",
    target: "feat/auth-mfa in core-api",
    time: "10 mins ago",
  },
  {
    id: "act-2",
    user: {
      name: "Anjali Sharma",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
    action: "resolved security alert in",
    target: "web-dashboard",
    time: "1 hour ago",
  },
  {
    id: "act-3",
    user: {
      name: "DevInsight AI",
      avatar:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&h=256&q=80",
    },
    action: "completed vulnerability scan for",
    target: "ai-analyst-agent",
    time: "Yesterday",
  },
];
