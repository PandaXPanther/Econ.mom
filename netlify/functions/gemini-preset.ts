// Netlify Function: Gemini-powered EconLever preset suggester.
// Rate-limited via shared limits.ts and 12h-cached by description hash.

import type { Handler } from "@netlify/functions";
import { enforce, getCachedJSON, setCachedJSON, hashStable } from "./_lib/limits";

export const handler: Handler = async (event) => {
  const blocked = await enforce(event, { service: "gemini-text", perMin: 12, perHour: 60, perDay: 120, perDayGlobal: 600, maxBodyBytes: 6144 });
  if (blocked) return blocked;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "GEMINI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const description = String(body.description || "").slice(0, 400).trim();
  if (!description) return jsonResp(400, { error: "Missing description." });

  const cacheKey = `gemini:preset:${hashStable(description.toLowerCase())}`;
  const cached = await getCachedJSON<any>(cacheKey, 60 * 60 * 12);
  if (cached) return jsonResp(200, { ...cached, cached: true });

  const prompt = `You are a fiscal-monetary policy designer. Translate this scenario description into the four EconLever sliders.

Scenario: "${description}"

Return ONLY JSON (no markdown):

{
  "topMarginalTax": number,        // %, 20-70, baseline 37
  "corporateTax": number,          // %, 5-45, baseline 21
  "welfareSpending": number,       // % GDP, 5-30, baseline 14
  "fedFundsRate": number,          // %, 0-10, baseline 4.5
  "label": string,                 // 2-4 word preset name
  "regime": string,                // e.g. "Progressive expansion", "Neoliberal retrenchment"
  "rationale": string,             // 2-3 sentences citing real precedent (e.g. Reagan 1981, Sweden 1990s, Japan ZIRP)
  "expectedRegime": string         // 1-2 word EconLever regime label
}

Rules:
- Numbers must be inside the slider ranges.
- Calibrate to real historical regimes when description matches one.
- Cite specific precedents in rationale.

Return ONLY the JSON object.`;

  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.45, responseMimeType: "application/json" },
      }),
    });
    if (!r.ok) return jsonResp(502, { error: `Gemini ${r.status}`, detail: (await r.text()).slice(0, 500) });
    const data: any = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }
    // clamp
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    parsed.topMarginalTax = clamp(Number(parsed.topMarginalTax) || 37, 20, 70);
    parsed.corporateTax = clamp(Number(parsed.corporateTax) || 21, 5, 45);
    parsed.welfareSpending = clamp(Number(parsed.welfareSpending) || 14, 5, 30);
    parsed.fedFundsRate = clamp(Number(parsed.fedFundsRate) || 4.5, 0, 10);
    await setCachedJSON(cacheKey, parsed, 60 * 60 * 12);
    return jsonResp(200, { ...parsed, cached: false });
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Gemini call failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
