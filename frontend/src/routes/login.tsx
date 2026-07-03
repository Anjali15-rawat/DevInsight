import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GitPullRequest,
  Github,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { API_BASE_URL, setTokens } from "@/lib/api-client";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useTheme();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("access_token");
    const refresh = searchParams.get("refresh_token");
    if (token && refresh) {
      setTokens(token, refresh);
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate login loading state
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/dashboard" });
    }, 1200);
  };

  const handleGithubLogin = () => {
    setOauthLoading(true);
    setError("");
    window.location.href = `${API_BASE_URL}/api/v1/auth/github`;
  };

  const handleGoogleLogin = () => {
    setError("Google Sign-In option is not configured. Please use GitHub Authentication.");
  };

  const handleDevBypass = () => {
    setOauthLoading(true);
    setError("");
    window.location.href = `${API_BASE_URL}/api/v1/auth/dev-bypass`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-30 dark:opacity-20" />
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-md shadow-primary/20">
              <GitPullRequest className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              DevInsight
            </span>
          </Link>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Engineering intelligence platform for developers
          </p>
        </div>

        <Card className="border-border/50 bg-card/60 shadow-xl backdrop-blur-xl dark:bg-card/40">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>
              Enter your email and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || oauthLoading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <span className="relative bg-background px-3 text-2xs uppercase text-muted-foreground">
                Or continue with
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                type="button"
                className="w-full cursor-pointer bg-gradient-brand hover:brightness-110 active:scale-95 transition-all text-white font-medium shadow-md shadow-primary/20"
                onClick={handleDevBypass}
                disabled={loading || oauthLoading || googleLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                  Bypass Login (Local Dev Mode)
                </span>
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full cursor-pointer border-[#24292e] bg-[#24292e] text-white hover:bg-[#1c1f23] hover:text-white transition-colors"
                onClick={handleGithubLogin}
                disabled={loading || oauthLoading || googleLoading}
              >
                {oauthLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Connecting GitHub...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Github className="h-4 w-4" />
                    Sign in with GitHub
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full cursor-pointer border-[#d3cdc4] bg-[#eae6df] text-[#2c2a29] hover:bg-[#dfd9ce] hover:text-[#2c2a29] transition-colors"
                onClick={handleGoogleLogin}
                disabled={loading || oauthLoading || googleLoading}
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    Connecting Google...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 mr-0.5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </span>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap justify-center border-t border-border/40 p-4 text-center">
            <span className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Create one now
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
