import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiFetch, clearTokens } from "@/lib/api-client";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  CreditCard,
  BookOpen,
  LogOut,
  Sparkles,
  ShieldAlert,
  GitPullRequest,
  CheckCircle,
  Clock,
  Terminal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mockNotifications, Workspace } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
  activeWorkspace: Workspace;
}

export function AppHeader({ onMenuClick, onSearchClick, activeWorkspace }: AppHeaderProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const { data: profile } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => apiFetch<any>("/api/v1/auth/me"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const handleSignOut = () => {
    clearTokens();
    window.location.href = "/login";
  };

  // Stateful notifications for real-time interaction
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  // Build breadcrumbs dynamically based on path
  const getBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    if (parts.length === 0) return [{ label: "Home", active: true }];

    return [
      { label: activeWorkspace.name, active: false },
      ...parts.map((part, index) => {
        const label = part
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return {
          label,
          active: index === parts.length - 1,
          to: "/" + parts.slice(0, index + 1).join("/"),
        };
      }),
    ];
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "security":
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case "pr_review":
        return <GitPullRequest className="h-4 w-4 text-primary" />;
      case "build":
        return <Terminal className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted text-foreground md:hidden cursor-pointer border border-border/40"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm font-medium">
          {getBreadcrumbs().map((bc, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-muted-foreground/50">/</span>}
              {bc.active ? (
                <span className="text-foreground font-semibold">{bc.label}</span>
              ) : bc.to ? (
                <Link
                  to={bc.to}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {bc.label}
                </Link>
              ) : (
                <span className="text-muted-foreground font-medium">{bc.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Command Search button */}
        <button
          onClick={onSearchClick}
          className="flex h-9 w-[180px] sm:w-[220px] items-center justify-between rounded-lg border border-border/80 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/80 cursor-pointer shadow-2xs transition-all hover:border-border"
        >
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
          </span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-80">
            Ctrl K
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-muted cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 p-0 border border-transparent hover:border-border/40"
            >
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive shadow-sm animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[320px] sm:w-[360px] p-0 border-border/80 bg-popover/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 p-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="brand" className="text-3xs px-1.5 py-0">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-2xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[280px] overflow-y-auto divide-y divide-border/40">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-foreground">You are all caught up</p>
                  <p className="text-3xs text-muted-foreground mt-0.5">
                    No recent alerts or review notices
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 p-3 text-left transition-colors hover:bg-muted/40",
                      !notif.read && "bg-primary/5 dark:bg-primary/2",
                    )}
                  >
                    <span className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {notif.title}
                      </p>
                      <p className="text-2xs text-muted-foreground leading-normal">
                        {notif.description}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-3xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {notif.time}
                        </span>
                        <button
                          onClick={(e) => clearNotification(notif.id, e)}
                          className="text-3xs text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border/60 p-2 text-center">
              <button
                onClick={() => alert("Simulation of notifications log page")}
                className="text-2xs font-semibold text-primary hover:underline cursor-pointer w-full"
              >
                View all notifications
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 p-0 rounded-full h-8 w-8"
            >
              <Avatar className="h-8 w-8 border border-border/60 hover:scale-105 transition-transform">
                <AvatarImage
                  src={
                    profile?.avatar_url ||
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  }
                />
                <AvatarFallback>
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "AS"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[240px] border-border/80 bg-popover/95 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 p-3">
              <Avatar className="h-9 w-9 border border-border/40">
                <AvatarImage
                  src={
                    profile?.avatar_url ||
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  }
                />
                <AvatarFallback>
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "AS"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-semibold text-xs text-foreground truncate">
                  {profile?.name || profile?.github_login || "Developer"}
                </span>
                <span className="text-3xs text-muted-foreground truncate">
                  {profile?.email || `${profile?.github_login || "developer"}@devinsight.io`}
                </span>
              </div>
            </div>
            <div className="px-3 pb-2">
              <div className="rounded-lg bg-gradient-brand-soft border border-primary/20 px-2 py-1 flex items-center justify-between">
                <span className="text-3xs font-semibold text-primary">Pro Account</span>
                <Sparkles className="h-3 w-3 text-accent" />
              </div>
            </div>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem
              onClick={() => alert("Simulation of profile options")}
              className="flex items-center gap-2 cursor-pointer py-2 px-2.5 text-xs focus:bg-accent"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>User Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => alert("Simulation of billing")}
              className="flex items-center gap-2 cursor-pointer py-2 px-2.5 text-xs focus:bg-accent"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Billing & Plan</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => alert("Simulation of documentation")}
              className="flex items-center gap-2 cursor-pointer py-2 px-2.5 text-xs focus:bg-accent"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>Documentation</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 cursor-pointer py-2 px-2.5 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
