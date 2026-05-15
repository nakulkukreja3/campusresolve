import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass flex items-center justify-between rounded-2xl px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold tracking-tight">
              CampusResolve
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
            <a href="#workflow" className="text-sm text-muted-foreground transition hover:text-foreground">Workflow</a>
            <a href="#intelligence" className="text-sm text-muted-foreground transition hover:text-foreground">Intelligence</a>
            <a href="#stats" className="text-sm text-muted-foreground transition hover:text-foreground">Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/auth"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground md:block"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-lg bg-gradient-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
