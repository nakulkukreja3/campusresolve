import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-card p-12 text-center shadow-elegant">
          <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
          <div className="absolute -inset-x-20 top-0 h-40 bg-gradient-primary opacity-20 blur-3xl" />

          <div className="relative">
            <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Ready to <span className="text-gradient">resolve smarter</span>?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Deploy CampusResolve across your institution in days, not quarters.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
              >
                Start free trial
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              <a
                href="https://wa.me/918076921256?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-border bg-card/40 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-card"
              >
                Talk to sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
