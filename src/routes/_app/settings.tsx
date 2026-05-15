import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/Primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: Settings });

function Settings() {
  const { user, roles, signOut } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name ?? "");
      setLoading(false);
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />
      <div className="max-w-xl space-y-6 p-8">
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <h3 className="mb-4 font-display text-sm font-semibold">Profile</h3>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
                <div className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground">{user?.email}</div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Roles</label>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <span key={r} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">{r.replace("_", " ")}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card">
          <h3 className="mb-2 font-display text-sm font-semibold">Session</h3>
          <p className="mb-3 text-xs text-muted-foreground">Sign out of CampusResolve on this device.</p>
          <button onClick={signOut} className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
