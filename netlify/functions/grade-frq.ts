// Netlify Function: AI-powered AP FRQ grader.
// Called from the React app at /api/grade-frq (rewritten by netlify.toml).
// Requires the GEMINI_API_KEY environment variable in Netlify site settings.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "AI grading unavailable: GEMINI_API_KEY not configured.",
      }),
    };
  }

  try {
    const { frq, responses } = JSON.parse(event.body || "{}");
    if (!frq || !responses) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing frq or responses." }),
      };
    }

    const rubricBlock = (frq.parts || [])
      .map((p: any) => {
        const points = (p.rubricPoints || [])
          .map(
            (rp: any, i: number) =>
              `  Point ${i + 1} [${rp.id}] (${rp.points} pt): ${rp.prompt}\n    Ideal: ${rp.idealAnswer || ""}`
          )
          .join("\n");
        return `Part ${p.label} (${p.id}) - ${p.prompt}\n${points}`;
      })
      .join("\n\n");

    const responsesBlock = Object.entries(responses)
      .map(([k, v]) => `[${k}]\n${v}`)
      .join("\n\n");

    const totalPossible = (frq.parts || []).reduce(
      (s: number, p: any) =>
        s +
        (p.rubricPoints || []).reduce(
          (a: number, b: any) => a + (b.points || 0),
          0
        ),
      0
    );

    const prompt = `You are an expert AP Economics FRQ grader trained on every released College Board rubric. Grade the student response strictly against the rubric below. Return ONLY valid JSON matching this exact TypeScript shape:

{
  "totalEarned": number,
  "totalPossible": ${totalPossible},
  "overallFeedback": string,
  "idealRewrite": string,
  "parts": [
    {
      "partId": string,
      "partLabel": string,
      "earnedInPart": number,
      "possibleInPart": number,
      "points": [
        {
          "pointId": string,
          "prompt": string,
          "earned": number,
          "possible": number,
          "verdict": "full" | "partial" | "none",
          "feedback": string,
          "idealAnswer": string
        }
      ]
    }
  ]
}

Rules:
- pointId must match the rubric point id exactly.
- partId / partLabel must match the rubric part.
- For graph points, students may describe diagrams in words; reward explicit labels of axes, curves, equilibrium points, and shifts.
- Be encouraging but rigorous. Cite missing rubric language in feedback.
- idealRewrite is a paragraph-level "5/5" rewrite for the entire FRQ, separated by \\n\\n with optional **Part A** style headers.

== FRQ TITLE ==
${frq.title || ""}

== EXAM / YEAR ==
${(frq.exam || "").toUpperCase()} . ${frq.year || ""}

== PROMPT ==
${frq.prompt || ""}

== RUBRIC ==
${rubricBlock}

== STUDENT RESPONSES ==
${responsesBlock}

Return ONLY the JSON object. Do not wrap in markdown code fences. Do not add commentary.`;

    const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Gemini API error: ${geminiResp.status}`,
          detail: errText.slice(0, 500),
        }),
      };
    }

    const data: any = await geminiResp.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join("") ||
      "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err?.message || "Unknown error" }),
    };
  }
};
