// AP Econ FRQ Rubric Engine
// Based on published College Board scoring guidelines 2018–2025.
// Each rubric point contains (1) required terms/concepts, (2) graph elements,
// and (3) a target response. The engine scores a student response against these.

export type RubricCheckType = "terms-all" | "terms-any" | "graph" | "numeric" | "direction";

export interface RubricPoint {
  id: string;
  points: number;
  prompt: string;
  checkType: RubricCheckType;
  // For terms-all / terms-any: arrays of term synonyms. Each inner array is a required concept.
  requiredTerms?: string[][];
  // For graph: required graph element labels.
  graphElements?: string[];
  // For numeric: expected value and tolerance.
  numeric?: { value: number; tolerance: number; unit?: string };
  // For direction: up/down/increase/decrease language about a specific variable.
  direction?: { variable: string; direction: "increase" | "decrease" | "no change" };
  idealAnswer: string;  // the 5/5 response to this rubric point
  explainIfMissed: string; // feedback if student missed this point
}

export interface FRQ {
  id: string;
  year: number;
  exam: "macro" | "micro";
  frqNumber: number;
  title: string;
  prompt: string;          // full question prompt
  parts: FRQPart[];
  topic: string;
}

export interface FRQPart {
  id: string;
  label: string;           // "(a)", "(b)(i)", etc
  prompt: string;
  rubricPoints: RubricPoint[];
}

// A curated library of recent, well-known AP Econ FRQs with faithful rubric reconstructions.
// (Official CB scoring guidelines are the source; wording simplified for display.)
export const FRQ_LIBRARY: FRQ[] = [
  {
    id: "macro-2023-1",
    year: 2023,
    exam: "macro",
    frqNumber: 1,
    title: "AP Macro 2023 · FRQ 1 (Long)",
    topic: "SRAS/LRAS shock → monetary policy response",
    prompt:
      "Assume the economy of Country X is currently in a recession. Changes in stock prices have caused consumer wealth to decrease.",
    parts: [
      {
        id: "a",
        label: "(a)",
        prompt:
          "Using a correctly labeled graph of AD/AS, show each of the following: (i) the current short-run equilibrium output and price level, labeled Y1 and PL1; (ii) the long-run aggregate supply curve, labeled LRAS; (iii) full-employment output, labeled Yf.",
        rubricPoints: [
          {
            id: "a-graph",
            points: 3,
            prompt: "Correctly labeled AD/AS graph showing Y1 < Yf and PL1",
            checkType: "graph",
            graphElements: ["AD", "SRAS", "LRAS", "Y1", "Yf", "PL1"],
            idealAnswer:
              "A correctly labeled AD/AS diagram with: axes labeled 'Price Level' (vertical) and 'Real GDP' (horizontal); downward-sloping AD; upward-sloping SRAS; vertical LRAS at Yf; short-run equilibrium at intersection of AD and SRAS, with Y1 < Yf and PL1 shown.",
            explainIfMissed:
              "Missing graph elements or labels. On AP Macro graphs, always label BOTH axes, all three curves (AD, SRAS, LRAS), and the specific values requested (Y1, PL1, Yf). Y1 must be shown to the LEFT of Yf to indicate recession.",
          },
        ],
      },
      {
        id: "b",
        label: "(b)",
        prompt:
          "Given the decrease in consumer wealth, what happens to aggregate demand in the short run? Explain.",
        rubricPoints: [
          {
            id: "b-direction",
            points: 1,
            prompt: "States AD decreases / shifts left",
            checkType: "direction",
            direction: { variable: "AD", direction: "decrease" },
            requiredTerms: [["aggregate demand", "AD"], ["decrease", "decreases", "shift left", "shifts left", "leftward", "falls", "lower"]],
            idealAnswer:
              "Aggregate demand decreases (shifts left) because a decrease in consumer wealth reduces consumption spending, which is a component of AD.",
            explainIfMissed:
              "Must explicitly say AD decreases/shifts left. Must explain the mechanism: lower wealth → lower consumption → lower AD. Both the direction AND the explanation are needed.",
          },
        ],
      },
      {
        id: "c",
        label: "(c)",
        prompt:
          "Assume the Federal Reserve wants to return the economy to full employment using open-market operations. What specific action should the Fed take?",
        rubricPoints: [
          {
            id: "c-action",
            points: 1,
            prompt: "States Fed should buy bonds / Treasury securities",
            checkType: "terms-all",
            requiredTerms: [["buy", "purchase", "buys", "purchases"], ["bonds", "treasury securities", "government securities", "treasuries"]],
            idealAnswer:
              "The Federal Reserve should BUY government bonds (Treasury securities) in the open market.",
            explainIfMissed:
              "Expansionary OMO = Fed BUYS bonds. A common error is saying 'the Fed lowers interest rates' — that's the OUTCOME, not the OMO action. The action is buying bonds.",
          },
        ],
      },
      {
        id: "d",
        label: "(d)",
        prompt:
          "Based on your answer in part (c), what happens to each of the following in the short run?\n(i) The nominal interest rate. Explain.\n(ii) Investment spending.",
        rubricPoints: [
          {
            id: "d-i",
            points: 2,
            prompt: "Nominal interest rate decreases; explains via money supply increase → MS shifts right → i falls",
            checkType: "terms-all",
            requiredTerms: [
              ["nominal interest rate", "interest rate", "i", "r"],
              ["decrease", "decreases", "fall", "falls", "lower", "lowers", "drops"],
              ["money supply", "MS", "reserves"],
            ],
            idealAnswer:
              "The nominal interest rate decreases. When the Fed buys bonds, it increases the money supply. With a greater money supply and unchanged money demand, the equilibrium nominal interest rate falls.",
            explainIfMissed:
              "Need both: (1) interest rate DECREASES, and (2) explanation tied to money supply INCREASING (MS shifts right, MD unchanged → i falls).",
          },
          {
            id: "d-ii",
            points: 1,
            prompt: "Investment spending increases",
            checkType: "direction",
            direction: { variable: "investment", direction: "increase" },
            requiredTerms: [["investment"], ["increase", "increases", "rise", "rises", "higher"]],
            idealAnswer: "Investment spending increases, because lower interest rates reduce the cost of borrowing.",
            explainIfMissed:
              "Investment and interest rates move inversely. Lower i → higher I.",
          },
        ],
      },
    ],
  },
  {
    id: "micro-2022-1",
    year: 2022,
    exam: "micro",
    frqNumber: 1,
    title: "AP Micro 2022 · FRQ 1 (Long)",
    topic: "Perfectly competitive firm earning losses",
    prompt:
      "Sun Orchards is a producer of apples in a perfectly competitive market and is currently producing at its profit-maximizing level of output but earning losses.",
    parts: [
      {
        id: "a",
        label: "(a)",
        prompt:
          "Draw correctly labeled side-by-side graphs for the market and for Sun Orchards, showing (i) the market price P*; (ii) the firm's profit-maximizing quantity Q*; (iii) the area of economic losses, shaded.",
        rubricPoints: [
          {
            id: "a-graph",
            points: 4,
            prompt: "Side-by-side market + firm graphs with P*, Q*, MC, ATC, loss area",
            checkType: "graph",
            graphElements: ["market", "firm", "P*", "Q*", "MC", "ATC", "MR", "loss"],
            idealAnswer:
              "Two side-by-side graphs. Market: D and S, equilibrium at P*, Qm. Firm: MC upward-sloping, ATC U-shaped and lying ABOVE the horizontal MR = P* line at Q*. Q* where MC = MR. Losses shaded as the rectangle between ATC and P* across quantity 0 to Q*.",
            explainIfMissed:
              "Classic pitfalls: forgetting to draw BOTH graphs; putting ATC below the MR line (that would be profit, not loss); forgetting to shade the loss rectangle; forgetting MR = P horizontal line for the perfectly-competitive firm.",
          },
        ],
      },
      {
        id: "b",
        label: "(b)",
        prompt:
          "If the market price remains at P*, will Sun Orchards continue to produce in the short run? Explain using specific cost concepts.",
        rubricPoints: [
          {
            id: "b-decision",
            points: 2,
            prompt: "Depends on whether P > AVC (shutdown rule)",
            checkType: "terms-all",
            requiredTerms: [["AVC", "average variable cost"], ["P", "price"], ["shut down", "shutdown", "continue", "produce"]],
            idealAnswer:
              "Sun Orchards should continue to produce if P > AVC, because it can cover all of its variable costs plus some fixed costs. If P < AVC, it should shut down because it cannot even cover variable costs.",
            explainIfMissed:
              "Use the SHUTDOWN RULE explicitly: compare P to AVC. Do not compare P to ATC for the shutdown decision — that's the profit decision, not the shutdown decision.",
          },
        ],
      },
      {
        id: "c",
        label: "(c)",
        prompt:
          "In the long run, assuming no change in demand, will the market price increase, decrease, or stay the same? Explain.",
        rubricPoints: [
          {
            id: "c-price",
            points: 2,
            prompt: "Price increases, because firms exit, shifting market supply left",
            checkType: "terms-all",
            requiredTerms: [["exit", "leave"], ["supply", "S"], ["increase", "rise", "higher", "up"]],
            idealAnswer:
              "The market price will INCREASE. In the long run, firms earning losses will exit the industry. As firms exit, market supply decreases (shifts left), and equilibrium price rises until remaining firms earn zero economic profit.",
            explainIfMissed:
              "Must chain all three: firms EXIT → market SUPPLY shifts LEFT → PRICE rises. Missing any link costs a rubric point.",
          },
        ],
      },
    ],
  },
  {
    id: "macro-2024-2",
    year: 2024,
    exam: "macro",
    frqNumber: 2,
    title: "AP Macro 2024 · FRQ 2 (Short)",
    topic: "Money market & loanable funds",
    prompt:
      "Assume the economy of Country Z is operating at full employment.",
    parts: [
      {
        id: "a",
        label: "(a)",
        prompt:
          "Assume the central bank increases the money supply. Using a correctly labeled graph of the money market, show the impact on the nominal interest rate.",
        rubricPoints: [
          {
            id: "a-graph",
            points: 2,
            prompt: "Money market graph with MS shift right; i falls",
            checkType: "graph",
            graphElements: ["money market", "MS", "MD", "nominal interest rate", "i"],
            idealAnswer:
              "Money market graph: vertical axis 'Nominal Interest Rate (i)', horizontal axis 'Quantity of Money'. MS vertical (or near-vertical), MD downward-sloping. MS shifts right to MS2. New equilibrium interest rate i2 < i1.",
            explainIfMissed:
              "Label axes. The money supply is vertical (perfectly inelastic). MD is downward-sloping. When MS shifts right, show BOTH the old and new interest rates and the new intersection.",
          },
        ],
      },
      {
        id: "b",
        label: "(b)",
        prompt:
          "Given the change in the nominal interest rate in part (a), what happens to the international value of Country Z's currency? Explain.",
        rubricPoints: [
          {
            id: "b",
            points: 2,
            prompt: "Currency depreciates; explains capital outflow",
            checkType: "terms-all",
            requiredTerms: [
              ["depreciate", "depreciates", "weaken", "weakens", "falls", "decrease"],
              ["financial", "capital", "investment", "demand"],
            ],
            idealAnswer:
              "The currency will depreciate. Lower nominal interest rates in Country Z reduce the return on Country Z's financial assets relative to other countries, so financial capital flows out. This decreases demand for Country Z's currency (and/or increases supply of it), causing it to depreciate.",
            explainIfMissed:
              "Two parts needed: (1) currency DEPRECIATES, and (2) the capital-flow mechanism — lower i means foreigners want fewer of Country Z's assets, demand for the currency falls, currency depreciates.",
          },
        ],
      },
    ],
  },
];

// Grading engine
export interface GradeResult {
  totalEarned: number;
  totalPossible: number;
  parts: PartGrade[];
  overallFeedback: string;
  idealRewrite: string;
}

export interface PartGrade {
  partId: string;
  partLabel: string;
  points: PointGrade[];
  earnedInPart: number;
  possibleInPart: number;
}

export interface PointGrade {
  pointId: string;
  prompt: string;
  earned: number;
  possible: number;
  verdict: "full" | "partial" | "none";
  feedback: string;
  idealAnswer: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,;:!?"']/g, " ").replace(/\s+/g, " ").trim();
}

function hasAnyOf(text: string, synonyms: string[]): boolean {
  const t = normalize(text);
  return synonyms.some((s) => t.includes(normalize(s)));
}

function hasAllConcepts(text: string, concepts: string[][]): boolean {
  return concepts.every((synonyms) => hasAnyOf(text, synonyms));
}

function partialConceptMatch(text: string, concepts: string[][]): number {
  const matched = concepts.filter((syns) => hasAnyOf(text, syns)).length;
  return matched / concepts.length;
}

export function gradePart(partResponse: string, part: FRQPart): PartGrade {
  const grades: PointGrade[] = part.rubricPoints.map((rp) => {
    let earned = 0;
    let verdict: PointGrade["verdict"] = "none";
    let feedback = "";

    const resp = partResponse || "";

    if (rp.checkType === "graph") {
      const elements = rp.graphElements || [];
      const matched = elements.filter((e) => normalize(resp).includes(normalize(e))).length;
      const ratio = matched / Math.max(1, elements.length);
      if (ratio >= 0.9) {
        earned = rp.points;
        verdict = "full";
        feedback = `Full marks. Your description covered all required graph elements (${elements.join(", ")}).`;
      } else if (ratio >= 0.55) {
        earned = Math.max(1, Math.floor(rp.points * ratio));
        verdict = "partial";
        const missing = elements.filter((e) => !normalize(resp).includes(normalize(e)));
        feedback = `Partial. Your description covered most elements, but graders looked for these and couldn't find them: ${missing.join(", ")}. ${rp.explainIfMissed}`;
      } else {
        earned = 0;
        verdict = "none";
        feedback = `Not yet. Graph FRQs are scored on EXPLICIT labels. ${rp.explainIfMissed}`;
      }
    } else if (rp.checkType === "terms-all" && rp.requiredTerms) {
      const ratio = partialConceptMatch(resp, rp.requiredTerms);
      if (ratio >= 0.999) {
        earned = rp.points;
        verdict = "full";
        feedback = "Full marks. All required concepts present.";
      } else if (ratio >= 0.5) {
        earned = Math.max(0, rp.points - 1);
        verdict = "partial";
        const missing = rp.requiredTerms
          .filter((syns) => !hasAnyOf(resp, syns))
          .map((syns) => syns[0]);
        feedback = `Partial. You're close, but graders look for these concepts by name: ${missing.join(" / ")}. ${rp.explainIfMissed}`;
      } else {
        earned = 0;
        verdict = "none";
        feedback = rp.explainIfMissed;
      }
    } else if (rp.checkType === "direction" && rp.direction) {
      const variableHit = rp.requiredTerms ? hasAnyOf(resp, rp.requiredTerms[0]) : normalize(resp).includes(normalize(rp.direction.variable));
      const directionHit = rp.requiredTerms ? hasAnyOf(resp, rp.requiredTerms[1]) : hasAnyOf(resp, [rp.direction.direction, rp.direction.direction + "s"]);
      if (variableHit && directionHit) {
        earned = rp.points;
        verdict = "full";
        feedback = "Full marks. Variable and direction stated clearly.";
      } else if (variableHit || directionHit) {
        earned = 0;
        verdict = "partial";
        feedback = `Partial. ${rp.explainIfMissed}`;
      } else {
        earned = 0;
        verdict = "none";
        feedback = rp.explainIfMissed;
      }
    } else {
      feedback = rp.explainIfMissed;
    }

    return {
      pointId: rp.id,
      prompt: rp.prompt,
      earned,
      possible: rp.points,
      verdict,
      feedback,
      idealAnswer: rp.idealAnswer,
    };
  });

  const earnedInPart = grades.reduce((s, g) => s + g.earned, 0);
  const possibleInPart = grades.reduce((s, g) => s + g.possible, 0);

  return {
    partId: part.id,
    partLabel: part.label,
    points: grades,
    earnedInPart,
    possibleInPart,
  };
}

export function gradeFRQ(responses: Record<string, string>, frq: FRQ): GradeResult {
  const parts = frq.parts.map((part) => gradePart(responses[part.id] || "", part));
  const totalEarned = parts.reduce((s, p) => s + p.earnedInPart, 0);
  const totalPossible = parts.reduce((s, p) => s + p.possibleInPart, 0);

  const pct = totalEarned / Math.max(1, totalPossible);
  let overallFeedback = "";
  if (pct >= 0.9) {
    overallFeedback = "Outstanding. This response would likely earn a 5 on the full exam. Clean, precise, rubric-aligned language.";
  } else if (pct >= 0.7) {
    overallFeedback = "Strong response. You understand the material — missed points are usually about rubric-aligned WORDING rather than understanding. Study the 'Ideal rewrite' below to see the exact phrasing graders reward.";
  } else if (pct >= 0.4) {
    overallFeedback = "Work in progress. You have the right ideas but miss the specific rubric terms graders are trained to look for. Study the ideal rewrite — AP Econ FRQs reward the exact language.";
  } else {
    overallFeedback = "Not yet. Re-read the ideal rewrite below line-by-line. On AP Econ FRQs, graders look for specific terms and direction statements — 'AD decreases', 'price depreciates', 'Fed BUYS bonds'. Vague description earns zero.";
  }

  const idealRewrite = frq.parts
    .map((p) => {
      const answers = p.rubricPoints.map((rp) => rp.idealAnswer).join(" ");
      return `**${p.label}** ${answers}`;
    })
    .join("\n\n");

  return {
    totalEarned,
    totalPossible,
    parts,
    overallFeedback,
    idealRewrite,
  };
}
