import { useAuth } from "../../context/AuthContext";
import { ChevronRight, LogOut, User, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "../theme/ThemeToggle";
import NotificationsDropdown from "./NotificationsDropdown";
import { cn } from "@/lib/utils";

const profilePaths = {
  "super-admin": "/admin/profile",
  "campus-admin": "/admin/profile",
  teacher: "/teacher/profile",
  student: "/student/profile",
};

const titleCaseSegment = (segment) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const Navbar = ({ onToggle = () => {} }) => {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const crumbs = pathname.split("/").filter(Boolean).map(titleCaseSegment);
  const profilePath =
    profilePaths[user?.role?.toLowerCase()] || "/admin/profile";

  return (
    <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
            onClick={onToggle}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          {crumbs.length > 0 && (
            <ol
              className="hidden min-w-0 items-center gap-1.5 text-sm md:flex"
              aria-label="Breadcrumb"
            >
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <li
                    key={`${crumb}-${index}`}
                    className="flex min-w-0 items-center gap-1.5"
                  >
                    {index > 0 && (
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-muted-foreground/60"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate",
                        isLast
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <NotificationsDropdown />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open account menu"
                className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card py-1 pl-1 pr-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User size={15} aria-hidden="true" />
                </span>
                <span className="hidden min-w-0 leading-tight sm:block">
                  <span className="block max-w-[140px] truncate text-sm font-medium text-foreground">
                    {user?.name}
                  </span>
                  <span className="block text-xs capitalize text-muted-foreground">
                    {user?.role?.replace("-", " ")}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {user?.name}
                </span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {user?.email || user?.role?.replace("-", " ")}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={profilePath} className="cursor-pointer">
                  <User size={16} aria-hidden="true" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => logout()}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut size={16} aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
