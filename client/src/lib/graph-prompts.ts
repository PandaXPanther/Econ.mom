// Canonical AP Macro / Micro graph prompts.
// Each prompt gives the student a clear "draw this" task plus the rubric points
// the College Board would award for that diagram. The rubric is shown to Gemini
// alongside the student's drawn image so the AI can score the actual sketch.

export interface GraphRubricPoint {
  id: string;
  prompt: string;          // what the AP grader is checking for
  points: number;          // usually 1
}

export interface GraphPrompt {
  id: string;
  exam: "macro" | "micro";
  unit: string;            // AP CED unit
  title: string;           // short label
  scenario: string;        // the question stem ("Suppose the Fed raises…")
  drawTask: string;        // the explicit drawing instructions
  axes: { x: string; y: string };
  hint: string;            // a one-liner cue for stuck students
  rubric: GraphRubricPoint[];
}

export const GRAPH_PROMPTS: GraphPrompt[] = [
  // ---------------- AP MACRO ----------------
  {
    id: "asad-expansionary-fiscal",
    exam: "macro",
    unit: "Macro Unit 3",
    title: "AS-AD: Expansionary Fiscal Policy",
    scenario:
      "The economy is currently in a recession. Congress passes a $500B tax cut and increased government spending package.",
    drawTask:
      "Draw a correctly labeled AS-AD graph showing the economy in a recession, then show the impact of the expansionary fiscal policy.",
    axes: { x: "Real GDP (Y)", y: "Price Level (PL)" },
    hint: "AD shifts right. Mark Y1, Y2, PL1, PL2. Show Y* (LRAS) somewhere to the right of Y1.",
    rubric: [
      { id: "axes", prompt: "Both axes correctly labeled (Price Level on Y, Real GDP / Y on X).", points: 1 },
      { id: "ad-srAS-lrAS", prompt: "AD curve, SRAS curve, and LRAS curve all drawn and labeled.", points: 1 },
      { id: "recession-equilibrium", prompt: "Initial equilibrium shown to the LEFT of LRAS (recessionary gap).", points: 1 },
      { id: "ad-shift-right", prompt: "AD shifts right (AD1 to AD2) in response to expansionary fiscal policy.", points: 1 },
      { id: "new-equilibrium", prompt: "New equilibrium labeled with higher price level and higher real GDP.", points: 1 },
    ],
  },
  {
    id: "money-market-fed-hike",
    exam: "macro",
    unit: "Macro Unit 4",
    title: "Money Market: Fed Hikes Rates",
    scenario:
      "The Federal Reserve sells government bonds in the open market to fight inflation.",
    drawTask:
      "Draw a correctly labeled money market graph showing the impact of the Fed's open market sale on the nominal interest rate.",
    axes: { x: "Quantity of Money", y: "Nominal Interest Rate (i)" },
    hint: "Money supply is vertical. An open market sale shifts MS LEFT, raising i.",
    rubric: [
      { id: "axes", prompt: "Y-axis labeled Nominal Interest Rate (or i). X-axis labeled Quantity of Money.", points: 1 },
      { id: "ms-vertical", prompt: "Money supply (MS) drawn as a VERTICAL line.", points: 1 },
      { id: "md-downward", prompt: "Money demand (MD) drawn as a downward-sloping curve.", points: 1 },
      { id: "ms-shift-left", prompt: "Money supply shifts LEFT (MS1 to MS2) in response to the open market sale.", points: 1 },
      { id: "i-rises", prompt: "New equilibrium interest rate (i2) is higher than original (i1).", points: 1 },
    ],
  },
  {
    id: "loanable-funds-deficit",
    exam: "macro",
    unit: "Macro Unit 4",
    title: "Loanable Funds: Government Deficit",
    scenario:
      "The federal government runs a large budget deficit and finances it by borrowing.",
    drawTask:
      "Draw a correctly labeled loanable funds market showing the impact of the government deficit on the real interest rate.",
    axes: { x: "Quantity of Loanable Funds", y: "Real Interest Rate (r)" },
    hint: "Government borrowing shifts demand for loanable funds RIGHT (crowding out).",
    rubric: [
      { id: "axes", prompt: "Y-axis labeled Real Interest Rate (or r). X-axis labeled Quantity of Loanable Funds.", points: 1 },
      { id: "supply-demand", prompt: "Supply of loanable funds (upward) and Demand (downward) drawn and labeled.", points: 1 },
      { id: "demand-shift-right", prompt: "Demand for loanable funds shifts RIGHT (D1 to D2).", points: 1 },
      { id: "r-rises", prompt: "New equilibrium real interest rate (r2) is higher than (r1).", points: 1 },
    ],
  },
  {
    id: "phillips-curve-supply-shock",
    exam: "macro",
    unit: "Macro Unit 5",
    title: "Phillips Curve: Adverse Supply Shock",
    scenario:
      "A major oil price spike (adverse supply shock) hits the economy.",
    drawTask:
      "Draw a correctly labeled short-run Phillips curve and show the impact of the adverse supply shock.",
    axes: { x: "Unemployment Rate (u)", y: "Inflation Rate (π)" },
    hint: "SRPC shifts UP / RIGHT. LRPC stays vertical at the natural rate.",
    rubric: [
      { id: "axes", prompt: "Y-axis labeled Inflation Rate (π). X-axis labeled Unemployment Rate (u).", points: 1 },
      { id: "srpc-lrpc", prompt: "Both Short-Run Phillips Curve (downward-sloping) and Long-Run Phillips Curve (vertical at NAIRU) drawn and labeled.", points: 1 },
      { id: "srpc-shift", prompt: "SRPC shifts UP / RIGHT (SRPC1 to SRPC2) in response to the adverse supply shock.", points: 1 },
      { id: "stagflation", prompt: "New short-run equilibrium shows BOTH higher inflation AND higher unemployment.", points: 1 },
    ],
  },
  {
    id: "forex-dollar-appreciation",
    exam: "macro",
    unit: "Macro Unit 6",
    title: "Foreign Exchange: Dollar Appreciation",
    scenario:
      "US interest rates rise relative to the Eurozone, attracting foreign capital into US assets.",
    drawTask:
      "Draw a correctly labeled foreign exchange market for the US dollar showing the impact of the interest rate differential.",
    axes: { x: "Quantity of US Dollars", y: "Exchange Rate (€ per $)" },
    hint: "Demand for dollars shifts RIGHT. Dollar appreciates.",
    rubric: [
      { id: "axes", prompt: "Y-axis labeled Exchange Rate (€/$ or price of dollars). X-axis labeled Quantity of Dollars.", points: 1 },
      { id: "supply-demand", prompt: "Supply of dollars (upward) and Demand for dollars (downward) drawn and labeled.", points: 1 },
      { id: "demand-shift-right", prompt: "Demand for dollars shifts RIGHT (D1 to D2).", points: 1 },
      { id: "appreciation", prompt: "New equilibrium exchange rate is HIGHER (dollar appreciates).", points: 1 },
    ],
  },

  // ---------------- AP MICRO ----------------
  {
    id: "perfect-comp-firm-profit",
    exam: "micro",
    unit: "Micro Unit 3",
    title: "Perfectly Competitive Firm: Short-Run Profit",
    scenario:
      "A perfectly competitive firm in a market is currently earning short-run economic profit.",
    drawTask:
      "Draw a correctly labeled side-by-side graph: market on the left, firm on the right. Show the firm earning short-run economic profit.",
    axes: { x: "Quantity (Q)", y: "Price / Costs ($)" },
    hint: "Firm's MR = D = P (horizontal at market price). Profit rectangle = (P - ATC) × Q.",
    rubric: [
      { id: "axes", prompt: "Both axes labeled (Y: Price / Costs, X: Quantity) on both market and firm graphs.", points: 1 },
      { id: "market-side", prompt: "Market graph shows downward-sloping market demand and upward-sloping market supply meeting at equilibrium price P*.", points: 1 },
      { id: "firm-curves", prompt: "Firm graph shows MC (upward), ATC (U-shaped), and a horizontal MR = D = P at the market equilibrium price.", points: 1 },
      { id: "profit-max-q", prompt: "Firm produces at Q where MR = MC.", points: 1 },
      { id: "profit-rectangle", prompt: "Positive economic profit shown as a shaded rectangle: (P - ATC) at the profit-max Q.", points: 1 },
    ],
  },
  {
    id: "monopoly-graph",
    exam: "micro",
    unit: "Micro Unit 4",
    title: "Monopoly: Profit-Maximizing Output",
    scenario:
      "A profit-maximizing monopoly faces a downward-sloping market demand curve.",
    drawTask:
      "Draw a correctly labeled monopoly graph showing the profit-maximizing quantity, the price, and the area of economic profit (or loss).",
    axes: { x: "Quantity (Q)", y: "Price / Costs ($)" },
    hint: "MR is below D. Find Q where MR = MC, then go UP to D for the price.",
    rubric: [
      { id: "axes", prompt: "Axes labeled (Y: Price / Costs, X: Quantity).", points: 1 },
      { id: "curves", prompt: "Demand (D), Marginal Revenue (MR, below D and steeper), MC, and ATC all drawn and labeled.", points: 1 },
      { id: "qm-mr-mc", prompt: "Profit-maximizing quantity Qm where MR = MC.", points: 1 },
      { id: "pm-on-d", prompt: "Price Pm read off the demand curve at Qm (Pm > MR at Qm).", points: 1 },
      { id: "profit-area", prompt: "Economic profit (or loss) shown as the rectangle (Pm - ATC at Qm) × Qm.", points: 1 },
    ],
  },
  {
    id: "negative-externality",
    exam: "micro",
    unit: "Micro Unit 6",
    title: "Negative Production Externality",
    scenario:
      "A factory pollutes a river while producing chemicals, imposing costs on downstream communities.",
    drawTask:
      "Draw a correctly labeled supply and demand graph showing a negative production externality, including the marginal social cost (MSC), marginal private cost (MPC), and the deadweight loss.",
    axes: { x: "Quantity (Q)", y: "Price / Cost ($)" },
    hint: "MSC is ABOVE MPC by the size of the external cost. Qmarket > Qsocial.",
    rubric: [
      { id: "axes", prompt: "Axes labeled (Y: Price/Cost, X: Quantity).", points: 1 },
      { id: "demand-msb", prompt: "Demand curve (= MSB) drawn downward-sloping and labeled.", points: 1 },
      { id: "mpc-msc", prompt: "MPC and MSC both drawn, with MSC ABOVE MPC by the external cost.", points: 1 },
      { id: "qmkt-qsoc", prompt: "Market quantity (Qm where MPC = D) labeled and Socially Optimal Q (Q* where MSC = D) labeled, with Qm > Q*.", points: 1 },
      { id: "dwl", prompt: "Deadweight loss triangle shaded between MSC, MPC, and the Q axis from Q* to Qm.", points: 1 },
    ],
  },
  {
    id: "labor-market-min-wage",
    exam: "micro",
    unit: "Micro Unit 5",
    title: "Labor Market: Binding Minimum Wage",
    scenario:
      "The government sets a minimum wage above the market equilibrium wage.",
    drawTask:
      "Draw a correctly labeled labor market graph showing the impact of the binding minimum wage on employment and unemployment.",
    axes: { x: "Quantity of Labor (L)", y: "Wage Rate (W)" },
    hint: "Min wage is a horizontal line ABOVE equilibrium W. Quantity supplied > quantity demanded = unemployment.",
    rubric: [
      { id: "axes", prompt: "Y-axis labeled Wage. X-axis labeled Quantity of Labor.", points: 1 },
      { id: "supply-demand", prompt: "Labor supply (upward) and labor demand (downward) drawn and labeled.", points: 1 },
      { id: "min-wage-line", prompt: "Minimum wage drawn as a horizontal line ABOVE the equilibrium wage.", points: 1 },
      { id: "employment", prompt: "New employment level shown at the quantity demanded at the minimum wage (lower than equilibrium).", points: 1 },
      { id: "unemployment", prompt: "Unemployment shown as the horizontal gap between Qs and Qd at the minimum wage.", points: 1 },
    ],
  },
];

export const GRAPH_PROMPT_BY_ID = Object.fromEntries(
  GRAPH_PROMPTS.map((p) => [p.id, p])
);
