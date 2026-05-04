// Reusable progress indicator for long-running Gemini calls.
// Shows: animated spinner, what we're doing, elapsed time, ETA, and an
// optional "details" line that updates over the course of the call.
//
// Why this exists: the critique flagged that several tools (ShockSim, TariffLab,
// PaperDecoder, InflationDecomposer) call Gemini for 10-30 seconds with no
// feedback, leaving users uncertain whether to wait or retry.

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

interface GeminiProgressProps {
  /** True while the Gemini call is in flight. */
  active: boolean;
  /** Human-readable name of the operation, e.g. "Calibrating elasticities". */
  label: string;
  /** Optional sub-line that updates during the call. */
  detail?: string;
  /** Expected duration in seconds; ETA bar uses this. Default 12s. */
  etaSeconds?: number;
  /** Optional list of stage messages cycled while the call is in flight. */
  stages?: string[];
  /** Optional cancel handler; if provided, shows a Cancel link. */
  onCancel?: () => void;
}

export function GeminiProgress({
  active,
  label,
  detail,
  etaSeconds = 12,
  stages,
  onCancel,
}: GeminiProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      setStageIdx(0);
      return;
    }
    const t0 = Date.now();
    const id = setInterval(() => {
      const sec = (Date.now() - t0) / 1000;
      setElapsed(sec);
      if (stages?.length) {
        // Advance every ~3 seconds, stop on the last stage.
        const idx = Math.min(Math.floor(sec / 3), stages.length - 1);
        setStageIdx(idx);
      }
    }, 200);
    return () => clearInterval(id);
  }, [active, stages]);

  if (!active) return null;

  // Progress bar fills smoothly to 90% over etaSeconds, then asymptotes.
  const pct = Math.min(90, (elapsed / etaSeconds) * 90);
  // After 1.5x the expected duration, switch to a "still working" tone.
  const overTime = elapsed > etaSeconds * 1.5;
  const currentDetail = stages?.length ? stages[stageIdx] : detail;

  return (
    <div className="rounded-md border border-border bg-card/60 p-3 text-xs">
      <div className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        <span className="font-medium">{label}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground tabular-nums">
          {elapsed.toFixed(1)}s
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-[width] duration-200 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      {currentDetail && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>{currentDetail}</span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {overTime
            ? "Still working. Gemini is taking longer than usual."
            : `Typical: ~${etaSeconds}s`}
        </span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
