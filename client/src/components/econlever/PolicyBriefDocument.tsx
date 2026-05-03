import { forwardRef } from "react";
import type { PolicyLevers, SimulationResult } from "@/lib/econlever/engine";
import { generateAnalysis, BASELINE } from "@/lib/econlever/engine";
import { PrintGiniChart, PrintGdpDeficitChart } from "./PrintCharts";
import { EconLeverLogo as Logo } from "./EconLeverLogo";

interface BriefProps {
  levers: PolicyLevers;
  result: SimulationResult;
}

/**
 * Hidden, print-optimized layout used for PDF export.
 * Renders ONLY the elements that should appear in the brief:
 *  - Branded header
 *  - Lever readouts (NOT the interactive sliders)
 *  - Both charts
 *  - Key metrics
 *  - Analysis text
 *  - Methodology disclaimer + signature
 *
 * The element is rendered off-screen but at A4 width so html2canvas
 * captures a properly-laid-out document, not a screenshot of the dashboard.
 */
export const PolicyBriefDocument = forwardRef<HTMLDivElement, BriefProps>(
  function PolicyBriefDocument({ levers, result }, ref) {
    const analysis = generateAnalysis(levers, result);
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const leverRows: Array<{ label: string; value: string; baseline: string }> = [
      {
        label: "Top Marginal Income Tax",
        value: `${levers.topMarginalTax.toFixed(1)}%`,
        baseline: `${BASELINE.neutral.topMarginalTax}%`,
      },
      {
        label: "Corporate Income Tax",
        value: `${levers.corporateTax.toFixed(1)}%`,
        baseline: `${BASELINE.neutral.corporateTax}%`,
      },
      {
        label: "Social Welfare Spending (% GDP)",
        value: `${levers.welfareSpending.toFixed(1)}%`,
        baseline: `${BASELINE.neutral.welfareSpending}%`,
      },
      {
        label: "Federal Funds Rate",
        value: `${levers.fedFundsRate.toFixed(2)}%`,
        baseline: `${BASELINE.neutral.fedFundsRate}%`,
      },
    ];

    return (
      <div
        ref={ref}
        // 816px ≈ 8.5in @ 96dpi, the standard letter width html2canvas captures
        style={{
          position: "absolute",
          left: "-10000px",
          top: 0,
          width: "816px",
          padding: "48px 56px",
          background: "#ffffff",
          color: "#0b1f3a",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "13px",
          fontWeight: 500,
          lineHeight: 1.55,
          // Crisper rendering when html2canvas rasterizes the brief.
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 16,
            borderBottom: "2px solid #0b1f3a",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo
              className=""
              // inline-style override via wrapper
            />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
                EconLever · Policy Brief
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#3a4350", fontFamily: "JetBrains Mono, ui-monospace, monospace" }}>
                {today} · 10-Year Projection · 2026–2036
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-block",
                fontSize: 10,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "#0b1f3a",
                color: "#fff",
                padding: "4px 9px",
                borderRadius: 3,
              }}
            >
              Regime · {result.regime}
            </div>
          </div>
        </div>

        {/* Lever readouts table */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Policy Configuration</SectionLabel>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #d4d8df", color: "#3a4350" }}>
                <Th align="left">Lever</Th>
                <Th align="right">Setting</Th>
                <Th align="right">U.S. Baseline (2025)</Th>
              </tr>
            </thead>
            <tbody>
              {leverRows.map((r) => (
                <tr key={r.label} style={{ borderBottom: "1px solid #eef0f3" }}>
                  <Td>{r.label}</Td>
                  <Td align="right" bold>{r.value}</Td>
                  <Td align="right" muted>{r.baseline}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key metrics */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Projected Outcomes (10-Year Average)</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <MetricBox
              label="Avg. Real GDP Growth"
              value={`${result.avgGdpGrowth.toFixed(2)}%`}
              tone="growth"
            />
            <MetricBox
              label="Cumul. Deficit (% GDP)"
              value={`${result.cumulativeDeficit.toFixed(1)}%`}
              tone="deficit"
            />
            <MetricBox
              label="Final Gini Coefficient"
              value={result.finalGini.toFixed(3)}
              hint={`Δ ${result.giniDelta >= 0 ? "+" : ""}${result.giniDelta.toFixed(3)} vs. baseline`}
            />
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
          <ChartFrame title="Gini Coefficient · 10-Yr Trajectory">
            <PrintGiniChart data={result.series} />
          </ChartFrame>
          <ChartFrame title="GDP Growth vs. Federal Deficit">
            <PrintGdpDeficitChart data={result.series} />
          </ChartFrame>
        </div>

        {/* Analysis */}
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Policy Analysis</SectionLabel>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 6,
              color: "#0b1f3a",
            }}
          >
            {analysis.headline}
          </div>
          <p style={{ fontSize: 12.5, fontWeight: 500, color: "#2a3340", maxWidth: "75ch" }}>
            {analysis.body}
          </p>
        </div>

        {/* Footer / signature */}
        <div
          style={{
            marginTop: 22,
            paddingTop: 12,
            borderTop: "1px solid #d4d8df",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10.5,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontWeight: 500,
            color: "#3a4350",
          }}
        >
          <span>
            Generated by EconLever. Illustrative simulation; coefficients calibrated
            to mainstream macroeconomic literature; not a substitute for DSGE/VAR
            analysis. See methodology page for full citations.
          </span>
          <span style={{ whiteSpace: "nowrap", marginLeft: 12 }}>
            Saras Totey · econ.mom
          </span>
        </div>
      </div>
    );
  }
);

// ── primitives ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "#3a4350",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align,
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontWeight: 700,
        padding: "6px 0",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  bold = false,
  muted = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <td
      style={{
        textAlign: align,
        fontSize: 12,
        padding: "8px 0",
        fontWeight: bold ? 700 : 500,
        color: muted ? "#5a6470" : "#0b1f3a",
      }}
    >
      {children}
    </td>
  );
}

function MetricBox({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "growth" | "deficit";
  hint?: string;
}) {
  const accent = tone === "growth" ? "#0e9f6e" : tone === "deficit" ? "#dd5a14" : "#0b1f3a";
  return (
    <div
      style={{
        border: "1px solid #d4d8df",
        borderRadius: 4,
        padding: "10px 12px",
        background: "#fafbfc",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#3a4350",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: accent,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 10.5,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontWeight: 500,
            color: "#3a4350",
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        border: "1px solid #d4d8df",
        borderRadius: 4,
        padding: "10px 10px 6px",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#3a4350",
          marginBottom: 4,
          padding: "0 2px",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>{children}</div>
    </div>
  );
}
