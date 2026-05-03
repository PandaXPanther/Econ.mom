import { Link } from "wouter";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { ArrowUpRight } from "lucide-react";

const FOUNDER_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Saras Totey",
  jobTitle: "Founder, The Mother Of Econ",
  homeLocation: { "@type": "Place", name: "Bennett, Colorado" },
  alumniOf:
    "AP Macroeconomics, AP Microeconomics, AP Statistics, AP Language & Composition, AP Precalculus",
  award: "National Economics Challenge — David Ricardo Division Finalist",
  worksFor: {
    "@type": "Organization",
    name: "The Mother Of Econ",
    url: "https://econ.mom/",
  },
  sameAs: ["https://econlever.org"],
};

export default function Founder() {
  return (
    <PageShell>
      <SEO
        title="The Founder · Saras Totey · econ.mom"
        description="Saras Totey — National Economics Challenge finalist, competitive extemporaneous speaker, and builder of EconLever and The Mother of Econ."
        path="/founder"
        jsonLd={FOUNDER_JSONLD}
      />

      {/* Editorial nameplate */}
      <section className="relative grain border-b border-border overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 -z-10 h-[28rem] w-[28rem] rounded-full opacity-[0.10] blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--primary)), transparent)",
          }}
        />
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-10 lg:pt-24 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between border-y-2 border-foreground/15 py-3 mb-12 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span>§ The Founder</span>
            <span className="hidden sm:inline">Bennett, Colorado</span>
            <span>econ.mom</span>
          </motion.div>

          <div className="grid items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-editorial text-[3.25rem] leading-[0.95] sm:text-[5rem] lg:text-[7rem]"
              >
                Saras{" "}
                <span className="italic font-normal text-primary">Totey</span>
                <span className="text-primary">.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="prose-serif mt-6 max-w-2xl text-[1.18rem] text-foreground/85"
              >
                National Economics Challenge finalist. Competitive
                extemporaneous speaker. Builder of{" "}
                <a
                  href="https://econlever.org"
                  target="_blank"
                  rel="noreferrer"
                  className="editorial-link italic"
                  data-testid="link-founder-econlever"
                >
                  EconLever
                </a>{" "}
                and <span className="italic">The Mother of Econ</span>.
              </motion.p>
            </div>

            {/* Dossier card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="lg:col-span-4"
            >
              <div className="relative rounded-xl border border-border bg-card p-6 shadow-md">
                <div className="absolute -top-3 left-6 bg-card px-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-primary">
                  Dossier
                </div>
                <dl className="mt-2 space-y-3 text-sm">
                  <Row k="Based" v="Bennett, Colorado" />
                  <Row
                    k="Coursework"
                    v="AP Macro · Micro · Stat · Lang · Precalc"
                  />
                  <Row k="Competitions" v="NEC — David Ricardo finalist" />
                  <Row k="Forensics" v="Extemp · ETOC · NIETOC qualifier" />
                  <Row
                    k="Leadership"
                    v="CO Chapter Pres — Equality in Forensics"
                  />
                  <Row
                    k="Sister project"
                    v={
                      <a
                        href="https://econlever.org"
                        target="_blank"
                        rel="noreferrer"
                        className="editorial-link inline-flex items-center gap-1"
                      >
                        EconLever <ArrowUpRight size={12} />
                      </a>
                    }
                  />
                </dl>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The note — short, in EconLever's spare voice */}
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="label-cap mb-6">A note</div>
        <div className="prose-serif space-y-6 text-[1.1rem] text-foreground/90">
          <p>
            <span className="float-left mr-3 mt-1 font-display text-[4rem] font-semibold leading-[0.85] text-primary">
              T
            </span>
            he Mother of Econ is a sister to{" "}
            <a
              href="https://econlever.org"
              target="_blank"
              rel="noreferrer"
              className="editorial-link italic"
              data-testid="link-note-econlever"
            >
              EconLever
            </a>
            : nine purpose-built tools for AP and policy economics, each
            answering a question that, until now, had no public answer — or
            whose answer was paywalled, stale, or wrong.
          </p>
          <p>
            Every tool is free. Every formula is shown. Every dataset is cited.
            Illustrative simulations are calibrated to mainstream macroeconomic
            literature; they are not substitutes for DSGE or VAR analysis. See
            the methodology page for full citations.
          </p>
          <p className="border-l-2 border-primary pl-6 italic text-foreground/80">
            "Si vis pacem, para statistica." — peace through numbers, not
            through pretending we have them.
          </p>
        </div>

        <div className="rule mt-14" />

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Link href="/tools">
            <a
              data-testid="link-see-tools"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition-transform hover:-translate-y-0.5"
            >
              See the nine
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </Link>
          <a
            href="https://econlever.org"
            target="_blank"
            rel="noreferrer"
            data-testid="link-visit-econlever"
            className="editorial-link inline-flex items-center gap-2 text-sm font-medium"
          >
            Visit EconLever
            <ArrowUpRight size={14} />
          </a>
        </div>

        <p className="mt-16 font-mono text-[0.7rem] text-muted-foreground">
          Saras Totey · econ.mom
        </p>
      </section>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2 last:border-0">
      <dt className="label-cap text-[0.65rem]">{k}</dt>
      <dd className="text-right text-foreground/90">{v}</dd>
    </div>
  );
}
