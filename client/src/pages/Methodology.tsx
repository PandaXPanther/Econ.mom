import { useState } from "react";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { TOOLS } from "@/lib/tools";
import { DEEP_METHODOLOGY, type DeepMethodology } from "@/lib/methodology-deep";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ExternalLink, Calendar, FileCode2, BookOpen, Database } from "lucide-react";

function isLatex(tex: string): boolean {
  // KaTeX understands \, ^, _, {} as latex; Σ/π/π* unicode shorthand will not parse.
  // Render as KaTeX only when there is at least one explicit backslash command.
  return /\\[a-zA-Z]/.test(tex);
}

function MethCallout({ deep }: { deep: DeepMethodology }) {
  return (
    <div className="grid gap-4 mt-10 sm:grid-cols-3">
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 label-cap mb-2">
          <Calendar size={12} aria-hidden /> Last updated
        </div>
        <div className="font-mono text-sm text-foreground">{deep.lastUpdated}</div>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 label-cap mb-2">
          <Database size={12} aria-hidden /> Data sources
        </div>
        <div className="font-mono text-sm text-foreground">
          {deep.dataSources.length} primary
        </div>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 label-cap mb-2">
          <BookOpen size={12} aria-hidden /> Citations
        </div>
        <div className="font-mono text-sm text-foreground">
          {deep.citations.length} peer, reviewed
        </div>
      </div>
    </div>
  );
}

export default function Methodology() {
  const [active, setActive] = useState(TOOLS[0].slug);
  const tool = TOOLS.find((t) => t.slug === active)!;
  const deep: DeepMethodology | undefined = DEEP_METHODOLOGY[active];

  return (
    <PageShell>
      <SEO
        title="Methodology & Citations, every formula, every primary source | The Mother Of Econ"
        description="Full methodology and primary sources behind each of The Mother Of Econ's twelve tools. College Board rubrics, USITC elasticities, FRED series, Taylor rule variants, NBER papers, and Colorado state data."
        path="/methodology"
      />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <div className="label-cap mb-4">§ Methodology & Citations</div>
          <h1 className="text-editorial text-[2.5rem] sm:text-[3.5rem] lg:text-[4rem]">
            No black boxes.
          </h1>
          <p className="prose-serif mt-6 max-w-2xl text-foreground/85">
            Every tool on econ.mom is documented here. Formulas, datasets, parameters,
            limitations, and primary, source citations. The full working paper behind
            each instrument. If you can't reproduce the results, the tool isn't finished.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Tab rail */}
          <aside className="lg:col-span-3">
            <div className="label-cap mb-4">The Twelve</div>
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
                Tool {tool.number} · {tool.category}
              </span>
            </div>
            <h2 className="text-editorial mt-4 text-[2.25rem] lg:text-[3rem]">
              {tool.name}
            </h2>
            <p className="prose-serif mt-4 max-w-3xl text-[1.1rem] text-foreground/85">
              {tool.blurb}
            </p>

            {deep ? (
              <>
                <MethCallout deep={deep} />

                {/* Overview */}
                <div className="rule-double mt-12" />
                <div className="mt-10">
                  <div className="label-cap mb-3">§ Overview</div>
                  <p className="prose-serif text-[1.05rem] leading-[1.75] text-foreground/85 max-w-3xl">
                    {deep.overview}
                  </p>
                </div>

                {/* Intellectual lineage */}
                <div className="mt-10 border-l-2 border-primary/40 pl-6">
                  <div className="label-cap mb-3">§ Intellectual lineage</div>
                  <p className="prose-serif italic text-foreground/80 max-w-3xl">
                    {deep.intellectualLineage}
                  </p>
                </div>

                {/* Sections (formulas + parameters + assumptions) */}
                <div className="rule mt-12" />
                <div className="mt-10 space-y-12">
                  <div className="label-cap">§ Model specification</div>
                  {deep.sections.map((s, i) => (
                    <div key={i} className="border-b border-border/50 pb-10 last:border-0">
                      <div className="flex items-baseline gap-4 mb-3">
                        <span className="font-mono text-[0.75rem] text-muted-foreground/70">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-editorial text-[1.5rem]">{s.title}</h3>
                      </div>
                      <p className="prose-serif text-[0.98rem] text-foreground/85 max-w-3xl mb-4">
                        {s.body}
                      </p>

                      {s.equations && s.equations.length > 0 && (
                        <div className="my-6 rounded-md bg-muted/30 border border-border p-5 space-y-4 overflow-x-auto">
                          {s.equations.map((eq, j) => (
                            <div key={j}>
                              <div className="text-foreground" data-testid={`equation-${tool.slug}-${i}-${j}`}>
                                {isLatex(eq.tex) ? (
                                  <BlockMath math={eq.tex} />
                                ) : (
                                  <pre className="font-mono text-[0.95rem] whitespace-pre-wrap leading-relaxed">
                                    {eq.tex}
                                  </pre>
                                )}
                              </div>
                              {eq.caption && (
                                <p className="mt-1 text-[0.85rem] italic text-muted-foreground">
                                  {eq.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {s.assumptions && s.assumptions.length > 0 && (
                        <div className="mt-5">
                          <div className="label-cap mb-2">Assumptions</div>
                          <ul className="space-y-2 text-[0.92rem] text-foreground/80">
                            {s.assumptions.map((a, j) => (
                              <li key={j} className="flex gap-3">
                                <span className="mt-2 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                                <span>{a}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {s.parameters && s.parameters.length > 0 && (
                        <div className="mt-5 overflow-x-auto">
                          <div className="label-cap mb-2">Parameters</div>
                          <table className="w-full border-collapse text-[0.88rem]">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="py-2 pr-4 text-left font-mono uppercase tracking-wide text-[0.7rem] text-muted-foreground">
                                  Parameter
                                </th>
                                <th className="py-2 pr-4 text-left font-mono uppercase tracking-wide text-[0.7rem] text-muted-foreground">
                                  Value
                                </th>
                                <th className="py-2 text-left font-mono uppercase tracking-wide text-[0.7rem] text-muted-foreground">
                                  Source
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.parameters.map((p, j) => (
                                <tr key={j} className="border-b border-border/40">
                                  <td className="py-2 pr-4 font-display text-foreground">
                                    {p.name}
                                  </td>
                                  <td className="py-2 pr-4 font-mono text-foreground">
                                    {p.value}
                                  </td>
                                  <td className="py-2 text-foreground/75">{p.source}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Validation */}
                <div className="mt-12 rounded-md border border-emerald-700/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-6">
                  <div className="label-cap mb-3 text-emerald-900/80 dark:text-emerald-200/80">
                    § Validation
                  </div>
                  <p className="prose-serif text-[0.98rem] text-foreground/85">
                    {deep.validation}
                  </p>
                </div>

                {/* Limitations */}
                <div className="mt-8 rounded-md border border-amber-700/30 bg-amber-50/30 dark:bg-amber-950/20 p-6">
                  <div className="label-cap mb-3 text-amber-900/80 dark:text-amber-200/80">
                    § Limitations, honest caveats
                  </div>
                  <ul className="space-y-2 text-[0.95rem] text-foreground/85">
                    {deep.limitations.map((l, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-mono text-[0.75rem] text-muted-foreground/70 mt-1 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Data sources */}
                <div className="rule mt-12" />
                <div className="mt-10">
                  <div className="label-cap mb-4">§ Primary data sources</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {deep.dataSources.map((d, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-border p-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-display text-[1rem] font-medium text-foreground">
                            {d.url ? (
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-primary inline-flex items-center gap-1"
                              >
                                {d.name}
                                <ExternalLink size={11} className="opacity-50" />
                              </a>
                            ) : (
                              d.name
                            )}
                          </div>
                        </div>
                        <div className="mt-1 text-[0.85rem] text-muted-foreground">
                          {d.publisher}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.72rem] uppercase tracking-wide text-muted-foreground/80">
                          <span>vintage: {d.vintage}</span>
                          {d.frequency && <span>freq: {d.frequency}</span>}
                        </div>
                        {d.series && d.series.length > 0 && (
                          <div className="mt-2 font-mono text-[0.75rem] text-foreground/70">
                            series: {d.series.join(", ")}
                          </div>
                        )}
                        {d.notes && (
                          <p className="mt-2 text-[0.82rem] italic text-foreground/70">
                            {d.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citations */}
                <div className="rule mt-12" />
                <div className="mt-10">
                  <div className="label-cap mb-4">
                    § Citations ({deep.citations.length})
                  </div>
                  <ol className="space-y-5">
                    {deep.citations.map((c, i) => (
                      <li
                        key={i}
                        className="flex gap-4 border-b border-border/40 pb-5 last:border-0"
                      >
                        <span className="font-mono text-[0.72rem] text-muted-foreground/70 mt-1 shrink-0 w-7">
                          [{String(i + 1).padStart(2, "0")}]
                        </span>
                        <div className="flex-1">
                          <div className="prose-serif text-[0.95rem] text-foreground/90">
                            <span className="font-medium">{c.authors}</span>
                            <span className="text-muted-foreground"> ({c.year}). </span>
                            {c.url ? (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer"
                                className="italic editorial-link hover:text-primary"
                              >
                                {c.title}
                              </a>
                            ) : (
                              <span className="italic">{c.title}</span>
                            )}
                            {c.venue && (
                              <span className="text-foreground/75">. {c.venue}</span>
                            )}
                            {c.doi && (
                              <span className="font-mono text-[0.78rem] text-muted-foreground">
                                {" "}
                                doi:{c.doi}
                              </span>
                            )}
                            .
                          </div>
                          <div className="mt-1 text-[0.82rem] italic text-muted-foreground">
                            Role: {c.role}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Reproducibility */}
                <div className="mt-12 rounded-md border-2 border-primary/40 bg-primary/5 p-6">
                  <div className="flex items-center gap-2 label-cap mb-3 text-primary">
                    <FileCode2 size={14} aria-hidden /> § Reproducibility commitment
                  </div>
                  <p className="prose-serif text-[0.98rem] text-foreground/90">
                    {deep.reproducibility}
                  </p>
                </div>

                {/* Status footer */}
                <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
                  <div className="text-[0.82rem] text-muted-foreground">
                    Tool status:{" "}
                    <span className="font-mono capitalize text-foreground">
                      {tool.status}
                    </span>
                  </div>
                  <div className="text-[0.82rem] text-muted-foreground">
                    Documentation revised {deep.lastUpdated}
                  </div>
                </div>
              </>
            ) : (
              // Fallback to legacy short methodology if deep version is missing
              <>
                <div className="rule-double mt-12" />
                <div className="mt-12 grid gap-12 md:grid-cols-12">
                  <div className="md:col-span-8">
                    <div className="label-cap mb-4">Methodology</div>
                    <ol className="space-y-5 list-none">
                      {tool.methodology.map((m, i) => (
                        <li
                          key={i}
                          className="flex gap-5 border-b border-border/60 pb-5 last:border-0"
                        >
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
                              <ExternalLink
                                size={12}
                                className="mt-1 shrink-0 opacity-40 group-hover:opacity-100"
                              />
                            </a>
                          ) : (
                            <span className="text-[0.88rem] text-foreground/80">
                              {c.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </article>
        </div>
      </section>
    </PageShell>
  );
}
