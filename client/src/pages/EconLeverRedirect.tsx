import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { SEO } from "@/components/brand/SEO";

/**
 * Bounces visitors to econlever.org. Used by both:
 *   • the in-app hash routes  /#/econlever  /#/lever
 *   • the Netlify path redirect /econlever (which short-circuits before React loads)
 *
 * If JS is enabled we redirect immediately (1.2s pause for the user to register
 * what's happening). The <noscript> fallback gives a hard link.
 */
export default function EconLeverRedirect() {
  const target = "https://econlever.org";

  useEffect(() => {
    const t = window.setTimeout(() => {
      window.location.replace(target);
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      <SEO
        title="EconLever — Redirecting · The Mother of Econ"
        description="Sending you over to EconLever — Saras Totey's first economics project."
        path="/econlever"
        noindex
      />
      <main className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <p className="label-cap">Redirecting</p>
          <h1
            className="text-editorial text-5xl md:text-6xl leading-[1.05]"
            data-testid="text-redirect-heading"
          >
            Off to <span className="italic">EconLever</span>.
          </h1>
          <p className="prose-serif text-lg opacity-80">
            EconLever is the sibling project — a live policy dashboard and the
            place where this whole thing started. We're sending you there now.
          </p>
          <a
            href={target}
            className="inline-flex items-center gap-2 editorial-link text-base font-medium"
            data-testid="link-econlever-manual"
          >
            Take me there immediately
            <ArrowUpRight size={16} />
          </a>
          <p className="text-xs opacity-60 font-mono">
            <noscript>
              JavaScript is off. Click the link above to continue.
            </noscript>
          </p>
        </div>
      </main>
    </>
  );
}
