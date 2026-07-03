import { Link, useRouterState } from "@tanstack/react-router";
import { clearTokens } from "@/lib/api-client";
import {
  LayoutDashboard,
  GitPullRequest,
  AlertOctagon,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Box,
  FileCode,
  FolderOpen,
  LogOut,
  Bug,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Workspace } from "@/lib/mock-data";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activeWorkspace: Workspace;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export function AppSidebar({
  collapsed,
  setCollapsed,
  activeWorkspace,
  setActiveWorkspace,
}: AppSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { theme, setTheme } = useTheme();

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      to: "/dashboard",
    },
    {
      label: "Repositories",
      icon: FolderOpen,
      to: "/repositories",
    },
    {
      label: "Review Queue",
      icon: GitPullRequest,
      to: "/pull-requests",
    },
    {
      label: "Bug Queue",
      icon: Bug,
      to: "/bugs",
    },
    {
      label: "AI Workspace",
      icon: Cpu,
      to: "/ai-workspace",
    },
    {
      label: "Empty States",
      icon: FolderOpen,
      to: "/empty",
    },
    {
      label: "Design System",
      icon: Box,
      to: "/design-system",
    },
    {
      label: "500 Error Page",

      icon: AlertOctagon,
      to: "/500",
    },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 relative",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Top Brand & Switcher */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-3.5">
        <WorkspaceSwitcher
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={setActiveWorkspace}
          collapsed={collapsed}
        />
      </div>

      {/* Navigation items */}
      <div className="flex-1 space-y-6 px-3 py-6">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-2xs"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground",
                  collapsed && "justify-center",
                )}
                title={item.label}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    active ? "text-inherit" : "text-muted-foreground",
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer controls */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* Quick Theme Switcher */}
        {!collapsed ? (
          <div className="flex items-center justify-between rounded-lg bg-sidebar-accent p-1 border border-sidebar-border/40">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex-1 flex justify-center py-1 rounded-md text-xs font-medium cursor-pointer transition-all",
                theme === "light"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Light theme"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex-1 flex justify-center py-1 rounded-md text-xs font-medium cursor-pointer transition-all",
                theme === "dark"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Dark theme"
            >
              <Moon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme("beige")}
              className={cn(
                "flex-1 flex justify-center py-1 rounded-md text-xs font-medium cursor-pointer transition-all",
                theme === "beige"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Beige theme"
            >
              <Laptop className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (theme === "light") setTheme("dark");
              else if (theme === "dark") setTheme("beige");
              else setTheme("light");
            }}
            className="w-full flex justify-center py-2 hover:bg-sidebar-accent rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : theme === "beige" ? (
              <Laptop className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Sidebar Toggle & Logout */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => {
              clearTokens();
              window.location.href = "/login";
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2 text-sm font-medium hover:bg-sidebar-accent text-destructive cursor-pointer w-full justify-center px-3 border-0 bg-transparent text-left",
              !collapsed && "md:justify-start",
            )}
            title="Log out"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden md:grid h-8 w-8 place-items-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer shrink-0 border border-sidebar-border/40"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-[72px] hidden md:grid h-6 w-6 place-items-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground hover:text-foreground shadow-sm cursor-pointer z-50 hover:scale-105 transition-transform"
          title="Expand sidebar"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </aside>
  );
}
