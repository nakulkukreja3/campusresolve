import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Inbox,
  ArrowUpDown,
  RefreshCcw,
  Eye,
  User,
  Mail,
  Phone,
  GraduationCap,
  Hash,
  Building2,
  MapPin,
  Calendar,
  Brain,
  Send,
  AlertTriangle,
  CheckCircle2,
  Lock,
  GitBranch,
  Loader2,
  Clock,
  X,
  MessageSquare,
  Paperclip,
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  PageHeader,
  StatusBadge,
  PriorityBadge,
  SentimentBadge,
} from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/admin/complaints")({
  component: AdminComplaints,
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
  { key: "assigned", label: "Assign", icon: Building2 },
  { key: "in_progress", label: "Start work", icon: Clock },
  { key: "escalated", label: "Escalate", icon: AlertTriangle },
  { key: "resolved", label: "Resolve", icon: CheckCircle2 },
  { key: "closed", label: "Close", icon: Lock },
];

function AdminComplaints() {
  const [rows, setRows] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [dept, setDept] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "critical">("newest");

  const [selected, setSelected] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [actionDept, setActionDept] = useState("");
  const [remark, setRemark] = useState("");
  const [updating, setUpdating] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const { data: deptRows, error: deptError } = await supabase
        .from("departments")
        .select("id, name, code")
        .order("name");

      if (deptError) throw deptError;

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
          ai_sentiment,
          ai_category,
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
        .order("created_at", { ascending: false })
        .limit(500);

      if (complaintError) throw complaintError;

      const safeComplaints = complaintRows ?? [];

      const complaintIds = safeComplaints.map((r) => r.id);

      let attachmentMap: Record<string, any[]> = {};

      if (complaintIds.length > 0) {
        const { data: attachmentRows, error: attachmentError } = await supabase
          .from("complaint_attachments")
          .select(
            `
            id,
            complaint_id,
            user_id,
            file_name,
            file_path,
            file_type,
            file_size,
            bucket,
            created_at
          `,
          )
          .in("complaint_id", complaintIds)
          .order("created_at", { ascending: false });

        if (attachmentError) {
          console.error("Attachments loading failed:", attachmentError.message);
        }

        attachmentMap = (attachmentRows ?? []).reduce((acc: Record<string, any[]>, item) => {
          if (!acc[item.complaint_id]) acc[item.complaint_id] = [];
          acc[item.complaint_id].push(item);
          return acc;
        }, {});
      }

      const userIds = [
        ...new Set(
          safeComplaints
            .map((r) => r.user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      let profileMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            id,
            email,
            full_name,
            username,
            roll_number,
            phone,
            course,
            semester,
            age,
            address
          `,
          )
          .in("id", userIds);

        if (profileError) {
          console.error("Profiles loading failed:", profileError.message);
          toast.error("Complaints loaded, but student profiles could not load");
        }

        profileMap = Object.fromEntries((profileRows ?? []).map((p) => [p.id, p]));
      }

      setDepartments(deptRows ?? []);
      setRows(safeComplaints);
      setProfiles(profileMap);
      setAttachments(attachmentMap);

      if (selected) {
        const updated = safeComplaints.find((r) => r.id === selected.id);
        setSelected(updated ?? null);
      }
    } catch (error: any) {
      console.error("Admin complaints load failed:", error);
      toast.error(error?.message ?? "Failed to load complaints");
      setRows([]);
      setDepartments([]);
      setProfiles({});
      setAttachments({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const deptName = (id: string | null) =>
    departments.find((d) => d.id === id)?.name ?? "Unassigned";

  const filtered = useMemo(() => {
    const priorityRank: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return rows
      .filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        if (priority !== "all" && r.ai_priority !== priority) return false;
        if (dept !== "all" && r.assigned_department_id !== dept) return false;

        const p = profiles[r.user_id] ?? {};

        const searchText = `
          ${r.title ?? ""}
          ${r.tracking_id ?? ""}
          ${r.ai_category ?? ""}
          ${r.description ?? ""}
          ${p.full_name ?? ""}
          ${p.email ?? ""}
          ${p.roll_number ?? ""}
        `.toLowerCase();

        if (q && !searchText.includes(q.toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => {
        if (sort === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }

        if (sort === "critical") {
          return (priorityRank[b.ai_priority] ?? 0) - (priorityRank[a.ai_priority] ?? 0);
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [rows, profiles, q, status, priority, dept, sort]);

  function openComplaint(row: any) {
    setSelected(row);
    setActionStatus(row.status || "under_review");
    setActionDept(row.assigned_department_id ?? "");
    setRemark("");
  }

  function closePopup() {
    setSelected(null);
    setActionStatus("");
    setActionDept("");
    setRemark("");
  }

  function quickAction(nextStatus: string) {
    setActionStatus(nextStatus);
    setActionDept(selected?.assigned_department_id ?? "");
    setRemark("");
  }

  async function submitAction() {
    if (!selected) return;

    if (!remark.trim()) {
      toast.error("Remark is required for admin action");
      return;
    }

    setUpdating(true);

    try {
      const patch: any = {
        status: actionStatus,
        assigned_department_id: actionDept || null,
      };

      if (actionStatus === "escalated") {
        patch.escalation_level = (selected.escalation_level ?? 0) + 1;
      }

      if (actionStatus === "resolved" || actionStatus === "closed") {
        patch.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("complaints")
        .update(patch)
        .eq("id", selected.id);

      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const departmentLabel = actionDept ? deptName(actionDept) : "Unassigned";

      await supabase.from("complaint_logs").insert({
        complaint_id: selected.id,
        actor_id: user?.id ?? null,
        action:
          actionStatus === "escalated"
            ? "escalated"
            : actionStatus === "closed"
              ? "closed"
              : actionStatus === "resolved"
                ? "resolved"
                : "admin_update",
        note: `Status: ${actionStatus.replace("_", " ")} | Department: ${departmentLabel} | Remark: ${remark.trim()}`,
      });

      if (selected.user_id) {
        await supabase.from("notifications").insert({
          recipient_id: selected.user_id,
          complaint_id: selected.id,
          type: "status",
          title: `Complaint ${selected.tracking_id} updated`,
          message: `Status changed to ${actionStatus.replace("_", " ")}. ${remark.trim()}`,
        });
      }

      toast.success("Complaint updated");
      await load();
      setRemark("");
    } catch (error: any) {
      console.error("Complaint update failed:", error);
      toast.error(error?.message ?? "Failed to update complaint");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin complaints"
        subtitle={`${filtered.length} of ${rows.length} complaints shown`}
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
          transition={{ duration: 0.2 }}
          className="rounded-3xl border border-border bg-card p-4 shadow-card"
        >
          <div className="grid gap-3 xl:grid-cols-[1fr,170px,170px,210px,160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, tracking ID, student, roll no..."
                className="w-full rounded-xl border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <Select icon={Filter} value={status} onChange={setStatus} options={STATUSES} />
            <Select value={priority} onChange={setPriority} options={PRIORITIES} />

            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary"
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <Select
              icon={ArrowUpDown}
              value={sort}
              onChange={(v) => setSort(v as any)}
              options={["newest", "oldest", "critical"]}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.03 }}
          className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
        >
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              No complaints match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Tracking ID</th>
                    <th className="px-4 py-3 text-left">Complaint title</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Evidence</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Reported on</th>
                    <th className="px-4 py-3 text-right">View</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const p = profiles[r.user_id] ?? {};
                    const evidenceCount = attachments[r.id]?.length ?? 0;

                    return (
                      <tr key={r.id} className="transition hover:bg-muted/40">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {r.tracking_id}
                        </td>

                        <td className="max-w-[340px] px-4 py-3">
                          <div className="truncate font-medium text-foreground">
                            {r.title || "Untitled complaint"}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {r.ai_category ?? "Uncategorized"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-foreground">
                            {r.is_anonymous
                              ? "Anonymous"
                              : p.full_name || p.username || "Not added"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {r.is_anonymous
                              ? "Identity hidden"
                              : p.roll_number || p.email || "No profile data"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {deptName(r.assigned_department_id)}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <Paperclip className="h-3.5 w-3.5" />
                            {evidenceCount} attachment{evidenceCount === 1 ? "" : "s"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <PriorityBadge priority={r.ai_priority ?? r.urgency} />
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDateTime(r.created_at)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openComplaint(r)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <ComplaintPopup
        complaint={selected}
        profile={selected ? profiles[selected.user_id] : null}
        attachments={selected ? attachments[selected.id] ?? [] : []}
        departments={departments}
        deptName={deptName}
        actionStatus={actionStatus}
        setActionStatus={setActionStatus}
        actionDept={actionDept}
        setActionDept={setActionDept}
        remark={remark}
        setRemark={setRemark}
        updating={updating}
        onClose={closePopup}
        onSubmit={submitAction}
        onQuickAction={quickAction}
      />
    </div>
  );
}

function ComplaintPopup({
  complaint,
  profile,
  attachments,
  departments,
  deptName,
  actionStatus,
  setActionStatus,
  actionDept,
  setActionDept,
  remark,
  setRemark,
  updating,
  onClose,
  onSubmit,
  onQuickAction,
}: any) {
  if (!complaint) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 18 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl"
        >
          <div className="sticky top-0 z-10 border-b border-border bg-background/95 p-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    {complaint.tracking_id}
                  </span>

                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.ai_priority ?? complaint.urgency} />
                  <SentimentBadge sentiment={complaint.ai_sentiment} />
                </div>

                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Complaint title
                </div>

                <h2 className="mt-1 text-xl font-semibold leading-snug text-foreground">
                  {complaint.title || "Untitled complaint"}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-5">
            <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
              <div className="space-y-5">
                <Section title="Complaint information" icon={MessageSquare}>
                  <Detail label="Title" value={complaint.title || "Untitled complaint"} />
                  <Detail label="Description" value={complaint.description || "No description provided"} multiline />
                  <Detail label="Tracking ID" value={complaint.tracking_id || "Not available"} />
                  <Detail label="Current status" value={formatText(complaint.status)} />
                  <Detail label="Reported date and time" value={formatDateTime(complaint.created_at)} />
                  <Detail label="Resolved / closed time" value={complaint.resolved_at ? formatDateTime(complaint.resolved_at) : "Not resolved yet"} />
                  <Detail label="Location" value={complaint.location || "Not provided"} />
                  <Detail label="Anonymous complaint" value={complaint.is_anonymous ? "Yes" : "No"} />
                </Section>

                <Section title="Evidence attachments" icon={Paperclip}>
                  <Detail
                    label="Attachment count"
                    value={`${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`}
                  />

                  {attachments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                      No evidence attached by the student.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {attachments.map((file: any) => (
                        <AttachmentCard key={file.id} file={file} />
                      ))}
                    </div>
                  )}
                </Section>

                <Section title="AI triage details" icon={Brain}>
                  <Detail label="AI category" value={complaint.ai_category || "Uncategorized"} />
                  <Detail label="AI priority" value={complaint.ai_priority || complaint.urgency || "Not set"} />
                  <Detail label="AI sentiment" value={complaint.ai_sentiment || "Not set"} />
                  <Detail label="AI confidence" value={complaint.ai_confidence ? `${Math.round(complaint.ai_confidence)}%` : "Not set"} />
                  <Detail label="AI suggested department" value={deptName(complaint.ai_department_id)} />
                  <Detail label="AI reasoning" value={complaint.ai_reasoning || "No AI reasoning available"} multiline />

                  <div className="grid gap-2 border-t border-border pt-3 sm:grid-cols-[180px,1fr]">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      AI tags
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {complaint.ai_tags?.length > 0 ? (
                        complaint.ai_tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No tags generated</span>
                      )}
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-5">
                <Section title="Student information" icon={User}>
                  {complaint.is_anonymous ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
                      Student identity is hidden because this complaint was submitted anonymously.
                    </div>
                  ) : (
                    <>
                      <Detail label="Student name" value={profile?.full_name || profile?.username || "Not added"} />
                      <Detail label="Email" value={profile?.email || "Not available"} />
                      <Detail label="Roll number" value={profile?.roll_number || "Not added"} />
                      <Detail label="Phone" value={profile?.phone || "Not added"} />
                      <Detail label="Course" value={profile?.course || "Not added"} />
                      <Detail label="Semester" value={profile?.semester || "Not added"} />
                      <Detail label="Age" value={profile?.age ? String(profile.age) : "Not added"} />
                      <Detail label="Address" value={profile?.address || "Not added"} multiline />
                    </>
                  )}
                </Section>

                <Section title="Department and escalation" icon={Building2}>
                  <Detail label="Current department" value={deptName(complaint.assigned_department_id)} />
                  <Detail label="AI department" value={deptName(complaint.ai_department_id)} />
                  <Detail label="Escalation level" value={String(complaint.escalation_level ?? 0)} />
                </Section>

                <Section title="Admin actions" icon={GitBranch}>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIONS.map((a) => {
                      const Icon = a.icon;

                      return (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => onQuickAction(a.key)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {a.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Change status
                      </label>

                      <select
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      >
                        {STATUSES.filter((s) => s !== "all").map((s) => (
                          <option key={s} value={s}>
                            {formatText(s)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Refer / transfer department
                      </label>

                      <select
                        value={actionDept}
                        onChange={(e) => setActionDept(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Unassigned</option>
                        {departments.map((d: any) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Admin remark / reason
                      </label>

                      <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        rows={4}
                        placeholder="Example: Transferred to IT department because the issue is related to lab network outage."
                        className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={updating}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Save admin action
                    </button>
                  </div>
                </Section>

                <Link
                  to="/complaints/$id"
                  params={{ id: complaint.id }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Eye className="h-4 w-4" />
                  See all cases
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
            {formatText(s)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="grid gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0 sm:grid-cols-[180px,1fr]">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>

      <div
        className={`text-sm font-medium text-foreground ${
          multiline ? "whitespace-pre-wrap leading-relaxed" : "break-words"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function AttachmentCard({ file }: { file: any }) {
  const [opening, setOpening] = useState(false);
  const Icon = getFileIcon(file.file_type);

  async function openFile() {
    setOpening(true);

    try {
      const bucket = file.bucket || "complaint-evidence";

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(file.file_path, 60 * 5);

      if (error) throw error;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to open file");
    } finally {
      setOpening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openFile}
      className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 text-left transition hover:border-primary hover:bg-primary/5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {file.file_name}
        </span>
        <span className="block text-xs text-muted-foreground">
          {formatFileSize(file.file_size)} • {file.file_type || "File"}
        </span>
      </span>

      {opening ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

function getFileIcon(type: string) {
  if (type?.startsWith("image/")) return Image;
  if (type?.startsWith("video/")) return Video;
  if (type?.includes("spreadsheet") || type?.includes("excel") || type?.includes("csv")) {
    return FileSpreadsheet;
  }
  if (type?.includes("pdf")) return FileText;
  return Paperclip;
}

function formatFileSize(size: number) {
  if (!size) return "Unknown size";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatText(value: string) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ");
}
