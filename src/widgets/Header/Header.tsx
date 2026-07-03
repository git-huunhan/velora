import { useState, useEffect } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { useSidebar } from "@/widgets/Sidebar/useSidebar";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  HelpCircle,
  Settings,
  LogOut,
  User,
  Search,
  MoreHorizontal,
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  ClipboardList,
} from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useAuth } from "@/features/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";

export function Header() {
  const [activePopover, setActivePopover] = useState<
    "none" | "search" | "command"
  >("none");
  const [isMobileCommandOpen, setIsMobileCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          setActivePopover((prev) => (prev === "command" ? "none" : "command"));
        } else {
          setIsMobileCommandOpen((prev) => !prev);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { toggleMobile, toggleDesktop, isDesktopClosed, isMobileOpen } =
    useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Feature 2: Command Palette (Ctrl+K)
  const renderCommandPalette = (close: () => void) => {
    const run = (cmd: () => void) => {
      close();
      cmd();
    };
    return (
      <Command>
        <CommandInput placeholder="Search actions, settings, or type '/' to search work" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => run(() => navigate("/"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate("/users"))}>
              <Users className="mr-2 h-4 w-4" />
              Go to Users
            </CommandItem>
            <CommandItem onSelect={() => run(() => navigate("/projects"))}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Go to Projects
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => run(() => navigate("/projects"))}>
              <CheckSquare className="mr-2 h-4 w-4" />
              View All Tasks
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
  };

  // Feature 1: Global Search Modal Content
  const renderSearchModal = (close: () => void) => {
    return (
      <div className="flex flex-col h-[600px] max-h-[80vh] w-[800px] max-w-[90vw]">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <input
            type="text"
            placeholder="Search Elora..."
            className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground text-foreground"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col sm:flex-row gap-6">
          {/* Left Column: Recent Work */}
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Recently Viewed
            </h3>
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  onClick={close}
                  className="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                >
                  <ClipboardList className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-none mb-1 text-foreground">
                      Task RAB-{i + 12} update dashboard UI
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Elora Project
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">
              Recent Boards & Projects
            </h3>
            <div className="space-y-1">
              <div
                onClick={close}
                className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
              >
                <div className="w-5 h-5 shrink-0 rounded bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <FolderKanban className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">Elora Team Board</span>
              </div>
              <div
                onClick={close}
                className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
              >
                <div className="w-5 h-5 shrink-0 rounded bg-purple-500/20 flex items-center justify-center text-purple-500">
                  <Users className="h-3 w-3" />
                </div>
                <span className="text-sm font-medium">
                  Marketing Campaign (MC)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Filters (Like Jira) */}
          <div className="sm:w-64 sm:border-l border-border sm:pl-6 hidden sm:block shrink-0">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Last Updated
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full cursor-pointer hover:bg-primary/20">
                Any time
              </span>
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full cursor-pointer hover:bg-accent">
                Today
              </span>
              <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full cursor-pointer hover:bg-accent">
                Past 7 days
              </span>
            </div>

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Filter by Assignee
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox />
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=10b981&textColor=ffffff&backgroundType=solid`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">
                    {user?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{user?.name} (Me)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox />
                <Avatar className="h-5 w-5 shrink-0 bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center">
                  JD
                </Avatar>
                <span className="text-sm truncate">John Doe</span>
              </label>
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-border bg-muted/30 flex justify-between items-center text-xs text-muted-foreground shrink-0 mt-auto">
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-foreground">
              Go to all:
            </span>
            <span className="cursor-pointer hover:text-foreground">Boards</span>
            <span className="cursor-pointer hover:text-foreground">
              Projects
            </span>
            <span className="cursor-pointer hover:text-foreground">
              Filters
            </span>
          </div>
          <span className="hidden sm:inline">Press enter to search</span>
        </div>
      </div>
    );
  };

  const renderUserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded-full hover:bg-accent transition-colors">
          <Avatar className="h-8 w-8 border-2 border-primary/20 shrink-0">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=10b981&textColor=ffffff&backgroundType=solid`}
              alt={user?.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
              {user?.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56 mt-1">
        <div className="px-2 py-1.5 flex flex-col">
          <span className="text-sm font-medium">{user?.name}</span>
          <span className="text-xs text-muted-foreground capitalize">
            {user?.role}
          </span>
        </div>
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="h-4 w-4 mr-2" />
          Profile & Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={logout}
          className="text-destructive cursor-pointer font-medium"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <CommandDialog
        open={isMobileCommandOpen}
        onOpenChange={setIsMobileCommandOpen}
      >
        {renderCommandPalette(() => setIsMobileCommandOpen(false))}
      </CommandDialog>

      <header className="flex h-14 items-center border-b bg-background shrink-0">
        {/* Left Area - Fixed width to match sidebar on desktop ONLY */}
        <div className="flex items-center gap-2 md:gap-4 lg:w-64 px-2 md:px-4 shrink-0">
          {/* Mobile toggle */}
          <button
            data-sidebar-toggle="true"
            onClick={toggleMobile}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground transition-colors"
          >
            {isMobileOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
          {/* Desktop toggle */}
          <button
            data-sidebar-toggle="true"
            onClick={toggleDesktop}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded hover:bg-accent text-muted-foreground transition-colors"
          >
            {isDesktopClosed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
          <div
            className="flex items-center cursor-pointer text-xl font-bold tracking-tight text-foreground"
            onClick={() => navigate("/")}
          >
            <img
              src="/logo.png"
              alt="V"
              className="w-7 h-7 object-contain -mr-1 saturate-150 -hue-rotate-[10deg] drop-shadow-sm dark:brightness-125 dark:drop-shadow-md"
            />
            <span className="hidden sm:inline-block">elora</span>
          </div>
          {/* Mobile Search Icon */}
          <button
            onClick={() => setActivePopover("search")}
            className="md:hidden ml-1 h-8 w-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Remaining Header Area */}
        <div className="flex flex-1 items-center px-2 md:px-4 min-w-0">
          {/* Spacer 1 (Desktop) */}
          <div className="flex-1 hidden lg:block"></div>

          {/* Center: Search (Desktop/Tablet) */}
          <div className="hidden md:flex flex-1 lg:flex-none items-center gap-2 w-full max-w-xl min-w-0 md:ml-4 lg:mx-4">
            <Popover
              open={activePopover !== "none"}
              onOpenChange={(open) => !open && setActivePopover("none")}
            >
              <PopoverAnchor asChild>
                <div
                  onClick={() => setActivePopover("search")}
                  className="flex-1 relative flex items-center h-8 bg-muted/50 hover:bg-muted border border-border rounded transition-colors cursor-pointer min-w-0"
                >
                  <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-muted-foreground" />
                  <div className="w-full h-full pl-9 pr-14 bg-transparent text-sm text-foreground/50 rounded flex items-center truncate">
                    Search...
                  </div>
                  <kbd className="absolute right-1.5 top-1.5 inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shrink-0">
                    Ctrl K
                  </kbd>
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="p-0 shadow-xl overflow-hidden rounded-xl border-border bg-popover text-popover-foreground"
                align="start"
                sideOffset={8}
                style={{
                  width:
                    activePopover === "search"
                      ? "800px"
                      : "var(--radix-popover-trigger-width)",
                  maxWidth: "90vw",
                }}
              >
                {activePopover === "search" &&
                  renderSearchModal(() => setActivePopover("none"))}
                {activePopover === "command" &&
                  renderCommandPalette(() => setActivePopover("none"))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Spacer 2 (Desktop) */}
          <div className="flex-1 hidden lg:block"></div>

          {/* Right: Create + Icons */}
          <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
            <button className="h-8 px-3 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 flex items-center gap-1 transition-colors shrink-0 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </button>

            {/* Desktop Icons */}
            <div className="hidden md:flex items-center gap-1">
              <NotificationDropdown />
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground transition-colors">
                <HelpCircle className="h-5 w-5" />
              </button>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <ModeToggle />
              <div className="ml-2">{renderUserMenu()}</div>
            </div>

            {/* Mobile More Menu */}
            <div className="md:hidden flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-accent text-muted-foreground transition-colors border border-transparent hover:border-border">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-auto p-2"
                  sideOffset={8}
                >
                  <div className="flex items-center gap-1">
                    <NotificationDropdown />
                    <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground transition-colors">
                      <HelpCircle className="h-5 w-5" />
                    </button>
                    <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground transition-colors">
                      <Settings className="h-5 w-5" />
                    </button>
                    <ModeToggle />
                    <div className="ml-1">{renderUserMenu()}</div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
