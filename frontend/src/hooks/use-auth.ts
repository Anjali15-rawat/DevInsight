import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, clearTokens, getAccessToken, setTokens } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface UserProfile {
  authenticated: boolean;
  user_id: number;
  github_login: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const token = getAccessToken();

  const { data, isLoading, isError, refetch } = useQuery<UserProfile>({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiFetch<UserProfile>("/api/v1/auth/me"),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logout = () => {
    clearTokens();
    queryClient.setQueryData(queryKeys.auth.me(), null);
    queryClient.invalidateQueries();
  };

  const handleOAuthCallback = async (code: str) => {
    const res = await apiFetch<{ access_token: string; refresh_token: string }>(
      `/api/v1/auth/callback?code=${code}`,
    );
    setTokens(res.access_token, res.refresh_token);
    await refetch();
    return res;
  };

  return {
    user: data || null,
    isAuthenticated: !!data?.authenticated,
    isLoading: !!token && isLoading,
    isError,
    logout,
    handleOAuthCallback,
  };
}
