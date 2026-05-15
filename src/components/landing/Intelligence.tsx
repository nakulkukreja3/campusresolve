import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const examples = [
  {
    text: "The projector in Lab 4 has not been working for 3 days.",
    tags: [
      { label: "Infrastructure", tone: "info" },
      { label: "IT Support", tone: "primary" },
      { label: "Medium", tone: "warning" },
      { label: "Neutral", tone: "muted" },
    ],
    confidence: 91,
  },
  {
    text: "I feel unsafe in the hostel corridor due to repeated harassment.",
    tags: [
      { label: "Safety", tone: "destructive" },
      { label: "Hostel Admin", tone: "primary" },
      { label: "Critical", tone: "destructive" },
      { label: "Negative", tone: "warning" },
    ],
    confidence: 97,
  },
  {
    text: "Water leakage in hostel room is causing an electrical issue.",
    tags: [
      { label: "Maintenance", tone: "info" },
      { label: "Hostel Maint.", tone: "primary" },
      { label: "High", tone: "warning" },
      { label: "Concerned", tone: "muted" },
    ],
    confidence: 94,
  },
];

const toneCls: Record<string, string> = {
  info: "bg-info/15 text-info",
  primary: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Intelligence() {
  return (
    <section id="intelligence" className="relative py-28">
      <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">AI Engine</span>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              An intelligence layer that <span className="text-gradient">reads between the lines</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              CampusResolve parses every complaint in real time — extracting category,
              department, urgency and sentiment — so the right people act on the right
              issues, instantly.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Predicts category & department with confidence scores",
                "Detects emotional urgency and safety risk",
                "Suggests escalation before SLA breach",
                "Surfaces recurring patterns and risk clusters",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {examples.map((ex, i) => (
              <motion.div
                key={ex.text}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-border bg-gradient-card p-5 shadow-card"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                    <span className="font-display text-[11px] font-bold text-primary-foreground">AI</span>
                  </div>
                  <p className="text-sm leading-relaxed">{ex.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pl-11">
                  {ex.tags.map((t) => (
                    <span
                      key={t.label}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${toneCls[t.tone]}`}
                    >
                      {t.label}
                    </span>
                  ))}
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    {ex.confidence}% conf.
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
