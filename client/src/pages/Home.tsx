import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { TOOLS } from "@/lib/tools";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const HOME_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "The Eight — Mother Of Econ tools",
  itemListElement: [
    "AP FRQ Grader", "TariffLab", "Textbook Atlas", "Shock Simulator",
    "Shadow Fed", "Econ Paper Decoder", "Extemp Engine", "Colorado Econ Dashboard",
  ].map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
};

export default function Home() {
  return (
    <PageShell>
      <SEO
        title="The Mother Of Econ — eight free, citation-rigorous economics tools · econ.mom"
        description="Eight free economics tools for AP students, debaters, and policy nerds. AP FRQ grading, live tariff modeling, a Shadow Fed with a public track record, and more — every formula shown, every dataset cited."
        path="/"
        jsonLd={HOME_JSONLD}
      />
      {/* HERO — Editorial cathedral */}
      <section className="relative grain overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24 lg:pb-32">
          {/* Issue masthead */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="flex items-center justify-between border-y border-border py-3 mb-12 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground"
          >
            <div>Issue Nº 1 · Vol. I</div>
            <div className="hidden sm:block">Founded MMXXVI · Bennett, Colorado</div>
            <div>econ.mom</div>
          </motion.div>

          <div className="grid items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <motion.div
                initial="hidden"
                animate="show"
                custom={0}
                variants={fadeUp}
                className="label-cap mb-6 text-foreground/70"
              >
                A library of economic instruments
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="show"
                custom={1}
                variants={fadeUp}
                className="text-editorial text-[3rem] font-light text-foreground sm:text-[4.25rem] lg:text-[5.75rem]"
              >
                The <span className="italic font-normal">Mother</span> <span className="text-muted-foreground">of</span> Econ.
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="show"
                custom={2}
                variants={fadeUp}
                className="prose-serif mt-8 max-w-2xl text-[1.125rem] text-foreground/80"
              >
                Eight free, citation-rigorous tools for the students, debaters, and
                policy nerds the textbooks forgot. From <span className="italic">AP free-response grading</span> to <span className="italic">live tariff modeling</span> to a <span className="italic">Shadow Fed</span> with a public track record — every formula shown, every dataset cited.
              </motion.p>
              <motion.div
                initial="hidden"
                animate="show"
                custom={3}
                variants={fadeUp}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link href="/tools">
                  <a
                    data-testid="button-explore-tools"
                    className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition-transform hover:-translate-y-0.5"
                  >
                    Explore the eight
                    <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </Link>
                <Link href="/methodology">
                  <a
                    data-testid="button-methodology"
                    className="inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm font-medium text-foreground/80 hover:border-foreground hover:text-foreground"
                  >
                    Read the methodology
                  </a>
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              custom={4}
              variants={fadeUp}
              className="lg:col-span-4"
            >
              <div className="rounded-lg border border-border bg-card/60 p-6 shadow-sm">
                <div className="label-cap mb-3">Editor's Note</div>
                <p className="prose-serif text-[0.95rem] text-foreground/85">
                  When the National Economics Challenge finalist who built
                  <Link href="/founder">
                    <a className="editorial-link cursor-pointer mx-1 italic">EconLever</a>
                  </Link>
                  noticed that the tools his classmates needed didn't exist anywhere on the public internet, he built them himself. This is the result.
                </p>
                <div className="rule mt-6" />
                <div className="mt-4 grid grid-cols-3 gap-4 font-mono">
                  <Stat n="8" label="Tools" />
                  <Stat n="∞" label="Free" />
                  <Stat n="0" label="Paywalls" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Marquee of categories */}
        <div className="overflow-hidden border-t border-border bg-card/40 py-3">
          <div className="marquee gap-12 whitespace-nowrap font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex gap-12 pr-12">
                <span>· AP Macro</span>
                <span>· AP Micro</span>
                <span>· Trade Policy</span>
                <span>· Monetary Policy</span>
                <span>· Fiscal Policy</span>
                <span>· Inequality</span>
                <span>· FRED-Live</span>
                <span>· College Board Rubric</span>
                <span>· Peterson Institute</span>
                <span>· NBER Working Papers</span>
                <span>· Colorado Local Data</span>
                <span>· NSDA Extemp</span>
                <span>· No Sign-In</span>
                <span>· Open Methodology</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE EIGHT — Tool index, editorial layout */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16 grid items-end gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="label-cap mb-4">The Eight</div>
            <h2 className="text-editorial text-[2.25rem] sm:text-[3rem] lg:text-[3.5rem]">
              Tools the textbooks forgot.
            </h2>
          </div>
          <p className="prose-serif md:col-span-5 text-foreground/80">
            Each instrument below answers a question that has no public-internet answer — or whose existing answer is wrong, paywalled, or stale. Click any to begin.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <Link key={tool.slug} href={`/${tool.slug}`}>
              <a
                data-testid={`card-tool-${tool.slug}`}
                className="card-lift group relative flex h-full flex-col bg-card p-7 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[0.72rem] uppercase tracking-widest text-muted-foreground">
                    Nº {tool.number}
                  </span>
                  <StatusPill status={tool.status} />
                </div>
                <h3 className="mt-8 text-[1.5rem] font-medium leading-tight">
                  {tool.name}
                </h3>
                <p className="prose-serif mt-3 text-[0.95rem] text-muted-foreground">
                  {tool.tagline}
                </p>
                <div className="mt-8 flex flex-1 items-end justify-between">
                  <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    {tool.category}
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </div>
                {tool.flagship && (
                  <div className="absolute top-7 right-16 hidden items-center gap-1 font-mono text-[0.6rem] uppercase tracking-widest text-primary md:flex">
                    <Sparkles size={10} /> Flagship
                  </div>
                )}
              </a>
            </Link>
          ))}
        </div>
      </section>

      {/* THESIS — Founder pitch */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-32">
          <div className="lg:col-span-5">
            <div className="label-cap mb-4">The Thesis</div>
            <h2 className="text-editorial text-[2rem] sm:text-[2.75rem]">
              Economics is too important to lock behind a Bloomberg terminal.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="prose-serif text-[1.05rem] text-foreground/85">
              Every tool on econ.mom answers a question that, until now, had no
              public answer — or whose answer was paywalled, stale, or wrong. The
              <span className="italic"> AP FRQ Grader </span> turns the College Board's own rubric into something a student can use. <span className="italic">TariffLab </span> shows you the deadweight-loss triangle the news anchors keep getting wrong. The
              <span className="italic"> Shadow Fed </span> publishes a Taylor-rule recommendation every Monday and logs the gap when the FOMC actually decides — a public, accountable track record nobody else runs.
            </p>
            <div className="rule mt-10" />
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <Pillar
                title="Open methodology"
                body="Every formula and dataset behind every tool is documented on the Methodology page. No black boxes. No 'trust me.'"
              />
              <Pillar
                title="Cited primary sources"
                body="Data from FRED, BLS, BEA, USITC, NBER, the College Board, and the Federal Reserve — never a third-hand summary."
              />
              <Pillar
                title="Free forever"
                body="No accounts, no paywalls, no ads. Built for AP students, debaters, and the curious."
              />
              <Pillar
                title="Built by a student"
                body="Designed by a National Economics Challenge finalist who needed these tools and couldn't find them."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="grain relative overflow-hidden rounded-2xl border border-border bg-foreground p-12 text-background lg:p-16">
          <div className="relative grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="label-cap mb-4 text-background/60">Begin reading</div>
              <h3 className="text-editorial text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] text-background">
                Open the first instrument.
              </h3>
              <p className="prose-serif mt-6 max-w-xl text-background/70">
                The AP FRQ Grader takes any free-response answer and scores it
                against the official College Board rubric, point-by-point. Try it
                with a question you have on the desk right now.
              </p>
            </div>
            <div className="flex items-end lg:col-span-5 lg:justify-end">
              <Link href="/frq-grader">
                <a
                  data-testid="button-cta-frq"
                  className="group inline-flex items-center gap-3 rounded-full bg-background px-7 py-4 font-medium text-foreground transition-transform hover:-translate-y-0.5"
                >
                  Open the FRQ Grader
                  <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-1" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="num-display text-[1.75rem] leading-none text-foreground">{n}</div>
      <div className="label-cap mt-2 text-[0.625rem]">{label}</div>
    </div>
  );
}

function Pillar({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="font-display text-[1.05rem] font-medium text-foreground">{title}</div>
      <p className="prose-serif mt-2 text-[0.9rem] text-muted-foreground">{body}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "live" | "beta" | "soon" }) {
  const map = {
    live: { label: "Live", cls: "bg-foreground/5 text-foreground border-foreground/20" },
    beta: { label: "Beta", cls: "bg-accent/15 text-accent-foreground border-accent/40" },
    soon: { label: "Soon", cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const it = map[status];
  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-widest ${it.cls}`}>
      {it.label}
    </span>
  );
}
