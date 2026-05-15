import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Bell,
  Settings,
  Building2,
  BarChart3,
  ShieldAlert,
  LogOut,
  Brain,
  User,
  GraduationCap,
  Moon,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const studentNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/submit", label: "Submit", icon: FileText },
  { to: "/complaints", label: "Complaints", icon: Inbox },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/insights", label: "AI Insights", icon: Brain },
  { to: "/profile", label: "Profile", icon: User },
];

const departmentNav = [
  { to: "/department", label: "Department", icon: LayoutDashboard },
  { to: "/department/complaints", label: "Assigned Cases", icon: ClipboardList },
  { to: "/department/responses", label: "Responses", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Admin", icon: ShieldAlert },
  { to: "/admin/complaints", label: "Complaints", icon: Inbox },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const {
    isAdmin,
    isSuperAdmin,
    isDepartmentStaff,
    user,
    signOut,
  } = useAuth();

  const isAdminUser = isAdmin || isSuperAdmin;

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  const roleLabel = isAdminUser
    ? "Admin"
    : isDepartmentStaff
      ? "Department Staff"
      : "Student";

  return (
    <motion.aside
      initial={{ x: -18, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 shrink-0 border-r border-border/70 bg-sidebar/95 backdrop-blur-xl md:flex md:flex-col"
    >
      <Link
        to="/"
        className="flex items-center gap-3 border-b border-border/70 px-5 py-5"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>

        <div className="min-w-0">
          <div className="truncate font-display text-lg font-semibold tracking-tight">
            CampusResolve
          </div>

          <div className="truncate text-xs text-muted-foreground">
            AI Grievance Platform
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <div className="rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            {roleLabel}
          </div>
        </div>

        {!isAdminUser && !isDepartmentStaff && (
          <NavGroup title="Student" items={studentNav} active={path} />
        )}

        {isDepartmentStaff && !isAdminUser && (
          <NavGroup title="Department" items={departmentNav} active={path} />
        )}

        {isAdminUser && (
          <NavGroup title="Admin" items={adminNav} active={path} />
        )}
      </nav>

      <div className="border-t border-border/70 p-3">
        <div className="mb-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>

          <ThemeToggle />
        </div>

        <Link
          to="/settings"
          className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
            {(user?.email ?? "?")[0].toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user?.email}</div>
            <div className="text-[10px] text-muted-foreground">
              {roleLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

function NavGroup({
  title,
  items,
  active,
}: {
  title: string;
  items: { to: string; label: string; icon: React.ElementType }[];
  active: string;
}) {
  return (
    <div>
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </div>

      <div className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;

          const isActive =
            active === it.to ||
            (it.to !== "/dashboard" &&
              it.to !== "/department" &&
              it.to !== "/admin" &&
              active.startsWith(it.to));

          return (
            <Link
              key={it.to}
              to={it.to}
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-sm transition"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  transition={{
                    type: "spring",
                    stiffness: 620,
                    damping: 42,
                    mass: 0.7,
                  }}
                  className="absolute inset-0 rounded-xl bg-sidebar-accent shadow-card"
                />
              )}

              {isActive && (
                <motion.div
                  layoutId="sidebar-active-dot"
                  transition={{
                    type: "spring",
                    stiffness: 620,
                    damping: 42,
                    mass: 0.7,
                  }}
                  className="absolute right-3 h-2 w-2 rounded-full bg-primary"
                />
              )}

              <Icon
                className={`relative z-10 h-4 w-4 transition ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />

              <span
                className={`relative z-10 truncate transition ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
