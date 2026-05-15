import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const trend = [
  { d: "M", v: 32 }, { d: "T", v: 48 }, { d: "W", v: 41 },
  { d: "T", v: 67 }, { d: "F", v: 58 }, { d: "S", v: 72 }, { d: "S", v: 84 },
];
const dept = [
  { name: "Hostel", v: 42 }, { name: "IT", v: 31 },
  { name: "Acad", v: 28 }, { name: "Maint", v: 22 }, { name: "Safety", v: 14 },
];

const stats = [
  { label: "Active cases", value: "248", icon: Clock, tone: "text-info" },
  { label: "Resolved (7d)", value: "1,402", icon: CheckCircle2, tone: "text-success" },
  { label: "AI accuracy", value: "94.2%", icon: TrendingUp, tone: "text-primary" },
  { label: "Escalated", value: "12", icon: AlertTriangle, tone: "text-warning" },
];

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/60 p-3 shadow-elegant backdrop-blur-xl">
      <div className="rounded-xl border border-border bg-background/50 p-4 md:p-6">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">campus-resolve / admin</span>
          </div>
          <span className="hidden font-mono text-[10px] text-muted-foreground md:inline">⌘K</span>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-xl border border-border bg-gradient-card p-3 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className={`h-3.5 w-3.5 ${s.tone}`} />
              </div>
              <div className="mt-2 font-display text-2xl font-semibold">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-3 rounded-xl border border-border bg-gradient-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Complaint volume</div>
                <div className="font-display text-lg font-semibold">+18.4% this week</div>
              </div>
              <div className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                Trending
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.66 0.21 268)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.66 0.21 268)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "oklch(0.72 0.02 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.72 0.02 260)" }} axisLine={false} tickLine={false} />
                  <Area type="monotone" dataKey="v" stroke="oklch(0.66 0.21 268)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-gradient-card p-4 shadow-card">
            <div className="mb-3 text-xs text-muted-foreground">By department</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dept} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.72 0.02 260)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.72 0.02 260)" }} axisLine={false} tickLine={false} />
                  <Bar dataKey="v" fill="oklch(0.72 0.18 220)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI insight row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <span className="font-display text-xs font-bold text-primary-foreground">AI</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">
              "Water leakage in hostel block C causing electrical issue"
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">Priority: High</span>
              <span className="rounded-md bg-info/15 px-1.5 py-0.5 text-[10px] font-medium text-info">Hostel Maintenance</span>
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">94% confidence</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
