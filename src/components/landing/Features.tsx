import { motion } from "framer-motion";
import {
  Brain, Compass, Heart, EyeOff, Activity,
  GitBranch, BarChart3, Building2,
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI categorization", desc: "Classify every complaint into the right category in milliseconds." },
  { icon: Compass, title: "Smart routing", desc: "Route to the correct department & staff automatically." },
  { icon: Heart, title: "Sentiment analysis", desc: "Detect distress and urgency from natural language." },
  { icon: EyeOff, title: "Anonymous reporting", desc: "Confidential safe channels for sensitive issues." },
  { icon: Activity, title: "Real-time tracking", desc: "Live status, owner, ETA and audit trail." },
  { icon: GitBranch, title: "Escalation workflow", desc: "Multi-level escalation when SLAs are breached." },
  { icon: BarChart3, title: "Analytics", desc: "Trends, heatmaps, and resolution efficiency." },
  { icon: Building2, title: "Department insights", desc: "Performance benchmarks across every unit." },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Capabilities</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Everything your institution needs
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete grievance operating system — purpose-built for higher education.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="group relative rounded-2xl border border-border bg-gradient-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-gradient-primary group-hover:text-primary-foreground group-hover:shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
