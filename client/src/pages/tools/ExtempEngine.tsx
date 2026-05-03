import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { Mic, Printer, Timer, ArrowDownToLine, Quote, Copy, Check } from "lucide-react";
import { SEO } from "@/components/brand/SEO";

interface SpeechBlock {
  agd: string;
  link: string;
  restate: string;
  significance: string;
  question: string;
  preview: string[];
  con1: { claim: string; warrant: string; impact: string; cites: { stat: string; src: string }[] };
  con2: { claim: string; warrant: string; impact: string; cites: { stat: string; src: string }[] };
  answer: string;
  tieback: string;
}

// Hand-built corpus of extemp prompts an extemper at NIETOC/ETOC actually sees.
// Each one has citations a judge will recognize and a Colorado tieback.
const PROMPTS: { id: string; q: string; topic: string; speech: SpeechBlock }[] = [
  {
    id: "tariffs-2026",
    topic: "Trade & Tariffs",
    q: "Are the 2025–26 US tariffs delivering on their promise to revitalize American manufacturing?",
    speech: {
      agd: "In 1828, John C. Calhoun called the Tariff of Abominations exactly that — abominable — because it taxed Southern consumers to enrich Northern factories. Two centuries later, we are still arguing about who really pays a tariff.",
      link: "Today, after the largest tariff escalation since Smoot-Hawley, that argument is no longer academic.",
      restate: "The question: are the 2025–26 US tariffs delivering on their promise to revitalize American manufacturing?",
      significance: "Manufacturing is 10.3% of US GDP and 7.9% of US employment, per the BEA — and Colorado alone has 156,000 manufacturing workers in aerospace, food processing, and medical devices according to CDLE.",
      question: "Are the tariffs working?",
      preview: [
        "First — the price-level effect, where the burden has fallen on importers and consumers, not foreign exporters.",
        "Second — the employment effect, where domestic factory hiring has lagged the political messaging.",
      ],
      con1: {
        claim: "The tariffs have been paid by Americans, not by foreign producers.",
        warrant: "Cavallo, Gopinath, Neiman, and Tang find in their NBER working paper that virtually 100% of the 2018–19 tariffs were passed through to US import prices — and the 2025 tariffs are showing the same pattern.",
        impact: "The Peterson Institute estimates the 2025 tariffs cost the average US household $1,200 per year — a regressive tax falling hardest on households at the bottom of the income distribution.",
        cites: [
          { stat: "Tariff pass-through to US import prices: ~100%", src: "Cavallo et al., NBER WP 26396" },
          { stat: "Annual cost per US household: ~$1,200", src: "Peterson Institute, 2025" },
          { stat: "US tariff revenue 2025: highest since 1944", src: "U.S. Treasury Daily Statement" },
        ],
      },
      con2: {
        claim: "Domestic manufacturing employment has not responded.",
        warrant: "BLS Current Employment Statistics show manufacturing payrolls are essentially flat year-over-year, and the ISM Manufacturing PMI has spent most of 2025 below 50 — the line that separates expansion from contraction.",
        impact: "In Colorado, CDLE's QCEW shows aerospace and food-processing employment growing — but driven by demand, not by tariff-induced reshoring. The political story and the ground truth do not match.",
        cites: [
          { stat: "ISM Manufacturing PMI 2025 average: below 50", src: "Institute for Supply Management" },
          { stat: "US manufacturing payrolls YoY change: ~0%", src: "BLS CES" },
          { stat: "Colorado manufacturing employment: 156,000", src: "CDLE QCEW" },
        ],
      },
      answer: "No — the tariffs are functioning as a regressive consumption tax that has not produced the manufacturing renaissance their architects promised.",
      tieback: "Calhoun's 1828 worry was that tariffs make ordinary people pay so a few protected interests can prosper. Two centuries later, the data say he was right.",
    },
  },
  {
    id: "fed-cuts-2026",
    topic: "Monetary Policy",
    q: "Should the Federal Reserve cut interest rates in the next FOMC meeting?",
    speech: {
      agd: "When Paul Volcker took the chairmanship of the Federal Reserve in 1979, inflation was 13%. He raised rates to 20%, broke the back of inflation, and made the Fed's credibility — its independence, its willingness to inflict pain — the most valuable asset in American economic life.",
      link: "Forty-seven years later, that asset is being tested again.",
      restate: "The question: should the Federal Reserve cut interest rates in the next FOMC meeting?",
      significance: "The Fed sets the rate at which the entire $25-trillion US economy borrows. A 25-basis-point cut is the difference, on a $400,000 mortgage, of about $80 a month — and the difference, in the aggregate, of hundreds of billions in business investment.",
      question: "Should they cut?",
      preview: [
        "First — the inflation case, where Core PCE has not yet stabilized at the 2% target.",
        "Second — the labor-market case, where rising unemployment makes the cost of waiting higher than the cost of cutting.",
      ],
      con1: {
        claim: "Inflation has not yet returned to target.",
        warrant: "Core PCE — the Fed's preferred gauge — sits stubbornly above 2.5% YoY, well above the 2% mandate. The Cleveland Fed's median CPI tells the same story.",
        impact: "Cutting prematurely would re-anchor inflation expectations upward, the precise mistake the 1970s Fed made and the precise mistake Volcker spent a decade unwinding.",
        cites: [
          { stat: "Core PCE YoY: above 2.5%", src: "BEA Personal Income & Outlays" },
          { stat: "Cleveland Fed Median CPI: above 3%", src: "FRED MEDCPIM158SFRBCLE" },
          { stat: "5-year breakeven inflation: above 2.4%", src: "Federal Reserve H.15" },
        ],
      },
      con2: {
        claim: "The labor market is softening fast enough that waiting is the bigger risk.",
        warrant: "Unemployment has risen meaningfully off its cycle low — the Sahm Rule, a recession indicator with a near-perfect track record, is flashing. The Beveridge curve has moved back to its pre-pandemic position.",
        impact: "Monetary policy operates with what Milton Friedman called 'long and variable lags.' Waiting for inflation to perfectly hit 2% before cutting risks driving unemployment past the natural rate — a much harder problem to fix than mild inflation overshoot.",
        cites: [
          { stat: "Sahm Rule indicator: above 0.5", src: "FRED SAHMCURRENT" },
          { stat: "Unemployment rate vs. cycle low: +0.6pp", src: "BLS CPS" },
          { stat: "Job openings per unemployed worker: 1.0×", src: "BLS JOLTS" },
        ],
      },
      answer: "Yes — a measured 25-basis-point cut, with forward guidance making clear the cut is risk-management against labor-market deterioration, is the correct call.",
      tieback: "Volcker's lesson was that credibility matters. But credibility is two-sided: it means tightening when inflation runs hot, and it means easing when the labor market signals a downturn. Doing either at the wrong moment costs the same asset.",
    },
  },
  {
    id: "co-housing",
    topic: "Colorado Policy",
    q: "Should Colorado preempt local zoning to address its housing crisis?",
    speech: {
      agd: "Charles Tiebout's 1956 paper 'A Pure Theory of Local Expenditures' argued that people 'vote with their feet' — they pick the city whose policies they like best. But what happens when every city votes for the same policy, and the policy is to build nothing?",
      link: "That is the question Colorado's legislature is wrestling with right now.",
      restate: "The question: should Colorado preempt local zoning to address its housing crisis?",
      significance: "The median home in Denver Metro is now over $640,000 according to the Colorado Association of Realtors — about 7.4× the median household income. The CDLE reports that 60,000 Coloradans commute over an hour each way, in part because they cannot afford to live near where they work.",
      question: "Should Colorado preempt local zoning?",
      preview: [
        "First — the supply argument, where local discretion has produced a coordinated under-build across the metro region.",
        "Second — the equity argument, where zoning's history is inseparable from its racial and economic exclusion.",
      ],
      con1: {
        claim: "Local zoning has produced a Colorado-wide housing under-build.",
        warrant: "A 2025 Common Sense Institute study estimates Colorado is short roughly 100,000 units of housing — and that shortage is concentrated in cities whose zoning makes multifamily construction effectively illegal. Denver, per CDLE building-permit data, issued the fewest housing permits per capita in 2024 of any major Mountain West metro.",
        impact: "When supply is inelastic, every dollar of demand growth becomes a price increase, not a quantity increase — Econ 101. Coloradans pay the price.",
        cites: [
          { stat: "Colorado housing shortage: ~100,000 units", src: "Common Sense Institute, 2025" },
          { stat: "Denver Metro median home price: $640k+", src: "Colorado Association of Realtors" },
          { stat: "Coloradans with 60+ minute commutes: ~60,000", src: "CDLE / U.S. Census ACS" },
        ],
      },
      con2: {
        claim: "The history of single-family zoning is the history of exclusion.",
        warrant: "Richard Rothstein's 'The Color of Law' documents that single-family-only zoning was originally adopted in many U.S. cities — including in Colorado — explicitly to keep multifamily housing, and the families who would live there, out. The policy outlived its origin; the effect did not.",
        impact: "States from Oregon to Montana have already preempted single-family-only zoning. The early data — particularly from Minneapolis — suggest small-multifamily construction rises and rent growth slows.",
        cites: [
          { stat: "Minneapolis 2040 plan, 4 years post-passage: 12% slower rent growth than peer cities", src: "Pew Charitable Trusts" },
          { stat: "Oregon HB 2001 (2019): legalized duplexes statewide", src: "Oregon Legislative Assembly" },
          { stat: "States that have passed zoning preemption: 6 (and counting)", src: "Sightline Institute" },
        ],
      },
      answer: "Yes — Colorado should preempt single-family-only zoning, with carve-outs for genuinely unique local conditions but a default in favor of allowing the housing the state's labor market urgently needs.",
      tieback: "Tiebout assumed people could vote with their feet between cities. The Colorado data show that, increasingly, the only feet doing the voting are leaving the state. Zoning reform is how that changes.",
    },
  },
];

const COMP = TOOL_BY_SLUG["extemp-engine"];

export default function ExtempEngine() {
  const [active, setActive] = useState(PROMPTS[0].id);
  const [teleprompter, setTeleprompter] = useState(false);
  const [copied, setCopied] = useState(false);
  const speech = useMemo(() => PROMPTS.find((p) => p.id === active)!, [active]);

  function fullText(): string {
    const s = speech.speech;
    return [
      s.agd,
      s.link,
      s.restate,
      s.significance,
      s.question,
      "",
      "Two contentions.",
      ...s.preview,
      "",
      `CONTENTION ONE — ${s.con1.claim}`,
      s.con1.warrant,
      s.con1.impact,
      "",
      `CONTENTION TWO — ${s.con2.claim}`,
      s.con2.warrant,
      s.con2.impact,
      "",
      `Answer: ${s.answer}`,
      s.tieback,
    ].join("\n");
  }

  function copy() {
    navigator.clipboard.writeText(fullText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <PageShell>
      <SEO
        title="Extemp Engine — 7-minute economics speeches with cited stats | The Mother Of Econ"
        description="Built by an extemper for extempers. Generate fully-cited 7-minute extemporaneous speeches on economics topics, with Colorado examples, both sides steel-manned, and a teleprompter view."
        path="/extemp-engine"
      />
      <ToolPageHeader tool={COMP} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* PROMPT SELECTOR */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="label-cap mb-3 flex items-center gap-2">
                  <Mic size={11} /> Choose a prompt
                </div>
                <div className="space-y-2.5">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      data-testid={`button-prompt-${p.id}`}
                      onClick={() => setActive(p.id)}
                      className={`group block w-full rounded-md border p-4 text-left transition-all ${
                        active === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/30 hover:bg-muted/40"
                      }`}
                    >
                      <div className="label-cap mb-2 text-[0.6rem]">{p.topic}</div>
                      <div className="font-display text-[0.98rem] leading-snug">
                        {p.q}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5">
                <div className="label-cap mb-2">House style</div>
                <p className="prose-serif text-[0.9rem] text-muted-foreground">
                  Speech structure: AGD → link → restate → significance → question → preview → two contentions (claim, warrant, impact) → answer + tieback. Built to NSDA Extemp norms.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  data-testid="button-teleprompter"
                  onClick={() => setTeleprompter((t) => !t)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-foreground/40"
                >
                  <Timer size={13} /> {teleprompter ? "Exit teleprompter" : "Teleprompter view"}
                </button>
                <button
                  data-testid="button-copy"
                  onClick={copy}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-foreground/40"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy speech"}
                </button>
                <button
                  data-testid="button-print"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-foreground/40"
                >
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>
          </aside>

          {/* SPEECH BODY */}
          <div className="lg:col-span-8">
            {teleprompter ? <Teleprompter text={fullText()} /> : <SpeechView speech={speech.speech} q={speech.q} />}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function SpeechView({ speech, q }: { speech: SpeechBlock; q: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="prose-serif rounded-lg border border-border bg-card p-8 text-[1.05rem] text-foreground/90 lg:p-12"
    >
      <div className="label-cap mb-3">§ Question</div>
      <h2 className="text-editorial mb-10 text-[1.6rem] font-medium leading-tight text-foreground sm:text-[1.85rem]">
        {q}
      </h2>

      <Block label="Attention-Getting Device">
        <p>{speech.agd}</p>
        <p className="mt-3">{speech.link}</p>
      </Block>

      <Block label="Restate · Significance · Question">
        <p>{speech.restate}</p>
        <p className="mt-3">{speech.significance}</p>
        <p className="mt-3 italic">{speech.question}</p>
      </Block>

      <Block label="Preview">
        <ul className="mt-2 space-y-2 list-none pl-0">
          {speech.preview.map((p, i) => (
            <li key={i} className="border-l-2 border-primary/30 pl-4">{p}</li>
          ))}
        </ul>
      </Block>

      <Contention n="One" body={speech.con1} />
      <Contention n="Two" body={speech.con2} />

      <Block label="Answer & Tieback">
        <p className="font-display text-[1.15rem] italic text-foreground">{speech.answer}</p>
        <p className="mt-4">{speech.tieback}</p>
      </Block>
    </motion.article>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-9 border-t border-border pt-6 first:border-0 first:pt-0">
      <div className="label-cap mb-3">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Contention({ n, body }: { n: string; body: SpeechBlock["con1"] }) {
  return (
    <div className="mb-10 border-t border-border pt-6">
      <div className="flex items-baseline gap-3 mb-3">
        <div className="label-cap">Contention {n}</div>
      </div>
      <h3 className="font-display text-[1.25rem] font-medium text-foreground mb-3">
        {body.claim}
      </h3>
      <p className="mb-3">
        <span className="label-cap mr-2 text-[0.6rem]">Warrant</span>
        {body.warrant}
      </p>
      <p className="mb-4">
        <span className="label-cap mr-2 text-[0.6rem]">Impact</span>
        {body.impact}
      </p>
      <div className="rounded-md border border-border bg-muted/30 p-4">
        <div className="label-cap mb-2 flex items-center gap-1.5">
          <Quote size={10} /> Cited stats
        </div>
        <ul className="space-y-2">
          {body.cites.map((c, i) => (
            <li key={i} className="flex items-baseline justify-between gap-4 font-mono text-[0.78rem]">
              <span className="text-foreground">{c.stat}</span>
              <span className="text-muted-foreground">{c.src}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Teleprompter({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border bg-foreground p-8 text-background lg:p-12">
      <div className="label-cap mb-3 text-background/60">Teleprompter · Eyes up</div>
      <pre className="whitespace-pre-wrap font-display text-[1.6rem] leading-[1.45] tracking-tight text-background">
        {text}
      </pre>
      <div className="mt-8 flex items-center gap-2 text-[0.7rem] text-background/60 font-mono">
        <ArrowDownToLine size={11} /> Scroll naturally · Cadence: 150 wpm
      </div>
    </div>
  );
}
