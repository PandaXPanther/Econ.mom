import { Link } from "wouter";
import { Tool } from "@/lib/tools";

export function ToolPageHeader({ tool }: { tool: Tool }) {
  return (
    <section className="border-b border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <Link href="/tools">
          <a className="label-cap inline-block mb-6 cursor-pointer text-muted-foreground hover:text-foreground">
            ← All Instruments
          </a>
        </Link>
        <div className="flex flex-wrap items-baseline gap-4 mb-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
            Instrument Nº {tool.number} · {tool.category}
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground capitalize">
            {tool.status}
          </span>
        </div>
        <h1 className="text-editorial text-[2.5rem] sm:text-[3.25rem] lg:text-[3.75rem]">
          {tool.name}
        </h1>
        <p className="prose-serif mt-4 max-w-3xl text-[1.1rem] text-foreground/85">
          {tool.tagline}
        </p>
        <div className="mt-6">
          <Link href={`/methodology#${tool.slug}`}>
            <a
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = "/methodology";
              }}
              className="text-sm text-muted-foreground hover:text-foreground border-b border-muted-foreground/30 hover:border-foreground"
            >
              Read methodology & citations →
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
}
