import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { ToolExplainer } from "@/components/brand/ToolExplainer";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { FRQ_LIBRARY, gradeFRQ, GradeResult, type FRQ } from "@/lib/frq-rubrics";
import { SEO } from "@/components/brand/SEO";
import { CheckCircle2, XCircle, MinusCircle, ArrowRight, Sparkles, FileText, Trophy, Zap, AlertTriangle, Wand2, Loader2 } from "lucide-react";
import { GraphCanvas } from "@/components/brand/GraphCanvas";
import { GeminiProgress } from "@/components/GeminiProgress";
import { apiRequest } from "@/lib/queryClient";

export default function FRQGrader() {
  const tool = TOOL_BY_SLUG["frq-grader"];
  const [generatedFrqs, setGeneratedFrqs] = useState<FRQ[]>([]);
  const allFrqs = useMemo<FRQ[]>(() => [...generatedFrqs, ...FRQ_LIBRARY], [generatedFrqs]);
  const [selectedFrqId, setSelectedFrqId] = useState(FRQ_LIBRARY[0].id);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [showIdeal, setShowIdeal] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [graderUsed, setGraderUsed] = useState<"ai" | "rubric" | null>(null);

  // FRQ generator state
  const [genTopic, setGenTopic] = useState("");
  const [genExam, setGenExam] = useState<"macro" | "micro">("macro");
  const [genStyle, setGenStyle] = useState<"short" | "long">("short");
  const [genDifficulty, setGenDifficulty] = useState<"easy" | "standard" | "hard">("standard");
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const frq = useMemo(() => allFrqs.find((f) => f.id === selectedFrqId)!, [allFrqs, selectedFrqId]);

  // Per-part canvases. We hold one canvas DOM ref per graph part and a flag
  // recording whether the student has actually drawn on it. `partsNeedingGraph`
  // is recomputed from the FRQ each time the selection changes.
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [hasDrawing, setHasDrawing] = useState<Record<string, boolean>>({});
  const partsNeedingGraph = useMemo(() => {
    const needs: Record<string, { axes?: string; drawHint?: string }> = {};
    for (const part of frq.parts) {
      // Built-in FRQs: rubric points carry checkType === "graph".
      const ruleSaysGraph = part.rubricPoints.some((rp: any) => rp.checkType === "graph");
      // AI-generated FRQs: scan the part prompt for the canonical "correctly labeled graph" phrasing.
      const promptSaysGraph = /\b(draw|sketch|using a correctly labeled|correctly labeled (graph|diagram))\b/i.test(part.prompt);
      if (ruleSaysGraph || promptSaysGraph) {
        // Pull a graph-elements hint from the rubric if available.
        const elements = part.rubricPoints
          .flatMap((rp: any) => (rp.graphElements as string[]) || [])
          .filter(Boolean);
        const drawHint = elements.length > 0 ? `Required labels: ${elements.join(", ")}.` : undefined;
        needs[part.id] = { drawHint };
      }
    }
    return needs;
  }, [frq]);

  const setHasDrawingFor = useCallback(
    (partId: string, has: boolean) => {
      setHasDrawing((prev) => (prev[partId] === has ? prev : { ...prev, [partId]: has }));
    },
    []
  );

  async function onGenerate() {
    if (!genTopic.trim()) {
      setGenErr("Enter a topic first.");
      return;
    }
    setGenerating(true);
    setGenErr(null);
    try {
      const resp = await apiRequest("POST", "/api/generate-frq", {
        topic: genTopic.trim(),
        exam: genExam,
        style: genStyle,
        difficulty: genDifficulty,
      });
      const data = await resp.json();
      if (data?.error) throw new Error(data.error);
      // The generated FRQ uses keywords (no checkType) so force AI grading.
      const newFrq: FRQ = data as FRQ;
      setGeneratedFrqs((prev) => [newFrq, ...prev]);
      setSelectedFrqId(newFrq.id);
      setResponses({});
      setResult(null);
      setUseAI(true);
    } catch (e: any) {
      setGenErr(e?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const onGrade = async () => {
    // A part counts as "answered" if it has either text >=5 chars OR a drawing
    // on its canvas. This way a graph-only part isn't flagged blank just because
    // the student didn't type anything.
    const isPartAnswered = (p: any) => {
      const textOk = (responses[p.id] || "").trim().length >= 5;
      const drawOk = !!hasDrawing[p.id];
      return textOk || drawOk;
    };
    const filledParts = frq.parts.filter(isPartAnswered).length;
    if (filledParts === 0) {
      setAiNotice(
        "Please answer at least one part before grading. Type a response or draw the graph."
      );
      return;
    }
    if (filledParts < frq.parts.length) {
      const skipped = frq.parts.length - filledParts;
      setAiNotice(
        `${skipped} of ${frq.parts.length} part${skipped > 1 ? "s are" : " is"} blank. Blank parts will score 0.`
      );
      // Continue grading anyway (notice is informational, not blocking).
    }
    setGrading(true);
    setShowIdeal(false);

    // Snapshot any drawn canvases as PNG data URLs, keyed by part id. Sent
    // to the grader so Gemini's vision model can score the diagrams.
    const partImages: Record<string, string> = {};
    for (const partId of Object.keys(partsNeedingGraph)) {
      if (!hasDrawing[partId]) continue;
      const c = canvasRefs.current[partId];
      if (!c) continue;
      try {
        partImages[partId] = c.toDataURL("image/png");
      } catch {
        // ignore export failures, the part will fall back to text only
      }
    }

    const isGenerated = (frq as any).generated === true;
    if (useAI || isGenerated) {
      try {
        const resp = await apiRequest("POST", "/api/grade-frq", { frq, responses, partImages });
        const data = await resp.json();
        if (data && typeof data.totalEarned === "number" && Array.isArray(data.parts)) {
          setResult(data as GradeResult);
          setGraderUsed("ai");
          setGrading(false);
          return;
        }
        throw new Error("Malformed AI response");
      } catch (e: any) {
        if (isGenerated) {
          setAiNotice(
            "AI grader unavailable for this generated FRQ. Set GEMINI_API_KEY in Netlify to enable scoring."
          );
          setGrading(false);
          return;
        }
        setAiNotice(
          "AI grader unavailable, using built-in rubric matcher instead. (Server may be missing GEMINI_API_KEY.)"
        );
      }
    }

    // Fallback / non-AI path (only for built-in FRQs with checkType rubrics)
    await new Promise((r) => setTimeout(r, 800));
    const r = gradeFRQ(responses, frq);
    setResult(r);
    setGraderUsed("rubric");
    setGrading(false);
  };

  const onReset = () => {
    setResponses({});
    setResult(null);
    setShowIdeal(false);
    setAiNotice(null);
    setGraderUsed(null);
  };

  const onSelectFrq = (id: string) => {
    setSelectedFrqId(id);
    setResponses({});
    setResult(null);
    setShowIdeal(false);
    setHasDrawing({});
    canvasRefs.current = {};
  };

  const totalPossible = frq.parts.reduce(
    (s, p) => s + p.rubricPoints.reduce((a, b) => a + b.points, 0),
    0
  );

  return (
    <PageShell>
      <SEO
        title="AP FRQ Grader, College Board rubric scoring for AP Macro & Micro free-response | The Mother Of Econ"
        description="Paste any AP Macro or Micro free-response answer. Get scored against the official College Board rubric, point-by-point, with a 5/5 rewrite. Trained on every released CB rubric 2018–2025."
        path="/frq-grader"
      />
      <ToolPageHeader tool={tool} />
      <ToolExplainer tool={tool} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* FRQ selector + meta */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              {/* FRQ Generator (Gemini) */}
              <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <button
                  onClick={() => setShowGenerator((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                  data-testid="button-toggle-generator"
                >
                  <span className="label-cap flex items-center gap-2 text-primary">
                    <Wand2 size={12} /> Generate a custom FRQ
                  </span>
                  <span className="text-[10px] text-muted-foreground">{showGenerator ? "hide" : "open"}</span>
                </button>
                {showGenerator && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      placeholder="e.g. monetary policy and exchange rates"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      data-testid="input-frq-topic"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <select value={genExam} onChange={(e) => setGenExam(e.target.value as any)}
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        data-testid="select-frq-exam">
                        <option value="macro">Macro</option>
                        <option value="micro">Micro</option>
                      </select>
                      <select value={genStyle} onChange={(e) => setGenStyle(e.target.value as any)}
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        data-testid="select-frq-style">
                        <option value="short">Short</option>
                        <option value="long">Long</option>
                      </select>
                      <select value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value as any)}
                        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        data-testid="select-frq-difficulty">
                        <option value="easy">Easy</option>
                        <option value="standard">Standard</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <button
                      onClick={onGenerate}
                      disabled={generating || !genTopic.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                      data-testid="button-generate-frq"
                    >
                      {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {generating ? "Writing FRQ\u2026" : "Generate FRQ"}
                    </button>
                    {genErr && <div className="text-[10px] text-destructive">{genErr}</div>}
                    <GeminiProgress
                      active={generating}
                      label="Gemini is writing your FRQ"
                      etaSeconds={15}
                      stages={[
                        "Choosing AP-style parts",
                        "Drafting prompts",
                        "Building rubric",
                        "Final formatting",
                      ]}
                    />
                    <div className="text-[10px] text-muted-foreground">
                      Powered by Gemini. Generated FRQs are AI-graded against an AI-written rubric, so they cannot fall back to the offline matcher.
                    </div>
                  </div>
                )}
              </div>
              <div className="label-cap mb-4">Select an FRQ</div>
              <div className="space-y-3">
                {allFrqs.map((f) => {
                  const isGen = (f as any).generated === true;
                  return (
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
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                          {f.exam.toUpperCase()} · {f.year}
                        </span>
                        {isGen && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-primary">
                            <Wand2 size={9} /> Generated
                          </span>
                        )}
                      </div>
                      <div className="mt-2 font-display text-[1.05rem] font-medium">
                        {f.title}
                      </div>
                      <div className="prose-serif mt-1 text-[0.85rem] text-muted-foreground">
                        {(f as any).topic || ((f as any).topics && ((f as any).topics as string[]).join(" \u00b7 ")) || "Custom FRQ"}
                      </div>
                    </button>
                  );
                })}
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
                Graph parts get a built-in drawing canvas, sketch the diagram and Gemini grades the actual image against the rubric. Text-only parts: type your response below.
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
              {frq.parts.map((part) => {
                const graphInfo = partsNeedingGraph[part.id];
                const isGraphPart = !!graphInfo;
                return (
                  <div key={part.id}>
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[0.8rem] text-muted-foreground">
                        Part {part.label}
                      </span>
                      <span className="label-cap text-foreground/60">
                        {part.rubricPoints.reduce((s, p) => s + p.points, 0)} pts
                      </span>
                      {isGraphPart && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-primary">
                          graph
                        </span>
                      )}
                    </div>
                    <p className="prose-serif mt-2 text-[0.98rem] text-foreground/85 whitespace-pre-line">
                      {part.prompt}
                    </p>

                    {isGraphPart && (
                      <GraphCanvas
                        partId={part.id}
                        drawHint={graphInfo.drawHint}
                        ref={(node) => {
                          canvasRefs.current[part.id] = node;
                        }}
                        onChange={(has) => setHasDrawingFor(part.id, has)}
                      />
                    )}

                    <textarea
                      data-testid={`textarea-response-${part.id}`}
                      value={responses[part.id] || ""}
                      onChange={(e) =>
                        setResponses({ ...responses, [part.id]: e.target.value })
                      }
                      placeholder={
                        isGraphPart
                          ? "Optional: describe anything in your sketch the grader should know about…"
                          : "Type your response here…"
                      }
                      className="mt-4 w-full min-h-[140px] rounded-md border border-border bg-background p-4 font-sans text-[0.95rem] leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                );
              })}
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
                    <Sparkles size={16} className="animate-pulse" />
                    {useAI ? "Grading with Gemini…" : "Grading…"}
                  </>
                ) : (
                  <>
                    Grade my response <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <label
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary"
                data-testid="toggle-ai-grading"
              >
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="accent-primary"
                  aria-label="Use AI grading"
                />
                <Zap size={14} className="text-primary" />
                AI grading (Gemini)
              </label>

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

            <div className="mt-4">
              <GeminiProgress
                active={grading}
                label={useAI ? "Gemini is grading your response" : "Grading your response"}
                etaSeconds={useAI ? 25 : 5}
                stages={useAI ? [
                  "Reading each part",
                  "Checking against rubric",
                  "Awarding points",
                  "Drafting feedback",
                ] : undefined}
              />
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
                  {aiNotice && (
                    <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-700/30 bg-amber-50 p-4 text-[0.9rem] text-amber-900 dark:border-amber-400/30 dark:bg-amber-900/10 dark:text-amber-200" data-testid="text-ai-notice">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>{aiNotice}</span>
                    </div>
                  )}
                  {graderUsed === "ai" && (
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary" data-testid="badge-ai-graded">
                      <Zap size={12} /> Graded by Gemini
                    </div>
                  )}
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
