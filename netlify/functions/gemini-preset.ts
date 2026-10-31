// Netlify Function: OpenAI-powered EconLever preset suggester.
// Rate-limited via shared limits.ts and 12h-cached by description hash.

import { requestOpenAI, aiCacheKey, OpenAIError } from "../../shared/openai";

import type { LambdaHandler } from "@netlify/aws-lambda-compat";
import { withRuntime } from "./_lib/runtime";
import { enforce, getCachedJSON, setCachedJSON, hashStable } from "./_lib/limits";

const handler: LambdaHandler = async (event) => {
  if (process.env.AI_DISABLED === "1") {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "AI features temporarily disabled. Try again later." }) };
  }

  const blocked = await enforce(event, { service: "gemini-text", perMin: 6, perHour: 25, perDay: 60, perDayGlobal: 200, maxBodyBytes: 6144 });
  if (blocked) return blocked;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "OPENAI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const description = String(body.description || "").slice(0, 400).trim();
  if (!description) return jsonResp(400, { error: "Missing description." });

  const cacheKey = aiCacheKey("preset", hashStable(description.toLowerCase()));
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

  try {
    const result = await requestOpenAI(apiKey, "preset", prompt, { maxOutputTokens: 1100 });
    const parsed = result;
    // clamp
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    parsed.topMarginalTax = clamp(Number(parsed.topMarginalTax) || 37, 20, 70);
    parsed.corporateTax = clamp(Number(parsed.corporateTax) || 21, 5, 45);
    parsed.welfareSpending = clamp(Number(parsed.welfareSpending) || 14, 5, 30);
    parsed.fedFundsRate = clamp(parsed.fedFundsRate, 0, 10);
    await setCachedJSON(cacheKey, parsed, 60 * 60 * 12);
    return jsonResp(200, { ...parsed, cached: false });
  } catch (err: any) {
    return jsonResp(err instanceof OpenAIError ? err.statusCode : 500, { error: err?.message || "OpenAI call failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// The modern runtime supplies the Blobs context for quota and cache stores.
export default withRuntime(handler);
