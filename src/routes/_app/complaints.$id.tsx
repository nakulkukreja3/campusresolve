import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Brain,
  MessageSquare,
  Loader2,
  Building2,
  User as UserIcon,
  Tag,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Send,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  PageHeader,
  StatusBadge,
  PriorityBadge,
  SentimentBadge,
} from "@/components/app/Primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/complaints/$id")({
  component: ComplaintDetail,
});

const STAFF_ACTIONS = [
  {
    status: "under_review",
    label: "Mark under review",
    icon: RefreshCcw,
    tone: "primary",
  },
  {
    status: "assigned",
    label: "Assign",
    icon: Building2,
    tone: "info",
  },
  {
    status: "in_progress",
    label: "Start progress",
    icon: Send,
    tone: "primary",
  },
  {
    status: "escalated",
    label: "Escalate",
    icon: ShieldAlert,
    tone: "warning",
  },
  {
    status: "resolved",
    label: "Resolve",
    icon: CheckCircle2,
    tone: "success",
  },
  {
    status: "closed",
    label: "Close",
    icon: XCircle,
    tone: "danger",
  },
];

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();

  const [c, setC] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [dept, setDept] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [posting, setPosting] = useState(false);

  const [actionOpen, setActionOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);

    const [{ data, error }, { data: deptRows }] = await Promise.all([
      supabase.from("complaints").select("*").eq("id", id).maybeSingle(),
      supabase.from("departments").select("id, name").order("name"),
    ]);

    if (error || !data) {
      toast.error("Complaint not found");
      navigate({ to: "/complaints" });
      return;
    }

    setC(data);
    setDepartments(deptRows ?? []);
    setSelectedDept(data.assigned_department_id ?? "");

    if (data.assigned_department_id) {
      const matched = (deptRows ?? []).find(
        (d) => d.id === data.assigned_department_id,
      );
      setDept(matched ?? null);
    } else {
      setDept(null);
    }

    const { data: ls } = await supabase
      .from("complaint_logs")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    setLogs(ls ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    const channel = supabase
      .channel(`complaint-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaint_logs",
          filter: `complaint_id=eq.${id}`,
        },
        () => load(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "complaints",
          filter: `id=eq.${id}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const actionSummary = useMemo(() => {
    if (!c) return [];

    return [
      {
        label: "Tracking ID",
        value: c.tracking_id,
      },
      {
        label: "Current status",
        value: c.status?.replace("_", " "),
      },
      {
        label: "Priority",
        value: c.ai_priority ?? c.urgency ?? "medium",
      },
      {
        label: "Department",
        value: dept?.name ?? "Unassigned",
      },
    ];
  }, [c, dept]);

  function openAction(action: any) {
    setSelectedAction(action);
    setReason("");
    setActionOpen(true);
  }

  async function confirmAction() {
    if (!user || !c || !selectedAction) return;

    if (reason.trim().length < 10) {
      toast.error("Please add a proper reason of at least 10 characters.");
      return;
    }

    if (selectedAction.status === "assigned" && !selectedDept) {
      toast.error("Please select a department before assigning.");
      return;
    }

    setUpdating(true);

    const patch: any = {
      status: selectedAction.status,
      updated_at: new Date().toISOString(),
    };

    if (selectedAction.status === "assigned") {
      patch.assigned_department_id = selectedDept;
      patch.ai_department_id = selectedDept;
    }

    if (selectedAction.status === "escalated") {
      patch.escalation_level = (c.escalation_level ?? 0) + 1;
    }

    if (["resolved", "closed"].includes(selectedAction.status)) {
      patch.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("complaints")
      .update(patch)
      .eq("id", id);

    if (error) {
      setUpdating(false);
      toast.error(error.message);
      return;
    }

    const deptLabel =
      departments.find((d) => d.id === selectedDept)?.name ?? "department";

    await supabase.from("complaint_logs").insert({
      complaint_id: id,
      actor_id: user.id,
      action: selectedAction.status,
      note:
        selectedAction.status === "assigned"
          ? `Assigned to ${deptLabel}. Reason: ${reason.trim()}`
          : `${selectedAction.label}. Reason: ${reason.trim()}`,
    });

    if (c.user_id) {
      await supabase.from("notifications").insert({
        recipient_id: c.user_id,
        complaint_id: id,
        type: "status",
        title: `Complaint ${c.tracking_id} updated`,
        message: `Status changed to ${selectedAction.status.replace("_", " ")}.`,
      });
    }

    toast.success("Complaint updated");
    setActionOpen(false);
    setSelectedAction(null);
    setReason("");
    setUpdating(false);
    load();
  }

  async function postNote() {
    if (!note.trim() || !user) return;

    setPosting(true);

    const { error } = await supabase.from("complaint_logs").insert({
      complaint_id: id,
      actor_id: user.id,
      action: isStaff ? "staff_note" : "comment",
      note: note.trim(),
    });

    setPosting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setNote("");
    toast.success("Comment added");
  }

  if (loading || !c) {
    return (
      <div className="flex h-[65vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={c.tracking_id}
        subtitle={c.title}
        actions={
          <Link
            to={isStaff ? "/admin/complaints" : "/complaints"}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm transition hover:bg-sidebar-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[1fr,380px]">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="rounded-3xl border border-border bg-card/80 p-6 shadow-card"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              <PriorityBadge priority={c.ai_priority ?? c.urgency} />
              <SentimentBadge sentiment={c.ai_sentiment} />

              {(c.escalation_level ?? 0) > 0 && (
                <span className="rounded-full bg-warning/15 px-3 py-1 text-[11px] font-semibold text-warning">
                  Escalated level {c.escalation_level}
                </span>
              )}
            </div>

            <h2 className="font-display text-xl font-semibold">{c.title}</h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {c.description}
            </p>

            <div className="mt-6 grid gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
              {c.location && (
                <Meta icon={MapPin} label="Location" value={c.location} />
              )}
              <Meta
                icon={Calendar}
                label="Created"
                value={new Date(c.created_at).toLocaleString()}
              />
              <Meta
                icon={Building2}
                label="Department"
                value={dept?.name ?? "Unassigned"}
              />
              {c.is_anonymous && (
                <Meta icon={UserIcon} label="Submitted" value="Anonymously" />
              )}
            </div>
          </motion.div>

          {isStaff && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.04 }}
              className="rounded-3xl border border-border bg-card/80 p-6 shadow-card"
            >
              <div className="mb-4">
                <h3 className="font-display text-base font-semibold">
                  Staff actions
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every action requires a reason and is saved in the audit trail.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {STAFF_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const active = c.status === action.status;

                  return (
                    <button
                      key={action.status}
                      type="button"
                      disabled={active || updating}
                      onClick={() => openAction(action)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.08 }}
            className="rounded-3xl border border-border bg-card/80 p-6 shadow-card"
          >
            <h3 className="mb-4 font-display text-base font-semibold">
              Activity timeline
            </h3>

            <div className="relative space-y-5 border-l border-border pl-5">
              {logs.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  No activity yet.
                </div>
              )}

              {logs.map((l) => (
                <div key={l.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-primary shadow-glow" />

                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {l.action.replace("_", " ")} ·{" "}
                    {new Date(l.created_at).toLocaleString()}
                  </div>

                  {l.note && (
                    <div className="mt-1 rounded-2xl bg-background/60 p-3 text-sm leading-6">
                      {l.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-2 h-4 w-4 text-muted-foreground" />

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={
                    isStaff
                      ? "Add an internal staff note..."
                      : "Add a comment or update..."
                  }
                  className="flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                />

                <button
                  type="button"
                  onClick={postNote}
                  disabled={posting || !note.trim()}
                  className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
                >
                  {posting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <aside className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.06 }}
            className="rounded-3xl border border-border bg-card/80 p-5 shadow-card"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Brain className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold">AI triage</div>
                <div className="text-[11px] text-muted-foreground">
                  Automated routing analysis
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <Row label="Category" value={c.ai_category ?? "—"} />
              <Row label="Department" value={dept?.name ?? "Unassigned"} />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority</span>
                <PriorityBadge priority={c.ai_priority} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sentiment</span>
                <SentimentBadge sentiment={c.ai_sentiment} />
              </div>

              {c.ai_confidence != null && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-muted-foreground">
                    <span>Confidence</span>
                    <span>{Math.round(c.ai_confidence)}%</span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-primary"
                      style={{ width: `${c.ai_confidence}%` }}
                    />
                  </div>
                </div>
              )}

              {c.ai_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {c.ai_tags.map((t: string) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {c.ai_reasoning && (
                <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {c.ai_reasoning}
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.1 }}
            className="rounded-3xl border border-border bg-card/80 p-5 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Case summary</h3>
            </div>

            <div className="space-y-3 text-xs">
              {actionSummary.map((item) => (
                <Row key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </motion.div>
        </aside>
      </div>

      <AnimatePresence>
        {actionOpen && selectedAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-card"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedAction.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a clear reason. This will be saved in the complaint audit
                  trail.
                </p>
              </div>

              {selectedAction.status === "assigned" && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Assign department
                  </label>

                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full rounded-2xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Write the reason for this action..."
                className="w-full resize-none rounded-2xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
              />

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-sidebar-accent"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmAction}
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50"
                >
                  {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm action
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium capitalize">{value}</span>
    </div>
  );
}
