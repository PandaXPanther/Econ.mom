// Wraps AI-powered UI so it hides when the AI_DISABLED kill-switch is on.
// Use around buttons, panels, or entire tool sections that only work with the
// Gemini/Perplexity backend.

import type { ReactNode } from "react";
import { useAIEnabled } from "@/hooks/use-ai-enabled";
import { Sparkles } from "lucide-react";

type Props = {
  children: ReactNode;
  // If true, render a small explainer where the hidden UI would have been.
  showFallback?: boolean;
  // Optional custom fallback (overrides the default banner).
  fallback?: ReactNode;
  // If true, hide both children AND fallback when disabled (silent hide).
  silent?: boolean;
};

export function AIGate({ children, showFallback = true, fallback, silent }: Props) {
  const enabled = useAIEnabled();
  if (enabled) return <>{children}</>;
  if (silent) return null;
  if (fallback) return <>{fallback}</>;
  if (!showFallback) return null;
  return (
    <div
      className="my-4 flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground"
      data-testid="ai-gate-fallback"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-medium text-foreground">AI features paused</p>
        <p className="mt-1">
          The Gemini-powered explanations for this tool are temporarily off while we
          watch cost usage. Everything parametric still works below.
        </p>
      </div>
    </div>
  );
}

// Renders a small banner ONLY when AI features are disabled. Drop at the top
// of any tool page that leans on AI so users get context before they poke at
// buttons that would otherwise 503.
export function AIDisabledBanner({ tone = "soft" }: { tone?: "soft" | "loud" }) {
  const enabled = useAIEnabled();
  if (enabled) return null;
  const isLoud = tone === "loud";
  return (
    <div
      role="status"
      className={
        isLoud
          ? "mb-6 flex items-start gap-3 rounded-lg border border-primary/50 bg-primary/10 p-4 text-sm text-foreground"
          : "mb-6 flex items-start gap-3 rounded-lg border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground"
      }
      data-testid="ai-disabled-banner"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-medium text-foreground">AI features are paused</p>
        <p className="mt-1">
          The Gemini-powered pieces of this tool are temporarily off while we
          watch API spend. The parametric core still works. Check back soon.
        </p>
      </div>
    </div>
  );
}
