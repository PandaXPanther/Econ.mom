import { Link } from "wouter";
import { Logo } from "./Logo";
import { TOOLS } from "@/lib/tools";
import { FOUNDED_YEAR, copyrightYears } from "@/lib/site-meta";
import { Linkedin, Instagram, Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo size={36} withWordmark />
            <p className="prose-serif mt-6 max-w-xs text-[0.95rem] text-muted-foreground">
              Twelve free, citation-rigorous economics tools for the students,
              debaters, and policymakers the textbooks forgot.
            </p>
            <p className="mt-6 font-mono text-[0.7rem] text-muted-foreground">
              econ.mom · Founded {FOUNDED_YEAR} · Boulder, CO
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="label-cap mb-4">The Twelve</div>
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
                <Link href="/econlever">
                  <a className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                    EconLever
                  </a>
                </Link>
              </li>
              <li>
                <a
                  href="mailto:motherofeconomics@gmail.com"
                  className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
                  data-testid="link-contact-email"
                >
                  Contact
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
            <p className="mt-4 font-mono text-[0.78rem] text-muted-foreground">
              Press, partnerships, classroom use:{" "}
              <a
                href="mailto:motherofeconomics@gmail.com"
                className="text-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                motherofeconomics@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 text-[0.75rem] text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="font-mono">
              © {copyrightYears()} The Mother of Econ · econ.mom
            </div>
            <span className="hidden sm:inline text-muted-foreground/40">·</span>
            <div className="font-mono">
              Created by{" "}
              <a
                href="https://www.linkedin.com/in/saras-totey-64a777334/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:text-primary hover:underline"
                data-testid="link-creator-linkedin"
              >
                Saras Totey
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/saras-totey-64a777334/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Saras Totey on LinkedIn"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              data-testid="link-social-linkedin"
            >
              <Linkedin size={14} />
            </a>
            <a
              href="https://www.instagram.com/sarastotey_/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Saras Totey on Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              data-testid="link-social-instagram"
            >
              <Instagram size={14} />
            </a>
            <a
              href="https://github.com/PandaXPanther"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Saras Totey on GitHub"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              data-testid="link-social-github"
            >
              <Github size={14} />
            </a>
          </div>
        </div>

        <div className="mt-6 text-center font-mono text-[0.7rem] text-muted-foreground/70">
          Built for AP Economics students, debaters, and policy researchers.
        </div>
      </div>
    </footer>
  );
}
