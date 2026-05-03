// Netlify Function: Gemini-powered deep inflation decomposition explanation.

import type { Handler } from "@netlify/functions";

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

  const prompt = `You are an inflation economist (Gagnon, Gopinath, Bernanke style). Decompose this CPI print and explain it deeply for an AP Macro student.

Headline CPI YoY: ${headlineCpi.toFixed(2)}%

Component contributions (pp YoY):
${JSON.stringify(components, null, 2)}

Return ONLY JSON (no markdown):

{
  "narrative": string,           // 4-6 sentences, the story behind the print
  "drivers": [                   // 3-5 dominant drivers
    { "name": string, "contribution": number, "explanation": string, "outlook": string }
  ],
  "supplyVsDemand": {
    "supplyPp": number,          // signed pp from supply factors
    "demandPp": number,          // signed pp from demand factors
    "explanation": string        // 1-2 sentences citing Shapiro (SF Fed) decomposition
  },
  "fedImplication": string,      // 2-3 sentences on Fed reaction function
  "historicalContext": string,   // 2 sentences on similar prints (year, magnitude)
  "watchNext": [string]          // 3-5 specific FRED series and what threshold matters
}

Rules:
- Cite real Fed papers / NBER work.
- Numbers must sum approximately to headlineCpi.
- Be concrete: name actual goods, services, or shocks.

Return ONLY the JSON object.`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
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
    parsed.fetchedAt = new Date().toISOString();
    return jsonResp(200, parsed);
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Gemini call failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
