import { useMemo, useRef, useState } from "react";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NATURAL_EXPERIMENTS, ID_METHOD_INFO, type IdMethod, type NaturalExperiment } from "@/lib/natexp/database";
import { Download } from "lucide-react";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { exportBriefAsPdf } from "@/lib/brief/exportBrief";

const SLUG = "natural-experiments";
const ALL_METHODS: IdMethod[] = ["DiD", "RDD", "IV", "RCT", "Synthetic", "EventStudy", "Bunching", "Shift-Share", "Lottery"];
const ALL_FIELDS = ["Labor", "Macro", "Health", "Education", "Trade", "Finance", "Public", "Crime", "Development"] as const;

export default function NaturalExperiments() {
  const tool = TOOL_BY_SLUG[SLUG];
  const [query, setQuery] = useState("");
  const [methods, setMethods] = useState<Set<IdMethod>>(new Set());
  const [fields, setFields] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<NaturalExperiment | null>(NATURAL_EXPERIMENTS[0]);
  const briefRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NATURAL_EXPERIMENTS.filter((e) => {
      if (methods.size && !methods.has(e.method)) return false;
      if (fields.size && !e.field.some((f) => fields.has(f))) return false;
      if (q) {
        const hay = (e.title + " " + e.authors + " " + e.question + " " + e.keywords.join(" ") + " " + e.finding).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, methods, fields]);

  function toggleMethod(m: IdMethod) {
    setMethods((s) => {
      const n = new Set(s);
      if (n.has(m)) n.delete(m); else n.add(m);
      return n;
    });
  }
  function toggleField(f: string) {
    setFields((s) => {
      const n = new Set(s);
      if (n.has(f)) n.delete(f); else n.add(f);
      return n;
    });
  }

  async function onExport() {
    if (!briefRef.current || !selected) return;
    await exportBriefAsPdf(briefRef.current, {
      title: `econ.mom · ${selected.title}`,
      subject: "Natural Experiment Brief",
      filename: `${selected.id}-Brief.pdf`,
    });
  }

  const info = selected ? ID_METHOD_INFO[selected.method] : null;

  return (
    <div>
      <ToolPageHeader tool={tool} />

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-24">
        <div className="rounded-2xl border border-border bg-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1">Library</div>
            <div className="text-base">{NATURAL_EXPERIMENTS.length} curated identification strategies · {filtered.length} match filters</div>
          </div>
          <Button onClick={onExport} disabled={!selected} data-testid="button-export-brief">
            <Download className="h-4 w-4 mr-2" /> Export Strategy Brief (PDF)
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: filters + list */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Search</div>
                <Input
                  placeholder="e.g. minimum wage, IV, China shock"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Method</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => toggleMethod(m)}
                      className={`text-[11px] rounded-full px-2.5 py-1 border ${methods.has(m) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}
                      data-testid={`filter-method-${m}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Field</div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_FIELDS.map((f) => (
                    <button
                      key={f}
                      onClick={() => toggleField(f)}
                      className={`text-[11px] rounded-full px-2.5 py-1 border ${fields.has(f) ? "bg-accent text-accent-foreground border-accent" : "border-border hover:border-accent/60"}`}
                      data-testid={`filter-field-${f}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filtered.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={`w-full text-left rounded-lg border p-3 transition ${selected?.id === e.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  data-testid={`exp-${e.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium leading-snug">{e.title}</div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">{e.method}</Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {e.authors} · {e.year} · {e.journal}
                  </div>
                </button>
              ))}
              {filtered.length === 0 ? <div className="text-sm text-muted-foreground p-4">No matches. Clear filters or broaden your search.</div> : null}
            </div>
          </div>

          {/* Right: detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card className="p-6">
                <div className="flex flex-wrap items-baseline gap-3 mb-2">
                  <Badge>{selected.method}</Badge>
                  {selected.field.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
                  <span className="text-[11px] text-muted-foreground ml-auto">{selected.authors} · {selected.year} · {selected.journal}</span>
                </div>
                <h2 className="text-2xl font-semibold mb-4 leading-tight">{selected.title}</h2>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Question</div>
                    <div className="text-sm">{selected.question}</div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Treatment</div>
                    <div className="text-sm">{selected.treatment}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Headline finding</div>
                    <div className="text-sm">{selected.finding}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Why this identifies a causal effect</div>
                    <div className="text-sm">{selected.identification}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">Diagnostics & threats</div>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {selected.diagnostics.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                  {info ? (
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">{info.name}</div>
                      <div className="text-sm mb-2">{info.gist}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Identifying assumptions: {info.assumptions.join(" · ")}
                      </div>
                    </div>
                  ) : null}
                  {selected.doi ? (
                    <a className="text-sm text-primary underline" href={`https://doi.org/${selected.doi}`} target="_blank" rel="noreferrer">
                      DOI: {selected.doi}
                    </a>
                  ) : null}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </section>

      {selected ? (
        <BriefDocument
          ref={briefRef}
          toolName="Natural Experiment Finder"
          toolNumber={tool?.number ?? "XI"}
          headline={selected.title}
          subhead={`${selected.authors} (${selected.year}) · ${selected.journal} · ${ID_METHOD_INFO[selected.method].name}`}
          regimeBadge={selected.method}
          sections={[
            { heading: "Research question", body: selected.question },
            { heading: "Treatment / shock", body: selected.treatment },
            { heading: "Headline finding", body: selected.finding },
            { heading: "Identification logic", body: selected.identification },
            { heading: "Diagnostics", paragraphs: selected.diagnostics },
            { heading: "Method assumptions", paragraphs: ID_METHOD_INFO[selected.method].assumptions },
          ]}
          footerNote={selected.doi ? `DOI: ${selected.doi}` : "econ.mom Natural Experiment Library"}
        />
      ) : null}
    </div>
  );
}
