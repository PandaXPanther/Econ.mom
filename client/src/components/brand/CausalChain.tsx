import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * CausalChain
 *
 * A tiny visual strip that summarizes the cause-and-effect logic the tool
 * models, before the user touches any sliders. Visual learners read this and
 * immediately know what story the tool is telling. Each node is a labelled
 * pill, connected by an arrow. Color cues direction (up / down / neutral).
 *
 * Drops in between ToolPageHeader and ToolExplainer.
 */
export type ChainNode = {
  label: string;
  // Direction tells the user what the variable does under the typical scenario
  // the tool models (e.g., tariff up, import price up). Drives the visual cue.
  direction?: "up" | "down" | "neutral";
};

export function CausalChain({
  caption,
  nodes,
  testId = "causal-chain",
}: {
  caption?: string;
  nodes: ChainNode[];
  testId?: string;
}) {
  return (
    <section
      className="border-b border-border bg-card/30"
      data-testid={testId}
      aria-label={caption ? `Causal chain: ${caption}` : "Causal chain"}
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="label-cap">The story this tool models</div>
          {caption && (
            <div className="prose-serif text-[0.85rem] text-muted-foreground">
              {caption}
            </div>
          )}
        </div>
        <ol
          className="flex flex-wrap items-center gap-2"
          aria-label="Sequence of effects"
        >
          {nodes.map((n, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2"
            >
              <ChainPill node={n} />
              {i < nodes.length - 1 && (
                <ArrowRight
                  size={16}
                  className="shrink-0 text-muted-foreground/70"
                  aria-hidden
                />
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ChainPill({ node }: { node: ChainNode }) {
  const dir = node.direction ?? "neutral";
  const tone =
    dir === "up"
      ? "border-primary/40 bg-primary/10 text-foreground"
      : dir === "down"
      ? "border-accent/40 bg-accent/10 text-foreground"
      : "border-border bg-card text-foreground";
  const arrowGlyph = dir === "up" ? "↑" : dir === "down" ? "↓" : "";
  const srLabel =
    dir === "up"
      ? "increases"
      : dir === "down"
      ? "decreases"
      : "";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.82rem] font-medium ${tone}`}
    >
      <span>{node.label}</span>
      {arrowGlyph && (
        <span aria-hidden className="font-mono text-[0.85rem] leading-none">
          {arrowGlyph}
        </span>
      )}
      {srLabel && <span className="sr-only">{srLabel}</span>}
    </span>
  );
}
