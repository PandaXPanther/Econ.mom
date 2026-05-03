import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { FileSearch, Sparkles, Quote } from "lucide-react";

interface Decoded {
  title: string;
  authors: string;
  journal: string;
  year: string;
  identification: "RCT" | "DiD" | "IV" | "RDD" | "Synthetic Control" | "Structural" | "Descriptive";
  abstract: string;
  finding: string;
  citation30s: string;
}

// Pre-built sample papers — Decoder ships with a small library to demonstrate
// the methodology classification framework.
const SAMPLES: Record<string, Decoded> = {
  card_krueger: {
    title: "Minimum Wages and Employment: A Case Study of the Fast-Food Industry in NJ and PA",
    authors: "David Card, Alan Krueger",
    journal: "American Economic Review",
    year: "1994",
    identification: "DiD",
    abstract: "When New Jersey raised the minimum wage from $4.25 to $5.05 in 1992, this paper compared employment changes in NJ fast-food restaurants to those in nearby Pennsylvania (which did not raise its minimum wage). The result contradicted standard textbook predictions: employment in NJ rose modestly relative to PA.",
    finding: "Employment in NJ fast-food restaurants did NOT fall after the minimum-wage increase; if anything it rose ~13% relative to the PA control. This launched the modern minimum-wage debate.",
    citation30s: "A landmark Card-Krueger 1994 study compared New Jersey and Pennsylvania fast-food employment after NJ raised its minimum wage. Using difference-in-differences, the authors found employment ROSE 13% in NJ relative to the PA control — directly contradicting the textbook prediction that minimum-wage hikes cost jobs in low-wage labor markets.",
  },
  chetty_moving: {
    title: "The Effects of Exposure to Better Neighborhoods on Children",
    authors: "Raj Chetty, Nathaniel Hendren, Lawrence Katz",
    journal: "American Economic Review",
    year: "2016",
    identification: "RCT",
    abstract: "This paper re-analyzes the Moving to Opportunity (MTO) housing experiment, which randomly assigned vouchers to families in high-poverty public housing. The authors find children who moved to lower-poverty neighborhoods before age 13 earn significantly more as adults.",
    finding: "Children who moved to better neighborhoods before age 13 earned ~31% more as adults than the control group; effects fade for adolescents. Place-based mobility effects are strong and causally identified.",
    citation30s: "Chetty, Hendren, and Katz's 2016 AER study used the Moving to Opportunity housing voucher RCT to show that children who moved to lower-poverty neighborhoods before age 13 earned 31% more as adults than the control group — strong causal evidence that neighborhood exposure shapes long-run economic mobility.",
  },
  acemoglu_history: {
    title: "The Colonial Origins of Comparative Development",
    authors: "Daron Acemoglu, Simon Johnson, James Robinson",
    journal: "American Economic Review",
    year: "2001",
    identification: "IV",
    abstract: "Why are some countries rich and others poor? This paper instruments for modern institutions using historical settler-mortality rates: where Europeans could not survive, they set up extractive institutions; where they could, they set up inclusive ones — and these institutions persisted.",
    finding: "Better institutions cause higher GDP per capita. The IV estimates suggest a one-standard-deviation improvement in institutional quality raises GDP per capita by ~70%.",
    citation30s: "Acemoglu, Johnson, and Robinson's 2001 AER paper used 19th-century European settler-mortality rates as an instrument for modern institutional quality — a creative IV strategy that solved the chicken-and-egg problem in growth economics. They estimate that a one-standard-deviation improvement in institutions raises GDP per capita by 70%.",
  },
};

const METHODOLOGY_INFO: Record<Decoded["identification"], { tagline: string; explainer: string; diagram: { name: string; role: string }[] }> = {
  DiD: {
    tagline: "Difference-in-Differences",
    explainer: "Compares the change over time in a treated group to the change in a control group. The 'second difference' nets out group-specific factors and time trends.",
    diagram: [
      { name: "Treated group", role: "receives the intervention (e.g., NJ — minimum wage rise)" },
      { name: "Control group", role: "does not (e.g., PA)" },
      { name: "Pre-period", role: "before the intervention" },
      { name: "Post-period", role: "after the intervention" },
      { name: "DiD estimate", role: "(Treated_post − Treated_pre) − (Control_post − Control_pre)" },
    ],
  },
  RCT: {
    tagline: "Randomized Controlled Trial",
    explainer: "Subjects are randomly assigned to treatment or control. Random assignment ensures the only systematic difference between groups is the treatment itself.",
    diagram: [
      { name: "Treatment group", role: "receives the intervention via randomization" },
      { name: "Control group", role: "does not receive the intervention" },
      { name: "Outcome (Y)", role: "what is measured (e.g., earnings)" },
      { name: "Average Treatment Effect", role: "Y(treated) − Y(control)" },
    ],
  },
  IV: {
    tagline: "Instrumental Variables",
    explainer: "Uses an external instrument that affects the treatment but only affects the outcome through the treatment. This isolates causal variation when randomization is impossible.",
    diagram: [
      { name: "Instrument (Z)", role: "external variable (e.g., settler mortality)" },
      { name: "Treatment (X)", role: "affected by Z (e.g., institutions)" },
      { name: "Outcome (Y)", role: "the dependent variable (e.g., GDP)" },
      { name: "Exclusion restriction", role: "Z affects Y ONLY through X" },
    ],
  },
  RDD: {
    tagline: "Regression Discontinuity",
    explainer: "Compares units just above and just below a sharp cutoff. As-good-as-random treatment assignment in a narrow window around the threshold.",
    diagram: [
      { name: "Running variable", role: "determines treatment via cutoff (e.g., test score)" },
      { name: "Cutoff", role: "the threshold value" },
      { name: "Treatment", role: "applied above (or below) the cutoff" },
      { name: "Discontinuity", role: "jump in outcome at the cutoff = treatment effect" },
    ],
  },
  "Synthetic Control": {
    tagline: "Synthetic Control",
    explainer: "Constructs a 'synthetic' control unit as a weighted average of donor units that best matches the treated unit pre-treatment.",
    diagram: [
      { name: "Treated unit", role: "the unit of interest" },
      { name: "Donor pool", role: "candidate untreated units" },
      { name: "Synthetic control", role: "weighted combination of donors" },
      { name: "Treatment effect", role: "treated path − synthetic path post-treatment" },
    ],
  },
  Structural: {
    tagline: "Structural Estimation",
    explainer: "Specifies a fully-articulated economic model with parameters and estimates them directly from data.",
    diagram: [
      { name: "Economic model", role: "utility, production, market clearing" },
      { name: "Parameters", role: "to be estimated" },
      { name: "Moment conditions", role: "match model predictions to data" },
      { name: "Counterfactuals", role: "simulate policy alternatives" },
    ],
  },
  Descriptive: {
    tagline: "Descriptive",
    explainer: "Documents patterns or correlations without claiming causal identification. Important for stylized facts.",
    diagram: [
      { name: "Variables", role: "of interest" },
      { name: "Patterns", role: "documented" },
      { name: "Correlations", role: "summarized" },
      { name: "Note", role: "no causal claim asserted" },
    ],
  },
};

export default function PaperDecoder() {
  const tool = TOOL_BY_SLUG["paper-decoder"];
  const [active, setActive] = useState<keyof typeof SAMPLES | null>(null);
  const [loading, setLoading] = useState(false);

  const onSelect = async (key: keyof typeof SAMPLES) => {
    setLoading(true);
    setActive(null);
    await new Promise((r) => setTimeout(r, 800));
    setActive(key);
    setLoading(false);
  };

  const decoded = active ? SAMPLES[active] : null;

  return (
    <PageShell>
      <SEO
        title="Econ Paper Decoder — turn any NBER, JEP, or AER paper into an extemp citation | The Mother Of Econ"
        description="Upload a working paper. Decoder returns: plain-English abstract, identification strategy with diagram (RCT, DiD, IV, RDD), headline findings, and a 30-second debate-ready citation block."
        path="/paper-decoder"
      />
      <ToolPageHeader tool={tool} />
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="label-cap mb-3 flex items-center gap-2"><FileSearch size={12}/> Decode a paper</div>
              <p className="prose-serif text-[0.92rem] text-foreground/85 mb-6">
                Upload an NBER, JEP, or AER paper. Decoder returns a plain-English abstract, the identification strategy mapped out, the headline finding, and a debate-ready 30-second citation block.
              </p>
              <div className="rounded-md border-2 border-dashed border-border bg-muted/20 p-8 text-center">
                <FileSearch size={28} className="mx-auto text-muted-foreground" />
                <div className="prose-serif mt-3 text-sm text-muted-foreground">
                  Drag a PDF here, or
                </div>
                <button className="mt-3 rounded-full border border-border px-5 py-2 text-sm font-medium hover:border-foreground" disabled>
                  Choose file (coming soon)
                </button>
              </div>
            </div>

            <div className="mt-6 label-cap">Or try a famous paper</div>
            <div className="mt-3 space-y-3">
              {Object.entries(SAMPLES).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => onSelect(key as keyof typeof SAMPLES)}
                  data-testid={`button-paper-${key}`}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    active === key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/30"
                  }`}
                >
                  <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    {p.journal} · {p.year} · {p.identification}
                  </div>
                  <div className="mt-2 font-display text-[1rem] font-medium leading-tight">
                    {p.title}
                  </div>
                  <div className="prose-serif mt-1 text-[0.85rem] text-muted-foreground">
                    {p.authors}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-border bg-card p-12 text-center"
                >
                  <Sparkles size={28} className="mx-auto animate-pulse text-primary" />
                  <p className="prose-serif mt-4 text-muted-foreground">
                    Decoding paper, mapping identification strategy…
                  </p>
                </motion.div>
              )}
              {decoded && !loading && (
                <motion.div
                  key={decoded.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  data-testid="paper-decoded"
                >
                  <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="font-mono text-[0.72rem] uppercase tracking-widest text-muted-foreground">
                      {decoded.journal} · {decoded.year}
                    </div>
                    <h2 className="text-editorial mt-2 text-[1.85rem] lg:text-[2.25rem] leading-tight">
                      {decoded.title}
                    </h2>
                    <p className="font-display italic text-foreground/80 mt-2">{decoded.authors}</p>
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="label-cap mb-3">Plain-English abstract</div>
                    <p className="prose-serif text-foreground/90">{decoded.abstract}</p>
                  </div>

                  <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6 lg:p-8">
                    <div className="label-cap mb-3 text-primary">Identification strategy</div>
                    <h3 className="font-display text-[1.4rem] font-medium">
                      {METHODOLOGY_INFO[decoded.identification].tagline}
                    </h3>
                    <p className="prose-serif mt-3 text-[0.96rem] text-foreground/85">
                      {METHODOLOGY_INFO[decoded.identification].explainer}
                    </p>

                    <div className="mt-6 grid gap-3">
                      {METHODOLOGY_INFO[decoded.identification].diagram.map((row, i) => (
                        <div key={i} className="flex items-baseline gap-4 border-b border-border/50 pb-3 last:border-0">
                          <div className="font-mono text-[0.8rem] text-primary shrink-0 w-40">{row.name}</div>
                          <div className="prose-serif text-[0.92rem] text-foreground/85">{row.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="label-cap mb-3">Headline finding</div>
                    <p className="prose-serif text-[1.05rem] text-foreground/90">{decoded.finding}</p>
                  </div>

                  <div className="mt-6 rounded-xl border border-foreground bg-foreground p-6 lg:p-8 text-background">
                    <div className="label-cap mb-3 text-background/60 flex items-center gap-2"><Quote size={12}/> 30-second citation block</div>
                    <p className="prose-serif text-[1.02rem]">
                      {decoded.citation30s}
                    </p>
                  </div>
                </motion.div>
              )}
              {!decoded && !loading && (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center">
                  <p className="prose-serif text-muted-foreground">
                    Pick a paper from the left to see Decoder in action.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
