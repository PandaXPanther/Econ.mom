import { Link } from "wouter";
import { PageShell } from "@/components/brand/PageShell";
import { SEO } from "@/components/brand/SEO";
import { ArrowUpRight } from "lucide-react";

const FOUNDER_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Saras Totey",
  jobTitle: "Founder, The Mother Of Econ",
  homeLocation: { "@type": "Place", name: "Bennett, Colorado" },
  alumniOf: "AP Macroeconomics, AP Microeconomics, AP Statistics, AP Language & Composition, AP Precalculus",
  award: "National Economics Challenge — David Ricardo Division Finalist",
  worksFor: { "@type": "Organization", name: "The Mother Of Econ", url: "https://econ.mom/" },
};

export default function Founder() {
  return (
    <PageShell>
      <SEO
        title="Saras Totey — founder of The Mother Of Econ | econ.mom"
        description="National Economics Challenge finalist. Competitive extemporaneous speaker. Colorado Chapter President for Equality in Forensics. Builder of EconLever and The Mother Of Econ."
        path="/founder"
        jsonLd={FOUNDER_JSONLD}
      />
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-end gap-10 px-6 py-16 lg:grid-cols-12 lg:gap-16 lg:px-10 lg:py-24">
          <div className="lg:col-span-7">
            <div className="label-cap mb-4">§ The Founder</div>
            <h1 className="text-editorial text-[3rem] sm:text-[4rem] lg:text-[5rem] leading-[0.95]">
              Saras Totey.
            </h1>
            <p className="prose-serif mt-6 max-w-2xl text-[1.125rem] text-foreground/85">
              National Economics Challenge finalist. Competitive extemporaneous
              speaker. Colorado Chapter President for Equality in Forensics. The
              kind of student who, having noticed that the economics tools his
              classmates needed didn't exist on the public internet, sat down
              and built them.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="label-cap mb-3">Founder dossier</div>
              <dl className="space-y-3 text-sm">
                <Row k="Based" v="Bennett, Colorado" />
                <Row k="Coursework" v="AP Macro · AP Micro · AP Stat · AP Lang · AP Precalc" />
                <Row k="Competitions" v="NEC Finalist (David Ricardo → Adam Smith)" />
                <Row k="Speech & Debate" v="Extemp · ETOC, NIETOC qualifier" />
                <Row k="Leadership" v="CO Chapter President — Equality in Forensics" />
                <Row k="Prior project" v={
                  <a href="https://econlever.org" target="_blank" rel="noreferrer" className="editorial-link inline-flex items-center gap-1">
                    EconLever <ArrowUpRight size={12} />
                  </a>
                } />
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="label-cap mb-6">A letter from the founder</div>

        <div className="prose-serif space-y-6 text-[1.1rem] text-foreground/90">
          <p>
            <span className="float-left mr-3 mt-1 font-display text-[4rem] font-semibold leading-[0.85] text-primary">I</span>
            built EconLever in the spring of 2026 because I had a debate round on
            the federal budget and there was no public tool that could turn a
            tax-rate slider into a 10-year deficit projection. I built it for
            myself. Then a few teammates used it. Then a teacher in Denver
            wrote to ask if her AP Macro class could use it for a project.
          </p>
          <p>
            That was the moment I realized the gap. The economics profession
            has Bloomberg terminals, FRED, NBER working papers, the Federal
            Reserve Board's research staff. High-school students have a
            textbook from 2018 and a teacher who wishes she had time to update
            her own slides. Between the two — nothing.
          </p>
          <p>
            <span className="font-display italic text-foreground">The Mother of Econ</span> is what I'd want to hand to my younger self the day I started AP Macro. It is eight tools, each of which answers a question that — until now — had no public answer, or whose answer was paywalled, stale, or wrong.
          </p>
          <p>
            The <span className="italic">AP FRQ Grader</span> turns the College
            Board's own rubric into a live coach. <span className="italic">TariffLab </span>
            shows you the deadweight-loss triangle the news anchors keep getting wrong. The
            <span className="italic"> Shadow Fed </span> publishes a Taylor-rule
            recommendation every Monday and logs the gap when the FOMC actually
            decides — a public, accountable track record nobody else runs.
            <span className="italic"> Extemp Engine </span> is the tool I wish I'd
            had three rounds before NIETOC.
          </p>
          <p>
            Every tool is free. Every formula is shown. Every dataset is cited.
            That part is non-negotiable. Economics is too important to lock
            behind a Bloomberg terminal.
          </p>
          <p className="border-l-2 border-primary pl-6 italic text-foreground/80">
            "Si vis pacem, para statistica." — peace through numbers, not
            through pretending we have them.
          </p>
        </div>

        <div className="rule mt-16" />

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <Cite k="Macroeconomics" v="National Economics Challenge — David Ricardo Division Finalist; transitioning to Adam Smith Division." />
          <Cite k="Forensics" v="Extemporaneous speaking — qualified to ETOC and NIETOC. Colorado Chapter President for Equality in Forensics." />
          <Cite k="Civic" v="All proceeds from EconLever's Dispatch support financial-literacy programming in Colorado high schools." />
        </div>

        <div className="mt-20 flex flex-wrap items-center gap-6">
          <Link href="/tools">
            <a className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background hover:-translate-y-0.5 transition-transform">
              See the eight tools
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Link>
          <a
            href="https://econlever.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm font-medium hover:border-foreground"
          >
            Visit EconLever
            <ArrowUpRight size={14} />
          </a>
        </div>
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

function Cite({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="label-cap mb-2">{k}</div>
      <p className="prose-serif text-[0.95rem] text-foreground/80">{v}</p>
    </div>
  );
}
