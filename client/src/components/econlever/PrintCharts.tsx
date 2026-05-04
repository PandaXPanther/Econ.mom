/**
 * Fixed-size, print-only chart variants used inside the PolicyBriefDocument.
 * Recharts' ResponsiveContainer requires a measurable parent, when the brief
 * is rendered off-screen, the container reports zero width and the chart fails
 * to draw. These variants pass explicit width/height instead.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar,
  Legend,
} from "recharts";
import type { YearProjection } from "@/lib/econlever/engine";
import { BASELINE } from "@/lib/econlever/engine";

const PRINT_WIDTH = 340;
const PRINT_HEIGHT = 220;

const axisTick = { fontSize: 9, fontFamily: "JetBrains Mono, monospace", fill: "#5a6470" };
const axisLine = { stroke: "#cfd4dc" };

export function PrintGiniChart({ data }: { data: YearProjection[] }) {
  return (
    <ComposedChart
      width={PRINT_WIDTH}
      height={PRINT_HEIGHT}
      data={data}
      margin={{ top: 6, right: 56, left: 0, bottom: 4 }}
    >
      <defs>
        <linearGradient id="giniAreaPrint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7e22ce" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#7e22ce" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="#e2e6ec" strokeDasharray="2 4" vertical={false} />
      <XAxis dataKey="year" tick={axisTick} tickLine={false} axisLine={axisLine} interval={1} />
      <YAxis
        domain={[0.34, 0.52]}
        tickCount={5}
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        width={36}
        tickFormatter={(v: number) => v.toFixed(2)}
      />
      <ReferenceLine
        y={BASELINE.gini}
        stroke="#9aa3b1"
        strokeDasharray="3 3"
        label={{
          value: `Baseline ${BASELINE.gini.toFixed(3)}`,
          position: "right",
          fill: "#5a6470",
          fontSize: 8,
          fontFamily: "JetBrains Mono, monospace",
        }}
      />
      <Area type="monotone" dataKey="gini" stroke="none" fill="url(#giniAreaPrint)" isAnimationActive={false} />
      <Line
        type="monotone"
        dataKey="gini"
        stroke="#7e22ce"
        strokeWidth={2}
        dot={{ r: 2, fill: "#7e22ce", strokeWidth: 0 }}
        isAnimationActive={false}
      />
    </ComposedChart>
  );
}

export function PrintGdpDeficitChart({ data }: { data: YearProjection[] }) {
  return (
    <ComposedChart
      width={PRINT_WIDTH}
      height={PRINT_HEIGHT}
      data={data}
      margin={{ top: 6, right: 12, left: 0, bottom: 4 }}
      barCategoryGap={5}
    >
      <CartesianGrid stroke="#e2e6ec" strokeDasharray="2 4" vertical={false} />
      <XAxis dataKey="year" tick={axisTick} tickLine={false} axisLine={axisLine} interval={1} />
      <YAxis
        tick={axisTick}
        tickLine={false}
        axisLine={false}
        width={38}
        tickFormatter={(v: number) => `${Math.round(v * 10) / 10}%`}
      />
      <Legend
        wrapperStyle={{ fontSize: 9, fontFamily: "Inter, sans-serif", paddingTop: 2 }}
        iconType="square"
        iconSize={8}
      />
      <Bar dataKey="deficit" name="Deficit (% GDP)" fill="#dd5a14" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      <Line
        type="monotone"
        dataKey="gdpGrowth"
        name="Real GDP Growth"
        stroke="#0e9f6e"
        strokeWidth={2}
        dot={{ r: 2, fill: "#0e9f6e", strokeWidth: 0 }}
        isAnimationActive={false}
      />
    </ComposedChart>
  );
}
