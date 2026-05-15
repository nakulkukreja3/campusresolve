import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Inbox,
  Eye,
  X,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  RotateCcw,
  GitBranch,
  AlertTriangle,
  MapPin,
  Calendar,
  Brain,
  MessageSquare,
  Building2,
  RefreshCcw,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  PageHeader,
  StatusBadge,
  PriorityBadge,
  SentimentBadge,
} from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/department/complaints")({
  component: DepartmentComplaints,
});

const STATUSES = [
  "all",
  "submitted",
  "under_review",
  "assigned",
  "in_progress",
  "escalated",
  "resolved",
  "closed",
];

const PRIORITIES = ["all", "critical", "high", "medium", "low"];

const ACTIONS = [
  { key: "in_progress", label: "Start work", icon: Clock },
  { key: "resolved", label: "Close / Resolve", icon: CheckCircle2 },
  { key: "under_review", label: "Send to admin", icon: RotateCcw },
  { key: "assigned", label: "Refer department", icon: GitBranch },
];

function DepartmentComplaints() {
  const { user, loading: authLoading } = useAuth();

  const [department, setDepartment] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const [selected, setSelected] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [actionDept, setActionDept] = useState("");
  const [remark, setRemark] = useState("");
  const [updating, setUpdating] = useState(false);

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
            code,
            description
          )
        `,
        )
        .eq("user_id", user.id);

      if (staffError) throw staffError;

      const firstStaff = staffRows?.[0];

      if (!firstStaff?.departments) {
        setDebug(`No department_staff row found for user_id: ${user.id}`);
        setDepartment(null);
        setRows([]);
        setLoading(false);
        return;
      }

      const dept = Array.isArray(firstStaff.departments)
        ? firstStaff.departments[0]
        : firstStaff.departments;

      setDepartment(dept);

      const { data: deptRows, error: deptError } = await supabase
        .from("departments")
        .select("id, name, code, description")
        .order("name");

      if (deptError) throw deptError;

      setDepartments(deptRows ?? []);

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
        .limit(300);

      if (complaintError) throw complaintError;

      const safeRows = complaintRows ?? [];
      setRows(safeRows);

      const complaintIds = safeRows.map((r) => r.id);

      if (complaintIds.length > 0) {
        const { data: attachmentRows } = await supabase
          .from("complaint_attachments")
          .select("id, complaint_id, file_name, file_url, file_type, created_at")
          .in("complaint_id", complaintIds);

        const attachmentMap: Record<string, any[]> = {};

        for (const item of attachmentRows ?? []) {
          if (!attachmentMap[item.complaint_id]) {
            attachmentMap[item.complaint_id] = [];
          }

          attachmentMap[item.complaint_id].push(item);
        }

        setAttachments(attachmentMap);

        const { data: logRows } = await supabase
          .from("complaint_logs")
          .select("id, complaint_id, action, note, actor_id, created_at")
          .in("complaint_id", complaintIds)
          .order("created_at", { ascending: false });

        const logMap: Record<string, any[]> = {};

        for (const item of logRows ?? []) {
          if (!logMap[item.complaint_id]) {
            logMap[item.complaint_id] = [];
          }

          logMap[item.complaint_id].push(item);
        }

        setLogs(logMap);
      } else {
        setAttachments({});
        setLogs({});
      }
    } catch (error: any) {
      console.error("Department complaints load failed:", error);
      setDebug(error?.message ?? "Failed to load assigned cases");
      toast.error(error?.message ?? "Failed to load assigned cases");
      setDepartment(null);
      setRows([]);
      setAttachments({});
      setLogs({});
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

    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (priority !== "all" && (r.ai_priority ?? r.urgency) !== priority) {
        return false;
      }

      const text = `
        ${r.tracking_id ?? ""}
        ${r.title ?? ""}
        ${r.description ?? ""}
        ${r.location ?? ""}
        ${r.ai_category ?? ""}
      `.toLowerCase();

      if (search && !text.includes(search)) return false;

      return true;
    });
  }, [rows, q, status, priority]);

  function openCase(row: any) {
    setSelected(row);
    setActionStatus(row.status || "in_progress");
    setActionDept(row.assigned_department_id || department?.id || "");
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

      toast.success("Case updated");
      closeCase();
      await load();
    } catch (error: any) {
      console.error("Department case update failed:", error);
      toast.error(error?.message ?? "Failed to update case");
    } finally {
      setUpdating(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div>
        <PageHeader
          title="Assigned cases"
          subtitle="Loading department cases"
        />

        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading assigned cases...
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div>
        <PageHeader
          title="Assigned cases"
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
        title="Assigned cases"
        subtitle={`${filtered.length} of ${rows.length} complaints assigned to ${department.name}`}
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="rounded-3xl border border-border bg-card p-4 shadow-card"
        >
          <div className="grid gap-3 md:grid-cols-[1fr,180px,180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tracking ID, title, location, category..."
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <Select
              icon={Filter}
              value={status}
              onChange={setStatus}
              options={STATUSES}
            />

            <Select
              value={priority}
              onChange={setPriority}
              options={PRIORITIES}
            />
          </div>
        </motion.div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-border bg-card py-16 text-sm text-muted-foreground shadow-card">
            <Inbox className="h-8 w-8 opacity-50" />
            No assigned cases found.
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((r, index) => {
              const count = attachments[r.id]?.length ?? 0;

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.01 }}
                  className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                          {r.tracking_id}
                        </span>

                        <StatusBadge status={r.status} />
                        <PriorityBadge priority={r.ai_priority ?? r.urgency} />
                        <SentimentBadge sentiment={r.ai_sentiment} />
                      </div>

                      <h3 className="truncate text-base font-semibold text-foreground">
                        {r.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {r.description || "No description provided."}
                      </p>

                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <SmallInfo
                          icon={Calendar}
                          label="Reported"
                          value={new Date(r.created_at).toLocaleString()}
                        />

                        <SmallInfo
                          icon={MapPin}
                          label="Location"
                          value={r.location || "Not provided"}
                        />

                        <SmallInfo
                          icon={Paperclip}
                          label="Evidence"
                          value={
                            count === 0
                              ? "0 attachments"
                              : `${count} attachment${count > 1 ? "s" : ""}`
                          }
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCase(r)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
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
              className="max-h-[88vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-2xl"
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

                  <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
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
                  label="Reported date and time"
                  value={new Date(selected.created_at).toLocaleString()}
                />

                <InfoCard
                  icon={MapPin}
                  label="Complaint location"
                  value={selected.location || "Not provided"}
                />

                <InfoCard
                  icon={Building2}
                  label="Current department"
                  value={department.name}
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
                  icon={Paperclip}
                  label="Evidence"
                  value={`${
                    attachments[selected.id]?.length ?? 0
                  } attachment${
                    (attachments[selected.id]?.length ?? 0) === 1 ? "" : "s"
                  }`}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Evidence attachments
                </div>

                {(attachments[selected.id]?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    0 attachments. No evidence was attached by the student.
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {attachments[selected.id].map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-border bg-card p-3 text-sm text-foreground transition hover:border-primary hover:text-primary"
                      >
                        <div className="font-medium">{file.file_name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {file.file_type || "Attachment"}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
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

              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Case history
                </div>

                {(logs[selected.id]?.length ?? 0) === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No action history available yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs[selected.id].map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-border bg-card p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-foreground">
                            {String(log.action).replace("_", " ")}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {log.note || "No note added."}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                    placeholder="Write the action taken, reason for closure, or reason for forwarding."
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

function Select({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon?: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground capitalize outline-none"
      >
        {options.map((s) => (
          <option key={s} value={s} className="bg-background text-foreground">
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

function SmallInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>

        <div className="truncate text-xs font-medium text-foreground">
          {value}
        </div>
      </div>
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
