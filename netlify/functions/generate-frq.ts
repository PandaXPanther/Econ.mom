// Netlify Function: Gemini-powered AP FRQ generator.
// Takes a topic + exam (macro/micro) and returns a fully rubric-scaffolded FRQ
// matching the FRQ_LIBRARY shape used by the AP FRQ Grader.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResp(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResp(503, { error: "GEMINI_API_KEY not configured." });
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResp(400, { error: "Invalid JSON body" });
  }

  const topic = String(body.topic || "").slice(0, 500).trim();
  const exam = (body.exam === "micro" ? "micro" : "macro") as "macro" | "micro";
  const difficulty = (body.difficulty === "hard"
    ? "hard"
    : body.difficulty === "easy"
    ? "easy"
    : "standard") as "easy" | "standard" | "hard";
  const style = (body.style === "long" ? "long" : "short") as "short" | "long";

  if (!topic) return jsonResp(400, { error: "Missing topic." });

  const examLabel = exam === "macro" ? "AP Macroeconomics" : "AP Microeconomics";
  const partsCount = style === "long" ? "5-7 parts (Long FRQ #1)" : "3-4 parts (Short FRQ)";
  const totalPts = style === "long" ? "10" : "5";

  const prompt = `You are an expert AP Economics test writer with deep knowledge of every released College Board ${examLabel} FRQ rubric (2018-2025) and the AP-CED unit map. Generate ONE original ${examLabel} free-response question on the topic: "${topic}".

Difficulty: ${difficulty}. Length: ${style} (${partsCount}, ~${totalPts} rubric points total).

Return ONLY valid JSON in this exact shape (no markdown, no commentary):

{
  "id": string,                  // kebab-case slug, prefix with "gen-"
  "exam": "${exam}",
  "year": 2025,
  "title": string,               // 4-9 word title in editorial style
  "prompt": string,              // 2-4 sentence scenario in past or present tense; reference real economies, currencies, or numeric values
  "topics": [string],            // 2-4 AP-CED unit tags (e.g. "Unit 4: Financial Sector")
  "parts": [
    {
      "id": "a" | "b" | "c" | "d" | "e" | "f" | "g",
      "label": "(a)" | "(b)" | etc,
      "prompt": string,           // single-question prompt; if multi-step include "(i)", "(ii)" sub-tags
      "rubricPoints": [
        {
          "id": string,           // "a-i", "a-ii", "b", etc.
          "prompt": string,       // exact scoring criterion College Board would print
          "points": 1,
          "idealAnswer": string,  // 1-3 sentence model answer
          "keywords": [string]    // 3-6 lowercase keywords graders look for
        }
      ]
    }
  ]
}

Rules:
- Use real-world flavor. Cite plausible numeric values. NO placeholder names like "Country X" unless the topic requires it.
- Match official CB tone: precise, terse, unambiguous.
- For graph points, write "Draw a correctly labeled graph of [market]. On your graph, show..." in the part prompt.
- Keywords must be lowercase, single words or short bigrams.
- Sum of points must equal ${totalPts}.
- For ${examLabel}, prefer these graph types: ${exam === "macro" ? "AD/AS, money market, loanable funds, FX market, Phillips curve" : "perfectly competitive firm, monopoly, factor market, externality with social cost, indifference curves"}.

Topic to write the FRQ about: ${topic}

Return ONLY the JSON object.`;

  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return jsonResp(502, {
        error: `Gemini ${r.status}`,
        detail: errText.slice(0, 500),
      });
    }

    const data: any = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // Light validation + normalization
    if (!parsed?.parts || !Array.isArray(parsed.parts)) {
      return jsonResp(502, { error: "Malformed FRQ from Gemini.", raw: parsed });
    }
    parsed.id = parsed.id || `gen-${Date.now()}`;
    parsed.exam = exam;
    parsed.generated = true;

    return jsonResp(200, parsed);
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Generation failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
