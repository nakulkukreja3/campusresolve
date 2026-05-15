import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/Primitives";

export const Route = createFileRoute("/_app/notifications")({ component: Notifications });

function Notifications() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", user.id).eq("read", false);
    load();
  }

  const unread = rows.filter((r) => !r.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-sidebar-accent disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />
      <div className="p-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card shadow-card">
          {loading ? (
            <div className="space-y-px p-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/40" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
              <Bell className="h-8 w-8 opacity-50" />
              You have no notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? "bg-primary/5" : ""}`}>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary shadow-glow" : "bg-muted"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-sm">{n.title}</div>
                      <span className="text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    {n.message && <div className="mt-0.5 text-sm text-muted-foreground">{n.message}</div>}
                    {n.complaint_id && (
                      <Link to="/complaints/$id" params={{ id: n.complaint_id }} className="mt-1 inline-block text-xs text-primary hover:underline">
                        View complaint →
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
