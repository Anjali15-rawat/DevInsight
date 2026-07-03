import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Box,
  FolderOpen,
  AlertOctagon,
  LogOut,
  X,
  GitPullRequest,
  Menu,
  Bug,
  Cpu,
} from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { CommandPalette } from "./command-palette";
import { mockWorkspaces, Workspace } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(mockWorkspaces[0]);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const mobileLinks = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Repositories", to: "/repositories", icon: FolderOpen },
    { label: "Review Queue", to: "/pull-requests", icon: GitPullRequest },
    { label: "Bug Queue", to: "/bugs", icon: Bug },
    { label: "AI Workspace", to: "/ai-workspace", icon: Cpu },
    { label: "Empty States", to: "/empty", icon: FolderOpen },
    { label: "Design System", to: "/design-system", icon: Box },
    { label: "500 Error Page", to: "/500", icon: AlertOctagon },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop collapsible sidebar */}
      <AppSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
      />

      {/* Mobile Drawer (Overlay backdrop & slide panel) */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex md:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className={cn(
            "relative flex w-4/5 max-w-sm flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-full p-5 shadow-xl transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-sidebar-border/40 pb-4">
            <span className="flex items-center gap-2 font-display text-base font-extrabold text-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand">
                <GitPullRequest className="h-4.5 w-4.5 text-primary-foreground" />
              </span>
              DevInsight
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="flex-1 space-y-6 py-6 overflow-y-auto">
            <div className="space-y-1">
              {mobileLinks.map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-sidebar-border/40 pt-4 pb-2">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-sidebar-accent cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Log Out</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content pane */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header navigation */}
        <AppHeader
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          activeWorkspace={activeWorkspace}
        />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 dark:bg-background/20">{children}</main>
      </div>

      {/* Global search palette */}
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}
