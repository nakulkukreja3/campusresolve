import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-success" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Live AI classification engine • v1.0
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            <span className="text-gradient">AI-driven grievance</span>
            <br />
            intelligence for institutions
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            CampusResolve automates complaint classification, routing,
            prioritization and escalation — so your university resolves the
            right issues, faster, with sentiment-aware AI.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button className="group inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90">
              Get started free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-5 py-3 text-sm font-medium backdrop-blur transition hover:bg-card">
              <Shield className="h-4 w-4" />
              Admin access
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3 w-3 text-warning" /> Sub-200ms routing</span>
            <span className="hidden sm:inline-flex items-center gap-1.5"><Shield className="h-3 w-3 text-success" /> SOC2 ready</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="absolute -inset-x-20 -top-10 h-72 bg-gradient-primary opacity-20 blur-3xl" />
          <div className="relative">
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
