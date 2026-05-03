import { Link } from "wouter";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { ArrowUpRight, Linkedin, Instagram } from "lucide-react";

const FOUNDER_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Saras Totey",
  jobTitle: "Founder, The Mother Of Econ",
  homeLocation: { "@type": "Place", name: "Boulder, Colorado" },
  affiliation: [
    {
      "@type": "Organization",
      name: "Northeastern University",
      url: "https://www.northeastern.edu/",
    },
    {
      "@type": "Organization",
      name: "The Dividend Collective",
      url: "https://thedividendcollective.com/",
    },
    {
      "@type": "EducationalOrganization",
      name: "Boulder High School",
    },
  ],
  award: [
    "2x National Economics Challenge (NEC) Qualifier",
    "International Economics Olympiad (IEO) Winter Challenge Bronze Medalist",
  ],
  worksFor: {
    "@type": "Organization",
    name: "The Mother Of Econ",
    url: "https://econ.mom/",
  },
  sameAs: [
    "https://econlever.org",
    "https://www.linkedin.com/in/saras-totey-64a777334/",
    "https://www.instagram.com/sarastotey_/",
    "https://thedividendcollective.com/",
  ],
};

export default function Founder() {
  return (
    <PageShell>
      <SEO
        title="The Founder · Saras Totey · econ.mom"
        description="Saras Totey, student at Boulder High School, Research Analyst Assistant at Northeastern University, and Head Economics Researcher at The Dividend Collective. Builder of EconLever and The Mother of Econ."
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
            <span className="hidden sm:inline">Boulder, Colorado</span>
            <span>econ.mom</span>
          </motion.div>

          <div className="max-w-4xl">
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
              Boulder High School student. Research Analyst Assistant at
              Northeastern University. Head Economics Researcher at{" "}
              <a
                href="https://thedividendcollective.com/"
                target="_blank"
                rel="noreferrer"
                className="editorial-link italic"
                data-testid="link-founder-tdc"
              >
                The Dividend Collective
              </a>
              . Builder of{" "}
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

            {/* Social links */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href="https://www.linkedin.com/in/saras-totey-64a777334/"
                target="_blank"
                rel="noreferrer"
                data-testid="link-founder-linkedin"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
              <a
                href="https://www.instagram.com/sarastotey_/"
                target="_blank"
                rel="noreferrer"
                data-testid="link-founder-instagram"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                <Instagram size={14} />
                Instagram
              </a>
              <a
                href="https://thedividendcollective.com/"
                target="_blank"
                rel="noreferrer"
                data-testid="link-founder-tdc-pill"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
              >
                The Dividend Collective
                <ArrowUpRight size={12} />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The note */}
      <section className="mx-auto max-w-3xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="label-cap mb-6">A note from the founder</div>
        <div className="prose-serif space-y-6 text-[1.1rem] text-foreground/90">
          <p>
            <span className="float-left mr-3 mt-1 font-display text-[4rem] font-semibold leading-[0.85] text-primary">
              S
            </span>
            aras Totey is a student at Boulder High School and a Research
            Analyst Assistant at Northeastern University, where he assists with
            research on the socioeconomic legacy of Reaganomics, specifically
            analyzing how the 1981 to 1989 reduction in top marginal rates and
            welfare retrenchment shaped post-tax income disparity. He also
            serves as Head Economics Researcher at{" "}
            <a
              href="https://thedividendcollective.com/"
              target="_blank"
              rel="noreferrer"
              className="editorial-link italic"
            >
              The Dividend Collective
            </a>
            , a youth-led economics and policy research organization.
          </p>
          <p>
            A 2x National Economics Challenge (NEC) Qualifier and an
            International Economics Olympiad (IEO) Winter Challenge Bronze
            Medalist, Saras is also a competitive extemporaneous speaker and a
            social-impact founder. He is dedicated to building tools that
            translate dense economic research into accessible, decision-ready
            interfaces for students, debaters, and civic audiences.
          </p>

          <div className="rule my-10" />

          <p>
            The journey began with{" "}
            <a
              href="https://econlever.org"
              target="_blank"
              rel="noreferrer"
              className="editorial-link italic"
              data-testid="link-note-econlever"
            >
              EconLever
            </a>
            , a single-purpose calculator built to demystify the levers behind
            macroeconomic policy. Students used it. Debate teams cited it.
            Teachers shared it. But one tool was never going to be enough.
          </p>
          <p>
            So Saras kept building. The Mother of Econ is what came next: a
            growing collection of nine purpose-built instruments for AP and
            policy economics. Each one answers a question that, until now, had
            no public answer (or whose answer was paywalled, stale, or wrong).
          </p>
          <p>
            Every tool is free. Every formula is shown. Every dataset is cited.
            Illustrative simulations are calibrated to mainstream macroeconomic
            literature; they are not substitutes for DSGE or VAR analysis. See
            the methodology page for full citations.
          </p>
          <p className="border-l-2 border-primary pl-6 italic text-foreground/80">
            "Si vis pacem, para statistica." Peace through numbers, not through
            pretending we have them.
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
