import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Loader2,
  Trash2,
  Search,
  Users,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/Primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/departments")({
  component: Departments,
});

type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at?: string;
};

type ComplaintRow = {
  assigned_department_id: string | null;
  status: string;
  ai_priority: string | null;
};

type DepartmentStats = {
  total: number;
  open: number;
  resolved: number;
  escalated: number;
  critical: number;
};

function Departments() {
  const [rows, setRows] = useState<Department[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);

    const [{ data: deptData, error: deptError }, { data: complaintData }] =
      await Promise.all([
        supabase.from("departments").select("*").order("name"),
        supabase
          .from("complaints")
          .select("assigned_department_id, status, ai_priority"),
      ]);

    if (deptError) {
      toast.error(deptError.message);
    }

    setRows(deptData ?? []);
    setComplaints(complaintData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const statsByDepartment = useMemo(() => {
    const map: Record<string, DepartmentStats> = {};

    rows.forEach((dept) => {
      map[dept.id] = {
        total: 0,
        open: 0,
        resolved: 0,
        escalated: 0,
        critical: 0,
      };
    });

    complaints.forEach((complaint) => {
      const id = complaint.assigned_department_id;
      if (!id || !map[id]) return;

      map[id].total += 1;

      if (["resolved", "closed"].includes(complaint.status)) {
        map[id].resolved += 1;
      } else {
        map[id].open += 1;
      }

      if (complaint.status === "escalated") {
        map[id].escalated += 1;
      }

      if (complaint.ai_priority === "critical") {
        map[id].critical += 1;
      }
    });

    return map;
  }, [rows, complaints]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((dept) =>
      `${dept.name} ${dept.code} ${dept.description ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  const totalDepartments = rows.length;
  const totalComplaints = complaints.length;
  const activeDepartments = rows.filter(
    (dept) => (statsByDepartment[dept.id]?.total ?? 0) > 0,
  ).length;
  const totalEscalated = complaints.filter(
    (complaint) => complaint.status === "escalated",
  ).length;

  async function create(e: React.FormEvent) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanDesc = desc.trim();

    if (!cleanName || !cleanCode) {
      toast.error("Name and code are required");
      return;
    }

    if (cleanCode.length < 2) {
      toast.error("Department code should be at least 2 characters");
      return;
    }

    setCreating(true);

    const { error } = await supabase.from("departments").insert({
      name: cleanName,
      code: cleanCode,
      description: cleanDesc || null,
    });

    setCreating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setName("");
    setCode("");
    setDesc("");

    toast.success("Department created");
    load();
  }

  async function remove(dept: Department) {
    const stats = statsByDepartment[dept.id];

    if ((stats?.total ?? 0) > 0) {
      toast.error("This department has linked complaints. Reassign or resolve them before deleting.");
      return;
    }

    if (!confirm(`Delete ${dept.name}?`)) return;

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", dept.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Department deleted");
    load();
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage routing destinations used by AI triage and staff workflows"
      />

      <div className="space-y-6 p-6 md:p-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            icon={Building2}
            label="Departments"
            value={totalDepartments}
            hint="Configured routing units"
            tone="primary"
          />

          <MetricCard
            icon={Inbox}
            label="Total cases"
            value={totalComplaints}
            hint="All assigned complaints"
            tone="info"
          />

          <MetricCard
            icon={Activity}
            label="Active departments"
            value={activeDepartments}
            hint="Departments with workload"
            tone="success"
          />

          <MetricCard
            icon={AlertTriangle}
            label="Escalated"
            value={totalEscalated}
            hint="Needs admin attention"
            tone="warning"
          />
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.04 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Department directory
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review workload, escalation pressure, and routing health.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search department..."
                  className="w-full rounded-2xl border border-border bg-card px-4 py-2.5 pl-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-52 animate-pulse rounded-3xl border border-border bg-muted/30"
                  />
                ))}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card text-center">
                <Building2 className="mb-3 h-9 w-9 text-muted-foreground" />
                <p className="text-sm font-medium">No departments found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try another search or add a new department.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredRows.map((dept, index) => (
                  <DepartmentCard
                    key={dept.id}
                    dept={dept}
                    stats={statsByDepartment[dept.id]}
                    index={index}
                    onDelete={() => remove(dept)}
                  />
                ))}
              </div>
            )}
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.08 }}
            className="space-y-4"
          >
            <form
  onSubmit={create}
  className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card"
>
  <div className="border-b border-border bg-gradient-to-br from-primary/12 via-primary/5 to-transparent p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
        <Building2 className="h-5 w-5" />
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight">
          Create department
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Add a new institutional unit for AI routing and complaint assignment.
        </p>
      </div>
    </div>
  </div>

  <div className="space-y-4 p-5">
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Department name
      </span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Library Services"
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>

    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Department code
      </span>
      <div className="flex overflow-hidden rounded-2xl border border-border bg-background transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <span className="flex items-center border-r border-border bg-muted/50 px-3 font-mono text-xs text-muted-foreground">
          CODE
        </span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="LIB"
          maxLength={12}
          className="w-full bg-transparent px-4 py-3 font-mono text-sm outline-none"
        />
      </div>
    </label>

    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Description
      </span>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={4}
        placeholder="Example: Handles library cards, book issues, reading room access, and study space concerns."
        className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>

    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Suggested format
      </div>

      <div className="grid gap-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-2">
          <span>Name</span>
          <span className="font-medium text-foreground">IT Support</span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-2">
          <span>Code</span>
          <span className="font-mono font-medium text-foreground">IT</span>
        </div>
      </div>
    </div>

    <button
      type="submit"
      disabled={creating}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {creating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 transition group-hover:rotate-90" />
      )}
      {creating ? "Creating department..." : "Create department"}
    </button>
  </div>
</form>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">
                    Admin note
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Recommended setup
                  </p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Use short codes like IT, LIB, HOSTEL, FIN.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Keep department names clear for AI routing.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  Avoid deleting departments that already have complaints.
                </li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

function DepartmentCard({
  dept,
  stats,
  index,
  onDelete,
}: {
  dept: Department;
  stats?: DepartmentStats;
  index: number;
  onDelete: () => void;
}) {
  const total = stats?.total ?? 0;
  const open = stats?.open ?? 0;
  const resolved = stats?.resolved ?? 0;
  const escalated = stats?.escalated ?? 0;
  const critical = stats?.critical ?? 0;

  const resolvedRate = total ? Math.round((resolved / total) * 100) : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.035 }}
      whileHover={{ y: -3 }}
      className="group rounded-3xl border border-border bg-card p-5 shadow-card transition hover:border-primary/30"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-base font-semibold">
                {dept.name}
              </h3>
              <span className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {dept.code}
              </span>
            </div>

            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {dept.description || "No description added yet."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl p-2 text-muted-foreground opacity-70 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          title="Delete department"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Resolution rate</span>
          <span className="font-semibold text-foreground">{resolvedRate}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resolvedRate}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MiniStat icon={Inbox} label="Total" value={total} />
        <MiniStat icon={Clock} label="Open" value={open} />
        <MiniStat icon={CheckCircle2} label="Resolved" value={resolved} />
        <MiniStat
          icon={AlertTriangle}
          label={escalated > 0 ? "Escalated" : "Critical"}
          value={escalated > 0 ? escalated : critical}
          danger={escalated > 0 || critical > 0}
        />
      </div>
    </motion.article>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  hint: string;
  tone: "primary" | "info" | "success" | "warning";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-3xl font-semibold tracking-tight">{value}</span>
      </div>

      <div className="mt-4 text-sm font-medium">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${danger ? "text-destructive" : "text-primary"}`} />
        {label}
      </div>

      <div className={`text-lg font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
