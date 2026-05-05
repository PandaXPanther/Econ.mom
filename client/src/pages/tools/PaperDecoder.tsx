import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { ToolExplainer } from "@/components/brand/ToolExplainer";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { FileSearch, Sparkles, Quote, Link as LinkIcon, Upload, AlertTriangle } from "lucide-react";
import { GeminiProgress } from "@/components/GeminiProgress";

interface Decoded {
  title: string;
  authors: string | string[];
  journal: string;
  year: string | number;
  identification: string;
  abstract: string;
  finding: string;
  magnitude?: string;
  limitations?: string;
  citation30s: string;
  fredSeries?: string[];
  policyRelevance?: string;
  sourceUrl?: string | null;
}

const SAMPLES: Record<string, Decoded> = {
  card_krueger: {
    title: "Minimum Wages and Employment: A Case Study of the Fast-Food Industry in NJ and PA",
    authors: "David Card, Alan Krueger",
    journal: "American Economic Review",
    year: "1994",
    identification: "DiD",
    abstract: "When New Jersey raised the minimum wage from $4.25 to $5.05 in 1992, this paper compared employment changes in NJ fast-food restaurants to those in nearby Pennsylvania (which did not raise its minimum wage). The result contradicted standard textbook predictions: employment in NJ rose modestly relative to PA.",
    finding: "Employment in NJ fast-food restaurants did NOT fall after the minimum-wage increase; if anything it rose ~13% relative to the PA control. This launched the modern minimum-wage debate.",
    citation30s: "A landmark Card-Krueger 1994 study compared New Jersey and Pennsylvania fast-food employment after NJ raised its minimum wage. Using difference-in-differences, the authors found employment ROSE 13% in NJ relative to the PA control, directly contradicting the textbook prediction that minimum-wage hikes cost jobs in low-wage labor markets.",
  },
  chetty_moving: {
    title: "The Effects of Exposure to Better Neighborhoods on Children",
    authors: "Raj Chetty, Nathaniel Hendren, Lawrence Katz",
    journal: "American Economic Review",
    year: "2016",
    identification: "RCT",
    abstract: "This paper re-analyzes the Moving to Opportunity (MTO) housing experiment, which randomly assigned vouchers to families in high-poverty public housing. The authors find children who moved to lower-poverty neighborhoods before age 13 earn significantly more as adults.",
    finding: "Children who moved to better neighborhoods before age 13 earned ~31% more as adults than the control group; effects fade for adolescents.",
    citation30s: "Chetty, Hendren, and Katz's 2016 AER study used the Moving to Opportunity housing voucher RCT to show that children who moved to lower-poverty neighborhoods before age 13 earned 31% more as adults than the control group, strong causal evidence that neighborhood exposure shapes long-run economic mobility.",
  },
  acemoglu_history: {
    title: "The Colonial Origins of Comparative Development",
    authors: "Daron Acemoglu, Simon Johnson, James Robinson",
    journal: "American Economic Review",
    year: "2001",
    identification: "IV",
    abstract: "Why are some countries rich and others poor? This paper instruments for modern institutions using historical settler-mortality rates: where Europeans could not survive, they set up extractive institutions; where they could, they set up inclusive ones, and these institutions persisted.",
    finding: "Better institutions cause higher GDP per capita. The IV estimates suggest a one-standard-deviation improvement in institutional quality raises GDP per capita by ~70%.",
    citation30s: "Acemoglu, Johnson, and Robinson's 2001 AER paper used 19th-century European settler-mortality rates as an instrument for modern institutional quality, a creative IV strategy that solved the chicken-and-egg problem in growth economics. They estimate that a one-standard-deviation improvement in institutions raises GDP per capita by 70%.",
  },
};

async function extractPdfText(file: File): Promise<string> {
  // pdfjs-dist legacy build works in Vite browsers without worker config.
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerSrc = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  const max = Math.min(doc.numPages, 20);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n\n";
    if (text.length > 30000) break;
  }
  return text.slice(0, 30000);
}

export default function PaperDecoder() {
  const tool = TOOL_BY_SLUG["paper-decoder"];
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function callGemini(payload: { url?: string; text?: string }) {
    const r = await fetch("/api/gemini-paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${r.status}`);
    }
    return await r.json() as Decoded;
  }

  async function handleSample(key: keyof typeof SAMPLES) {
    setError(null);
    setLoading(true);
    setLoadingMessage("Mapping identification strategy…");
    setDecoded(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setDecoded(SAMPLES[key]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUrl() {
    if (!url.trim()) return;
    setError(null);
    setLoading(true);
    setLoadingMessage("Fetching paper from URL…");
    setDecoded(null);
    try {
      const data = await callGemini({ url: url.trim() });
      setDecoded(data);
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    setLoadingMessage("Extracting text from PDF…");
    setDecoded(null);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) throw new Error("No text could be extracted from the PDF.");
      setLoadingMessage("Decoding with Gemini…");
      const data = await callGemini({ text });
      setDecoded(data);
    } catch (err: any) {
      setError(err?.message || "Failed to decode PDF");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <PageShell>
      <SEO
        title="Econ Paper Decoder, turn any NBER, JEP, or AER paper into an extemp citation | The Mother Of Econ"
        description="Upload a working paper PDF or paste any URL. Decoder returns plain-English abstract, identification strategy, headline numeric finding, FRED series to watch, and a debate-ready 30-second citation block, powered by Gemini."
        path="/paper-decoder"
      />
      <ToolPageHeader tool={tool} />
      <ToolExplainer tool={tool} />
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="label-cap mb-3 flex items-center gap-2"><FileSearch size={12}/> Decode a paper</div>
              <p className="prose-serif text-[0.92rem] text-foreground/85 mb-6">
                Upload a PDF or paste any URL (NBER, JEP, AER, working paper). Decoder returns plain-English abstract, identification strategy, magnitude, FRED series to watch, and a debate-ready citation.
              </p>

              {/* PDF upload */}
              <div className="rounded-md border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                <Upload size={24} className="mx-auto text-muted-foreground" />
                <div className="prose-serif mt-2 text-sm text-muted-foreground">Choose a PDF (up to 20 pages)</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFile}
                  className="hidden"
                  data-testid="input-paper-file"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  data-testid="button-choose-paper-file"
                  disabled={loading}
                  className="mt-3 rounded-full border border-border px-5 py-2 text-sm font-medium hover:border-foreground disabled:opacity-50"
                >
                  Choose PDF
                </button>
              </div>

              {/* URL paste */}
              <div className="mt-5">
                <div className="label-cap mb-2 flex items-center gap-2"><LinkIcon size={12}/> Or paste a URL</div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.nber.org/papers/w12345"
                    data-testid="input-paper-url"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleUrl}
                    disabled={!url.trim() || loading}
                    data-testid="button-decode-url"
                    className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                  >
                    Decode
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-[0.85rem] text-destructive">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
            </div>

            <div className="mt-6 label-cap">Or try a famous paper</div>
            <div className="mt-3 space-y-3">
              {Object.entries(SAMPLES).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => handleSample(key as keyof typeof SAMPLES)}
                  data-testid={`button-paper-${key}`}
                  className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-foreground/30"
                >
                  <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    {p.journal} · {p.year} · {p.identification}
                  </div>
                  <div className="mt-2 font-display text-[1rem] font-medium leading-tight">{p.title}</div>
                  <div className="prose-serif mt-1 text-[0.85rem] text-muted-foreground">{Array.isArray(p.authors) ? p.authors.join(", ") : p.authors}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-border bg-card p-6">
                  <GeminiProgress
                    active={loading}
                    label="Decoding the paper"
                    detail={loadingMessage}
                    etaSeconds={20}
                  />
                </motion.div>
              )}
              {decoded && !loading && (
                <motion.div key={String(decoded.title)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} data-testid="paper-decoded">
                  <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="font-mono text-[0.72rem] uppercase tracking-widest text-muted-foreground">
                      {decoded.journal} · {decoded.year}
                    </div>
                    <h2 className="text-editorial mt-2 text-[1.85rem] lg:text-[2.25rem] leading-tight">{decoded.title}</h2>
                    <p className="font-display italic text-foreground/80 mt-2">
                      {Array.isArray(decoded.authors) ? decoded.authors.join(", ") : decoded.authors}
                    </p>
                    {decoded.sourceUrl && (
                      <a href={decoded.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-primary text-xs underline">
                        <LinkIcon size={11}/> Source
                      </a>
                    )}
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="label-cap mb-3">Plain-English abstract</div>
                    <p className="prose-serif text-foreground/90">{decoded.abstract}</p>
                  </div>

                  <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6 lg:p-8">
                    <div className="label-cap mb-3 text-primary">Identification strategy</div>
                    <h3 className="font-display text-[1.4rem] font-medium">{decoded.identification}</h3>
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="label-cap mb-3">Headline finding</div>
                    <p className="prose-serif text-[1.05rem] text-foreground/90">{decoded.finding}</p>
                    {decoded.magnitude && (
                      <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 font-mono text-[0.85rem]">
                        Magnitude: {decoded.magnitude}
                      </div>
                    )}
                  </div>

                  {decoded.fredSeries && decoded.fredSeries.length > 0 && (
                    <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                      <div className="label-cap mb-3">FRED series to watch</div>
                      <div className="flex flex-wrap gap-2">
                        {decoded.fredSeries.map((s, i) => (
                          <span key={i} className="font-mono text-[0.75rem] uppercase tracking-wider rounded bg-muted px-2 py-1">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {decoded.limitations && (
                    <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                      <div className="label-cap mb-3">Limitations</div>
                      <p className="prose-serif text-[0.94rem] text-foreground/85">{decoded.limitations}</p>
                    </div>
                  )}

                  <div className="mt-6 rounded-xl border border-foreground bg-foreground p-6 lg:p-8 text-background">
                    <div className="label-cap mb-3 text-background/60 flex items-center gap-2"><Quote size={12}/> 30-second citation block</div>
                    <p className="prose-serif text-[1.02rem]">{decoded.citation30s}</p>
                  </div>

                  {decoded.policyRelevance && (
                    <div className="mt-6 rounded-xl border border-border bg-card p-6 lg:p-8">
                      <div className="label-cap mb-3">Policy relevance</div>
                      <p className="prose-serif text-foreground/85">{decoded.policyRelevance}</p>
                    </div>
                  )}
                </motion.div>
              )}
              {!decoded && !loading && (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center">
                  <p className="prose-serif text-muted-foreground">
                    Upload a PDF, paste a URL, or pick a famous paper to see Decoder in action.
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
