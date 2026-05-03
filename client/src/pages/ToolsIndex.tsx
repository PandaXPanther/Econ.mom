import { Link } from "wouter";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { TOOLS } from "@/lib/tools";
import { ArrowUpRight } from "lucide-react";

export default function ToolsIndex() {
  return (
    <PageShell>
      <SEO
        title="All twelve tools — the complete library | The Mother Of Econ"
        description="Every instrument in the econ.mom library: AP FRQ Grader, TariffLab, Textbook Atlas, Shock Simulator, Shadow Fed, Paper Decoder, Econ News Translator, US Econ Dashboard, EconLever."
        path="/tools"
      />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="label-cap mb-4">§ The Twelve</div>
          <h1 className="text-editorial text-[2.75rem] sm:text-[3.75rem] lg:text-[4.5rem]">
            All instruments.
          </h1>
          <p className="prose-serif mt-6 max-w-2xl text-foreground/85">
            Every tool in the econ.mom library, listed in order of editorial
            publication. Each answers a question with no public-internet answer.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-20">
        <div className="divide-y divide-border border-y border-border">
          {TOOLS.map((tool) => (
            <Link key={tool.slug} href={`/${tool.slug}`}>
              <a
                data-testid={`link-tool-${tool.slug}`}
                className="group grid cursor-pointer grid-cols-12 items-baseline gap-6 py-10 transition-colors hover:bg-muted/30"
              >
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-[0.75rem] uppercase tracking-widest text-muted-foreground">
                    {tool.number}
                  </span>
                </div>
                <div className="col-span-10 md:col-span-6">
                  <h2 className="font-display text-[1.5rem] font-medium sm:text-[1.875rem]">
                    {tool.name}
                  </h2>
                  <p className="prose-serif mt-2 text-[0.95rem] text-muted-foreground">
                    {tool.tagline}
                  </p>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <div className="label-cap">{tool.category}</div>
                </div>
                <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-3">
                  <span className="font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground capitalize">
                    {tool.status}
                  </span>
                  <ArrowUpRight size={18} className="text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="col-span-12 md:col-span-1" />
              </a>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
