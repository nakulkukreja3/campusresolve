import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Target,
  TrendingUp,
  Search,
  Bell,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/insights")({
  component: AIInsightsPage,
});

const departmentData = [
  { name: "IT", complaints: 35 },
  { name: "Hostel", complaints: 28 },
  { name: "Finance", complaints: 21 },
  { name: "Academic", complaints: 17 },
  { name: "Library", complaints: 12 },
  { name: "Transport", complaints: 9 },
];

const priorityData = [
  { name: "Low", value: 18 },
  { name: "Medium", value: 42 },
  { name: "High", value: 27 },
  { name: "Critical", value: 13 },
];

const sentimentData = [
  { day: "Mon", positive: 22, negative: 18 },
  { day: "Tue", positive: 26, negative: 20 },
  { day: "Wed", positive: 24, negative: 28 },
  { day: "Thu", positive: 30, negative: 24 },
  { day: "Fri", positive: 28, negative: 32 },
  { day: "Sat", positive: 20, negative: 25 },
  { day: "Sun", positive: 18, negative: 22 },
];

const riskAreas = ["Hostel Administration", "Finance Office", "IT Support"];

const insights = [
  {
    title: "IT Support Overload Detected",
    badge: "+34%",
    description:
      "IT Support has received 34% more complaints than last month, suggesting infrastructure issues or understaffing.",
    action: "Schedule an infrastructure audit and increase IT support coverage.",
    tone: "warning",
    icon: AlertTriangle,
  },
  {
    title: "Hostel Safety Escalation Pattern",
    badge: "68% escalation",
    description:
      "Hostel safety complaints show the highest escalation rate across departments.",
    action: "Run a hostel safety audit and improve lighting or CCTV coverage.",
    tone: "danger",
    icon: AlertTriangle,
  },
  {
    title: "Library Resolution Excellence",
    badge: "97% in 2 days",
    description:
      "Library Services resolves most complaints within 2 days, making it the best performing department.",
    action: "Study this workflow and replicate it in slower departments.",
    tone: "success",
    icon: CheckCircle2,
  },
  {
    title: "Monday Peak Complaint Volume",
    badge: "Monday 9AM",
    description:
      "Complaint submissions peak on Monday mornings, likely due to weekend backlog.",
    action: "Assign extra admin staff during Monday morning slots.",
    tone: "info",
    icon: Info,
  },
  {
    title: "Finance Sentiment Declining",
    badge: "72% Negative",
    description:
      "Finance related complaints show a higher negative sentiment trend over the last 30 days.",
    action: "Improve scholarship and fee support workflows.",
    tone: "warning",
    icon: AlertTriangle,
  },
];

const pieColors = [
  "hsl(var(--primary))",
  "hsl(38 92% 50%)",
  "hsl(var(--destructive))",
  "hsl(262 83% 58%)",
];

function AIInsightsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search insights..."
              className="w-full rounded-xl border border-border bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <button className="relative ml-auto rounded-xl border border-border bg-card/80 p-2.5 text-muted-foreground transition hover:text-foreground">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-5 p-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            AI Insights Engine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Intelligent pattern recognition and institutional risk analysis
          </p>
        </motion.div>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={Activity}
            label="Complaints analyzed"
            value="122"
            hint="+18 this week"
          />
          <MetricCard
            icon={Target}
            label="High risk areas"
            value="3"
            hint="Needs attention"
          />
          <MetricCard
            icon={PieChartIcon}
            label="AI confidence"
            value="91%"
            hint="Average routing score"
          />
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.03 }}
          className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 shadow-sm"
        >
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">AI Analysis Summary</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  ● LIVE
                </span>
              </div>

              <p className="mt-2 max-w-5xl text-sm leading-6 text-muted-foreground">
                Recent complaint patterns show unusual IT volume spikes, hostel
                safety escalation risk, and declining finance sentiment. Library
                Services remains the strongest performing department.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.05 }}
          className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4.5 w-4.5 text-destructive" />
            <h2 className="text-base font-semibold">High Risk Areas</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {riskAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-destructive/15 bg-destructive/[0.06] px-3 py-1.5 text-xs font-medium text-destructive"
              >
                ● {area}
              </span>
            ))}
          </div>
        </motion.section>

        <section className="grid gap-3">
          {insights.map((item, index) => (
            <InsightCard key={item.title} item={item} index={index} />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <ChartCard title="Recurring Complaints by Department">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip content={<CleanTooltip />} cursor={{ opacity: 0.08 }} />
                <Bar
                  dataKey="complaints"
                  radius={[8, 8, 0, 0]}
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Priority Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={priorityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={4}
                >
                  {priorityData.map((_, index) => (
                    <Cell key={index} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CleanTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {priorityData.map((item, index) => (
                <div
                  key={item.name}
                  className="rounded-xl border border-border bg-background/50 p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: pieColors[index] }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{item.value}%</div>
                </div>
              ))}
            </div>
          </ChartCard>
        </section>

        <ChartCard title="Weekly Sentiment Movement">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip content={<CleanTooltip />} />
              <Line
                type="monotone"
                dataKey="positive"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="negative"
                stroke="hsl(var(--destructive))"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>

      <div className="mt-4 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

function InsightCard({
  item,
  index,
}: {
  item: any;
  index: number;
}) {
  const Icon = item.icon;

  const styles: Record<string, string> = {
    warning:
      "border-amber-200/50 bg-amber-50/50 text-amber-700 dark:border-amber-500/15 dark:bg-amber-500/5 dark:text-amber-300",
    danger:
      "border-red-200/50 bg-red-50/50 text-red-700 dark:border-red-500/15 dark:bg-red-500/5 dark:text-red-300",
    success:
      "border-emerald-200/50 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/15 dark:bg-emerald-500/5 dark:text-emerald-300",
    info:
      "border-blue-200/50 bg-blue-50/50 text-blue-700 dark:border-blue-500/15 dark:bg-blue-500/5 dark:text-blue-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.06 + index * 0.025 }}
      whileHover={{ y: -2, scale: 1.002 }}
      className={`rounded-2xl border p-4 shadow-sm transition ${styles[item.tone]}`}
    >
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/15 bg-background/50">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {item.title}
            </h3>
            <span className="rounded-full bg-background/70 px-2.5 py-0.5 text-[11px] font-semibold">
              {item.badge}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>

          <div className="mt-3 flex items-start gap-2 text-sm font-medium text-foreground">
            <Zap className="mt-0.5 h-4 w-4 text-primary" />
            <p>{item.action}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4.5 w-4.5 text-primary" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function CleanTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="text-muted-foreground">
          {entry.name}:{" "}
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
