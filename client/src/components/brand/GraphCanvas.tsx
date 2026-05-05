// Reusable inline graph drawing canvas. Used inside FRQGrader for any FRQ
// part that requires a labeled diagram. Each instance is fully self-contained:
// keeps its own undo stack, tool, color, line width. Parent reads the PNG via
// the forwarded canvasRef.
//
// Design intent: feel native to the FRQ Grader flow, not a separate page.
// White canvas background so Gemini's vision model gets a clean image.

import { useEffect, useRef, useState, forwardRef } from "react";
import {
  Pencil,
  Eraser,
  Trash2,
  Undo2,
  Type as TypeIcon,
  Palette,
  PencilRuler,
} from "lucide-react";

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
const CANVAS_H = 560;

interface GraphCanvasProps {
  partId: string;
  axesHint?: string;
  drawHint?: string;
  /**
   * Notify parent when the user has actually drawn something (vs. an empty
   * canvas). FRQGrader uses this to decide whether to send the image to the
   * backend at grade time.
   */
  onChange?: (hasDrawing: boolean) => void;
}

export const GraphCanvas = forwardRef<HTMLCanvasElement, GraphCanvasProps>(
  function GraphCanvas({ partId, axesHint, drawHint, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [tool, setTool] = useState<Tool>("pen");
    const [color, setColor] = useState(COLORS[0].value);
    const [width, setWidth] = useState(3);
    const [items, setItems] = useState<CanvasItem[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const drawingRef = useRef(false);

    // Forward the canvas DOM node to the parent via the forwarded ref. This lets
    // FRQGrader call canvas.toDataURL() at grade time without lifting all the
    // drawing state out of this component.
    useEffect(() => {
      if (typeof ref === "function") ref(canvasRef.current);
      else if (ref) (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = canvasRef.current;
    });

    // Notify parent when drawing state changes (item count crosses zero / non-zero).
    useEffect(() => {
      onChange?.(items.length > 0);
    }, [items.length, onChange]);

    // Redraw on every state change. Keeps the model simple: items are the
    // source of truth, the canvas is just a projection of them.
    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);

      // Faint gridlines, helpful for eyeballing axes without dominating the sketch.
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
      setCurrentStroke((s) => (s ? { ...s, points: [...s.points, pos] } : null));
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
      if (!window.confirm("Clear this canvas?")) return;
      setItems([]);
      setCurrentStroke(null);
    }

    return (
      <div className="mt-4 rounded-lg border border-primary/30 bg-primary/[0.03] p-4">
        <div className="label-cap mb-3 flex items-center gap-2 text-primary">
          <PencilRuler size={12} /> Draw your graph
        </div>

        {(axesHint || drawHint) && (
          <div className="mb-3 rounded-md bg-muted/40 p-3 text-[0.82rem] text-foreground/85">
            {drawHint && <div className="prose-serif">{drawHint}</div>}
            {axesHint && (
              <div className="mt-1 font-mono text-[0.7rem] text-muted-foreground">
                {axesHint}
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2">
          <button
            onClick={() => setTool("pen")}
            data-testid={`tool-pen-${partId}`}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
              tool === "pen" ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
            aria-pressed={tool === "pen"}
            type="button"
          >
            <Pencil size={12} /> Pen
          </button>
          <button
            onClick={() => setTool("eraser")}
            data-testid={`tool-eraser-${partId}`}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
              tool === "eraser" ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
            aria-pressed={tool === "eraser"}
            type="button"
          >
            <Eraser size={12} /> Erase
          </button>
          <button
            onClick={() => setTool("text")}
            data-testid={`tool-text-${partId}`}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${
              tool === "text" ? "bg-foreground text-background" : "hover:bg-muted"
            }`}
            aria-pressed={tool === "text"}
            type="button"
          >
            <TypeIcon size={12} /> Label
          </button>

          <div className="mx-1.5 h-5 w-px bg-border" />

          <div className="flex items-center gap-1.5">
            <Palette size={12} className="text-muted-foreground" />
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                title={c.name}
                aria-label={`Color ${c.name}`}
                data-testid={`color-${c.name.toLowerCase()}-${partId}`}
                className={`h-5 w-5 rounded-full border-2 ${
                  color === c.value ? "border-foreground scale-110" : "border-border"
                }`}
                style={{ background: c.value }}
                type="button"
              />
            ))}
          </div>

          <div className="mx-1.5 h-5 w-px bg-border" />

          <label className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            Line
            <input
              type="range"
              min={1}
              max={8}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-16"
              data-testid={`slider-width-${partId}`}
            />
            <span className="font-mono">{width}px</span>
          </label>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={onUndo}
              disabled={items.length === 0}
              data-testid={`button-undo-${partId}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-40"
              type="button"
            >
              <Undo2 size={12} /> Undo
            </button>
            <button
              onClick={onClear}
              disabled={items.length === 0}
              data-testid={`button-clear-${partId}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-40"
              type="button"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="mt-3 overflow-hidden rounded-md border border-border bg-white">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-testid={`graph-canvas-${partId}`}
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

        <p className="mt-2 text-[0.7rem] text-muted-foreground">
          Tip: use the Label tool to drop text labels (AD1, SRAS, P1, Y*). Gemini reads the actual sketch.
        </p>
      </div>
    );
  }
);
