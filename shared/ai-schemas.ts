// JSON contracts consumed by the existing tool pages. All fields are required
// for OpenAI strict Structured Outputs; nullable fields represent absence.
export type JSONSchema = {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JSONSchema;
  enum?: string[];
  anyOf?: JSONSchema[];
};
const s: JSONSchema = { type: "string" };
const n: JSONSchema = { type: "number" };
const strings: JSONSchema = { type: "array", items: s };
const nullableString: JSONSchema = { type: ["string", "null"] };
const array = (items: JSONSchema): JSONSchema => ({ type: "array", items });
const choice = (...values: string[]): JSONSchema => ({ type: "string", enum: values });
const object = (properties: Record<string, JSONSchema>): JSONSchema => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

const sector = object({
  id: s, label: s, hsPrefix: s, importDemandElasticity: n, exportSupplyElasticity: n, laborIntensity: n,
  baselineImports: n, baselineDomesticOutput: n, baselineWorldPrice: n, description: s, sources: strings,
  priceSeries: array(object({ month: s, index: n })), tariffHistory: s, retaliationRisk: s,
});

export const aiSchemas = {
  shock: object({
    type: choice("demand_increase", "demand_decrease", "supply_increase", "supply_decrease"), market: s,
    magnitude: choice("small", "medium", "large"), priceChangePct: n, quantityChangePct: n,
    elasticityDemand: n, elasticitySupply: n, shiftPct: n, reasoning: s,
    historicalAnalogs: array(object({ event: s, year: n, outcome: s })),
    watchVariables: array(object({ label: s, fredSeries: nullableString, source: s, sourceUrl: s })),
  }),
  news: object({
    model: choice("ADAS", "Phillips", "LoanableFunds", "ForexAD", "MoneyMarket", "PPF"), curve: s,
    direction: choice("left", "right", "up", "down"), shortRun: s, longRun: s,
    magnitudeNumbers: object({ gdpEffectPct: n, inflationEffectPp: n, unemploymentEffectPp: n, policyRateEffectBps: n, horizonMonths: n }),
    fredSeries: strings, historicalAnalog: object({ event: s, date: s, outcome: s, magnitude: s }),
    forecast: object({ watch: s, range: s, confidence: choice("low", "medium", "high"), reasoning: s }),
  }),
  paper: object({ title: s, authors: strings, journal: s, year: n, abstract: s, identification: s, finding: s, magnitude: s, limitations: s, citation30s: s, fredSeries: strings, policyRelevance: s }),
  preset: object({ topMarginalTax: n, corporateTax: n, welfareSpending: n, fedFundsRate: n, label: s, regime: s, rationale: s, expectedRegime: s }),
  scenario: object({
    id: s, title: s, era: s, question: s, context: s, outcomeUnit: s, outcomeLabel: s,
    params: array(object({ key: s, label: s, description: s, min: n, max: n, step: n, defaultActual: n, defaultCounterfactual: n, unit: s, coefficient: n })),
    series: array(object({ t: s, actual: n })), citations: array(object({ label: s, url: s })),
  }),
  inflation: object({
    narrative: s, drivers: array(object({ name: s, contribution: n, explanation: s, outlook: s })),
    supplyVsDemand: object({ supplyPp: n, demandPp: n, explanation: s }), fedImplication: s, historicalContext: s, watchNext: strings,
  }),
  frq: object({
    id: s, exam: choice("macro", "micro"), year: n, title: s, prompt: s, topics: strings,
    parts: array(object({ id: s, label: s, prompt: s, rubricPoints: array(object({ id: s, prompt: s, points: n, idealAnswer: s, keywords: strings })) })),
  }),
  grade: object({
    totalEarned: n, totalPossible: n, overallFeedback: s, idealRewrite: s,
    parts: array(object({ partId: s, partLabel: s, earnedInPart: n, possibleInPart: n,
      points: array(object({ pointId: s, prompt: s, earned: n, possible: n, verdict: choice("full", "partial", "none"), feedback: s, idealAnswer: s })),
    })),
  }),
  // A nested union keeps the API's required object root while retaining the
  // existing 422 response for an unrecognized commodity.
  sector: object({ result: { anyOf: [sector, object({ error: s })] } }),
} satisfies Record<string, JSONSchema>;

/** Validate at the trust boundary as well as requesting strict output. */
export function matchesSchema(value: unknown, schema: JSONSchema): boolean {
  if (schema.anyOf) return schema.anyOf.some((item) => matchesSchema(value, item));
  if (Array.isArray(schema.type)) return schema.type.some((type) => matchesSchema(value, { ...schema, type }));
  if (schema.enum && !schema.enum.includes(value as string)) return false;
  switch (schema.type) {
    case "null": return value === null;
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "array": return Array.isArray(value) && value.every((item) => matchesSchema(item, schema.items!));
    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const record = value as Record<string, unknown>;
      return (schema.required || []).every((key) => Object.hasOwn(record, key))
        && Object.entries(record).every(([key, item]) => !!schema.properties?.[key] && matchesSchema(item, schema.properties[key]));
    }
    default: return false;
  }
}
