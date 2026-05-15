import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "student" | "admin" | "super_admin" | "department_staff";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  roles: Role[];
  isStaff: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDepartmentStaff: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRoles(uid: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);

    if (error) {
      console.error("Failed to load roles:", error.message);
      setRoles([]);
      return;
    }

    setRoles((data ?? []).map((r) => r.role as Role));
  }

  async function refreshRoles() {
    const uid = session?.user?.id;
    if (!uid) return;

    await loadRoles(uid);
  }

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Failed to get session:", error.message);
        }

        if (!mounted) return;

        const currentSession = data.session ?? null;
        setSession(currentSession);

        if (currentSession?.user?.id) {
          await loadRoles(currentSession.user.id);
        } else {
          setRoles([]);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        if (mounted) {
          setSession(null);
          setRoles([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      setTimeout(async () => {
        if (!mounted) return;

        try {
          setLoading(true);

          if (nextSession?.user?.id) {
            await loadRoles(nextSession.user.id);
          } else {
            setRoles([]);
          }
        } catch (err) {
          console.error("Auth state role loading failed:", err);
          if (mounted) setRoles([]);
        } finally {
          if (mounted) setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = roles.includes("admin") || isSuperAdmin;
  const isDepartmentStaff = roles.includes("department_staff");
  const isStaff = isAdmin || isDepartmentStaff;

  async function signOut() {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out failed:", error.message);
        return;
      }

      setSession(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        isStaff,
        isAdmin,
        isSuperAdmin,
        isDepartmentStaff,
        loading,
        signOut,
        refreshRoles,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);

  if (!c) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return c;
}
