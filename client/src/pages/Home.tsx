import { Link } from "wouter";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  name: "The Nine — Mother Of Econ tools",
  itemListElement: [
    "AP FRQ Grader", "TariffLab", "Textbook Atlas", "Shock Simulator",
    "Shadow Fed", "Econ Paper Decoder", "Econ News Translator", "US Econ Dashboard", "EconLever",
  ].map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
};

export default function Home() {
  return (
    <PageShell>
      <SEO
        title="The Mother Of Econ — nine free, citation-rigorous economics tools · econ.mom"
        description="Nine free economics tools for AP students, debaters, and policy nerds. AP FRQ grading, live tariff modeling, a Shadow Fed with a public track record, an all-50-states dashboard, and EconLever — every formula shown, every dataset cited."
        path="/"
        jsonLd={HOME_JSONLD}
      />
      <HeroCathedral />

      {/* THE NINE — Tool index, editorial layout */}
      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16 grid items-end gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="label-cap mb-4">The Nine</div>
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

      {/* THESIS — Editorial pull-quote */}
      <ThesisBand />

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

/* ============================================================
 * HERO — Cathedral
 * Massive editorial display. Parallax. Animated ticker. Live clock.
 * Hero word ‘Mother’ has a hover micro-interaction (italic glide).
 * ============================================================ */
function HeroCathedral() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative grain overflow-hidden border-b border-border">
      {/* Layered background — oxblood wash, ambient gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/20" />
      <div
        aria-hidden
        className="absolute -top-40 -right-40 -z-10 h-[36rem] w-[36rem] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "radial-gradient(closest-side, hsl(var(--primary)), transparent)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-32 -z-10 h-[28rem] w-[28rem] rounded-full opacity-[0.08] blur-3xl"
        style={{ background: "radial-gradient(closest-side, hsl(var(--accent)), transparent)" }}
      />

      <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 lg:px-10 lg:pt-20 lg:pb-36">
        {/* Masthead bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between border-y-2 border-foreground/15 py-3 mb-12 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Issue Nº 1 · Vol. I</span>
          </div>
          <div className="hidden sm:block">Founded MMXXVI</div>
          <LiveClock />
        </motion.div>

        {/* The cathedral */}
        <motion.div style={{ y: y2, opacity }} className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="label-cap mb-8 text-foreground/70"
          >
            <span className="text-primary">§</span>  A library of economic instruments
          </motion.div>

          <h1 className="text-editorial relative text-foreground">
            <KineticHeadline />
          </h1>

          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-end">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="prose-serif lg:col-span-7 text-[1.18rem] leading-[1.6] text-foreground/80"
            >
              Nine free, citation-rigorous tools for the students, debaters, and
              policy desks the textbooks forgot. From{" "}
              <span className="italic text-foreground">AP free-response grading</span> to{" "}
              <span className="italic text-foreground">live tariff modeling</span> to a{" "}
              <span className="italic text-foreground">Shadow Fed</span> with a public track record — every formula shown, every dataset cited.
            </motion.p>

            {/* Editor counter card with animated metrics */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-xl border border-border bg-card/70 p-6 shadow-md backdrop-blur-sm">
                <div className="absolute -top-3 left-6 bg-card px-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-primary">
                  Author's Note
                </div>
                <p className="prose-serif mt-2 text-[0.98rem] text-foreground/85">
                  Nine instruments. Built for the reader who refuses to memorize what they could simply <span className="italic">model</span>. Every formula shown, every source cited, every paywall absent.
                </p>
                <div className="mt-4 flex items-center justify-end font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground" data-testid="text-author-byline">
                  <span className="mr-2 text-primary">/</span> Saras Totey, Founder
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
                  <CountStat to={9} label="Tools" />
                  <Stat n="∞" label="Free" />
                  <Stat n="0" label="Paywalls" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link href="/tools">
              <a
                data-testid="button-explore-tools"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-foreground px-7 py-3.5 font-medium text-background transition-transform hover:-translate-y-0.5"
              >
                <span className="relative z-10">Explore the nine</span>
                <ArrowUpRight size={16} className="relative z-10 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="absolute inset-0 -translate-x-full bg-primary transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:translate-x-0" />
              </a>
            </Link>
            <Link href="/methodology">
              <a
                data-testid="button-methodology"
                className="editorial-link inline-flex items-center gap-2 text-sm font-medium text-foreground/80"
              >
                Read the methodology →
              </a>
            </Link>
          </motion.div>
        </motion.div>

        {/* Latin pull-quote, large, parallaxed */}
        <motion.div
          style={{ y: y1 }}
          aria-hidden
          className="pointer-events-none absolute right-6 top-32 hidden font-display italic text-foreground/[0.035] lg:block"
        >
          <div className="text-[16rem] leading-none">M</div>
        </motion.div>
      </div>

      {/* Ticker tape — dual rows opposite directions */}
      <div className="border-y border-foreground/15 bg-card/40 py-2.5">
        <div className="marquee gap-10 whitespace-nowrap font-mono text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-10 pr-10">
              {TICKER.map((t, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary/60" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card/20 py-2.5">
        <div className="marquee-reverse gap-10 whitespace-nowrap font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground/70">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-10 pr-10">
              {SOURCES.map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TICKER = [
  "AP Macro", "AP Micro", "Trade Policy", "Monetary Policy", "Fiscal Policy",
  "Inequality", "FRED · Live", "College Board Rubric", "Peterson Institute",
  "NBER Working Papers", "Colorado Local Data", "NSDA Extemp", "No Sign-In", "Open Methodology",
];
const SOURCES = [
  "Source: FRED", "Source: BLS", "Source: BEA", "Source: USITC",
  "Source: NBER", "Source: College Board", "Source: Federal Reserve",
  "Source: Peterson Institute", "Source: CBO", "Source: U.S. Treasury",
];

/* Live local clock — auto-detects user's timezone via Intl. */
function LiveClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    });
    const tick = () => {
      const d = new Date();
      // Build HH:MM:SS from local time so we keep the editorial fixed-width feel
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const ss = String(d.getSeconds()).padStart(2, "0");
      // Pull the short timezone name (e.g. MDT, EST, PST, BST) from Intl
      const parts = tzFormatter.formatToParts(d);
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      const tz = tzPart ? tzPart.value : Intl.DateTimeFormat().resolvedOptions().timeZone;
      setNow(`${hh}:${mm}:${ss} ${tz}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span data-testid="text-live-clock">{now}</span>;
}

/* Kinetic headline — dramatic display, hover-italic transformation on ‘Mother’. */
function KineticHeadline() {
  return (
    <span className="block">
      <motion.span
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="block text-[3.5rem] font-light leading-[0.95] text-foreground sm:text-[5.25rem] lg:text-[8rem]"
      >
        The{" "}
        <motion.span
          whileHover={{ rotate: -2, x: -2 }}
          transition={{ type: "spring", stiffness: 220, damping: 12 }}
          className="inline-block italic font-normal text-primary tracking-[0.01em] [letter-spacing:0.01em]"
          data-testid="text-hero-mother"
          style={{ fontFeatureSettings: '"kern" 0' }}
        >
          Mother
        </motion.span>{" "}
        <span className="text-foreground/35">of</span>{" "}
        <span className="relative inline-block">
          Econ
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: 0.7, ease: [0.65, 0, 0.35, 1] }}
            style={{ originX: 0 }}
            className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary"
          />
        </span>
        <span className="text-primary">.</span>
      </motion.span>
    </span>
  );
}

/* Animated number that counts from 0 to `to` when scrolled into view. */
function CountStat({ to, label }: { to: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 24, mass: 0.9 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);
  useEffect(() => spring.on("change", (v) => setVal(Math.round(v))), [spring]);
  return (
    <div ref={ref}>
      <div className="num-display text-[1.75rem] leading-none text-foreground" data-testid={`count-${label.toLowerCase()}`}>
        {val}
      </div>
      <div className="label-cap mt-2 text-[0.625rem]">{label}</div>
    </div>
  );
}

/* ============================================================
 * THESIS BAND — Big editorial pull-quote with sticky display.
 * ============================================================ */
function ThesisBand() {
  return (
    <section className="relative border-y border-border bg-foreground text-background overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, hsl(var(--background)) 0 1px, transparent 1px 14px)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
        <div className="label-cap mb-6 text-background/60">§ The Thesis</div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-editorial text-[2.25rem] sm:text-[3.5rem] lg:text-[5rem] leading-[0.98] max-w-5xl"
        >
          Economics is too important to lock behind a{" "}
          <span className="italic text-primary">Bloomberg terminal</span>.
        </motion.h2>
        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <Pillar2
            title="Open methodology"
            body="Every formula and dataset documented. No black boxes. No 'trust me.'"
          />
          <Pillar2
            title="Cited primary sources"
            body="FRED · BLS · BEA · USITC · NBER · College Board · Federal Reserve. Never third-hand."
          />
          <Pillar2
            title="Free, forever"
            body="No accounts. No paywalls. No ads. Built for students and the curious."
          />
          <Pillar2
            title="Citation-rigorous"
            body="Every output attributable. Every retraction logged. A public record, not a sandbox."
          />
        </div>
      </div>
    </section>
  );
}
function Pillar2({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-t border-background/20 pt-5">
      <div className="font-display text-[1.05rem] font-medium text-background">{title}</div>
      <p className="prose-serif mt-2 text-[0.95rem] text-background/65">{body}</p>
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
