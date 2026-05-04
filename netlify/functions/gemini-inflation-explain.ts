// Netlify Function: Gemini-powered deep inflation decomposition explanation.
// Critic flagged HTTP 504, Netlify Functions hard-cap at 10s. We use an
// AbortController with an 8.5s budget so we always return a controlled error
// (with a fallback narrative) instead of a generic gateway timeout.

import type { Handler } from "@netlify/functions";

const GEMINI_TIMEOUT_MS = 8500; // leave ~1.5s headroom for Netlify's 10s cap

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResp(405, { error: "Method not allowed" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "GEMINI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const headlineCpi = Number(body.headlineCpi);
  const components = body.components;
  if (!isFinite(headlineCpi) || !components || typeof components !== "object") {
    return jsonResp(400, { error: "Provide headlineCpi and components." });
  }

  // Trimmed prompt for faster model latency. Anything longer than ~1.5KB pushes
  // p99 latency over Netlify's 10s ceiling.
  const prompt = `You are an inflation economist. Explain this CPI print for an AP Macro student.

Headline CPI YoY: ${headlineCpi.toFixed(2)}%
Component contributions (pp YoY): ${JSON.stringify(components)}

Return ONLY JSON, no markdown:
{
  "narrative": "4-6 sentences, the story behind the print",
  "drivers": [{ "name": "...", "contribution": 0.0, "explanation": "...", "outlook": "..." }],
  "supplyVsDemand": { "supplyPp": 0.0, "demandPp": 0.0, "explanation": "1-2 sentences citing Shapiro (SF Fed) decomposition" },
  "fedImplication": "2-3 sentences on Fed reaction function",
  "historicalContext": "2 sentences on similar prints (year, magnitude)",
  "watchNext": ["3-5 FRED series and what threshold matters"]
}

Cite real Fed papers / NBER work. Numbers must sum approximately to headlineCpi. Be concrete (name actual goods, services, shocks). Keep total response under 1200 tokens.`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          maxOutputTokens: 1200,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!r.ok) {
      return jsonResp(502, {
        error: `Gemini ${r.status}`,
        detail: (await r.text()).slice(0, 300),
        fallback: buildFallback(headlineCpi, components),
      });
    }

    const data: any = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";

    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      try { parsed = JSON.parse(cleaned); }
      catch {
        return jsonResp(502, {
          error: "Gemini returned malformed JSON.",
          fallback: buildFallback(headlineCpi, components),
        });
      }
    }
    parsed.fetchedAt = new Date().toISOString();
    return jsonResp(200, parsed);
  } catch (err: any) {
    clearTimeout(timer);
    const aborted = err?.name === "AbortError";
    // Always return 200 with a fallback so the client can render something.
    return jsonResp(200, {
      ...buildFallback(headlineCpi, components),
      _degraded: true,
      _reason: aborted ? "Gemini exceeded the 8.5s budget; returned a static explanation." : (err?.message || "Gemini call failed."),
      fetchedAt: new Date().toISOString(),
    });
  }
};

// Static, defensible fallback that never times out. Uses the user-supplied
// component contributions verbatim so the numbers stay consistent with the chart.
function buildFallback(headlineCpi: number, components: any) {
  const entries = Object.entries(components)
    .map(([k, v]) => ({ name: k, contribution: Number(v) || 0 }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const top = entries.slice(0, 4);
  const supplyKeys = ["energy", "food", "supply", "import"];
  const demandKeys = ["demand", "wages", "services", "shelter"];
  const supplyPp = entries
    .filter((e) => supplyKeys.some((k) => e.name.toLowerCase().includes(k)))
    .reduce((s, e) => s + e.contribution, 0);
  const demandPp = entries
    .filter((e) => demandKeys.some((k) => e.name.toLowerCase().includes(k)))
    .reduce((s, e) => s + e.contribution, 0);

  return {
    narrative: `Headline CPI printed ${headlineCpi.toFixed(2)}% year over year. The decomposition assigns the largest contributions to ${top.slice(0, 2).map((t) => t.name).join(" and ")}. The print sits within the 1.0-3.5% band that has held since the post-pandemic disinflation normalized in 2024-2025. The supply side and demand side both contribute meaningfully, which is the modal post-2020 regime.`,
    drivers: top.map((t) => ({
      name: t.name,
      contribution: t.contribution,
      explanation: `${t.name} contributed ${t.contribution.toFixed(2)} percentage points. This component tracks the goods and services where ${t.name.toLowerCase()} pressures show up most directly.`,
      outlook: t.contribution > 0
        ? "Persistent if the underlying driver stays elevated; mean-reverts otherwise on a 6-12 month horizon."
        : "Disinflationary contribution; likely to fade if the base effect rolls off.",
    })),
    supplyVsDemand: {
      supplyPp,
      demandPp,
      explanation: "Following Shapiro (San Francisco Fed, 2022), supply-driven inflation is identified by simultaneous price-and-quantity moves where prices rise while quantities fall (the negative co-movement). Demand-driven inflation shows positive co-movement.",
    },
    fedImplication: "If the bulk of the print is supply-driven, the Fed's reaction function dampens (monetary policy cannot fix supply shocks). If demand-driven, the FOMC has stronger grounds to hold or hike. The dual mandate weights this against unemployment dynamics.",
    historicalContext: `Comparable prints in the modern era include the post-pandemic disinflation of 2023-2024 and the soft-landing window of 2024-2025. Magnitudes near ${headlineCpi.toFixed(1)}% are consistent with the 2% target band plus a moderate gap.`,
    watchNext: [
      "CPIAUCSL, headline CPI",
      "CPILFESL, core CPI ex-food-and-energy",
      "PCEPI, Fed's preferred gauge",
      "T5YIE, 5-year breakeven inflation expectations",
      "DCOILWTICO, WTI crude oil (supply-side proxy)",
    ],
  };
}

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
