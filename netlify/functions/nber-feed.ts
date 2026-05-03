// Netlify Function: NBER working-paper RSS proxy.
// Pulls the latest NBER working papers and filters for causal-inference /
// natural-experiment style work. CDN-cached for 6 hours.

import type { Handler } from "@netlify/functions";

const NBER_RSS = "https://www.nber.org/rss/new.xml";

const KEYWORDS = [
  "regression discontinuity",
  "instrumental variable",
  "difference-in-difference",
  "differences-in-differences",
  "natural experiment",
  "causal effect",
  "synthetic control",
  "event study",
  "randomized",
  "field experiment",
  "policy evaluation",
  "exogenous shock",
  "quasi-experimental",
];

export const handler: Handler = async () => {
  try {
    const r = await fetch(NBER_RSS, {
      headers: { "User-Agent": "econ.mom/1.0 (+https://econ.mom)" },
    });
    if (!r.ok) {
      return jsonResp(502, { error: `NBER RSS ${r.status}` });
    }
    const xml = await r.text();

    // Lightweight RSS parse (no dep)
    const items: { title: string; link: string; description: string; pubDate: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRegex.exec(xml))) {
      const block = m[1];
      const title = pick(block, "title");
      const link = pick(block, "link");
      const description = stripHtml(pick(block, "description"));
      const pubDate = pick(block, "pubDate");
      if (title && link) items.push({ title, link, description, pubDate });
    }

    const annotated = items.map((it) => {
      const hay = (it.title + " " + it.description).toLowerCase();
      const matched = KEYWORDS.filter((k) => hay.includes(k));
      return {
        ...it,
        causalRelevance: matched.length,
        identificationMethods: matched,
      };
    });

    const causal = annotated
      .filter((it) => it.causalRelevance > 0)
      .sort((a, b) => b.causalRelevance - a.causalRelevance);

    return jsonResp(200, {
      fetchedAt: new Date().toISOString(),
      total: items.length,
      causal_count: causal.length,
      causal,
      all: annotated,
    });
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "NBER feed failed" });
  }
};

function pick(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function jsonResp(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=21600", // 6h
    },
    body: JSON.stringify(body),
  };
}
