import { motion } from "framer-motion";

const stats = [
  { v: "94%", l: "AI classification accuracy" },
  { v: "3.2x", l: "Faster resolution times" },
  { v: "120+", l: "Institutions onboard-ready" },
  { v: "<200ms", l: "Average routing latency" },
];

export function Stats() {
  return (
    <section id="stats" className="relative py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-3xl border border-border bg-gradient-card p-10 shadow-elegant">
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center md:text-left"
              >
                <div className="font-display text-5xl font-semibold tracking-tight text-gradient">
                  {s.v}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
