import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, StatusBadge, PriorityBadge } from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/complaints")({ component: ComplaintsList });

const STATUSES = ["all", "submitted", "under_review", "assigned", "in_progress", "escalated", "resolved", "closed"];

function ComplaintsList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("complaints")
      .select("id, tracking_id, title, status, ai_priority, ai_category, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (q && !`${r.title} ${r.tracking_id}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, q, status]);

  return (
    <div>
      <PageHeader title="My complaints" subtitle={`${rows.length} total`} />
      <div className="space-y-4 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or tracking ID"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-background">{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card">
          {loading ? (
            <div className="space-y-px p-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              No complaints match your filters.
              <Link to="/submit" className="text-primary hover:underline">Submit a new one →</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Tracking</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-sidebar-accent/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      <Link to="/complaints/$id" params={{ id: r.id }} className="hover:text-primary">
                        {r.tracking_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to="/complaints/$id" params={{ id: r.id }} className="font-medium hover:text-primary">
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.ai_category ?? "—"}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.ai_priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
