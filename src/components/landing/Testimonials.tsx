import { motion } from "framer-motion";

const items = [
  {
    quote:
      "Routing accuracy is staggering. We cut average resolution time from 9 days to under 3.",
    name: "Dr. Anika Rao",
    role: "Dean of Student Affairs",
  },
  {
    quote:
      "The sentiment alerts caught a hostel safety issue before it ever reached the press.",
    name: "Vikram Sharma",
    role: "Director, Campus Operations",
  },
  {
    quote:
      "Finally a grievance platform that doesn't feel like a 2008 ERP module.",
    name: "Prof. Meera Iyer",
    role: "Head, IT Services",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Trusted by</span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Built for institutions that care
          </h2>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card"
            >
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary font-display text-xs font-semibold text-primary-foreground">
                  {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
