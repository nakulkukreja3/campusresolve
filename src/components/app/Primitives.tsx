import { motion } from "framer-motion";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-8 py-6"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: any;
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
}) {
  const toneCls: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
  };
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneCls[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const statusTone: Record<string, string> = {
  submitted: "bg-info/15 text-info",
  under_review: "bg-info/15 text-info",
  assigned: "bg-primary/15 text-primary",
  in_progress: "bg-primary/15 text-primary",
  escalated: "bg-warning/15 text-warning",
  resolved: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
};
const priorityTone: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
};
const sentimentTone: Record<string, string> = {
  positive: "bg-success/15 text-success",
  neutral: "bg-muted text-muted-foreground",
  concerned: "bg-info/15 text-info",
  negative: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${statusTone[status] ?? "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: string | null | undefined }) {
  if (!priority) return null;
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${priorityTone[priority] ?? "bg-muted"}`}>
      {priority}
    </span>
  );
}
export function SentimentBadge({ sentiment }: { sentiment: string | null | undefined }) {
  if (!sentiment) return null;
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${sentimentTone[sentiment] ?? "bg-muted"}`}>
      {sentiment}
    </span>
  );
}
