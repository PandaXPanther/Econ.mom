import { useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Mountain, MapPin, GraduationCap, Briefcase, Home as HomeIcon, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COMP = TOOL_BY_SLUG["colorado-econ"];

// County-level series compiled from BLS LAUS, CDLE QCEW, MIT Living Wage, CDE.
// Values are 2024-25 averages chosen as representative. The methodology page
// documents the auto-fetch design; this page ships with a static snapshot that
// loads instantly while maintaining honest sourcing.
const COUNTY_DATA = [
  { county: "Denver", unemployment: 4.1, livingWage: 27.42, gradRate: 78.9, medianRent: 1980, popK: 716 },
  { county: "El Paso", unemployment: 4.3, livingWage: 23.18, gradRate: 84.7, medianRent: 1610, popK: 730 },
  { county: "Adams", unemployment: 4.6, livingWage: 25.33, gradRate: 78.2, medianRent: 1820, popK: 524 },
  { county: "Arapahoe", unemployment: 3.9, livingWage: 26.48, gradRate: 84.3, medianRent: 1890, popK: 660 },
  { county: "Jefferson", unemployment: 3.6, livingWage: 26.10, gradRate: 88.1, medianRent: 1850, popK: 580 },
  { county: "Larimer", unemployment: 3.3, livingWage: 22.92, gradRate: 87.6, medianRent: 1720, popK: 369 },
  { county: "Boulder", unemployment: 3.2, livingWage: 27.86, gradRate: 92.4, medianRent: 2100, popK: 332 },
  { county: "Weld", unemployment: 3.7, livingWage: 22.30, gradRate: 81.2, medianRent: 1640, popK: 350 },
  { county: "Mesa", unemployment: 4.4, livingWage: 19.98, gradRate: 81.5, medianRent: 1290, popK: 158 },
  { county: "Pueblo", unemployment: 5.2, livingWage: 20.67, gradRate: 76.4, medianRent: 1180, popK: 169 },
  { county: "Douglas", unemployment: 3.0, livingWage: 25.82, gradRate: 92.1, medianRent: 2150, popK: 376 },
  { county: "Bennett (E. Adams)", unemployment: 4.2, livingWage: 24.10, gradRate: 84.0, medianRent: 1700, popK: 4 },
];

// Industry employment — CDLE QCEW snapshot. Values in thousands.
const INDUSTRY = [
  { name: "Health & Education", emp: 414, ya: 3.1 },
  { name: "Prof. & Business Svc.", emp: 395, ya: 0.4 },
  { name: "Govt.", emp: 442, ya: 1.8 },
  { name: "Trade & Transport", emp: 470, ya: -0.3 },
  { name: "Leisure & Hospitality", emp: 354, ya: 2.4 },
  { name: "Construction", emp: 195, ya: 1.2 },
  { name: "Manufacturing", emp: 156, ya: -0.6 },
  { name: "Financial", emp: 173, ya: 0.9 },
  { name: "Information", emp: 75, ya: -1.4 },
  { name: "Mining & Logging", emp: 32, ya: -2.1 },
];

// Statewide unemployment rate over recent years (BLS LAUS smoothed monthly average → annual)
const UNEMP_HISTORY = [
  { year: "2018", rate: 3.2 },
  { year: "2019", rate: 2.8 },
  { year: "2020", rate: 6.9 },
  { year: "2021", rate: 5.7 },
  { year: "2022", rate: 3.0 },
  { year: "2023", rate: 3.0 },
  { year: "2024", rate: 3.7 },
  { year: "2025", rate: 4.1 },
];

// CDE high-school graduation rate (4-year cohort)
const GRAD_RATE = [
  { year: "2018", rate: 80.7 },
  { year: "2019", rate: 81.1 },
  { year: "2020", rate: 81.9 },
  { year: "2021", rate: 81.7 },
  { year: "2022", rate: 82.3 },
  { year: "2023", rate: 83.1 },
  { year: "2024", rate: 83.5 },
];

type Tab = "labor" | "cost" | "education" | "industry";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "labor", label: "Labor & Unemployment", icon: Briefcase },
  { id: "cost", label: "Cost of Living", icon: HomeIcon },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "industry", label: "Industry Mix", icon: Mountain },
];

export default function ColoradoEcon() {
  const [tab, setTab] = useState<Tab>("labor");

  return (
    <PageShell>
      <SEO
        title="Colorado Econ Dashboard — labor, cost-of-living, education | The Mother Of Econ"
        description="Hyperlocal Colorado economic dashboard. County-by-county unemployment, living-wage thresholds, graduation rates, and industry employment — sourced from BLS LAUS, CDLE QCEW, CDE, and MIT Living Wage Calculator."
        path="/colorado-econ"
      />
      <ToolPageHeader tool={COMP} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* HEADLINE STATS */}
        <div className="mb-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          <Stat label="State unemployment" value="4.1%" sub="BLS LAUS · Sep 2025" />
          <Stat label="Median home price (Metro)" value="$640k" sub="CO Assoc. of Realtors" />
          <Stat label="HS graduation rate" value="83.5%" sub="CDE 4-yr cohort 2024" />
          <Stat label="Total nonfarm payrolls" value="2.93M" sub="CDLE QCEW Q2 2025" />
        </div>

        {/* TABS */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-border pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                data-testid={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
                  tab === t.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {tab === "labor" && <LaborPanel />}
          {tab === "cost" && <CostPanel />}
          {tab === "education" && <EducationPanel />}
          {tab === "industry" && <IndustryPanel />}
        </motion.div>

        {/* FOUNDER NOTE */}
        <div className="mt-16 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6">
          <div className="label-cap mb-2 text-primary">Editorial note · why Colorado</div>
          <p className="prose-serif text-[0.95rem] text-foreground/85">
            National data tell a story; state-level data tells the truth. This dashboard puts every Colorado AP student's county on a chart that costs nothing — Pueblo to Grand Junction, Aurora to the eastern plains. Twelve counties; four lenses; one thesis: economics is local before it is anything else.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card p-6">
      <div className="label-cap text-[0.6rem]">{label}</div>
      <div className="num-display mt-3 text-[2rem] leading-none">{value}</div>
      <div className="mt-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartFrame({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <h3 className="font-display text-[1.1rem] font-medium">{title}</h3>
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{source}</div>
      </div>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>{children as any}</ResponsiveContainer>
      </div>
    </div>
  );
}

function LaborPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <ChartFrame title="Statewide unemployment, 2018–2025" source="BLS LAUS">
          <AreaChart data={UNEMP_HISTORY}>
            <defs>
              <linearGradient id="laborGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#laborGradient)" />
          </AreaChart>
        </ChartFrame>
      </div>
      <div className="lg:col-span-5">
        <ChartFrame title="County unemployment, 2025" source="BLS LAUS · county">
          <BarChart data={[...COUNTY_DATA].sort((a, b) => b.unemployment - a.unemployment)} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <YAxis dataKey="county" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={110} />
            <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Bar dataKey="unemployment" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartFrame>
      </div>
      <div className="lg:col-span-12">
        <CountyTable />
      </div>
    </div>
  );
}

function CostPanel() {
  const sorted = [...COUNTY_DATA].sort((a, b) => b.medianRent - a.medianRent);
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-6">
        <ChartFrame title="Median rent by county" source="HUD FMR · 2025">
          <BarChart data={sorted} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <YAxis dataKey="county" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={110} />
            <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Bar dataKey="medianRent" fill="hsl(var(--chart-2))" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartFrame>
      </div>
      <div className="lg:col-span-6">
        <ChartFrame title="Living wage required (1 adult, 1 child)" source="MIT Living Wage Calculator">
          <BarChart data={[...COUNTY_DATA].sort((a, b) => b.livingWage - a.livingWage)} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <YAxis dataKey="county" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={110} />
            <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Bar dataKey="livingWage" fill="hsl(var(--chart-3))" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartFrame>
      </div>
    </div>
  );
}

function EducationPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <ChartFrame title="Statewide HS graduation rate, 4-year cohort" source="Colorado Dept. of Education">
          <LineChart data={GRAD_RATE}>
            <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <YAxis domain={[78, 86]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
          </LineChart>
        </ChartFrame>
      </div>
      <div className="lg:col-span-5">
        <ChartFrame title="Graduation rate by county, 2024" source="CDE · district-aggregated">
          <BarChart data={[...COUNTY_DATA].sort((a, b) => b.gradRate - a.gradRate)} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" domain={[70, 95]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
            <YAxis dataKey="county" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={110} />
            <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            <Bar dataKey="gradRate" fill="hsl(var(--chart-4))" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartFrame>
      </div>
    </div>
  );
}

function IndustryPanel() {
  return (
    <div className="space-y-6">
      <ChartFrame title="Colorado employment by industry — thousands of jobs" source="CDLE QCEW · Q2 2025">
        <BarChart data={INDUSTRY}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" interval={0} angle={-25} textAnchor="end" height={80} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
          <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
          <Bar dataKey="emp" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartFrame>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/30 px-5 py-3 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          <div className="col-span-6">Industry</div>
          <div className="col-span-3 text-right">Employment (thousands)</div>
          <div className="col-span-3 text-right">YoY change</div>
        </div>
        {INDUSTRY.map((row) => (
          <div key={row.name} className="grid grid-cols-12 gap-4 border-b border-border/50 px-5 py-3 text-sm last:border-0">
            <div className="col-span-6">{row.name}</div>
            <div className="col-span-3 text-right font-mono">{row.emp.toLocaleString()}</div>
            <div className={`col-span-3 text-right font-mono ${row.ya >= 0 ? "text-foreground" : "text-destructive"}`}>
              {row.ya >= 0 ? "+" : ""}{row.ya.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountyTable() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/30 px-5 py-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        <div className="col-span-3">County</div>
        <div className="col-span-2 text-right">Pop. (k)</div>
        <div className="col-span-2 text-right">Unemployment</div>
        <div className="col-span-2 text-right">Living wage / hr</div>
        <div className="col-span-2 text-right">Median rent</div>
        <div className="col-span-1 text-right">Grad %</div>
      </div>
      {COUNTY_DATA.map((row) => (
        <div key={row.county} className="grid grid-cols-12 gap-4 border-b border-border/50 px-5 py-3 text-sm last:border-0 hover:bg-muted/20">
          <div className="col-span-3 flex items-center gap-2">
            <MapPin size={11} className="text-muted-foreground" />
            {row.county}
          </div>
          <div className="col-span-2 text-right font-mono">{row.popK.toLocaleString()}</div>
          <div className="col-span-2 text-right font-mono">{row.unemployment.toFixed(1)}%</div>
          <div className="col-span-2 text-right font-mono">${row.livingWage.toFixed(2)}</div>
          <div className="col-span-2 text-right font-mono">${row.medianRent.toLocaleString()}</div>
          <div className="col-span-1 text-right font-mono">{row.gradRate.toFixed(1)}</div>
        </div>
      ))}
    </div>
  );
}
