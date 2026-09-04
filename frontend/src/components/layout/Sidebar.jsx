import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Building,
  GraduationCap,
  Calendar,
  FileText,
  Home,
  ChevronDown,
  ChevronRight,
  BookOpen,
  ClipboardCheck,
  FileBarChart,
  School,
  MessageSquare,
  Sparkles,
  CreditCard,
  X,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = {
  "super-admin": [
    {
      section: "MAIN",
      items: [
        { label: "Dashboard", icon: Home, path: "/admin/dashboard" },
      ]
    },
    {
      section: "ACADEMICS",
      items: [
        { label: "Subjects", icon: BookOpen, path: "/admin/subjects" },
      ]
    },
    {
      section: "SYSTEM",
      items: [
        {
          label: "Campuses",
          icon: Building,
          children: [
            { label: "All Campuses", path: "/admin/campuses" },
            { label: "Add Campus", path: "/admin/campuses/add" },
          ],
        },
        { label: "Users", icon: Users, path: "/admin/users" },
      ]
    },
    {
      section: "AI TOOLS",
      items: [
        { label: "Communications", icon: MessageSquare, path: "/admin/communications" },
      ]
    }
  ],

  "campus-admin": [
    {
      section: "MAIN",
      items: [
        { label: "Dashboard", icon: Home, path: "/admin/dashboard" },
      ]
    },
    {
      section: "ACADEMICS",
      items: [
        { label: "Teachers", icon: Users, path: "/admin/teachers" },
        { label: "Teacher Attendance", icon: ClipboardCheck, path: "/admin/teacher-attendance" },
        { label: "Students", icon: Users, path: "/admin/students" },
        { label: "Classes", icon: School, path: "/admin/classes" },
        { label: "Subjects", icon: BookOpen, path: "/admin/subjects" },
        { label: "Exams", icon: GraduationCap, path: "/admin/exams" },
        { label: "Marksheets", icon: FileBarChart, path: "/admin/marksheets" },
      ]
    },
    {
      section: "FINANCIAL",
      items: [
        { label: "Fee Management", icon: CreditCard, path: "/admin/fees" },
      ]
    },
    {
      section: "AI TOOLS",
      items: [
        { label: "Communications", icon: MessageSquare, path: "/admin/communications" },
      ]
    },
    {
      section: "SYSTEM",
      items: [
        { label: "Users", icon: Users, path: "/admin/users" },
      ]
    }
  ],

  teacher: [
    {
      section: "MAIN",
      items: [
        { label: "Dashboard", icon: Home, path: "/teacher/dashboard" },
      ]
    },
    {
      section: "ACADEMICS",
      items: [
        { label: "My Attendance", icon: Calendar, path: "/teacher/my-attendance" },
        { label: "Student Attendance", icon: ClipboardCheck, path: "/teacher/attendance" },
        { label: "Exams", icon: GraduationCap, path: "/teacher/exams" },
        { label: "Marks Entry", icon: FileBarChart, path: "/teacher/marks" },
        { label: "Class Marksheets", icon: FileText, path: "/teacher/marksheets" },
      ]
    },
    {
      section: "AI TOOLS",
      items: [
        { label: "AI Assistant", icon: Sparkles, path: "/teacher/ai-assistant" },
      ]
    }
  ],

  student: [
    {
      section: "MAIN",
      items: [
        { label: "Dashboard", icon: Home, path: "/student/dashboard" },
      ]
    },
    {
      section: "ACADEMICS",
      items: [
        { label: "Attendance", icon: ClipboardCheck, path: "/student/my-attendance" },
        { label: "Marksheets", icon: FileBarChart, path: "/student/my-marksheets" },
        { label: "Fee Vouchers", icon: CreditCard, path: "/student/fees" },
      ]
    }
  ],

  parent: [
    {
      section: "MAIN",
      items: [
        { label: "Dashboard", icon: Home, path: "/parent/dashboard" },
      ]
    }
  ],
};

const dashboardPaths = {
  "super-admin": "/admin/dashboard",
  "campus-admin": "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
};

const profilePaths = {
  "super-admin": "/admin/profile",
  "campus-admin": "/admin/profile",
  teacher: "/teacher/profile",
  student: "/student/profile",
  parent: "/parent/profile",
};

const Sidebar = ({ isOpen = false, onClose = () => {}, collapsed = false, onToggleCollapse = () => {} }) => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "student";
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const roleLabel = role.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const initials = (user?.name || "U")
    .split(" ")
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen transform flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 ease-out",
          "w-64 shadow-xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-[72px]" : "md:w-64"
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-white/10",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {collapsed ? (
            <Link
              to={dashboardPaths[role] || "/admin/dashboard"}
              aria-label="SchoolSync dashboard"
              className="rounded-md p-1.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <img src="/logo.png" alt="" className="h-10 w-10 object-contain" />
            </Link>
          ) : (
            <>
              <Link
                to={dashboardPaths[role] || "/admin/dashboard"}
                onClick={onClose}
                aria-label="SchoolSync dashboard"
                className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 object-contain" />
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-[15px] font-semibold tracking-tight">SchoolSync</span>
                  <span className="mt-0.5 inline-flex w-fit rounded-full bg-white/15 px-2 py-px text-[10px] font-medium uppercase tracking-wider">
                    {roleLabel}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="rounded-md p-1.5 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:hidden"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
          <div className="space-y-5">
            {menuItems[role]?.map((group) => (
              <div key={group.section}>
                {!collapsed && (
                  <h3 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {group.section}
                  </h3>
                )}
                <ul className={cn("space-y-0.5", collapsed && "space-y-1")}>
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    if (item.children && !collapsed) {
                      const isMenuOpen = openMenus[item.label];
                      return (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={() => toggleMenu(item.label)}
                            aria-expanded={isMenuOpen}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          >
                            <span className="flex items-center gap-3">
                              <Icon size={18} className="shrink-0" aria-hidden="true" />
                              <span>{item.label}</span>
                            </span>
                            {isMenuOpen ? (
                              <ChevronDown size={16} aria-hidden="true" />
                            ) : (
                              <ChevronRight size={16} aria-hidden="true" />
                            )}
                          </button>
                          {isMenuOpen && (
                            <ul className="ml-[21px] mt-0.5 space-y-0.5 border-l border-white/15 py-0.5 pl-3">
                              {item.children.map((child) => (
                                <li key={child.path}>
                                  <NavLink
                                    to={child.path}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                      cn(
                                        "block rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                                        isActive
                                          ? "bg-white/15 font-medium text-white"
                                          : "text-white/60 hover:bg-white/10 hover:text-white"
                                      )
                                    }
                                  >
                                    {child.label}
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    /* Collapsed parent with children → expand sidebar on click */
                    if (item.children && collapsed) {
                      return (
                        <li key={item.label}>
                          <button
                            type="button"
                            onClick={onToggleCollapse}
                            title={item.label}
                            aria-label={`Expand sidebar to access ${item.label}`}
                            className="group relative flex w-full justify-center rounded-lg py-2.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          >
                            <Icon size={20} aria-hidden="true" />
                            <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-foreground/95 px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                              {item.label}
                            </span>
                          </button>
                        </li>
                      );
                    }

                    /* Normal item (expanded) */
                    if (!collapsed) {
                      return (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-white/15 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-r-full before:bg-white"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              )
                            }
                          >
                            <Icon size={18} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">{item.label}</span>
                          </NavLink>
                        </li>
                      );
                    }

                    /* Normal item (collapsed) — icon-only with hover tooltip */
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          title={item.label}
                          className={({ isActive }) =>
                            cn(
                              "group relative flex w-full justify-center rounded-lg py-2.5 transition-colors",
                              isActive
                                ? "bg-white/15 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-r-full before:bg-white"
                                : "text-white/60 hover:bg-white/10 hover:text-white"
                            )
                          }
                        >
                          <Icon size={20} aria-hidden="true" />
                          <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-foreground/95 px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            {item.label}
                          </span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn("shrink-0 border-t border-white/10", collapsed ? "p-2" : "p-3")}>
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "hidden w-full items-center rounded-lg py-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:flex",
              collapsed ? "justify-center" : "gap-2.5 px-3 text-xs font-medium"
            )}
          >
            {collapsed ? (
              <PanelLeft size={18} aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose size={16} aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* User card */}
          {collapsed ? (
            <Link
              to={profilePaths[role] || "/admin/profile"}
              className="mt-1.5 flex justify-center"
              aria-label="View profile"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold uppercase transition-colors hover:bg-white/20">
                {initials}
              </span>
            </Link>
          ) : (
            <Link
              to={profilePaths[role] || "/admin/profile"}
              onClick={onClose}
              className="group mt-1.5 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold uppercase">
                {initials}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-medium">{user?.name || "User"}</span>
                <span className="block text-xs text-white/50">View profile</span>
              </span>
              <ChevronRight
                size={14}
                className="shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )}

          {!collapsed && (
            <p className="mt-1.5 px-2 text-center text-[10px] text-white/30">
              © {new Date().getFullYear()} SchoolSync
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
