import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import { GitFork, ArrowLeft, LayoutDashboard } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      {/* Background radial highlight */}
      <div className="absolute inset-0 -z-10 bg-hero-glow opacity-30 dark:opacity-20" />
      <div className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="w-full max-w-md space-y-6">
        {/* Visual Element */}
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 border border-primary/20 text-primary shadow-glow">
          <GitFork className="h-10 w-10 rotate-90" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
            404
          </h1>
          <h2 className="font-display text-xl font-bold text-foreground">Resource not found</h2>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground leading-relaxed">
            The page or repository reference you are looking for does not exist or has been
            relocated.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-border/80 bg-background/50 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DevInsight — Engineering Intelligence, Powered by AI" },
      {
        name: "description",
        content:
          "DevInsight uses AI to review pull requests, classify issues, monitor repo health, detect security risks, and surface engineering analytics for fast-moving teams.",
      },
      { name: "author", content: "DevInsight" },
      { property: "og:title", content: "DevInsight — Engineering Intelligence, Powered by AI" },
      {
        property: "og:description",
        content:
          "AI-powered code review, issue triage, repository health, security insights, and engineering analytics — all in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@DevInsight" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
