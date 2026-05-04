import { forwardRef } from "react";

/**
 * Tool-neutral one-page Policy Brief document.
 * Captures the EconLever brief's typographic system (navy ink, Times-style
 * serifs, Inter monospace meta) without binding to any single tool's data.
 */
export interface BriefSection {
  heading: string;
  body?: string;
  rows?: { label: string; value: string }[]; // small key/value table
  paragraphs?: string[];
}

export interface BriefMetric {
  label: string;
  value: string;
  context?: string;
  delta?: string;
  tone?: "positive" | "negative" | "neutral";
}

export interface BriefDocProps {
  toolName: string;          // e.g. "Inflation Decomposer"
  toolNumber?: string;       // editorial roman numeral
  headline: string;          // big top headline
  subhead?: string;          // descriptive line under headline
  regimeBadge?: string;      // top-right badge
  date?: string;             // formatted date
  metrics?: BriefMetric[];   // 0–3 metric boxes
  sections?: BriefSection[]; // configurable text/table sections
  chart?: React.ReactNode;   // optional rendered chart
  footerNote?: string;
}

export const BriefDocument = forwardRef<HTMLDivElement, BriefDocProps>(function BriefDocument(
  {
    toolName,
    toolNumber,
    headline,
    subhead,
    regimeBadge,
    date,
    metrics = [],
    sections = [],
    chart,
    footerNote,
  },
  ref,
) {
  const today =
    date ??
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: "-10000px",
        top: 0,
        width: 816,
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Times New Roman', Times, serif",
        padding: "44px 56px 36px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: "2px solid #0b1f3a",
          paddingBottom: 14,
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            econ.mom · Policy Brief {toolNumber ? `· Tool ${toolNumber}` : ""}
          </div>
          <div
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: 19,
              fontWeight: 800,
              color: "#0b1f3a",
              letterSpacing: "-0.005em",
            }}
          >
            {toolName}
          </div>
          <div
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: 11,
              color: "#64748b",
              marginTop: 2,
            }}
          >
            {today}
          </div>
        </div>
        {regimeBadge ? (
          <div
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#0b1f3a",
              border: "1px solid #0b1f3a",
              padding: "5px 10px",
              borderRadius: 999,
              alignSelf: "center",
            }}
          >
            {regimeBadge}
          </div>
        ) : null}
      </div>

      {/* HEADLINE */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.1,
            fontWeight: 800,
            color: "#0b1f3a",
            letterSpacing: "-0.018em",
            marginBottom: 6,
          }}
        >
          {headline}
        </div>
        {subhead ? (
          <div
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: 12.5,
              color: "#334155",
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {subhead}
          </div>
        ) : null}
      </div>

      {/* METRICS */}
      {metrics.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${metrics.length}, 1fr)`, gap: 12, marginBottom: 18 }}>
          {metrics.map((m, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "12px 14px",
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, ui-sans-serif, system-ui",
                  fontSize: 9.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 4,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  color:
                    m.tone === "positive"
                      ? "#15803d"
                      : m.tone === "negative"
                      ? "#b91c1c"
                      : "#0b1f3a",
                  lineHeight: 1.1,
                }}
              >
                {m.value}
              </div>
              {(m.context || m.delta) ? (
                <div
                  style={{
                    fontFamily: "Inter, ui-sans-serif, system-ui",
                    fontSize: 10,
                    color: "#64748b",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <span>{m.context ?? ""}</span>
                  <span>{m.delta ?? ""}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* CHART */}
      {chart ? <div style={{ marginBottom: 18 }}>{chart}</div> : null}

      {/* SECTIONS */}
      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontFamily: "Inter, ui-sans-serif, system-ui",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0b1f3a",
              marginBottom: 6,
              borderTop: "1.5px solid #0b1f3a",
              paddingTop: 10,
            }}
          >
            {s.heading}
          </div>
          {s.body ? (
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#0f172a", fontWeight: 500 }}>{s.body}</div>
          ) : null}
          {s.paragraphs?.map((p, j) => (
            <div key={j} style={{ fontSize: 12.5, lineHeight: 1.55, color: "#0f172a", marginBottom: 6, fontWeight: 500 }}>
              {p}
            </div>
          ))}
          {s.rows ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Inter, ui-sans-serif, system-ui", fontSize: 11.5 }}>
              <tbody>
                {s.rows.map((r, j) => (
                  <tr key={j} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px 0", color: "#334155", width: "55%", fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: "6px 0", color: "#0b1f3a", textAlign: "right", fontWeight: 700 }}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ))}

      {/* DISCLAIMER */}
      <div
        style={{
          marginTop: 22,
          paddingTop: 14,
          paddingBottom: 10,
          borderTop: "1.5px solid #0b1f3a",
          fontFamily: "Inter, ui-sans-serif, system-ui",
          fontSize: 9.5,
          lineHeight: 1.5,
          color: "#475569",
          fontStyle: "italic",
        }}
      >
        <span style={{ fontWeight: 700, fontStyle: "normal", color: "#0b1f3a", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 9 }}>Disclaimer · </span>
        This brief is an editorial reconstruction of published peer-reviewed natural-experiment research, prepared by a high-school student for educational purposes. Causal estimates and magnitudes are summarized from the original studies cited; readers should consult the underlying papers before drawing policy conclusions. Not investment, legal, or policy advice.
      </div>

      {/* FOOTER */}
      <div
        style={{
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "Inter, ui-sans-serif, system-ui",
          fontSize: 9.5,
          fontWeight: 700,
          color: "#0b1f3a",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <span>{footerNote ?? "Illustrative · Not investment advice"}</span>
        <span>Saras Totey · econ.mom · 2026</span>
      </div>
    </div>
  );
});
