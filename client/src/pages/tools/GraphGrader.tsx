import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { GeminiProgress } from "@/components/GeminiProgress";
import { apiRequest } from "@/lib/queryClient";
import { GRAPH_PROMPTS, type GraphPrompt } from "@/lib/graph-prompts";
import {
  Pencil,
  Eraser,
  Trash2,
  Undo2,
  Type as TypeIcon,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowRight,
  Sparkles,
  PencilRuler,
  Palette,
  AlertTriangle,
} from "lucide-react";

interface GradeResult {
  totalEarned: number;
  totalPossible: number;
  overallFeedback: string;
  fiveOutOfFiveDescription: string;
  points: {
    pointId: string;
    prompt: string;
    earned: number;
    possible: number;
    verdict: "full" | "partial" | "none";
    feedback: string;
  }[];
}

type Tool = "pen" | "eraser" | "text";

interface Stroke {
  type: "stroke";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface TextItem {
  type: "text";
  x: number;
  y: number;
  text: string;
  color: string;
}

type CanvasItem = Stroke | TextItem;

const COLORS = [
  { name: "Ink", value: "#0f172a" },
  { name: "Blue", value: "#2563eb" },
  { name: "Red", value: "#dc2626" },
  { name: "Green", value: "#059669" },
  { name: "Amber", value: "#d97706" },
  { name: "Purple", value: "#7c3aed" },
];

const CANVAS_W = 900;
const CANVAS_H = 620;

export default function GraphGrader() {
  const [selectedId, setSelectedId] = useState<string>(GRAPH_PROMPTS[0].id);
  const prompt = useMemo<GraphPrompt>(
    () => GRAPH_PROMPTS.find((p) => p.id === selectedId)!,
    [selectedId]
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [width, setWidth] = useState(3);
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const drawingRef = useRef(false);
  const [studentNotes, setStudentNotes] = useState("");

  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIdeal, setShowIdeal] = useState(false);

  // Redraw canvas whenever items or active stroke change.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // background white (so Gemini sees a clean image)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);

    // subtle axis gridlines (faint) so the student has a frame
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let x = 0; x <= c.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, c.height);
      ctx.stroke();
    }
    for (let y = 0; y <= c.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }

    // draw everything
    const all = currentStroke ? [...items, currentStroke] : items;
    for (const it of all) {
      if (it.type === "stroke") {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = it.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        it.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else {
        ctx.fillStyle = it.color;
        ctx.font = "600 18px 'Inter', sans-serif";
        ctx.fillText(it.text, it.x, it.y);
      }
    }
  }, [items, currentStroke]);

  function canvasPos(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onPointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = canvasPos(e);
    if (tool === "text") {
      const label = window.prompt("Label text (e.g. AD1, SRAS, P1, Y*):");
      if (label && label.trim()) {
        setItems((arr) => [
          ...arr,
          { type: "text", x: pos.x, y: pos.y, text: label.trim(), color },
        ]);
      }
      return;
    }
    drawingRef.current = true;
    setCurrentStroke({
      type: "stroke",
      points: [pos],
      color: tool === "eraser" ? "#ffffff" : color,
      width: tool === "eraser" ? 18 : width,
    });
  }

  function onPointerMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const pos = canvasPos(e);
    setCurrentStroke((s) =>
      s ? { ...s, points: [...s.points, pos] } : null
    );
  }

  function onPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentStroke && currentStroke.points.length > 0) {
      setItems((arr) => [...arr, currentStroke]);
    }
    setCurrentStroke(null);
  }

  function onUndo() {
    setItems((arr) => arr.slice(0, -1));
  }

  function onClear() {
    if (items.length === 0) return;
    if (!window.confirm("Clear the whole canvas?")) return;
    setItems([]);
    setCurrentStroke(null);
    setResult(null);
  }

  // Reset canvas and results when the prompt changes
  useEffect(() => {
    setItems([]);
    setCurrentStroke(null);
    setResult(null);
    setError(null);
    setStudentNotes("");
    setShowIdeal(false);
  }, [selectedId]);

  async function onGrade() {
    if (items.length < 3) {
      setError("Draw your diagram first. You need at least a few strokes before grading.");
      return;
    }
    const c = canvasRef.current;
    if (!c) return;
    const dataUrl = c.toDataURL("image/png");
    setGrading(true);
    setError(null);
    setResult(null);
    setShowIdeal(false);
    try {
      const resp = await apiRequest("POST", "/api/grade-graph", {
        prompt: {
          scenario: prompt.scenario,
          drawTask: prompt.drawTask,
          axes: prompt.axes,
        },
        rubric: prompt.rubric,
        imageBase64: dataUrl,
        mimeType: "image/png",
        studentNotes: studentNotes.trim(),
      });
      const data: GradeResult = await resp.json();
      if ((data as any)?.error) throw new Error((data as any).error);
      if (typeof data.totalEarned !== "number" || !Array.isArray(data.points)) {
        throw new Error("Malformed grader response. Try again.");
      }
      setResult(data);
    } catch (e: any) {
      setError(
        e?.message ||
          "Graph grading failed. If this keeps happening, the Gemini key may be unset on the server."
      );
    } finally {
      setGrading(false);
    }
  }

  const totalPossible = prompt.rubric.reduce((s, r) => s + r.points, 0);

  return (
    <PageShell>
      <SEO
        title="AP Graph Grader, draw your AP Macro or Micro diagram and get Gemini to score it | The Mother Of Econ"
        description="Draw a hand-made AP Macro or Micro graph in the browser. Gemini's multimodal vision model scores your diagram against the College Board rubric: axis labels, curve names, shifts, equilibrium markers. Instant feedback."
        path="/graph-grader"
      />

      {/* Header */}
      <section className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
          <Link href="/frq-grader">
            <a className="label-cap inline-block mb-6 cursor-pointer text-muted-foreground hover:text-foreground">
              ← Back to FRQ Grader
            </a>
          </Link>
          <div className="flex flex-wrap items-baseline gap-4 mb-2">
            <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              Utility · Education
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-primary">
              new
            </span>
          </div>
          <h1 className="text-editorial text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem]">
            Graph Grader
          </h1>
          <p className="prose-serif mt-4 max-w-3xl text-[1.1rem] text-foreground/85">
            Draw any AP Macro or Micro diagram by hand, right in the browser. Gemini's
            vision model reads the sketch, checks it against the College Board rubric,
            and tells you exactly which points you earned and which you missed.
          </p>
        </div>
      </section>

      {/* Explainer */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="label-cap mb-3">What this teaches</div>
              <p className="prose-serif text-[1.05rem] text-foreground/90">
                On the AP Macro and Micro exams, roughly a third of every FRQ point comes
                from a correctly labeled graph: axes named, curves named, direction of
                shift shown, equilibrium labeled. Description-only graders can miss what a
                diagram actually shows. This tool closes that gap by letting you draw the
                sketch and having Gemini score the drawing itself.
              </p>
            </div>
            <div className="lg:col-span-5">
              <dl className="rounded-lg border border-border bg-card/30 p-6">
                <div className="mb-4">
                  <dt className="label-cap mb-1.5">Who it's for</dt>
                  <dd className="prose-serif text-[0.95rem] text-foreground/85">
                    AP Macro and AP Micro students drilling graph questions before the May exam.
                  </dd>
                </div>
                <div className="mb-4">
                  <dt className="label-cap mb-1.5">AP CED mapping</dt>
                  <dd className="prose-serif text-[0.95rem] text-foreground/85">
                    Every AP Macro and Micro unit that requires a graph (most of them).
                  </dd>
                </div>
                <div>
                  <dt className="label-cap mb-1.5">Try this</dt>
                  <dd className="prose-serif text-[0.95rem] text-foreground/85">
                    Pick AS-AD: Expansionary Fiscal Policy. Draw AD1, SRAS, LRAS, then shift AD right and label the new equilibrium. See how many rubric points you nail on the first try.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* LEFT: prompt selector */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <div className="label-cap mb-4">Pick a graph prompt</div>
              <div className="space-y-3">
                {GRAPH_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    data-testid={`button-select-graph-${p.id}`}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      selectedId === p.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-foreground/30"
                    }`}
                  >
                    <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                      {p.exam.toUpperCase()} · {p.unit}
                    </div>
                    <div className="mt-1.5 font-display text-[1.02rem] font-medium">
                      {p.title}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-md border border-dashed border-border p-4 text-[0.78rem] text-muted-foreground">
                <div className="label-cap mb-2 text-foreground">Hint</div>
                {prompt.hint}
              </div>
            </div>
          </aside>

          {/* RIGHT: prompt + canvas */}
          <div className="lg:col-span-8">
            {/* Scenario */}
            <div className="rounded-lg border border-border bg-card p-6 lg:p-7">
              <div className="label-cap mb-3 flex items-center gap-2">
                <PencilRuler size={12} /> Scenario
              </div>
              <p className="prose-serif text-[1rem] text-foreground/90">
                {prompt.scenario}
              </p>
              <div className="mt-5 rounded-md bg-muted/40 p-4">
                <div className="label-cap mb-1.5">Draw this</div>
                <p className="prose-serif text-[0.96rem] text-foreground/90">
                  {prompt.drawTask}
                </p>
                <div className="mt-3 font-mono text-[0.72rem] text-muted-foreground">
                  Axes: X = {prompt.axes.x} · Y = {prompt.axes.y}
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
              <button
                onClick={() => setTool("pen")}
                data-testid="tool-pen"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm ${
                  tool === "pen"
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
                aria-pressed={tool === "pen"}
              >
                <Pencil size={14} /> Pen
              </button>
              <button
                onClick={() => setTool("eraser")}
                data-testid="tool-eraser"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm ${
                  tool === "eraser"
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
                aria-pressed={tool === "eraser"}
              >
                <Eraser size={14} /> Eraser
              </button>
              <button
                onClick={() => setTool("text")}
                data-testid="tool-text"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm ${
                  tool === "text"
                    ? "bg-foreground text-background"
                    : "hover:bg-muted"
                }`}
                aria-pressed={tool === "text"}
              >
                <TypeIcon size={14} /> Label
              </button>

              <div className="mx-2 h-6 w-px bg-border" />

              {/* Color palette */}
              <div className="flex items-center gap-1.5" aria-label="Pen color">
                <Palette size={14} className="text-muted-foreground" />
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                    aria-label={`Color ${c.name}`}
                    data-testid={`color-${c.name.toLowerCase()}`}
                    className={`h-6 w-6 rounded-full border-2 ${
                      color === c.value
                        ? "border-foreground scale-110"
                        : "border-border"
                    }`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>

              <div className="mx-2 h-6 w-px bg-border" />

              {/* Stroke width */}
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                Line
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-20"
                  data-testid="slider-width"
                />
                <span className="font-mono text-[0.7rem]">{width}px</span>
              </label>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={onUndo}
                  disabled={items.length === 0}
                  data-testid="button-undo"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
                >
                  <Undo2 size={14} /> Undo
                </button>
                <button
                  onClick={onClear}
                  disabled={items.length === 0}
                  data-testid="button-clear"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                data-testid="graph-canvas"
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
                onTouchStart={onPointerDown}
                onTouchMove={onPointerMove}
                onTouchEnd={onPointerUp}
                className="w-full touch-none"
                style={{
                  display: "block",
                  aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                  cursor: tool === "text" ? "text" : "crosshair",
                }}
              />
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="label-cap mb-2 block">
                Notes for the grader (optional)
              </label>
              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Anything hard to read? E.g. 'top line is LRAS, middle line is SRAS, bottom is AD'"
                className="w-full min-h-[70px] rounded-md border border-border bg-background p-3 font-sans text-[0.9rem] focus:border-primary focus:outline-none"
                data-testid="textarea-notes"
              />
              <p className="mt-1 text-[0.75rem] text-muted-foreground">
                Gemini uses these notes only to resolve ambiguous labels. Rubric scoring
                is based on the drawing.
              </p>
            </div>

            {/* Grade button */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onGrade}
                disabled={grading}
                data-testid="button-grade-graph"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground px-7 py-3.5 font-medium text-background hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {grading ? (
                  <>
                    <Sparkles size={16} className="animate-pulse" />
                    Gemini is grading your graph…
                  </>
                ) : (
                  <>
                    Grade my graph
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
              <span className="text-sm text-muted-foreground">
                Rubric: <span className="font-mono">{totalPossible} pts</span> across{" "}
                <span className="font-mono">{prompt.rubric.length}</span> points.
              </span>
            </div>

            <div className="mt-4">
              <GeminiProgress
                active={grading}
                label="Gemini is reading your diagram"
                etaSeconds={18}
                stages={[
                  "Opening the image",
                  "Finding the curves",
                  "Checking axis labels",
                  "Awarding rubric points",
                ]}
              />
            </div>

            {error && (
              <div
                className="mt-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                data-testid="graph-error"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Rubric preview before grading */}
            {!result && !grading && (
              <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/20 p-5">
                <div className="label-cap mb-3">Rubric Gemini will check</div>
                <ul className="space-y-2">
                  {prompt.rubric.map((r) => (
                    <li
                      key={r.id}
                      className="prose-serif flex gap-3 text-[0.92rem] text-foreground/85"
                    >
                      <span className="font-mono text-[0.7rem] text-muted-foreground pt-1">
                        {r.points} pt
                      </span>
                      <span>{r.prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-12"
                  data-testid="graph-result"
                >
                  <div className="rule-double" />
                  <div className="mt-8 rounded-xl border border-border bg-card p-7">
                    <div className="grid gap-8 md:grid-cols-12">
                      <div className="md:col-span-5">
                        <div className="label-cap mb-3">Score</div>
                        <div className="num-display text-[4.5rem] leading-none text-foreground">
                          {result.totalEarned}
                          <span className="text-muted-foreground text-[2rem]">
                            /{result.totalPossible}
                          </span>
                        </div>
                        <div className="font-mono mt-2 text-[0.82rem] text-muted-foreground">
                          {result.totalPossible > 0
                            ? ((result.totalEarned / result.totalPossible) * 100).toFixed(0)
                            : 0}
                          % rubric-aligned
                        </div>
                      </div>
                      <div className="md:col-span-7">
                        <div className="label-cap mb-3">Overall feedback</div>
                        <p className="prose-serif text-[1rem] text-foreground/90">
                          {result.overallFeedback}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    {result.points.map((pt) => (
                      <div
                        key={pt.pointId}
                        className="rounded-lg border border-border bg-card p-5"
                      >
                        <div className="flex items-start gap-3">
                          <VerdictIcon v={pt.verdict} />
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between gap-4">
                              <div className="font-medium text-foreground">
                                {pt.prompt}
                              </div>
                              <div className="font-mono shrink-0 text-sm text-muted-foreground">
                                {pt.earned}/{pt.possible}
                              </div>
                            </div>
                            <p className="prose-serif mt-2 text-[0.92rem] text-foreground/85">
                              {pt.feedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="label-cap mb-2 text-primary">
                          What a 5/5 graph would look like
                        </div>
                        <h3 className="font-display text-[1.3rem] font-medium">
                          Reveal the perfect answer.
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowIdeal(!showIdeal)}
                        data-testid="button-toggle-ideal-graph"
                        className="rounded-full border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {showIdeal ? "Hide" : "Show me"}
                      </button>
                    </div>
                    {showIdeal && (
                      <p
                        className="prose-serif mt-5 text-[0.98rem] text-foreground/90"
                        data-testid="text-ideal-description"
                      >
                        {result.fiveOutOfFiveDescription}
                      </p>
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
    return (
      <CheckCircle2
        size={22}
        className="shrink-0 text-emerald-700 dark:text-emerald-400"
      />
    );
  if (v === "partial")
    return (
      <MinusCircle
        size={22}
        className="shrink-0 text-amber-700 dark:text-amber-400"
      />
    );
  return <XCircle size={22} className="shrink-0 text-destructive" />;
}
