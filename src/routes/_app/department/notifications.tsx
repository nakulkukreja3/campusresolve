import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Inbox,
  Search,
  Loader2,
  Calendar,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/department/notifications")({
  component: DepartmentNotifications,
});

function DepartmentNotifications() {
  const { user, loading: authLoading } = useAuth();

  const [department, setDepartment] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debug, setDebug] = useState("");

  async function load() {
    if (!user?.id) return;

    setLoading(true);
    setDebug("");

    try {
      const { data: staffRows, error: staffError } = await supabase
        .from("department_staff")
        .select(
          `
          user_id,
          department_id,
          departments:department_id (
            id,
            name,
            code
          )
        `,
        )
        .eq("user_id", user.id);

      if (staffError) throw staffError;

      const firstStaff = staffRows?.[0];

      if (!firstStaff?.departments) {
        setDepartment(null);
        setNotifications([]);
        setDebug(`No department_staff row found for user_id: ${user.id}`);
        setLoading(false);
        return;
      }

      const dept = Array.isArray(firstStaff.departments)
        ? firstStaff.departments[0]
        : firstStaff.departments;

      setDepartment(dept);

      const { data: complaintRows, error: complaintError } = await supabase
        .from("complaints")
        .select(
          `
          id,
          tracking_id,
          title,
          status,
          ai_priority,
          assigned_department_id,
          created_at,
          updated_at
        `,
        )
        .eq("assigned_department_id", dept.id)
        .order("created_at", { ascending: false })
        .limit(300);

      if (complaintError) throw complaintError;

      const items = (complaintRows ?? []).map((c) => ({
        id: c.id,
        type: getType(c),
        title: getTitle(c),
        message: getMessage(c, dept.name),
        tracking_id: c.tracking_id,
        complaint_title: c.title,
        status: c.status,
        priority: c.ai_priority,
        created_at: c.updated_at ?? c.created_at,
      }));

      setNotifications(items);
    } catch (error: any) {
      console.error("Department notifications load failed:", error);
      toast.error(error?.message ?? "Failed to load notifications");
      setDepartment(null);
      setNotifications([]);
      setDebug(error?.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user?.id) {
      load();
    }
  }, [authLoading, user?.id]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    return notifications.filter((n) => {
      const text = `
        ${n.title ?? ""}
        ${n.message ?? ""}
        ${n.tracking_id ?? ""}
        ${n.complaint_title ?? ""}
        ${n.status ?? ""}
        ${n.priority ?? ""}
      `.toLowerCase();

      if (search && !text.includes(search)) return false;

      return true;
    });
  }, [notifications, q]);

  if (authLoading || loading) {
    return (
      <div>
        <PageHeader
          title="Notifications"
          subtitle="Loading department notifications"
        />

        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notifications...
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div>
        <PageHeader
          title="Notifications"
          subtitle="No department is linked to your account"
        />

        <div className="p-8">
          <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
            Your account is not mapped to any department.

            {debug && (
              <div className="mt-4 rounded-xl border border-border bg-background p-3 font-mono text-xs text-foreground">
                {debug}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${filtered.length} department updates for ${department.name}`}
        actions={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <div className="space-y-5 p-6 md:p-8">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notifications, tracking ID, status..."
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card py-16 text-sm text-muted-foreground shadow-card">
            <Inbox className="h-8 w-8 opacity-50" />
            No notifications found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((n, index) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: index * 0.01 }}
                className="rounded-3xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className={getIconBoxClass(n.type)}>
                    {n.type === "critical" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : n.type === "resolved" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                        {n.tracking_id}
                      </span>

                      <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                        {String(n.status).replace("_", " ")}
                      </span>

                      {n.priority && (
                        <span className="rounded-lg bg-warning/15 px-2 py-1 text-xs font-medium capitalize text-warning">
                          {n.priority}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-foreground">
                      {n.title}
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {n.message}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getType(c: any) {
  if ((c.ai_priority ?? "").toLowerCase() === "critical") return "critical";
  if (["resolved", "closed"].includes(c.status)) return "resolved";
  return "normal";
}

function getTitle(c: any) {
  if ((c.ai_priority ?? "").toLowerCase() === "critical") {
    return "Critical complaint assigned";
  }

  if (c.status === "resolved" || c.status === "closed") {
    return "Complaint marked resolved";
  }

  return "Complaint assigned to your department";
}

function getMessage(c: any, departmentName: string) {
  if ((c.ai_priority ?? "").toLowerCase() === "critical") {
    return `${c.tracking_id} is marked critical and assigned to ${departmentName}. Immediate review is recommended.`;
  }

  if (c.status === "resolved" || c.status === "closed") {
    return `${c.tracking_id} has been marked ${String(c.status).replace(
      "_",
      " ",
    )}.`;
  }

  return `${c.tracking_id} is currently assigned to ${departmentName}. Please review and respond if action is required.`;
}

function getIconBoxClass(type: string) {
  if (type === "critical") {
    return "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive";
  }

  if (type === "resolved") {
    return "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success";
  }

  return "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary";
}
