import { motion } from "framer-motion";
import { FileText, Brain, Compass, GitBranch, CheckCircle2 } from "lucide-react";

const steps = [
  { icon: FileText, title: "Submit", desc: "Student files complaint with optional evidence." },
  { icon: Brain, title: "Analyze", desc: "AI extracts category, sentiment & urgency." },
  { icon: Compass, title: "Route", desc: "Auto-assigned to the right department & owner." },
  { icon: GitBranch, title: "Escalate", desc: "Auto-escalation if SLA at risk." },
  { icon: CheckCircle2, title: "Resolve", desc: "Closed with audit trail & feedback loop." },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">How it works</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            From submission to resolution
          </h2>
        </div>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          <div className="grid gap-6 md:grid-cols-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card">
                  <s.icon className="h-5 w-5 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary font-mono text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
