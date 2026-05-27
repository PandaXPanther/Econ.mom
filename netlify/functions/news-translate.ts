// Netlify Function: live AI news translator (Perplexity Sonar).
//
// Hardened with: aggressive per-IP + global daily caps, body size cap, origin
// guard, and 24h response cache. See netlify/functions/_lib/limits.ts.
//
// Requires PERPLEXITY_API_KEY in Netlify site env.
//
// Default caps (override with LIMIT_PERPLEXITY_* env vars). Tuned so a real
// student burning through samples never hits a wall; abusive scripts do:
//   8 / minute / IP
//   30 / hour  / IP
//   60 / day   / IP
//   200 / day global (budget guardrail)
//   2048 byte max body
//
// Cache: 24 hours by normalized headline. Identical headlines return cached
// citations + analysis without burning the wallet.

import type { Handler } from "@netlify/functions";
import { enforce, getCachedJSON, setCachedJSON, hashStable, json } from "./_lib/limits";

type Citation = { title?: string; url: string };

type Translation = {
  modelLabel: string;
  curve: string;
  direction: "left" | "right" | "rotate" | "none";
  shortRun: string;
  longRun: string;
  magnitude: "small" | "moderate" | "large";
  confidence: "low" | "medium" | "high";
  citations: Citation[];
  cached?: boolean;
};

const SYSTEM_PROMPT = `You are an AP Economics tutor that maps real news headlines to the single best textbook model.

Output a strict JSON object matching this TypeScript type, nothing else:
{
  "modelLabel": "Aggregate Supply / Aggregate Demand" | "IS-LM" | "Phillips Curve" | "Loanable Funds" | "Money Market" | "Solow Growth" | "Supply and Demand" | "International Trade",
  "curve": string,            // e.g. "AD shifts left", "SRAS shifts right", "real interest rate rises"
  "direction": "left" | "right" | "rotate" | "none",
  "shortRun": string,         // 1 to 3 sentences, AP framework language
  "longRun": string,          // 1 to 3 sentences
  "magnitude": "small" | "moderate" | "large",
  "confidence": "low" | "medium" | "high"
}

Rules:
- Use AP Economics curve names (AD, SRAS, LRAS, IS, LM, MS, MD, S, D, etc.).
- Never use em dashes. Use commas, periods, semicolons, or "to".
- Refuse non-economics headlines: return modelLabel "Supply and Demand", curve "out of scope", direction "none", shortRun "This headline is not an economics story.", confidence "low".
- Prefer the simplest model that captures the story. One model only.
- Do NOT include citations in the JSON; the API will return them separately.`;

function normalizeHeadline(h: string): string {
  return h
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

export const handler: Handler = async (event) => {
  const blocked = await enforce(event, {
    service: "perplexity",
    perMin: 8,
    perHour: 30,
    perDay: 60,
    perDayGlobal: 200,
    maxBodyBytes: 2048,
  });
  if (blocked) return blocked;

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: "Live AI translator unavailable: PERPLEXITY_API_KEY not configured.",
    });
  }

  let payload: { headline?: string };
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const rawHeadline = (payload.headline || "").toString().trim();
  if (!rawHeadline || rawHeadline.length < 6) {
    return json(400, { error: "Headline too short. Provide at least 6 characters." });
  }
  if (rawHeadline.length > 400) {
    return json(400, { error: "Headline too long. Trim to 400 characters or fewer." });
  }

  const normalized = normalizeHeadline(rawHeadline);
  const cacheKey = `pplx:news:${hashStable(normalized)}`;

  // 24h cache: identical headlines reuse cited analysis. Wallet protection.
  const cached = await getCachedJSON<Translation>(cacheKey, 60 * 60 * 24);
  if (cached) {
    return json(200, { ...cached, cached: true });
  }

  // Call Perplexity Sonar. Smallest model that still returns citations.
  const model = process.env.PERPLEXITY_MODEL || "sonar";
  const userPrompt =
    `Headline: "${rawHeadline}"\n\n` +
    `Return ONLY the JSON object described in the system prompt.`;

  const pplxResp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
      // Strong domain bias for credible economics sources.
      search_domain_filter: [
        "federalreserve.gov",
        "bls.gov",
        "bea.gov",
        "treasury.gov",
        "fred.stlouisfed.org",
        "nber.org",
        "imf.org",
        "worldbank.org",
        "reuters.com",
        "ft.com",
        "bloomberg.com",
        "wsj.com",
        "economist.com",
      ],
      return_citations: true,
      return_related_questions: false,
      web_search_options: { search_context_size: "low" },
    }),
  });

  if (!pplxResp.ok) {
    const errText = await pplxResp.text();
    return json(502, {
      error: `Perplexity API error: ${pplxResp.status}`,
      detail: errText.slice(0, 300),
    });
  }

  const data: any = await pplxResp.json();
  const content: string = data?.choices?.[0]?.message?.content || "";

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return json(502, {
        error: "Could not parse Perplexity response.",
        detail: content.slice(0, 300),
      });
    }
  }

  // Pull citations from either the new "search_results" array or the legacy
  // "citations" field. Limit to 4 to keep render compact.
  const search = (data?.search_results || []) as Array<{ title?: string; url?: string }>;
  const legacy = (data?.citations || []) as string[];
  let citations: Citation[];
  if (search.length) {
    citations = search
      .filter((s) => s?.url)
      .slice(0, 4)
      .map((s) => ({ title: s.title, url: s.url! }));
  } else {
    citations = legacy.slice(0, 4).map((u) => ({ url: u }));
  }

  const out: Translation = {
    modelLabel: parsed.modelLabel || "Supply and Demand",
    curve: parsed.curve || "no clear shift",
    direction: parsed.direction || "none",
    shortRun: parsed.shortRun || "",
    longRun: parsed.longRun || "",
    magnitude: parsed.magnitude || "moderate",
    confidence: parsed.confidence || "low",
    citations,
  };

  await setCachedJSON(cacheKey, out, 60 * 60 * 24);

  return json(200, { ...out, cached: false });
};
