/**
 * Centralized Query Keys factory for TanStack Query caching and invalidation.
 */

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  bff: {
    dashboard: (workspaceId: number) => ["bff", "dashboard", workspaceId] as const,
    repository: (repoId: number) => ["bff", "repository", repoId] as const,
    pullRequest: (prId: number) => ["bff", "pull-request", prId] as const,
  },
  repositories: {
    list: (workspaceId: number, filters?: Record<string, any>) =>
      ["repositories", "list", workspaceId, filters] as const,
    detail: (repoId: number) => ["repositories", "detail", repoId] as const,
  },
  pullRequests: {
    list: (workspaceId: number, filters?: Record<string, any>) =>
      ["pull-requests", "list", workspaceId, filters] as const,
    detail: (prId: number) => ["pull-requests", "detail", prId] as const,
  },
  bugs: {
    list: (workspaceId: number, filters?: Record<string, any>) =>
      ["bugs", "list", workspaceId, filters] as const,
    detail: (bugId: number) => ["bugs", "detail", bugId] as const,
  },
  knowledge: {
    list: (workspaceId: number) => ["knowledge", "list", workspaceId] as const,
    search: (workspaceId: number, query: string) =>
      ["knowledge", "search", workspaceId, query] as const,
  },
  analytics: {
    overview: (workspaceId: number) => ["analytics", "overview", workspaceId] as const,
    trends: (workspaceId: number) => ["analytics", "trends", workspaceId] as const,
  },
  notifications: {
    list: (unreadOnly?: boolean) => ["notifications", "list", { unreadOnly }] as const,
  },
};
