import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const {
    session,
    loading: authLoading,
    isAdmin,
    isSuperAdmin,
    isDepartmentStaff,
    refreshRoles,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  function getRedirectPath() {
    if (isAdmin || isSuperAdmin) return "/admin";
    if (isDepartmentStaff) return "/department";
    return "/dashboard";
  }

  useEffect(() => {
    if (!authLoading && session) {
      navigate({ to: getRedirectPath() });
    }
  }, [session, authLoading, isAdmin, isSuperAdmin, isDepartmentStaff, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });

        if (error) throw error;

        toast.success("Account created. Welcome to CampusResolve.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        await refreshRoles();

        const { data: roleRows, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

        if (roleError) throw roleError;

        const roles = (roleRows ?? []).map((r) => r.role);

        toast.success("Signed in");

        if (roles.includes("super_admin") || roles.includes("admin")) {
          navigate({ to: "/admin" });
          return;
        }

        if (roles.includes("department_staff")) {
          navigate({ to: "/department" });
          return;
        }

        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="mb-8 flex items-center justify-between">
            <Link
              to="/"
              className="font-display text-xl font-semibold tracking-tight"
            >
              CampusResolve
            </Link>

            <ThemeToggle />
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-elegant backdrop-blur-xl">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to your CampusResolve workspace"
                : "Join your institution's grievance system"}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              {mode === "signup" && (
                <Field
                  icon={UserIcon}
                  placeholder="Full name"
                  value={name}
                  onChange={setName}
                  required
                />
              )}

              <Field
                icon={Mail}
                type="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={setEmail}
                required
              />

              <Field
                icon={Lock}
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
                required
                minLength={6}
              />

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to CampusResolve's terms & privacy policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  value,
  onChange,
  ...rest
}: {
  icon: any;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background/60 px-9 py-2.5 text-sm outline-none ring-primary/30 transition focus:ring-2"
      />
    </div>
  );
}
