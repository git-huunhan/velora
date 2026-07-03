import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  UserCircle,
  Clock,
  Star,
  LayoutGrid,
  Layers,
  Orbit,
  Plus,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  ListFilter,
  LayoutDashboard,
  Target,
  Users2,
  Rocket,
  ExternalLink,
  Settings2,
  Search,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";
import { getSpaceAvatar } from "@/features/projects/model/avatars";
import { useProjects } from "@/features/projects";
import { useSidebar } from "./useSidebar";

interface SidebarItemProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  rightIcon?: ComponentType<{ className?: string }>;
  rightAction?: ReactNode;
  isActive?: boolean;
  hasLeftHighlight?: boolean;
}

const SidebarItem = forwardRef<HTMLDivElement, SidebarItemProps>(
  (
    {
      icon: Icon,
      label,
      rightIcon: RightIcon,
      rightAction,
      isActive,
      onClick,
      className = "",
      hasLeftHighlight,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        {...props}
        className={`relative flex items-center justify-between px-3 py-2 cursor-pointer rounded-md transition-colors ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        } ${className}`}
      >
        {hasLeftHighlight && isActive && (
          <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-primary rounded-r-md" />
        )}
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span className="text-[13.5px] font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {rightAction}
          {RightIcon && <RightIcon className="h-4 w-4 shrink-0" />}
        </div>
      </div>
    );
  },
);

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const [isSpacesOpen, setIsSpacesOpen] = useState(true);
  const location = useLocation();
  const { data: projectsData } = useProjects(1, 10);
  const projects = projectsData?.data || [];
  const starredProject = projects.find((p) => p.id === "proj-3");
  const recentProjects = projects.filter(
    (p) => p.id === "proj-1" || p.id === "proj-2",
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 custom-scrollbar">
        <SidebarItem icon={UserCircle} label="For you" />
        <SidebarItem icon={Clock} label="Recent" rightIcon={ChevronRight} />
        <SidebarItem icon={Star} label="Starred" rightIcon={ChevronRight} />
        <SidebarItem icon={LayoutGrid} label="Apps" />
        <SidebarItem icon={Layers} label="Plans" rightIcon={ChevronRight} />
        {/* Spaces Toggle */}
        <div
          onClick={() => setIsSpacesOpen(!isSpacesOpen)}
          className="flex items-center justify-between px-3 py-2 mt-2 cursor-pointer rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground group"
        >
          <div className="flex items-center gap-3">
            {isSpacesOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <Orbit className="h-4 w-4 shrink-0" />
            )}
            <span className="text-[13.5px] font-medium text-foreground">
              Spaces
            </span>
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-muted-foreground/20 rounded">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 hover:bg-muted-foreground/20 rounded">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {/* Expanded Spaces Content */}
        {isSpacesOpen && (
          <div className="pl-6 space-y-4 pt-1 pb-2">
            {/* Starred */}
            {starredProject && (
              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold text-muted-foreground">
                  Starred
                </div>
                <Link
                  to={`/projects/${starredProject.id}`}
                  onClick={onNavClick}
                >
                  <SidebarItem
                    icon={() => {
                      const avatar = getSpaceAvatar(starredProject.avatar);
                      const Icon = avatar.icon;
                      return (
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${avatar.bg} ${avatar.text}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      );
                    }}
                    label={starredProject.name}
                    isActive={
                      location.pathname === `/projects/${starredProject.id}`
                    }
                    hasLeftHighlight={true}
                    className="pl-2"
                  />
                </Link>
              </div>
            )}

            {/* Recent */}
            {recentProjects.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold text-muted-foreground">
                  Recent
                </div>
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    onClick={onNavClick}
                  >
                    <SidebarItem
                      icon={() => {
                        const avatar = getSpaceAvatar(project.avatar);
                        const Icon = avatar.icon;
                        return (
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${avatar.bg} ${avatar.text}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                        );
                      }}
                      label={project.name}
                      isActive={location.pathname === `/projects/${project.id}`}
                      hasLeftHighlight={true}
                      className="pl-2"
                    />
                  </Link>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarItem
                      icon={MoreHorizontal}
                      label="More spaces"
                      rightIcon={ChevronRight}
                      className="pl-2"
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-[300px] p-0 gap-0 bg-popover text-popover-foreground border-border shadow-xl rounded-xl"
                  >
                    <div className="flex items-center justify-between px-3 pt-3 pb-2">
                      <span className="font-semibold text-[13.5px]">
                        Spaces
                      </span>
                      <PopoverClose asChild>
                        <button className="text-muted-foreground hover:bg-accent rounded-sm p-1 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </PopoverClose>
                    </div>
                    <div className="px-3 pb-3 border-b border-border/50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search all spaces"
                          className="pl-9 h-8 text-[13.5px] bg-transparent border-border hover:border-border focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/projects"
                        onClick={onNavClick}
                        className="flex items-center gap-3 px-2 py-1.5 hover:bg-accent text-[13.5px] font-medium text-muted-foreground hover:text-foreground rounded-md cursor-pointer transition-colors"
                      >
                        <ListFilter className="w-4 h-4" />
                        View all spaces
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Recommended */}
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold text-muted-foreground">
                Recommended
              </div>
              <SidebarItem
                icon={() => (
                  <div className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
                    <span className="text-purple-500 text-xs font-bold">~</span>
                  </div>
                )}
                label="Create a roadmap"
                rightAction={
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-500 bg-purple-500/10">
                    TRY
                  </span>
                }
                className="pl-2"
              />
            </div>
          </div>
        )}
        <div className="h-4" /> {/* Spacer */}
        <SidebarItem icon={ListFilter} label="Filters" />
        <SidebarItem icon={LayoutDashboard} label="Dashboards" />
        <div className="h-4" /> {/* Spacer */}
        <SidebarItem icon={Target} label="Goals" rightIcon={ExternalLink} />
        <SidebarItem icon={Users2} label="Teams" rightIcon={ExternalLink} />
        <SidebarItem icon={Rocket} label="Projects" rightIcon={ExternalLink} />
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border/50">
        <SidebarItem icon={Settings2} label="Customize sidebar" />
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isMobileOpen, closeMobile, isDesktopClosed } = useSidebar();
  const mobileSidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isMobileOpen &&
        mobileSidebarRef.current &&
        !mobileSidebarRef.current.contains(event.target as Node)
      ) {
        const target = event.target as Element;
        if (target.closest("[data-sidebar-toggle]")) return;
        closeMobile();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen, closeMobile]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-full shrink-0 border-r bg-background transition-all duration-300 ${
          isDesktopClosed
            ? "w-0 overflow-hidden border-none opacity-0"
            : "w-64 opacity-100"
        }`}
      >
        <div className="w-64 h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile absolute sidebar */}
      <aside
        ref={mobileSidebarRef}
        className={`lg:hidden absolute top-0 left-0 h-full shrink-0 border-r bg-card z-50 transition-all duration-300 ${
          isMobileOpen
            ? "w-64 opacity-100 shadow-2xl"
            : "w-0 overflow-hidden border-none opacity-0"
        }`}
      >
        <div className="w-64 h-full">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}
