import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isStaff, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isStaff) {
      navigate({ to: "/dashboard" });
    }
  }, [isStaff, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div>
          <h1 className="text-xl font-semibold">Staff access required</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You need admin, super admin, or department staff access to view this area.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen"
    >
      <Outlet />
    </motion.div>
  );
}