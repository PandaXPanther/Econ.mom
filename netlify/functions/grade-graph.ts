// Netlify Function: AI-powered AP graph grader.
// Accepts a base64-encoded PNG of a student-drawn diagram plus the rubric,
// sends both to Gemini as multimodal input, and returns a rubric-aligned score.
//
// Called from the React app at /api/grade-graph (rewritten by netlify.toml).
// Requires GEMINI_API_KEY.

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
        error: "AI graph grading unavailable: GEMINI_API_KEY not configured.",
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { prompt, rubric, imageBase64, mimeType, studentNotes } = body || {};
    if (!prompt || !rubric || !imageBase64) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing prompt, rubric, or imageBase64.",
        }),
      };
    }

    // Strip any data URL prefix: "data:image/png;base64,..."
    const cleanedImage = String(imageBase64).replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ""
    );

    const rubricBlock = (rubric || [])
      .map(
        (rp: any, i: number) =>
          `  Point ${i + 1} [${rp.id}] (${rp.points} pt): ${rp.prompt}`
      )
      .join("\n");

    const totalPossible = (rubric || []).reduce(
      (s: number, rp: any) => s + (rp.points || 0),
      0
    );

    const systemPrompt = `You are an expert AP Economics graph grader trained on every released College Board rubric. You are looking at a student's hand-drawn graph for the following AP-style scenario:

== SCENARIO ==
${prompt.scenario || ""}

== DRAWING TASK ==
${prompt.drawTask || ""}

== AXES ==
X-axis: ${prompt.axes?.x || ""}
Y-axis: ${prompt.axes?.y || ""}

== STUDENT NOTES (optional, may clarify labels that are hard to read) ==
${studentNotes || "(none)"}

== RUBRIC ==
${rubricBlock}

Instructions:
- Look carefully at the image. The student drew it by hand in a browser canvas, so labels may be sloppy. Be generous with handwriting but strict on correctness.
- For each rubric point, decide "full" (1 pt), "partial" (0.5 pt if partial credit applies for a 1-pt item round to 0), or "none" (0 pt).
- Reward explicit axis labels, curve labels (AD, SRAS, LRAS, MS, MD, MR, MC, ATC, etc.), direction of shifts, and equilibrium markers.
- If the student wrote axis labels as abbreviations (PL for Price Level, Y for Real GDP, i for interest rate, W for wage), accept them.
- If a rubric point is ambiguous from the image alone, use the student notes above to resolve it.

Return ONLY valid JSON matching this TypeScript shape:

{
  "totalEarned": number,
  "totalPossible": ${totalPossible},
  "overallFeedback": string,
  "points": [
    {
      "pointId": string,
      "prompt": string,
      "earned": number,
      "possible": number,
      "verdict": "full" | "partial" | "none",
      "feedback": string
    }
  ],
  "fiveOutOfFiveDescription": string
}

Rules:
- pointId must match the rubric point id exactly.
- overallFeedback is 2 to 4 sentences of constructive guidance.
- fiveOutOfFiveDescription is a 3 to 6 sentence plain-English description of what a perfect drawing for this prompt would contain (every curve, every label, every shift).

Return ONLY the JSON object. No markdown code fences. No commentary.`;

    const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/png",
                  data: cleanedImage,
                },
              },
            ],
          },
        ],
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
