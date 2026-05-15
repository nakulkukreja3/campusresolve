import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, StatCard, StatusBadge, PriorityBadge } from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/dashboard")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("complaints")
      .select("id, tracking_id, title, status, ai_priority, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const total = rows.length;
  const resolved = rows.filter((r) => r.status === "resolved" || r.status === "closed").length;
  const pending = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
  const escalated = rows.filter((r) => r.status === "escalated").length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your complaints at a glance"
        actions={
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            New complaint <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={total} icon={Inbox} tone="primary" />
          <StatCard label="Pending" value={pending} icon={Clock} tone="info" />
          <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="success" />
          <StatCard label="Escalated" value={escalated} icon={AlertTriangle} tone="warning" />
        </div>

        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent complaints</h2>
            <Link to="/complaints" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No complaints yet.{" "}
              <Link to="/submit" className="text-primary hover:underline">Submit your first one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{r.tracking_id}</span>
                  <span className="flex-1 truncate text-sm">{r.title}</span>
                  <PriorityBadge priority={r.ai_priority} />
                  <StatusBadge status={r.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
