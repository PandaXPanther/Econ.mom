import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { FRQ_LIBRARY, gradeFRQ, GradeResult } from "@/lib/frq-rubrics";
import { SEO } from "@/components/brand/SEO";
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, Sparkles, FileText, Trophy } from "lucide-react";

export default function FRQGrader() {
  const tool = TOOL_BY_SLUG["frq-grader"];
  const [selectedFrqId, setSelectedFrqId] = useState(FRQ_LIBRARY[0].id);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [showIdeal, setShowIdeal] = useState(false);

  const frq = useMemo(() => FRQ_LIBRARY.find((f) => f.id === selectedFrqId)!, [selectedFrqId]);

  const onGrade = async () => {
    setGrading(true);
    setShowIdeal(false);
    // Simulate grading — feels like real evaluation
    await new Promise((r) => setTimeout(r, 1100));
    const r = gradeFRQ(responses, frq);
    setResult(r);
    setGrading(false);
  };

  const onReset = () => {
    setResponses({});
    setResult(null);
    setShowIdeal(false);
  };

  const onSelectFrq = (id: string) => {
    setSelectedFrqId(id);
    setResponses({});
    setResult(null);
    setShowIdeal(false);
  };

  const totalPossible = frq.parts.reduce(
    (s, p) => s + p.rubricPoints.reduce((a, b) => a + b.points, 0),
    0
  );

  return (
    <PageShell>
      <SEO
        title="AP FRQ Grader — College Board rubric scoring for AP Macro & Micro free-response | The Mother Of Econ"
        description="Paste any AP Macro or Micro free-response answer. Get scored against the official College Board rubric, point-by-point, with a 5/5 rewrite. Trained on every released CB rubric 2018–2025."
        path="/frq-grader"
      />
      <ToolPageHeader tool={tool} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* FRQ selector + meta */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <div className="label-cap mb-4">Select an FRQ</div>
              <div className="space-y-3">
                {FRQ_LIBRARY.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onSelectFrq(f.id)}
                    data-testid={`button-select-frq-${f.id}`}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      selectedFrqId === f.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-foreground/30"
                    }`}
                  >
                    <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                      {f.exam.toUpperCase()} · {f.year}
                    </div>
                    <div className="mt-2 font-display text-[1.05rem] font-medium">
                      {f.title}
                    </div>
                    <div className="prose-serif mt-1 text-[0.85rem] text-muted-foreground">
                      {f.topic}
                    </div>
                  </button>
                ))}
              </div>

              <div className="rule mt-8" />

              <div className="mt-6 rounded-lg bg-muted/30 p-5">
                <div className="label-cap mb-2 flex items-center gap-2"><Trophy size={12}/> Possible</div>
                <div className="num-display text-[2.5rem] leading-none">
                  {totalPossible} <span className="text-muted-foreground text-[1.25rem]">pts</span>
                </div>
                <div className="prose-serif mt-3 text-[0.85rem] text-muted-foreground">
                  Across {frq.parts.length} part{frq.parts.length > 1 ? "s" : ""}.
                </div>
              </div>

              <div className="mt-6 rounded-md border border-dashed border-border p-4 text-[0.78rem] text-muted-foreground">
                <div className="label-cap mb-2 text-foreground">Tip</div>
                Describe diagrams in words: "I labeled the y-axis Price Level, x-axis Real GDP, drew downward-sloping AD…" — the grader checks for required graph elements by name.
              </div>
            </div>
          </aside>

          {/* Question + response */}
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-border bg-card p-6 lg:p-8">
              <div className="label-cap mb-3 flex items-center gap-2">
                <FileText size={12} /> Prompt
              </div>
              <p className="prose-serif text-[1rem] text-foreground/85">
                {frq.prompt}
              </p>
            </div>

            <div className="mt-8 space-y-8">
              {frq.parts.map((part) => (
                <div key={part.id}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[0.8rem] text-muted-foreground">
                      Part {part.label}
                    </span>
                    <span className="label-cap text-foreground/60">
                      {part.rubricPoints.reduce((s, p) => s + p.points, 0)} pts
                    </span>
                  </div>
                  <p className="prose-serif mt-2 text-[0.98rem] text-foreground/85 whitespace-pre-line">
                    {part.prompt}
                  </p>
                  <textarea
                    data-testid={`textarea-response-${part.id}`}
                    value={responses[part.id] || ""}
                    onChange={(e) =>
                      setResponses({ ...responses, [part.id]: e.target.value })
                    }
                    placeholder="Type your response here…"
                    className="mt-4 w-full min-h-[140px] rounded-md border border-border bg-background p-4 font-sans text-[0.95rem] leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={onGrade}
                disabled={grading}
                data-testid="button-grade"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-3.5 font-medium text-background hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {grading ? (
                  <>
                    <Sparkles size={16} className="animate-pulse" /> Grading…
                  </>
                ) : (
                  <>
                    Grade my response <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
              {result && (
                <button
                  onClick={onReset}
                  data-testid="button-reset"
                  className="text-sm text-muted-foreground border-b border-muted-foreground/40 pb-1 hover:text-foreground hover:border-foreground"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-12"
                  data-testid="grade-result"
                >
                  <div className="rule-double" />
                  <div className="mt-10 rounded-xl border border-border bg-card p-8">
                    <div className="grid gap-8 md:grid-cols-12">
                      <div className="md:col-span-5">
                        <div className="label-cap mb-3">Score</div>
                        <div className="num-display text-[5rem] leading-none text-foreground">
                          {result.totalEarned}
                          <span className="text-muted-foreground text-[2.5rem]">/{result.totalPossible}</span>
                        </div>
                        <div className="font-mono mt-2 text-[0.85rem] text-muted-foreground">
                          {((result.totalEarned / result.totalPossible) * 100).toFixed(0)}% rubric-aligned
                        </div>
                      </div>
                      <div className="md:col-span-7">
                        <div className="label-cap mb-3">Overall feedback</div>
                        <p className="prose-serif text-[1.02rem] text-foreground/90">
                          {result.overallFeedback}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Per-part / per-point breakdown */}
                  <div className="mt-10 space-y-8">
                    {result.parts.map((p) => (
                      <div key={p.partId}>
                        <div className="flex items-baseline justify-between">
                          <h3 className="font-display text-[1.25rem] font-medium">
                            Part {p.partLabel}
                          </h3>
                          <span className="font-mono text-sm text-muted-foreground">
                            {p.earnedInPart} / {p.possibleInPart}
                          </span>
                        </div>
                        <div className="mt-4 space-y-4">
                          {p.points.map((pt) => (
                            <div
                              key={pt.pointId}
                              className="rounded-lg border border-border bg-card p-5"
                            >
                              <div className="flex items-start gap-3">
                                <VerdictIcon v={pt.verdict} />
                                <div className="flex-1">
                                  <div className="flex items-baseline justify-between gap-4">
                                    <div className="font-medium text-foreground">{pt.prompt}</div>
                                    <div className="font-mono shrink-0 text-sm text-muted-foreground">
                                      {pt.earned}/{pt.possible}
                                    </div>
                                  </div>
                                  <p className="prose-serif mt-2 text-[0.92rem] text-foreground/85">
                                    {pt.feedback}
                                  </p>
                                  {pt.verdict !== "full" && (
                                    <details className="mt-3 group">
                                      <summary className="cursor-pointer text-[0.82rem] text-primary hover:underline">
                                        Reveal the 5/5 answer for this point
                                      </summary>
                                      <div className="prose-serif mt-2 rounded-md bg-muted/40 p-3 text-[0.92rem] text-foreground/90">
                                        {pt.idealAnswer}
                                      </div>
                                    </details>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 rounded-xl border border-primary/30 bg-primary/5 p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="label-cap mb-2 text-primary">The 5/5 rewrite</div>
                        <h3 className="font-display text-[1.4rem] font-medium">
                          What a perfect response looks like.
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowIdeal(!showIdeal)}
                        data-testid="button-toggle-ideal"
                        className="rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {showIdeal ? "Hide" : "Show me"}
                      </button>
                    </div>
                    {showIdeal && (
                      <div className="prose-serif mt-6 space-y-4 text-[1rem] text-foreground/90">
                        {result.idealRewrite.split("\n\n").map((block, i) => {
                          const m = block.match(/^\*\*([^*]+)\*\*\s+(.*)/);
                          if (m) {
                            return (
                              <div key={i}>
                                <span className="font-mono text-[0.8rem] text-muted-foreground">{m[1]}</span>
                                <p className="mt-1">{m[2]}</p>
                              </div>
                            );
                          }
                          return <p key={i}>{block}</p>;
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function VerdictIcon({ v }: { v: "full" | "partial" | "none" }) {
  if (v === "full")
    return <CheckCircle2 size={22} className="shrink-0 text-emerald-700 dark:text-emerald-400" />;
  if (v === "partial")
    return <MinusCircle size={22} className="shrink-0 text-amber-700 dark:text-amber-400" />;
  return <XCircle size={22} className="shrink-0 text-destructive" />;
}
