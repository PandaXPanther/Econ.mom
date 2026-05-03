import { useState } from "react";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { TOOLS } from "@/lib/tools";
import { ExternalLink } from "lucide-react";

export default function Methodology() {
  const [active, setActive] = useState(TOOLS[0].slug);
  const tool = TOOLS.find((t) => t.slug === active)!;

  return (
    <PageShell>
      <SEO
        title="Methodology & Citations — every formula, every primary source | The Mother Of Econ"
        description="Full methodology and primary sources behind each of The Mother Of Econ's nine tools — College Board rubrics, USITC elasticities, FRED series, Taylor rule variants, NBER papers, and Colorado state data."
        path="/methodology"
      />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="label-cap mb-4">§ Methodology & Citations</div>
          <h1 className="text-editorial text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem]">
            No black boxes.
          </h1>
          <p className="prose-serif mt-6 max-w-2xl text-foreground/85">
            Every tool on econ.mom is documented here. Formulas, datasets,
            primary-source citations — the full working paper behind each
            instrument. If you can't reproduce the results, the tool isn't
            finished.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Tab rail */}
          <aside className="lg:col-span-3">
            <div className="label-cap mb-4">The Nine</div>
            <nav className="flex flex-col" aria-label="Methodology tool tabs">
              {TOOLS.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => setActive(t.slug)}
                  data-testid={`tab-methodology-${t.slug}`}
                  className={`group flex items-baseline gap-3 border-l-2 py-3 pl-4 text-left transition-all ${
                    active === t.slug
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <span className="font-mono text-[0.7rem] text-muted-foreground/70">
                    {t.number}
                  </span>
                  <span className="font-display text-[1.05rem] font-medium">
                    {t.name}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Active tab content */}
          <article className="lg:col-span-9" key={tool.slug}>
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="font-mono text-[0.75rem] uppercase tracking-widest text-muted-foreground">
                Instrument Nº {tool.number} · {tool.category}
              </span>
            </div>
            <h2 className="text-editorial mt-4 text-[2.25rem] lg:text-[3rem]">
              {tool.name}
            </h2>
            <p className="prose-serif mt-4 max-w-3xl text-[1.1rem] text-foreground/85">
              {tool.blurb}
            </p>

            <div className="rule-double mt-12" />

            <div className="mt-12 grid gap-12 md:grid-cols-12">
              <div className="md:col-span-8">
                <div className="label-cap mb-4">Methodology</div>
                <ol className="space-y-5 list-none">
                  {tool.methodology.map((m, i) => (
                    <li key={i} className="flex gap-5 border-b border-border/60 pb-5 last:border-0">
                      <span className="font-mono text-[0.75rem] pt-1 text-muted-foreground shrink-0 w-6">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="prose-serif text-[0.98rem] text-foreground/85">
                        {m}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="md:col-span-4">
                <div className="label-cap mb-4">Primary Sources</div>
                <ul className="space-y-4">
                  {tool.citations.map((c, i) => (
                    <li key={i}>
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-start gap-2 text-[0.88rem] text-foreground/80 hover:text-primary"
                        >
                          <span className="editorial-link">{c.label}</span>
                          <ExternalLink size={12} className="mt-1 shrink-0 opacity-40 group-hover:opacity-100" />
                        </a>
                      ) : (
                        <span className="text-[0.88rem] text-foreground/80">
                          {c.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="rule mt-10" />
                <div className="mt-6 rounded-md bg-muted/40 p-4">
                  <div className="label-cap mb-2">Tool status</div>
                  <div className="font-mono text-sm capitalize text-foreground">
                    {tool.status}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
