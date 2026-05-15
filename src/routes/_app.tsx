import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app/AppSidebar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <main className="min-h-screen md:pl-64">
        <Outlet />
      </main>
    </div>
  );
}
