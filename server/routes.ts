import type { Express, Request, Response } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // AI FRQ grading via Gemini
  app.post("/api/grade-frq", async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(503)
        .json({ error: "AI grading unavailable: GEMINI_API_KEY not configured." });
    }

    try {
      const { frq, responses } = req.body || {};
      if (!frq || !responses) {
        return res.status(400).json({ error: "Missing frq or responses." });
      }

      const rubricBlock = (frq.parts || [])
        .map((p: any) => {
          const points = (p.rubricPoints || [])
            .map(
              (rp: any, i: number) =>
                `  Point ${i + 1} [${rp.id}] (${rp.points} pt): ${rp.prompt}\n    Ideal: ${rp.idealAnswer || ""}`
            )
            .join("\n");
          return `Part ${p.label} (${p.id}), ${p.prompt}\n${points}`;
        })
        .join("\n\n");

      const responsesBlock = Object.entries(responses)
        .map(([k, v]) => `[${k}]\n${v}`)
        .join("\n\n");

      const totalPossible = (frq.parts || []).reduce(
        (s: number, p: any) =>
          s +
          (p.rubricPoints || []).reduce((a: number, b: any) => a + (b.points || 0), 0),
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
${(frq.exam || "").toUpperCase()} · ${frq.year || ""}

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
        return res
          .status(502)
          .json({ error: `Gemini API error: ${geminiResp.status}`, detail: errText.slice(0, 500) });
      }

      const data: any = await geminiResp.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
        "";

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Strip code fences if present
        const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        parsed = JSON.parse(cleaned);
      }

      return res.json(parsed);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "Unknown error" });
    }
  });

  // Multimodal AI graph grading via Gemini (vision)
  app.post("/api/grade-graph", async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: "AI graph grading unavailable: GEMINI_API_KEY not configured.",
      });
    }

    try {
      const { prompt, rubric, imageBase64, mimeType, studentNotes } = req.body || {};
      if (!prompt || !rubric || !imageBase64) {
        return res
          .status(400)
          .json({ error: "Missing prompt, rubric, or imageBase64." });
      }

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
- fiveOutOfFiveDescription is a 3 to 6 sentence plain-English description of what a perfect drawing for this prompt would contain.

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
        return res.status(502).json({
          error: `Gemini API error: ${geminiResp.status}`,
          detail: errText.slice(0, 500),
        });
      }

      const data: any = await geminiResp.json();
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

      return res.json(parsed);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "Unknown error" });
    }
  });

  return httpServer;
}
