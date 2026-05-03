import { Link } from "wouter";
import { Logo } from "./Logo";
import { TOOLS } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo size={36} withWordmark />
            <p className="prose-serif mt-6 max-w-xs text-[0.95rem] text-muted-foreground">
              Eight free, citation-rigorous economics tools for the students,
              debaters, and policymakers the textbooks forgot.
            </p>
            <p className="mt-6 font-mono text-[0.7rem] text-muted-foreground">
              econ.mom · Issue Nº 1 · Vol. I · MMXXVI
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="label-cap mb-4">The Eight</div>
            <ul className="space-y-2.5">
              {TOOLS.map((t) => (
                <li key={t.slug}>
                  <Link href={`/${t.slug}`}>
                    <a className="group flex items-baseline gap-3 cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                      <span className="font-mono text-[0.7rem] text-muted-foreground/60">
                        {t.number}
                      </span>
                      <span className="editorial-link">{t.name}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="label-cap mb-4">The Site</div>
            <ul className="space-y-2.5">
              <li>
                <Link href="/methodology">
                  <a className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Methodology
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/founder">
                  <a className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                    The Founder
                  </a>
                </Link>
              </li>
              <li>
                <a
                  href="https://econlever.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  EconLever ↗
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="label-cap mb-4">A note from the desk</div>
            <p className="prose-serif text-[0.95rem] text-muted-foreground">
              Every tool here is free. Every formula is shown. Every dataset is
              cited. Economics is too important to lock behind a Bloomberg
              terminal.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-[0.75rem] text-muted-foreground sm:flex-row sm:items-center">
          <div className="font-mono">
            © MMXXVI The Mother of Econ · econ.mom
          </div>
          <div className="font-mono">
            "Economia, Mater Omnium." — Editorial Note, Issue Nº 1
          </div>
        </div>
      </div>
    </footer>
  );
}
