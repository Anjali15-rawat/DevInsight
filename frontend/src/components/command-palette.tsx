import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  LayoutDashboard,
  GitPullRequest,
  AlertTriangle,
  Settings,
  Sun,
  Moon,
  Laptop,
  HelpCircle,
  FolderOpen,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useTheme } from "@/components/theme-provider";
import { mockRepositories } from "@/lib/mock-data";

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search repositories..." />
      <CommandList className="max-h-[360px] overflow-y-auto">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Suggestions">
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/empty" }))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span>Explore Empty States</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/500" }))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span>Simulate 500 Internal Error</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Repositories">
          {mockRepositories.map((repo) => (
            <CommandItem
              key={repo.id}
              value={repo.name}
              onSelect={() =>
                runCommand(() => {
                  alert(`Navigating to mock repository: ${repo.name}`);
                })
              }
              className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
            >
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium">{repo.name}</span>
                <span className="text-2xs text-muted-foreground truncate max-w-[320px]">
                  {repo.description}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings & Appearance">
          <CommandItem
            onSelect={() => runCommand(() => setTheme("light"))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <Sun className="h-4 w-4 text-muted-foreground" />
            <span>Switch to Light Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("dark"))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <Moon className="h-4 w-4 text-muted-foreground" />
            <span>Switch to Dark Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => setTheme("system"))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <Laptop className="h-4 w-4 text-muted-foreground" />
            <span>Use System Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate({ to: "/design-system" }))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Design System Tokens</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Help">
          <CommandItem
            onSelect={() => runCommand(() => window.open("https://github.com", "_blank"))}
            className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span>Search Documentation</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
