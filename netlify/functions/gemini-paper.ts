// Netlify Function: OpenAI-powered paper decoder. Accepts URL or pasted text.
// Rate-limited via shared limits.ts and 24h-cached by url/text hash.
// Body cap is larger (80KB) because users paste full paper text.

import { requestOpenAI, aiCacheKey, OpenAIError } from "../../shared/openai";

import type { LambdaHandler } from "@netlify/aws-lambda-compat";
import { withRuntime } from "./_lib/runtime";
import { enforce, getCachedJSON, setCachedJSON, hashStable } from "./_lib/limits";

const handler: LambdaHandler = async (event) => {
  if (process.env.AI_DISABLED === "1") {
    return { statusCode: 503, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "AI features temporarily disabled. Try again later." }) };
  }

  const blocked = await enforce(event, { service: "gemini-paper", perMin: 2, perHour: 8, perDay: 15, perDayGlobal: 40, maxBodyBytes: 80 * 1024 });
  if (blocked) return blocked;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "OPENAI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const url = String(body.url || "").slice(0, 1000).trim();
  const text = String(body.text || "").slice(0, 50000).trim();
  if (!url && !text) return jsonResp(400, { error: "Provide url or text." });

  const cacheKey = aiCacheKey("paper", hashStable({ url, text }));
  const cached = await getCachedJSON<any>(cacheKey, 60 * 60 * 24);
  if (cached) return jsonResp(200, { ...cached, cached: true });

  let extractedText = text;
  if (url && !text) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 econ.mom" } });
      if (!r.ok) return jsonResp(502, { error: `Failed to fetch URL: ${r.status}` });
      const raw = await r.text();
      extractedText = raw.replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 30000);
    } catch (e: any) {
      return jsonResp(502, { error: `URL fetch failed: ${e?.message}` });
    }
  }

  const prompt = `You are a research economist decoding an academic paper for a high school student. Extract structured info from the text below.

Source ${url ? `URL: ${url}` : "type: pasted text"}.

Text:
"""
${extractedText.slice(0, 25000)}
"""

Return ONLY JSON (no markdown):

{
  "title": string,
  "authors": [string],
  "journal": string,
  "year": number,
  "abstract": string,                        // 2-3 sentence plain-English abstract
  "identification": string,                  // 1-2 sentences on the empirical strategy (DiD, RDD, IV, RCT, etc.)
  "finding": string,                         // 2-3 sentence plain-English summary of the headline result
  "magnitude": string,                       // numeric main effect, e.g. "minimum wage +10% reduces teen employment 1-3%"
  "limitations": string,                     // 1 sentence on caveats
  "citation30s": string,                     // 30-second citation an AP student could say aloud
  "fredSeries": [string],                    // 2-4 FRED series this paper relates to
  "policyRelevance": string                  // 1-2 sentences on real-world implications
}

Rules:
- Be honest. If the text is too short to extract, say so in the field with "[insufficient text]".
- Use real numbers from the paper, not made-up.
- Cite real journals.

Return ONLY the JSON object.`;

  try {
    const result = await requestOpenAI(apiKey, "paper", prompt, { maxOutputTokens: 2600 });
    const parsed = result;
    parsed.fetchedAt = new Date().toISOString();
    parsed.sourceUrl = url || null;
    await setCachedJSON(cacheKey, parsed, 60 * 60 * 24);
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
