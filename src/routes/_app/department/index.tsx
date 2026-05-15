import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  ArrowRight,
  Loader2,
  Eye,
  X,
  Send,
  User,
  MapPin,
  Calendar,
  Brain,
  GitBranch,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  PriorityBadge,
  SentimentBadge,
} from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/department/")({
  component: DepartmentDashboard,
});

const ACTIONS = [
  {
    key: "in_progress",
    label: "Start work",
    icon: Clock,
  },
  {
    key: "resolved",
    label: "Close / Resolve",
    icon: CheckCircle2,
  },
  {
    key: "under_review",
    label: "Send to admin",
    icon: RotateCcw,
  },
  {
    key: "assigned",
    label: "Refer department",
    icon: GitBranch,
  },
];

function DepartmentDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [department, setDepartment] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState("");

  const [selected, setSelected] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [actionDept, setActionDept] = useState("");
  const [remark, setRemark] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!user?.id) return;

    setLoading(true);
    setDebug("");

    const { data: staffRows, error: staffError } = await supabase
      .from("department_staff")
      .select(
        `
        user_id,
        department_id,
        departments:department_id (
          id,
          name,
          code,
          description
        )
      `,
      )
      .eq("user_id", user.id);

    if (staffError) {
      setDebug(staffError.message);
      setDepartment(null);
      setComplaints([]);
      setLoading(false);
      return;
    }

    const firstStaff = staffRows?.[0];

    if (!firstStaff?.departments) {
      setDebug(`No department_staff row found for user_id: ${user.id}`);
      setDepartment(null);
      setComplaints([]);
      setLoading(false);
      return;
    }

    const dept = Array.isArray(firstStaff.departments)
      ? firstStaff.departments[0]
      : firstStaff.departments;

    setDepartment(dept);

    const { data: allDepartments, error: departmentsError } = await supabase
      .from("departments")
      .select("id, name, code, description")
      .order("name");

    if (departmentsError) {
      setDebug(departmentsError.message);
      setDepartments([]);
    } else {
      setDepartments(allDepartments ?? []);
    }

    const { data: complaintRows, error: complaintError } = await supabase
      .from("complaints")
      .select(
        `
        id,
        user_id,
        tracking_id,
        title,
        description,
        location,
        status,
        urgency,
        ai_priority,
        ai_category,
        ai_sentiment,
        ai_confidence,
        ai_reasoning,
        ai_tags,
        assigned_department_id,
        ai_department_id,
        escalation_level,
        is_anonymous,
        created_at,
        resolved_at
      `,
      )
      .eq("assigned_department_id", dept.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (complaintError) {
      setDebug(complaintError.message);
      setComplaints([]);
      setLoading(false);
      return;
    }

    setComplaints(complaintRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && user?.id) {
      load();
    }
  }, [authLoading, user?.id]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter(
      (c) => !["resolved", "closed"].includes(c.status),
    ).length;
    const inProgress = complaints.filter(
      (c) => c.status === "in_progress",
    ).length;
    const resolved = complaints.filter((c) =>
      ["resolved", "closed"].includes(c.status),
    ).length;
    const critical = complaints.filter(
      (c) => (c.ai_priority ?? c.urgency) === "critical",
    ).length;

    return { total, open, inProgress, resolved, critical };
  }, [complaints]);

  function openCase(c: any) {
    setSelected(c);
    setActionStatus(c.status || "in_progress");
    setActionDept(c.assigned_department_id || department?.id || "");
    setRemark("");
  }

  function closeCase() {
    setSelected(null);
    setActionStatus("");
    setActionDept("");
    setRemark("");
  }

  async function submitAction() {
    if (!selected) return;

    if (!remark.trim()) {
      toast.error("Remark is required");
      return;
    }

    if (actionStatus === "assigned" && !actionDept) {
      toast.error("Please select a department");
      return;
    }

    setUpdating(true);

    try {
      const patch: any = {
        status: actionStatus,
        assigned_department_id:
          actionStatus === "under_review" ? null : actionDept || department?.id,
      };

      if (actionStatus === "resolved" || actionStatus === "closed") {
        patch.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("complaints")
        .update(patch)
        .eq("id", selected.id);

      if (error) throw error;

      const targetDepartment =
        departments.find((d) => d.id === patch.assigned_department_id)?.name ??
        "Admin review queue";

      await supabase.from("complaint_logs").insert({
        complaint_id: selected.id,
        actor_id: user?.id ?? null,
        action:
          actionStatus === "resolved"
            ? "resolved"
            : actionStatus === "under_review"
              ? "sent_to_admin"
              : actionStatus === "assigned"
                ? "department_referred"
                : "department_update",
        note: `Department action by ${department?.name}: Status: ${actionStatus.replace(
          "_",
          " ",
        )} | Forwarded to: ${targetDepartment} | Remark: ${remark.trim()}`,
      });

      if (selected.user_id) {
        await supabase.from("notifications").insert({
          recipient_id: selected.user_id,
          complaint_id: selected.id,
          type: "status",
          title: `Complaint ${selected.tracking_id} updated`,
          message: `${department?.name} updated your complaint. ${remark.trim()}`,
        });
      }

      toast.success("Complaint updated");
      closeCase();
      await load();
    } catch (error: any) {
      console.error("Department action failed:", error);
      toast.error(error?.message ?? "Failed to update complaint");
    } finally {
      setUpdating(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div>
        <PageHeader
          title="Department dashboard"
          subtitle="Loading department workspace"
        />

        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading department details...
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div>
        <PageHeader
          title="Department dashboard"
          subtitle="No department is linked to your account"
        />

        <div className="p-8">
          <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
            Your account has department staff access, but it is not mapped to any
            department in the <b>department_staff</b> table.

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
        title={`${department.name} dashboard`}
        subtitle={`Department code: ${department.code}`}
        actions={
          <Link
            to="/department/complaints"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Assigned cases
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-6 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="rounded-3xl border border-border bg-card p-5 shadow-card"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {department.name}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {department.description ||
                  "Complaints referred to this department will appear here."}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total assigned"
            value={stats.total}
            icon={ClipboardList}
            tone="primary"
          />
          <StatCard label="Open" value={stats.open} icon={Inbox} tone="info" />
          <StatCard
            label="In progress"
            value={stats.inProgress}
            icon={Clock}
            tone="warning"
          />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Critical"
            value={stats.critical}
            icon={AlertTriangle}
            tone="danger"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.04 }}
          className="rounded-3xl border border-border bg-card p-5 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Recent assigned complaints
              </h3>
              <p className="text-xs text-muted-foreground">
                Latest complaints transferred to your department
              </p>
            </div>

            <Link
              to="/department/complaints"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              No complaints assigned to this department yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {complaints.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.tracking_id}
                  </span>

                  <span className="min-w-[220px] flex-1 truncate text-sm font-medium text-foreground">
                    {c.title}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {c.ai_category ?? "Uncategorized"}
                  </span>

                  <PriorityBadge priority={c.ai_priority ?? c.urgency} />
                  <StatusBadge status={c.status} />

                  <button
                    type="button"
                    onClick={() => openCase(c)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.18 }}
              className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      {selected.tracking_id}
                    </span>
                    <StatusBadge status={selected.status} />
                    <PriorityBadge
                      priority={selected.ai_priority ?? selected.urgency}
                    />
                    <SentimentBadge sentiment={selected.ai_sentiment} />
                  </div>

                  <h2 className="text-2xl font-semibold text-foreground">
                    {selected.title}
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {selected.description || "No description provided."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCase}
                  className="rounded-xl border border-border bg-background p-2 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <InfoCard
                  icon={Calendar}
                  label="Reported on"
                  value={new Date(selected.created_at).toLocaleString()}
                />
                <InfoCard
                  icon={MapPin}
                  label="Location"
                  value={selected.location || "Not provided"}
                />
                <InfoCard
                  icon={Brain}
                  label="AI category"
                  value={selected.ai_category || "Uncategorized"}
                />
                <InfoCard
                  icon={AlertTriangle}
                  label="Escalation level"
                  value={String(selected.escalation_level ?? 0)}
                />
                <InfoCard
                  icon={User}
                  label="Anonymous"
                  value={selected.is_anonymous ? "Yes" : "No"}
                />
                <InfoCard
                  icon={CheckCircle2}
                  label="Resolved at"
                  value={
                    selected.resolved_at
                      ? new Date(selected.resolved_at).toLocaleString()
                      : "Not resolved yet"
                  }
                />
              </div>

              {selected.ai_reasoning && (
                <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Brain className="h-4 w-4 text-primary" />
                    AI reasoning
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selected.ai_reasoning}
                  </p>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Department action
                  </h3>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Action
                    </label>

                    <select
                      value={actionStatus}
                      onChange={(e) => setActionStatus(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    >
                      {ACTIONS.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Refer / assign department
                    </label>

                    <select
                      value={actionDept}
                      onChange={(e) => setActionDept(e.target.value)}
                      disabled={actionStatus === "under_review"}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                    >
                      <option value="">Admin review queue</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Remark
                  </label>

                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={4}
                    placeholder="Write what action was taken, why it was closed, or why it is being referred."
                    className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCase}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={submitAction}
                    disabled={updating}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Save action
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>

      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
