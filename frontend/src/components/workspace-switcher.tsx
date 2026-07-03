import { useState } from "react";
import { ChevronDown, Plus, Check, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Workspace, mockWorkspaces } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  activeWorkspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  collapsed?: boolean;
}

export function WorkspaceSwitcher({
  activeWorkspace,
  onWorkspaceChange,
  collapsed = false,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full cursor-pointer hover:bg-sidebar-accent flex items-center gap-2 p-1.5 focus-visible:ring-0 focus-visible:ring-offset-0",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-primary-foreground font-bold text-xs font-display shadow-xs",
                activeWorkspace.logoColor,
              )}
            >
              {activeWorkspace.name.substring(0, 2).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="flex flex-col items-start text-left min-w-0 leading-tight">
                <span className="font-semibold text-foreground text-sm truncate w-[110px]">
                  {activeWorkspace.name}
                </span>
                <span className="text-muted-foreground text-2xs font-medium">
                  {activeWorkspace.plan} Plan
                </span>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[200px] border-border/80 bg-popover/90 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="text-2xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
          Workspaces
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        {mockWorkspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => onWorkspaceChange(ws)}
            className="flex items-center justify-between cursor-pointer py-2 px-2.5 focus:bg-accent focus:text-accent-foreground"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-md text-[10px] text-primary-foreground font-bold font-display shadow-2xs",
                  ws.logoColor,
                )}
              >
                {ws.name.substring(0, 2).toUpperCase()}
              </span>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-medium text-xs truncate max-w-[110px]">{ws.name}</span>
                <span className="text-3xs text-muted-foreground">{ws.role}</span>
              </div>
            </div>
            {ws.id === activeWorkspace.id && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem
          onClick={() => alert("Simulate workspace creation modal")}
          className="flex items-center gap-2 cursor-pointer py-2 px-2.5 text-xs text-primary font-medium focus:bg-accent"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Create Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
