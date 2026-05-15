export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-6 md:grid-cols-3">
          <div className="text-left">
            <span className="font-display text-base font-semibold">
              CampusResolve
            </span>
          </div>

          <div className="flex flex-wrap justify-start gap-5 text-xs text-muted-foreground md:justify-center">
            <a href="#" className="transition hover:text-foreground">
              Product
            </a>
            <a href="#" className="transition hover:text-foreground">
              Pricing
            </a>
            <a href="#" className="transition hover:text-foreground">
              Security
            </a>
            <a href="#" className="transition hover:text-foreground">
              Docs
            </a>
            <a href="#" className="transition hover:text-foreground">
              Privacy
            </a>
          </div>

          <div className="text-left text-xs text-muted-foreground md:text-right">
            © {new Date().getFullYear()} CampusResolve. Built for institutions.
          </div>
        </div>
      </div>
    </footer>
  );
}
