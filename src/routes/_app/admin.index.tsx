import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Flame,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  PriorityBadge,
} from "@/components/app/Primitives";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/_app/admin/")({
  component: AdminOverview,
});

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#8b5cf6",
  low: "#06b6d4",
};

const BAR_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
];

const CHART_COLORS = {
  submitted: "#8b5cf6",
  resolved: "#10b981",
  grid: "currentColor",
};

function AdminOverview() {
  const [rows, setRows] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [{ data: complaints }, { data: deptRows }] = await Promise.all([
        supabase
          .from("complaints")
          .select(
            "id, tracking_id, title, status, ai_priority, ai_category, assigned_department_id, created_at, resolved_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("departments").select("id, name"),
      ]);

      setRows(complaints ?? []);
      setDepartments(deptRows ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;

    const open = rows.filter(
      (r) => !["resolved", "closed"].includes(r.status),
    ).length;

    const resolved = rows.filter((r) =>
      ["resolved", "closed"].includes(r.status),
    ).length;

    const escalated = rows.filter((r) => r.status === "escalated").length;

    const critical = rows.filter((r) => r.ai_priority === "critical").length;

    return { total, open, resolved, escalated, critical };
  }, [rows]);

  const days = useMemo(() => {
    const data = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));

      const key = d.toISOString().slice(0, 10);

      return {
        date: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        key,
        submitted: 0,
        resolved: 0,
      };
    });

    rows.forEach((r) => {
      const createdKey = r.created_at?.slice(0, 10);
      const resolvedKey = r.resolved_at?.slice(0, 10);

      const createdDay = data.find((x) => x.key === createdKey);
      if (createdDay) createdDay.submitted += 1;

      const resolvedDay = data.find((x) => x.key === resolvedKey);
      if (resolvedDay) resolvedDay.resolved += 1;
    });

    return data;
  }, [rows]);

  const priorityCounts = useMemo(
    () =>
      ["critical", "high", "medium", "low"]
        .map((p) => ({
          name: p,
          value: rows.filter((r) => r.ai_priority === p).length,
        }))
        .filter((x) => x.value > 0),
    [rows],
  );

  const departmentLoad = useMemo(() => {
    return departments
      .map((d) => ({
        name: d.name,
        complaints: rows.filter((r) => r.assigned_department_id === d.id)
          .length,
      }))
      .filter((d) => d.complaints > 0)
      .sort((a, b) => b.complaints - a.complaints)
      .slice(0, 6);
  }, [departments, rows]);

  const recent = rows.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Admin overview"
        subtitle="Institutional grievance intelligence and workload monitoring"
        actions={
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Manage complaints
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-6 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <StatCard
            label="Total"
            value={stats.total}
            icon={Inbox}
            tone="primary"
            hint="Last 500 complaints"
          />

          <StatCard label="Open" value={stats.open} icon={Clock} tone="info" />

          <StatCard
            label="Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            tone="success"
          />

          <StatCard
            label="Escalated"
            value={stats.escalated}
            icon={AlertTriangle}
            tone="warning"
          />

          <StatCard
            label="Critical"
            value={stats.critical}
            icon={Flame}
            tone="danger"
          />
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard
            title="Complaint movement"
            subtitle="Submitted vs resolved in the last 14 days"
            className="xl:col-span-2"
            icon={Activity}
          >
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={days}>
                  <defs>
                    <linearGradient
                      id="submittedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.submitted}
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="100%"
                        stopColor={CHART_COLORS.submitted}
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="resolvedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.resolved}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={CHART_COLORS.resolved}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="currentColor"
                    strokeOpacity={0.16}
                    strokeDasharray="4 4"
                    vertical={false}
                    className="text-muted-foreground"
                  />

                  <XAxis
                    dataKey="date"
                    tick={<XAxisTick />}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />

                  <YAxis
                    tick={<YAxisTick />}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: CHART_COLORS.submitted,
                      strokeOpacity: 0.2,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="submitted"
                    stroke={CHART_COLORS.submitted}
                    fill="url(#submittedGradient)"
                    strokeWidth={2.8}
                    name="Submitted"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: CHART_COLORS.submitted,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke={CHART_COLORS.resolved}
                    fill="url(#resolvedGradient)"
                    strokeWidth={2.8}
                    name="Resolved"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: CHART_COLORS.resolved,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Priority mix" subtitle="Risk distribution" icon={Flame}>
            {loading ? (
              <ChartSkeleton />
            ) : priorityCounts.length === 0 ? (
              <EmptyState text="No priority data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={priorityCounts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {priorityCounts.map((p) => (
                      <Cell
                        key={p.name}
                        fill={PRIORITY_COLORS[p.name]}
                      />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard
            title="Department workload"
            subtitle="Top departments by assigned complaints"
            className="xl:col-span-1"
            icon={Building2}
          >
            {loading ? (
              <ChartSkeleton />
            ) : departmentLoad.length === 0 ? (
              <EmptyState text="No department workload yet" />
            ) : (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={departmentLoad}>
                  <CartesianGrid
                    stroke="currentColor"
                    strokeOpacity={0.16}
                    strokeDasharray="4 4"
                    vertical={false}
                    className="text-muted-foreground"
                  />

                  <XAxis
                    dataKey="name"
                    tick={<XAxisTick />}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />

                  <YAxis
                    tick={<YAxisTick />}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(139, 92, 246, 0.12)" }}
                  />

                  <Bar
                    dataKey="complaints"
                    name="Complaints"
                    radius={[12, 12, 0, 0]}
                  >
                    {departmentLoad.map((_, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.04 }}
            className="rounded-3xl border border-border bg-card p-5 shadow-card xl:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">
                  Recent complaints
                </h3>
                <p className="text-xs text-muted-foreground">
                  Latest submissions requiring administrative attention
                </p>
              </div>

              <Link
                to="/admin/complaints"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-muted/40"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState text="No complaints found" />
            ) : (
              <div className="divide-y divide-border">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    to="/complaints/$id"
                    params={{ id: r.id }}
                    className="flex flex-wrap items-center gap-3 py-3 transition hover:bg-muted/30"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.tracking_id}
                    </span>

                    <span className="min-w-[180px] flex-1 truncate text-sm font-medium text-foreground">
                      {r.title}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {r.ai_category ?? "Uncategorized"}
                    </span>

                    <PriorityBadge priority={r.ai_priority} />
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`rounded-3xl border border-border bg-card p-5 text-foreground shadow-card ${className}`}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <h3 className="font-display text-base font-semibold text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="text-muted-foreground">{children}</div>
    </motion.div>
  );
}

function XAxisTick(props: any) {
  const { x, y, payload } = props;

  return (
    <text
      x={x}
      y={y}
      dy={14}
      textAnchor="middle"
      fill="currentColor"
      className="fill-muted-foreground text-[11px]"
    >
      {payload.value}
    </text>
  );
}

function YAxisTick(props: any) {
  const { x, y, payload } = props;

  return (
    <text
      x={x}
      y={y}
      dx={-8}
      dy={4}
      textAnchor="end"
      fill="currentColor"
      className="fill-muted-foreground text-[11px]"
    >
      {payload.value}
    </text>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl">
      {label && (
        <div className="mb-1 font-semibold text-foreground">
          {label}
        </div>
      )}

      <div className="space-y-1">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />

            <span className="capitalize text-muted-foreground">
              {item.name}
            </span>

            <span className="font-semibold text-foreground">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[270px] animate-pulse rounded-2xl bg-muted/30" />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
      {text}
    </div>
  );
}
