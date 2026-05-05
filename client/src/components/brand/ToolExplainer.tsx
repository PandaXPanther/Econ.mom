import { useState } from "react";
import { Tool } from "@/lib/tools";
import { ChevronDown } from "lucide-react";

/**
 * ToolExplainer
 *
 * Sits between ToolPageHeader and the interactive UI on every tool page.
 * Cold visitors land on these pages from MR, Reddit, X, etc. and need to
 * understand "what does this tool teach me?" before they touch a slider.
 *
 * Sections:
 *  - What this teaches  (concept-level pitch in plain English)
 *  - Who it's for / AP unit  (two-line audience + curriculum mapping)
 *  - Try this  (concrete example prompt)
 *  - How it works  (collapsible, less technical than methodology)
 */
export function ToolExplainer({ tool }: { tool: Tool }) {
  const [howOpen, setHowOpen] = useState(false);

  return (
    <section
      className="border-b border-border bg-background"
      data-testid={`explainer-${tool.slug}`}
    >
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* LEFT: What this teaches */}
          <div className="lg:col-span-7">
            <div className="label-cap mb-4">What this teaches</div>
            <p
              className="prose-serif text-[1.1rem] text-foreground/90"
              data-testid={`explainer-teaches-${tool.slug}`}
            >
              {tool.whatThisTeaches}
            </p>

            {/* Try this */}
            <div className="mt-10 border-l-2 border-primary/60 pl-5">
              <div className="label-cap mb-2 text-primary">Try this</div>
              <p
                className="prose-serif text-foreground/85"
                data-testid={`explainer-try-${tool.slug}`}
              >
                {tool.tryThis}
              </p>
            </div>
          </div>

          {/* RIGHT: Who / AP unit + How it works */}
          <div className="lg:col-span-5">
            <dl className="rounded-lg border border-border bg-card/30 p-6">
              <div className="mb-5">
                <dt className="label-cap mb-1.5">Who it's for</dt>
                <dd
                  className="prose-serif text-[0.95rem] text-foreground/85"
                  data-testid={`explainer-who-${tool.slug}`}
                >
                  {tool.whoItsFor}
                </dd>
              </div>
              <div className="mb-5">
                <dt className="label-cap mb-1.5">AP CED mapping</dt>
                <dd
                  className="prose-serif text-[0.95rem] text-foreground/85"
                  data-testid={`explainer-ap-${tool.slug}`}
                >
                  {tool.apUnit}
                </dd>
              </div>
              <div>
                <dt className="label-cap mb-1.5">Status</dt>
                <dd className="prose-serif text-[0.95rem] capitalize text-foreground/85">
                  {tool.status}
                  {tool.flagship ? " · Flagship" : ""}
                </dd>
              </div>
            </dl>

            {/* How it works (collapsible) */}
            <button
              type="button"
              onClick={() => setHowOpen((s) => !s)}
              aria-expanded={howOpen}
              data-testid={`explainer-how-toggle-${tool.slug}`}
              className="mt-6 flex w-full items-center justify-between rounded-lg border border-border bg-card/30 px-6 py-4 text-left transition-colors hover:bg-card/60"
            >
              <span className="label-cap">How it works</span>
              <ChevronDown
                size={18}
                className={`text-muted-foreground transition-transform ${
                  howOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {howOpen && (
              <ol
                className="mt-3 space-y-3 rounded-lg border border-border bg-card/20 px-6 py-5"
                data-testid={`explainer-how-list-${tool.slug}`}
              >
                {tool.howItWorks.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 prose-serif text-[0.95rem] text-foreground/85"
                  >
                    <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground pt-1">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
