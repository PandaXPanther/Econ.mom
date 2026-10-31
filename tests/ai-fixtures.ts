export const frq = {
  id: "test-frq", exam: "macro", year: 2025, title: "Demand shock", prompt: "Explain an increase in AD.", topics: ["AD/AS"],
  parts: [{ id: "a", label: "(a)", prompt: "Explain output.", rubricPoints: [{ id: "a-i", prompt: "Output rises", points: 1, idealAnswer: "Output rises in the short run.", keywords: ["output", "rises"] }] }],
};
export const grade = {
  totalEarned: 1, totalPossible: 1, overallFeedback: "Correct.", idealRewrite: "Output rises in the short run.",
  parts: [{ partId: "a", partLabel: "(a)", earnedInPart: 1, possibleInPart: 1, points: [{ pointId: "a-i", prompt: "Output rises", earned: 1, possible: 1, verdict: "full", feedback: "Correct.", idealAnswer: "Output rises in the short run." }] }],
};
export const fixtures = [
  { name: "gemini-shock", input: { headline: "Oil supply falls" }, output: { type: "supply_decrease", market: "Oil", magnitude: "medium", priceChangePct: 5, quantityChangePct: -2, elasticityDemand: 0.4, elasticitySupply: 1, shiftPct: -7, reasoning: "A supply contraction raises price.", historicalAnalogs: [{ event: "Oil shock", year: 1973, outcome: "Higher oil prices" }], watchVariables: [{ label: "WTI", fredSeries: "DCOILWTICO", source: "FRED", sourceUrl: "https://untrusted.example/" }] } },
  { name: "gemini-news", input: { headline: "Government spending increases" }, output: { model: "ADAS", curve: "AD", direction: "right", shortRun: "Output rises.", longRun: "Prices adjust.", magnitudeNumbers: { gdpEffectPct: 1, inflationEffectPp: 0.3, unemploymentEffectPp: -0.5, policyRateEffectBps: 25, horizonMonths: 6 }, fredSeries: ["GDPC1"], historicalAnalog: { event: "Stimulus", date: "2009", outcome: "Recovery", magnitude: "1%" }, forecast: { watch: "GDP", range: "0-2%", confidence: "low", reasoning: "Illustrative." } } },
  { name: "gemini-paper", input: { text: "A paper about employment and wages." }, output: { title: "Employment", authors: ["A. Author"], journal: "Test", year: 2024, abstract: "Employment study.", identification: "RCT", finding: "Output rises.", magnitude: "1%", limitations: "Sample size", citation30s: "An RCT.", fredSeries: ["UNRATE"], policyRelevance: "Illustrative." } },
  { name: "gemini-preset", input: { description: "Zero interest rates" }, output: { topMarginalTax: 37, corporateTax: 21, welfareSpending: 14, fedFundsRate: 0, label: "Zero rates", regime: "Expansion", rationale: "Stimulus", expectedRegime: "Expansion" } },
  { name: "gemini-scenario", input: { description: "What if rates stayed low?" }, output: { id: "test", title: "Lower rates", era: "2008", question: "What if?", context: "Illustrative", outcomeUnit: "%", outcomeLabel: "GDP", params: [{ key: "rate", label: "Rate", description: "Interest", min: 0, max: 10, step: 0.25, defaultActual: 4, defaultCounterfactual: 0, unit: "%", coefficient: -1 }], series: [{ t: "2008", actual: 1 }], citations: [{ label: "GDP", url: "https://fred.stlouisfed.org/series/GDPC1" }] } },
  { name: "gemini-inflation-explain", input: { headlineCpi: 3, components: { energy: 1, shelter: 2 } }, output: { narrative: "CPI is 3%.", drivers: [{ name: "Shelter", contribution: 2, explanation: "Rent", outlook: "Sticky" }], supplyVsDemand: { supplyPp: 1, demandPp: 2, explanation: "Illustrative" }, fedImplication: "Watch inflation.", historicalContext: "Illustrative", watchNext: ["CPIAUCSL"] } },
  { name: "generate-frq", input: { topic: "AD/AS", exam: "macro" }, output: frq },
  { name: "grade-frq", input: { frq, responses: { a: "Output rises." } }, output: grade },
  { name: "tariff-sector-data", input: { sector: "wine" }, output: { id: "wine", label: "Imported wine", hsPrefix: "HS 2204", importDemandElasticity: 2, exportSupplyElasticity: 3, laborIntensity: 1, baselineImports: 6, baselineDomesticOutput: 10, baselineWorldPrice: 100, description: "US wine imports", sources: ["USITC"], priceSeries: [{ month: "2026-10", index: 100 }], tariffHistory: "Illustrative", retaliationRisk: "Possible" } },
];

export function envelope(value: unknown) {
  return { status: "completed", output: [{ type: "reasoning", summary: [] }, { type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(value) }] }] };
}
