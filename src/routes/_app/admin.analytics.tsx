import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Clock,
  Flame,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/app/Primitives";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

export const Route = createFileRoute("/_app/admin/analytics")({
  component: AdminAnalytics,
});

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const update = () => {
      setIsDark(root.classList.contains("dark"));
    };

    update();

    const observer = new MutationObserver(update);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

function getChartTheme(isDark: boolean) {
  return {
    primary: isDark ? "#a78bfa" : "#7c3aed",
    success: isDark ? "#4ade80" : "#16a34a",
    warning: isDark ? "#fbbf24" : "#d97706",
    danger: isDark ? "#f87171" : "#dc2626",
    info: isDark ? "#38bdf8" : "#0284c7",
    muted: isDark ? "#cbd5e1" : "#475569",
    grid: isDark ? "rgba(226, 232, 240, 0.16)" : "rgba(15, 23, 42, 0.12)",
    tooltipBg: isDark ? "#020617" : "#ffffff",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
    tooltipMuted: isDark ? "#cbd5e1" : "#64748b",
    tooltipBorder: isDark ? "rgba(226, 232, 240, 0.18)" : "rgba(15, 23, 42, 0.12)",
    pieStroke: isDark ? "#020617" : "#ffffff",
  };
}

function AdminAnalytics() {
  const isDark = useIsDarkMode();
  const chart = getChartTheme(isDark);

  const PRIORITY_COLORS: Record<string, string> = {
    critical: chart.danger,
    high: chart.warning,
    medium: chart.primary,
    low: chart.muted,
  };

  const [rows, setRows] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [{ data: complaintRows }, { data: deptRows }] = await Promise.all([
        supabase
          .from("complaints")
          .select(
            "id, status, ai_priority, ai_sentiment, assigned_department_id, created_at, resolved_at",
          )
          .order("created_at", { ascending: false })
          .limit(800),
        supabase.from("departments").select("id, name"),
      ]);

      setRows(complaintRows ?? []);
      setDepartments(deptRows ?? []);
      setLoading(false);
    }

    load();
  }, []);

  const total = rows.length;

  const unresolved = rows.filter(
    (r) => !["resolved", "closed"].includes(r.status),
  ).length;

  const critical = rows.filter((r) => r.ai_priority === "critical").length;
  const escalated = rows.filter((r) => r.status === "escalated").length;

  const avgResolutionHours = useMemo(() => {
    const resolved = rows.filter((r) => r.created_at && r.resolved_at);

    if (resolved.length === 0) return 0;

    const totalHours = resolved.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const resolvedAt = new Date(r.resolved_at).getTime();

      return sum + Math.max(0, resolvedAt - created) / 36e5;
    }, 0);

    return Math.round(totalHours / resolved.length);
  }, [rows]);

  const trend = useMemo(() => {
    const data = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));

      const key = d.toISOString().slice(0, 10);

      return {
        date: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        key,
        complaints: 0,
        resolved: 0,
        escalated: 0,
      };
    });

    rows.forEach((r) => {
      const createdKey = r.created_at?.slice(0, 10);
      const resolvedKey = r.resolved_at?.slice(0, 10);

      const createdDay = data.find((x) => x.key === createdKey);

      if (createdDay) {
        createdDay.complaints += 1;

        if (r.status === "escalated") {
          createdDay.escalated += 1;
        }
      }

      const resolvedDay = data.find((x) => x.key === resolvedKey);

      if (resolvedDay) {
        resolvedDay.resolved += 1;
      }
    });

    return data;
  }, [rows]);

  const departmentData = useMemo(() => {
    return departments
      .map((d) => {
        const deptRows = rows.filter((r) => r.assigned_department_id === d.id);

        const open = deptRows.filter(
          (r) => !["resolved", "closed"].includes(r.status),
        ).length;

        return {
          name: d.name,
          total: deptRows.length,
          open,
          resolved: deptRows.length - open,
        };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [departments, rows]);

  const priorityData = useMemo(
    () =>
      ["critical", "high", "medium", "low"]
        .map((p) => ({
          name: p,
          value: rows.filter((r) => r.ai_priority === p).length,
        }))
        .filter((x) => x.value > 0),
    [rows],
  );

  const sentimentData = useMemo(
    () =>
      ["urgent", "negative", "concerned", "neutral", "positive"]
        .map((s) => ({
          name: s,
          value: rows.filter((r) => r.ai_sentiment === s).length,
        }))
        .filter((x) => x.value > 0),
    [rows],
  );

  const heatmap = useMemo(() => {
    const statuses = [
      "submitted",
      "under_review",
      "assigned",
      "in_progress",
      "escalated",
      "resolved",
      "closed",
    ];

    return statuses.map((status) => ({
      status,
      count: rows.filter((r) => r.status === status).length,
    }));
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Admin analytics"
        subtitle="Operational trends, SLA risk, workload, and sentiment intelligence"
      />

      <div className="space-y-6 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        >
          <StatCard
            label="Total cases"
            value={total}
            icon={BarChart3}
            tone="primary"
          />

          <StatCard
            label="Unresolved"
            value={unresolved}
            icon={Clock}
            tone="info"
          />

          <StatCard
            label="Critical"
            value={critical}
            icon={Flame}
            tone="danger"
          />

          <StatCard
            label="Escalated"
            value={escalated}
            icon={AlertTriangle}
            tone="warning"
          />

          <StatCard
            label="Avg resolution"
            value={`${avgResolutionHours}h`}
            icon={TrendingUp}
            tone="success"
          />
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard
            title="30 day complaint trend"
            subtitle="Submissions, resolutions, and escalations"
            icon={Activity}
            className="xl:col-span-2"
          >
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chart.grid}
                    vertical={false}
                  />

                  <XAxis
  dataKey="date"
  stroke={chart.muted}
  tick={{ fill: chart.muted, fontSize: 11 }}
  tickLine={false}
  axisLine={false}
/>

<YAxis
  stroke={chart.muted}
  tick={{ fill: chart.muted, fontSize: 11 }}
  tickLine={false}
  axisLine={false}
/>

                  <Tooltip
                    content={
                      <CustomTooltip
                        bg={chart.tooltipBg}
                        border={chart.tooltipBorder}
                        text={chart.tooltipText}
                        muted={chart.tooltipMuted}
                      />
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="complaints"
                    stroke={chart.primary}
                    strokeWidth={2.8}
                    dot={false}
                    name="Complaints"
                  />

                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke={chart.success}
                    strokeWidth={2.8}
                    dot={false}
                    name="Resolved"
                  />

                  <Line
                    type="monotone"
                    dataKey="escalated"
                    stroke={chart.warning}
                    strokeWidth={2.8}
                    dot={false}
                    name="Escalated"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Priority distribution"
            subtitle="Risk mix"
            icon={Flame}
          >
            {loading ? (
              <ChartSkeleton />
            ) : priorityData.length === 0 ? (
              <EmptyState text="No priority data" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    stroke={chart.pieStroke}
                    strokeWidth={3}
                  >
                    {priorityData.map((p) => (
                      <Cell key={p.name} fill={PRIORITY_COLORS[p.name]} />
                    ))}
                  </Pie>

                  <Tooltip
                    content={
                      <CustomTooltip
                        bg={chart.tooltipBg}
                        border={chart.tooltipBorder}
                        text={chart.tooltipText}
                        muted={chart.tooltipMuted}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard
            title="Department performance"
            subtitle="Total, open, and resolved workload"
            icon={Building2}
          >
            {loading ? (
              <ChartSkeleton />
            ) : departmentData.length === 0 ? (
              <EmptyState text="No department data" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={departmentData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chart.grid}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke={chart.muted}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke={chart.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    content={
                      <CustomTooltip
                        bg={chart.tooltipBg}
                        border={chart.tooltipBorder}
                        text={chart.tooltipText}
                        muted={chart.tooltipMuted}
                      />
                    }
                  />

                  <Bar
                    dataKey="total"
                    fill={chart.primary}
                    radius={[8, 8, 0, 0]}
                  />

                  <Bar
                    dataKey="open"
                    fill={chart.warning}
                    radius={[8, 8, 0, 0]}
                  />

                  <Bar
                    dataKey="resolved"
                    fill={chart.success}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Sentiment movement"
            subtitle="Current complaint sentiment spread"
            icon={TrendingUp}
          >
            {loading ? (
              <ChartSkeleton />
            ) : sentimentData.length === 0 ? (
              <EmptyState text="No sentiment data" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={sentimentData}>
                  <defs>
                    <linearGradient
                      id="sentimentGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={chart.info}
                        stopOpacity={isDark ? 0.45 : 0.35}
                      />

                      <stop
                        offset="100%"
                        stopColor={chart.info}
                        stopOpacity={isDark ? 0.04 : 0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chart.grid}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    stroke={chart.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke={chart.muted}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    content={
                      <CustomTooltip
                        bg={chart.tooltipBg}
                        border={chart.tooltipBorder}
                        text={chart.tooltipText}
                        muted={chart.tooltipMuted}
                      />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chart.info}
                    fill="url(#sentimentGradient)"
                    strokeWidth={2.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard
          title="Status heatmap"
          subtitle="Operational load by complaint stage"
          icon={AlertTriangle}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {heatmap.map((item) => {
              const intensity = total ? Math.min(item.count / total, 1) : 0;

              return (
                <motion.div
                  key={item.status}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/40"
                >
                  <div
                    className="mb-3 h-2 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${chart.primary}, ${chart.info})`,
                      opacity: 0.45 + intensity * 0.55,
                    }}
                  />

                  <div className="text-2xl font-semibold text-foreground">
                    {item.count}
                  </div>

                  <div className="mt-1 text-xs capitalize text-muted-foreground">
                    {item.status.replace("_", " ")}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ChartCard>
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
      className={`rounded-3xl border border-border bg-card p-5 shadow-card ${className}`}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
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

      {children}
    </motion.div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
  bg,
  border,
  text,
  muted,
}: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-xl"
      style={{
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <p
        className="mb-2 text-xs font-medium"
        style={{
          color: muted,
        }}
      >
        {label}
      </p>

      <div className="space-y-1.5">
        {payload.map((item: any) => (
          <div
            key={item.dataKey || item.name}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span
              className="capitalize"
              style={{
                color: muted,
              }}
            >
              {item.name}
            </span>

            <span
              className="font-semibold"
              style={{
                color: text,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[300px] animate-pulse rounded-2xl bg-muted/30" />;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-border bg-background text-sm text-muted-foreground">
      {text}
    </div>
  );
}
