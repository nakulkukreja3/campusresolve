import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Inbox,
  Loader2,
  Calendar,
  FileText,
  User,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/department/responses")({
  component: DepartmentResponses,
});

function DepartmentResponses() {
  const { user, loading: authLoading } = useAuth();

  const [department, setDepartment] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
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
        setLogs([]);
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
        .select("id")
        .eq("assigned_department_id", dept.id);

      if (complaintError) throw complaintError;

      const complaintIds = (complaintRows ?? []).map((c) => c.id);

      if (complaintIds.length === 0) {
        setLogs([]);
        setLoading(false);
        return;
      }

      const { data: logRows, error: logError } = await supabase
        .from("complaint_logs")
        .select(
          `
          id,
          complaint_id,
          actor_id,
          action,
          note,
          created_at,
          complaints:complaint_id (
            id,
            tracking_id,
            title,
            status,
            ai_priority,
            assigned_department_id
          )
        `,
        )
        .in("complaint_id", complaintIds)
        .order("created_at", { ascending: false })
        .limit(300);

      if (logError) throw logError;

      setLogs(logRows ?? []);
    } catch (error: any) {
      console.error("Department responses load failed:", error);
      toast.error(error?.message ?? "Failed to load responses");
      setLogs([]);
      setDepartment(null);
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

    return logs.filter((log) => {
      const complaint = Array.isArray(log.complaints)
        ? log.complaints[0]
        : log.complaints;

      const text = `
        ${log.action ?? ""}
        ${log.note ?? ""}
        ${complaint?.tracking_id ?? ""}
        ${complaint?.title ?? ""}
      `.toLowerCase();

      if (search && !text.includes(search)) return false;

      return true;
    });
  }, [logs, q]);

  if (authLoading || loading) {
    return (
      <div>
        <PageHeader title="Responses" subtitle="Loading department responses" />

        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading responses...
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div>
        <PageHeader
          title="Responses"
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
        title="Responses"
        subtitle={`${filtered.length} response logs from ${department.name}`}
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
            placeholder="Search response, tracking ID, title..."
            className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card py-16 text-sm text-muted-foreground shadow-card">
            <Inbox className="h-8 w-8 opacity-50" />
            No responses found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((log, index) => {
              const complaint = Array.isArray(log.complaints)
                ? log.complaints[0]
                : log.complaints;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.01 }}
                  className="rounded-3xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                          {complaint?.tracking_id ?? "No tracking ID"}
                        </span>

                        <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                          {String(log.action).replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-foreground">
                        {complaint?.title ?? "Complaint title not available"}
                      </h3>

                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {log.note || "No response note added."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                      <Calendar className="mb-1 h-3.5 w-3.5" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <MiniInfo
                      icon={FileText}
                      label="Complaint"
                      value={complaint?.tracking_id ?? "Not available"}
                    />

                    <MiniInfo
                      icon={MessageSquare}
                      label="Action"
                      value={String(log.action).replace("_", " ")}
                    />

                    <MiniInfo
                      icon={User}
                      label="Actor"
                      value={log.actor_id ? "Department staff" : "System"}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-background p-3">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>

        <div className="mt-0.5 truncate text-xs font-medium capitalize text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
