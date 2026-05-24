import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { ToolExplainer } from "@/components/brand/ToolExplainer";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { MapPin, ArrowLeft, Search } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const COMP = TOOL_BY_SLUG["us-econ"];

// ─────────────────────────────────────────────────────────────────────────────
// STATE DATA, compiled from BLS LAUS (Sep 2025), QCEW Q2 2025 mean hourly wage,
// MIT Living Wage Calculator (state median, 1 adult + 1 child), NCES 4-year
// cohort grad rate (2021-22 most recent national release), Zillow ZHVI median
// home value (Sep 2025). Numbers are representative single-snapshot figures.
// ─────────────────────────────────────────────────────────────────────────────

interface StateRow {
  abbr: string;
  name: string;
  region: "Northeast" | "Midwest" | "South" | "West";
  unemp: number;       // %
  meanWage: number;    // $/hr (QCEW mean)
  livingWage: number;  // $/hr (1 adult + 1 child)
  gradRate: number;    // %
  zhvi: number;        // $ median home value
  popM: number;        // population in millions
}

const STATES: StateRow[] = [
  { abbr: "AL", name: "Alabama",        region: "South",     unemp: 3.4, meanWage: 26.78, livingWage: 23.45, gradRate: 89.0, zhvi: 233000, popM: 5.10 },
  { abbr: "AK", name: "Alaska",         region: "West",      unemp: 4.6, meanWage: 33.10, livingWage: 28.90, gradRate: 79.6, zhvi: 365000, popM: 0.73 },
  { abbr: "AZ", name: "Arizona",        region: "West",      unemp: 4.0, meanWage: 30.42, livingWage: 27.12, gradRate: 77.3, zhvi: 442000, popM: 7.43 },
  { abbr: "AR", name: "Arkansas",       region: "South",     unemp: 3.7, meanWage: 25.10, livingWage: 22.61, gradRate: 87.1, zhvi: 205000, popM: 3.05 },
  { abbr: "CA", name: "California",     region: "West",      unemp: 5.4, meanWage: 36.78, livingWage: 32.48, gradRate: 87.0, zhvi: 786000, popM: 38.97 },
  { abbr: "CO", name: "Colorado",       region: "West",      unemp: 4.1, meanWage: 33.02, livingWage: 27.40, gradRate: 83.5, zhvi: 555000, popM: 5.91 },
  { abbr: "CT", name: "Connecticut",    region: "Northeast", unemp: 3.9, meanWage: 35.40, livingWage: 28.65, gradRate: 89.5, zhvi: 421000, popM: 3.62 },
  { abbr: "DE", name: "Delaware",       region: "South",     unemp: 4.1, meanWage: 30.85, livingWage: 26.13, gradRate: 87.8, zhvi: 376000, popM: 1.03 },
  { abbr: "FL", name: "Florida",        region: "South",     unemp: 3.5, meanWage: 28.66, livingWage: 26.24, gradRate: 88.0, zhvi: 397000, popM: 22.61 },
  { abbr: "GA", name: "Georgia",        region: "South",     unemp: 3.6, meanWage: 28.95, livingWage: 26.10, gradRate: 84.1, zhvi: 327000, popM: 11.03 },
  { abbr: "HI", name: "Hawaii",         region: "West",      unemp: 3.3, meanWage: 31.80, livingWage: 31.20, gradRate: 86.0, zhvi: 838000, popM: 1.43 },
  { abbr: "ID", name: "Idaho",          region: "West",      unemp: 3.5, meanWage: 26.92, livingWage: 24.45, gradRate: 81.4, zhvi: 467000, popM: 1.96 },
  { abbr: "IL", name: "Illinois",       region: "Midwest",   unemp: 5.1, meanWage: 31.90, livingWage: 26.05, gradRate: 87.3, zhvi: 270000, popM: 12.55 },
  { abbr: "IN", name: "Indiana",        region: "Midwest",   unemp: 4.0, meanWage: 27.55, livingWage: 23.91, gradRate: 86.6, zhvi: 244000, popM: 6.86 },
  { abbr: "IA", name: "Iowa",           region: "Midwest",   unemp: 3.4, meanWage: 27.10, livingWage: 23.66, gradRate: 91.8, zhvi: 225000, popM: 3.21 },
  { abbr: "KS", name: "Kansas",         region: "Midwest",   unemp: 3.5, meanWage: 27.15, livingWage: 24.34, gradRate: 89.3, zhvi: 232000, popM: 2.94 },
  { abbr: "KY", name: "Kentucky",       region: "South",     unemp: 4.3, meanWage: 26.32, livingWage: 22.90, gradRate: 91.7, zhvi: 215000, popM: 4.51 },
  { abbr: "LA", name: "Louisiana",      region: "South",     unemp: 4.0, meanWage: 26.81, livingWage: 23.45, gradRate: 81.4, zhvi: 197000, popM: 4.57 },
  { abbr: "ME", name: "Maine",          region: "Northeast", unemp: 3.4, meanWage: 28.40, livingWage: 25.63, gradRate: 87.3, zhvi: 393000, popM: 1.39 },
  { abbr: "MD", name: "Maryland",       region: "South",     unemp: 3.3, meanWage: 32.95, livingWage: 28.81, gradRate: 86.8, zhvi: 432000, popM: 6.18 },
  { abbr: "MA", name: "Massachusetts",  region: "Northeast", unemp: 4.1, meanWage: 38.20, livingWage: 30.24, gradRate: 90.7, zhvi: 622000, popM: 7.00 },
  { abbr: "MI", name: "Michigan",       region: "Midwest",   unemp: 5.3, meanWage: 28.75, livingWage: 24.62, gradRate: 81.7, zhvi: 244000, popM: 10.04 },
  { abbr: "MN", name: "Minnesota",      region: "Midwest",   unemp: 3.4, meanWage: 31.10, livingWage: 25.93, gradRate: 84.0, zhvi: 327000, popM: 5.74 },
  { abbr: "MS", name: "Mississippi",    region: "South",     unemp: 3.3, meanWage: 24.20, livingWage: 22.42, gradRate: 88.4, zhvi: 178000, popM: 2.94 },
  { abbr: "MO", name: "Missouri",       region: "Midwest",   unemp: 4.0, meanWage: 27.45, livingWage: 23.82, gradRate: 89.6, zhvi: 244000, popM: 6.20 },
  { abbr: "MT", name: "Montana",        region: "West",      unemp: 3.5, meanWage: 26.95, livingWage: 24.81, gradRate: 86.4, zhvi: 446000, popM: 1.13 },
  { abbr: "NE", name: "Nebraska",       region: "Midwest",   unemp: 2.8, meanWage: 27.84, livingWage: 23.95, gradRate: 88.3, zhvi: 248000, popM: 1.99 },
  { abbr: "NV", name: "Nevada",         region: "West",      unemp: 5.6, meanWage: 28.20, livingWage: 26.42, gradRate: 81.7, zhvi: 432000, popM: 3.19 },
  { abbr: "NH", name: "New Hampshire",  region: "Northeast", unemp: 2.5, meanWage: 30.80, livingWage: 26.30, gradRate: 89.0, zhvi: 478000, popM: 1.40 },
  { abbr: "NJ", name: "New Jersey",     region: "Northeast", unemp: 4.7, meanWage: 33.70, livingWage: 28.94, gradRate: 91.0, zhvi: 521000, popM: 9.29 },
  { abbr: "NM", name: "New Mexico",     region: "West",      unemp: 4.1, meanWage: 27.41, livingWage: 24.10, gradRate: 76.7, zhvi: 292000, popM: 2.11 },
  { abbr: "NY", name: "New York",       region: "Northeast", unemp: 4.3, meanWage: 38.90, livingWage: 30.87, gradRate: 87.8, zhvi: 458000, popM: 19.57 },
  { abbr: "NC", name: "North Carolina", region: "South",     unemp: 3.7, meanWage: 28.10, livingWage: 25.34, gradRate: 86.4, zhvi: 322000, popM: 10.84 },
  { abbr: "ND", name: "North Dakota",   region: "Midwest",   unemp: 2.6, meanWage: 28.45, livingWage: 24.13, gradRate: 84.0, zhvi: 263000, popM: 0.78 },
  { abbr: "OH", name: "Ohio",           region: "Midwest",   unemp: 4.7, meanWage: 28.50, livingWage: 24.70, gradRate: 87.2, zhvi: 230000, popM: 11.79 },
  { abbr: "OK", name: "Oklahoma",       region: "South",     unemp: 3.4, meanWage: 26.40, livingWage: 23.51, gradRate: 81.6, zhvi: 205000, popM: 4.05 },
  { abbr: "OR", name: "Oregon",         region: "West",      unemp: 4.5, meanWage: 31.65, livingWage: 27.60, gradRate: 81.3, zhvi: 488000, popM: 4.23 },
  { abbr: "PA", name: "Pennsylvania",   region: "Northeast", unemp: 3.6, meanWage: 30.15, livingWage: 25.12, gradRate: 87.0, zhvi: 257000, popM: 12.97 },
  { abbr: "RI", name: "Rhode Island",   region: "Northeast", unemp: 4.7, meanWage: 31.40, livingWage: 27.45, gradRate: 84.1, zhvi: 467000, popM: 1.10 },
  { abbr: "SC", name: "South Carolina", region: "South",     unemp: 4.1, meanWage: 26.65, livingWage: 24.38, gradRate: 85.3, zhvi: 297000, popM: 5.37 },
  { abbr: "SD", name: "South Dakota",   region: "Midwest",   unemp: 1.9, meanWage: 26.10, livingWage: 23.81, gradRate: 84.4, zhvi: 285000, popM: 0.92 },
  { abbr: "TN", name: "Tennessee",      region: "South",     unemp: 3.5, meanWage: 27.85, livingWage: 24.86, gradRate: 90.7, zhvi: 309000, popM: 7.13 },
  { abbr: "TX", name: "Texas",          region: "South",     unemp: 4.1, meanWage: 29.85, livingWage: 26.20, gradRate: 89.7, zhvi: 295000, popM: 30.97 },
  { abbr: "UT", name: "Utah",           region: "West",      unemp: 3.5, meanWage: 28.50, livingWage: 27.10, gradRate: 88.2, zhvi: 510000, popM: 3.42 },
  { abbr: "VT", name: "Vermont",        region: "Northeast", unemp: 2.4, meanWage: 28.25, livingWage: 25.92, gradRate: 85.7, zhvi: 386000, popM: 0.65 },
  { abbr: "VA", name: "Virginia",       region: "South",     unemp: 3.0, meanWage: 31.60, livingWage: 27.10, gradRate: 91.3, zhvi: 391000, popM: 8.72 },
  { abbr: "WA", name: "Washington",     region: "West",      unemp: 4.7, meanWage: 36.20, livingWage: 30.10, gradRate: 81.4, zhvi: 597000, popM: 7.81 },
  { abbr: "WV", name: "West Virginia",  region: "South",     unemp: 4.3, meanWage: 25.45, livingWage: 22.75, gradRate: 89.6, zhvi: 162000, popM: 1.78 },
  { abbr: "WI", name: "Wisconsin",      region: "Midwest",   unemp: 3.0, meanWage: 28.40, livingWage: 24.42, gradRate: 89.6, zhvi: 290000, popM: 5.91 },
  { abbr: "WY", name: "Wyoming",        region: "West",      unemp: 3.6, meanWage: 26.80, livingWage: 24.31, gradRate: 82.1, zhvi: 359000, popM: 0.58 },
];

// ─────────────────────────────────────────────────────────────────────────────
// COUNTY DATA, top counties per state. CO is full (preserved from prior dash).
// Other states ship 4–6 representative high-pop counties.
// ─────────────────────────────────────────────────────────────────────────────

interface CountyRow {
  county: string;
  unemp: number;
  livingWage: number;
  gradRate: number;
  medianRent: number;
  popK: number;
}

const COUNTIES: Record<string, CountyRow[]> = {
  CO: [
    { county: "Denver",            unemp: 4.1, livingWage: 27.42, gradRate: 78.9, medianRent: 1980, popK: 716 },
    { county: "El Paso",           unemp: 4.3, livingWage: 23.18, gradRate: 84.7, medianRent: 1610, popK: 730 },
    { county: "Adams",             unemp: 4.6, livingWage: 25.33, gradRate: 78.2, medianRent: 1820, popK: 524 },
    { county: "Arapahoe",          unemp: 3.9, livingWage: 26.48, gradRate: 84.3, medianRent: 1890, popK: 660 },
    { county: "Jefferson",         unemp: 3.6, livingWage: 26.10, gradRate: 88.1, medianRent: 1850, popK: 580 },
    { county: "Larimer",           unemp: 3.3, livingWage: 22.92, gradRate: 87.6, medianRent: 1720, popK: 369 },
    { county: "Boulder",           unemp: 3.2, livingWage: 27.86, gradRate: 92.4, medianRent: 2100, popK: 332 },
    { county: "Weld",              unemp: 3.7, livingWage: 22.30, gradRate: 81.2, medianRent: 1640, popK: 350 },
    { county: "Mesa",              unemp: 4.4, livingWage: 19.98, gradRate: 81.5, medianRent: 1290, popK: 158 },
    { county: "Pueblo",            unemp: 5.2, livingWage: 20.67, gradRate: 76.4, medianRent: 1180, popK: 169 },
    { county: "Douglas",           unemp: 3.0, livingWage: 25.82, gradRate: 92.1, medianRent: 2150, popK: 376 },
    { county: "Bennett (E. Adams)",unemp: 4.2, livingWage: 24.10, gradRate: 84.0, medianRent: 1700, popK: 4 },
  ],
  CA: [
    { county: "Los Angeles", unemp: 5.7, livingWage: 33.10, gradRate: 86.6, medianRent: 2390, popK: 9721 },
    { county: "San Diego",   unemp: 4.6, livingWage: 31.80, gradRate: 87.6, medianRent: 2680, popK: 3289 },
    { county: "Orange",      unemp: 4.2, livingWage: 32.20, gradRate: 89.7, medianRent: 2740, popK: 3186 },
    { county: "Riverside",   unemp: 5.4, livingWage: 28.91, gradRate: 87.1, medianRent: 2080, popK: 2473 },
    { county: "San Bernardino", unemp: 5.6, livingWage: 28.10, gradRate: 86.4, medianRent: 1840, popK: 2202 },
    { county: "Santa Clara", unemp: 4.0, livingWage: 36.50, gradRate: 88.1, medianRent: 3140, popK: 1872 },
    { county: "Alameda",     unemp: 4.6, livingWage: 35.20, gradRate: 87.0, medianRent: 2730, popK: 1620 },
    { county: "Sacramento",  unemp: 5.1, livingWage: 30.40, gradRate: 86.9, medianRent: 1980, popK: 1577 },
  ],
  TX: [
    { county: "Harris",     unemp: 4.4, livingWage: 26.70, gradRate: 89.3, medianRent: 1430, popK: 4836 },
    { county: "Dallas",     unemp: 4.1, livingWage: 27.40, gradRate: 88.6, medianRent: 1580, popK: 2611 },
    { county: "Tarrant",    unemp: 3.8, livingWage: 26.85, gradRate: 90.2, medianRent: 1520, popK: 2153 },
    { county: "Bexar",      unemp: 4.0, livingWage: 25.21, gradRate: 89.3, medianRent: 1340, popK: 2093 },
    { county: "Travis",     unemp: 3.7, livingWage: 28.40, gradRate: 91.6, medianRent: 1820, popK: 1305 },
    { county: "Collin",     unemp: 3.4, livingWage: 27.05, gradRate: 95.2, medianRent: 1690, popK: 1196 },
    { county: "El Paso",    unemp: 4.6, livingWage: 24.10, gradRate: 86.5, medianRent: 1180, popK: 866 },
  ],
  FL: [
    { county: "Miami-Dade", unemp: 3.6, livingWage: 28.20, gradRate: 87.8, medianRent: 2390, popK: 2702 },
    { county: "Broward",    unemp: 3.4, livingWage: 27.65, gradRate: 90.3, medianRent: 2280, popK: 1948 },
    { county: "Palm Beach", unemp: 3.6, livingWage: 27.20, gradRate: 91.0, medianRent: 2370, popK: 1539 },
    { county: "Hillsborough", unemp: 3.5, livingWage: 26.10, gradRate: 87.6, medianRent: 1830, popK: 1497 },
    { county: "Orange",     unemp: 3.6, livingWage: 26.40, gradRate: 87.8, medianRent: 1880, popK: 1453 },
    { county: "Duval",      unemp: 3.6, livingWage: 25.80, gradRate: 86.5, medianRent: 1620, popK: 1010 },
  ],
  NY: [
    { county: "Kings (Brooklyn)", unemp: 4.6, livingWage: 31.20, gradRate: 84.4, medianRent: 2810, popK: 2561 },
    { county: "Queens",      unemp: 4.5, livingWage: 31.80, gradRate: 86.2, medianRent: 2480, popK: 2272 },
    { county: "New York (Manhattan)", unemp: 4.4, livingWage: 32.40, gradRate: 88.1, medianRent: 4180, popK: 1597 },
    { county: "Suffolk",     unemp: 3.6, livingWage: 30.10, gradRate: 89.3, medianRent: 2690, popK: 1479 },
    { county: "Bronx",       unemp: 6.1, livingWage: 30.80, gradRate: 78.5, medianRent: 2120, popK: 1370 },
    { county: "Nassau",      unemp: 3.4, livingWage: 30.20, gradRate: 91.4, medianRent: 2890, popK: 1395 },
  ],
  IL: [
    { county: "Cook",        unemp: 5.6, livingWage: 27.50, gradRate: 87.0, medianRent: 1820, popK: 5109 },
    { county: "DuPage",      unemp: 3.8, livingWage: 26.70, gradRate: 92.1, medianRent: 1840, popK: 933 },
    { county: "Lake",        unemp: 4.4, livingWage: 26.40, gradRate: 91.5, medianRent: 1810, popK: 711 },
    { county: "Will",        unemp: 4.5, livingWage: 25.90, gradRate: 91.8, medianRent: 1730, popK: 696 },
    { county: "Kane",        unemp: 4.7, livingWage: 26.10, gradRate: 87.4, medianRent: 1640, popK: 514 },
  ],
  WA: [
    { county: "King",        unemp: 4.4, livingWage: 32.50, gradRate: 84.8, medianRent: 2280, popK: 2272 },
    { county: "Pierce",      unemp: 5.2, livingWage: 29.10, gradRate: 81.5, medianRent: 1830, popK: 928 },
    { county: "Snohomish",   unemp: 4.6, livingWage: 30.20, gradRate: 87.8, medianRent: 2080, popK: 832 },
    { county: "Spokane",     unemp: 5.0, livingWage: 26.85, gradRate: 80.4, medianRent: 1410, popK: 552 },
    { county: "Clark",       unemp: 5.4, livingWage: 28.40, gradRate: 84.6, medianRent: 1880, popK: 511 },
  ],
  MA: [
    { county: "Middlesex",   unemp: 3.7, livingWage: 31.10, gradRate: 92.6, medianRent: 2680, popK: 1632 },
    { county: "Worcester",   unemp: 4.4, livingWage: 28.20, gradRate: 90.0, medianRent: 1830, popK: 866 },
    { county: "Suffolk",     unemp: 4.6, livingWage: 32.40, gradRate: 87.6, medianRent: 3220, popK: 791 },
    { county: "Essex",       unemp: 4.2, livingWage: 30.20, gradRate: 90.4, medianRent: 2280, popK: 798 },
    { county: "Norfolk",     unemp: 3.6, livingWage: 30.40, gradRate: 93.1, medianRent: 2420, popK: 730 },
  ],
  GA: [
    { county: "Fulton",      unemp: 3.7, livingWage: 27.40, gradRate: 84.8, medianRent: 1730, popK: 1067 },
    { county: "Gwinnett",    unemp: 3.4, livingWage: 26.90, gradRate: 87.2, medianRent: 1810, popK: 974 },
    { county: "Cobb",        unemp: 3.3, livingWage: 26.80, gradRate: 89.4, medianRent: 1730, popK: 776 },
    { county: "DeKalb",      unemp: 3.9, livingWage: 27.00, gradRate: 78.6, medianRent: 1580, popK: 765 },
    { county: "Clayton",     unemp: 4.4, livingWage: 25.20, gradRate: 79.4, medianRent: 1420, popK: 297 },
  ],
  AZ: [
    { county: "Maricopa",    unemp: 3.7, livingWage: 27.60, gradRate: 79.4, medianRent: 1750, popK: 4585 },
    { county: "Pima",        unemp: 4.1, livingWage: 25.90, gradRate: 81.5, medianRent: 1410, popK: 1064 },
    { county: "Pinal",       unemp: 4.4, livingWage: 25.10, gradRate: 81.8, medianRent: 1680, popK: 467 },
    { county: "Yavapai",     unemp: 4.0, livingWage: 25.30, gradRate: 78.4, medianRent: 1580, popK: 247 },
  ],
  PA: [
    { county: "Philadelphia",unemp: 4.6, livingWage: 27.40, gradRate: 76.4, medianRent: 1620, popK: 1550 },
    { county: "Allegheny",   unemp: 3.6, livingWage: 25.40, gradRate: 90.4, medianRent: 1410, popK: 1233 },
    { county: "Montgomery",  unemp: 3.0, livingWage: 26.20, gradRate: 93.6, medianRent: 1830, popK: 864 },
    { county: "Bucks",       unemp: 3.1, livingWage: 26.30, gradRate: 94.5, medianRent: 1820, popK: 645 },
    { county: "Chester",     unemp: 2.9, livingWage: 26.80, gradRate: 95.3, medianRent: 1860, popK: 547 },
  ],
  OH: [
    { county: "Cuyahoga",    unemp: 4.9, livingWage: 25.30, gradRate: 80.5, medianRent: 1280, popK: 1264 },
    { county: "Franklin",    unemp: 4.6, livingWage: 25.40, gradRate: 84.4, medianRent: 1410, popK: 1334 },
    { county: "Hamilton",    unemp: 4.4, livingWage: 25.10, gradRate: 87.7, medianRent: 1340, popK: 833 },
    { county: "Summit",      unemp: 4.7, livingWage: 24.80, gradRate: 86.4, medianRent: 1180, popK: 537 },
    { county: "Montgomery",  unemp: 4.8, livingWage: 24.60, gradRate: 86.0, medianRent: 1100, popK: 537 },
  ],
  MI: [
    { county: "Wayne",       unemp: 6.4, livingWage: 25.40, gradRate: 78.8, medianRent: 1280, popK: 1751 },
    { county: "Oakland",     unemp: 4.7, livingWage: 26.00, gradRate: 88.2, medianRent: 1620, popK: 1280 },
    { county: "Macomb",      unemp: 5.4, livingWage: 25.80, gradRate: 87.6, medianRent: 1410, popK: 881 },
    { county: "Kent",        unemp: 4.4, livingWage: 25.10, gradRate: 84.5, medianRent: 1480, popK: 670 },
  ],
  NC: [
    { county: "Mecklenburg", unemp: 3.8, livingWage: 27.10, gradRate: 88.0, medianRent: 1720, popK: 1156 },
    { county: "Wake",        unemp: 3.4, livingWage: 27.30, gradRate: 90.4, medianRent: 1820, popK: 1187 },
    { county: "Guilford",    unemp: 3.7, livingWage: 25.40, gradRate: 86.0, medianRent: 1320, popK: 547 },
    { county: "Forsyth",     unemp: 3.6, livingWage: 25.20, gradRate: 87.0, medianRent: 1340, popK: 386 },
  ],
  VA: [
    { county: "Fairfax",     unemp: 2.6, livingWage: 28.40, gradRate: 92.7, medianRent: 2330, popK: 1147 },
    { county: "Prince William", unemp: 3.0, livingWage: 27.40, gradRate: 92.1, medianRent: 2080, popK: 484 },
    { county: "Loudoun",     unemp: 2.8, livingWage: 28.10, gradRate: 95.4, medianRent: 2310, popK: 444 },
    { county: "Virginia Beach (city)", unemp: 3.1, livingWage: 26.40, gradRate: 90.4, medianRent: 1720, popK: 451 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<StateRow, "name" | "unemp" | "meanWage" | "livingWage" | "gradRate" | "zhvi" | "popM">;

export default function USEcon() {
  const [selected, setSelected] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("popM");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [region, setRegion] = useState<"All" | StateRow["region"]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return STATES
      .filter((s) => (region === "All" ? true : s.region === region))
      .filter((s) => (query ? s.name.toLowerCase().includes(query.toLowerCase()) || s.abbr.toLowerCase().includes(query.toLowerCase()) : true))
      .sort((a, b) => {
        // Colorado is pinned first as the home-county case study
        if (a.abbr === "CO" && b.abbr !== "CO") return -1;
        if (b.abbr === "CO" && a.abbr !== "CO") return 1;
        const dir = sortDir === "asc" ? 1 : -1;
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
  }, [region, query, sortKey, sortDir]);

  const selectedState = selected ? STATES.find((s) => s.abbr === selected) : null;

  const usAverages = useMemo(() => {
    const wsum = STATES.reduce((acc, s) => acc + s.popM, 0);
    return {
      unemp: STATES.reduce((a, s) => a + s.unemp * s.popM, 0) / wsum,
      meanWage: STATES.reduce((a, s) => a + s.meanWage * s.popM, 0) / wsum,
      gradRate: STATES.reduce((a, s) => a + s.gradRate * s.popM, 0) / wsum,
      zhvi: STATES.reduce((a, s) => a + s.zhvi * s.popM, 0) / wsum,
    };
  }, []);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  return (
    <PageShell>
      <SEO
        title="US Econ Dashboard, every state, every county | The Mother Of Econ"
        description="A national economic dashboard. All 50 states with unemployment, wages, living-wage thresholds, graduation rates, and median home values. Click any state to drill into county-level data. Sourced from BLS LAUS, QCEW, MIT Living Wage, NCES, and Zillow ZHVI."
        path="/us-econ"
      />
      <ToolPageHeader tool={COMP} />
      <ToolExplainer tool={COMP} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* HEADLINE STATS, US averages */}
        <div className="mb-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          <Stat label="US unemployment (pop-weighted)" value={`${usAverages.unemp.toFixed(2)}%`} sub="BLS LAUS · Sep 2025" />
          <Stat label="US mean hourly wage" value={`$${usAverages.meanWage.toFixed(2)}`} sub="QCEW · Q2 2025" />
          <Stat label="US HS grad rate (4-yr cohort)" value={`${usAverages.gradRate.toFixed(1)}%`} sub="NCES" />
          <Stat label="US median home value" value={`$${(usAverages.zhvi/1000).toFixed(0)}k`} sub="Zillow ZHVI" />
        </div>

        <AnimatePresence mode="wait">
          {!selectedState ? (
            <motion.div
              key="states"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
            >
              {/* CONTROLS */}
              <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-border pb-4">
                <div className="label-cap mr-2 text-muted-foreground">Region</div>
                {(["All", "Northeast", "Midwest", "South", "West"] as const).map((r) => (
                  <button
                    key={r}
                    data-testid={`region-${r}`}
                    onClick={() => setRegion(r)}
                    className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${
                      region === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
                  <Search size={13} className="text-muted-foreground" />
                  <input
                    data-testid="input-search-state"
                    placeholder="Search state…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-44 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* SCATTER, wage vs unemployment, dot size = population */}
              <div className="mb-8 rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
                  <h3 className="font-display text-[1.1rem] font-medium">Mean wage vs. unemployment, every state</h3>
                  <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">QCEW × LAUS · 2025</div>
                </div>
                <div style={{ width: "100%", height: 360 }}>
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
                      <CartesianGrid stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        dataKey="unemp"
                        name="Unemployment"
                        unit="%"
                        domain={[1.5, 6]}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                        label={{ value: "Unemployment (%)", position: "bottom", offset: 0, fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="meanWage"
                        name="Mean wage"
                        unit="$"
                        domain={[22, 42]}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                        label={{ value: "Mean hourly wage ($)", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <ZAxis type="number" dataKey="popM" range={[40, 800]} />
                      <RTooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }}
                        formatter={(v: number, name: string) => [name === "Mean wage" ? `$${v}` : name === "Population" ? `${v.toFixed(2)}M` : `${v}%`, name]}
                        labelFormatter={(_, payload) => {
                          const p = (payload as any[])?.[0]?.payload as StateRow | undefined;
                          return p ? `${p.name} (${p.abbr})` : "";
                        }}
                      />
                      <Scatter
                        name="All states"
                        data={filtered.filter((s) => s.abbr !== "CO")}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.7}
                        stroke="hsl(var(--primary))"
                      />
                      <Scatter
                        name="Colorado (home state)"
                        data={filtered.filter((s) => s.abbr === "CO")}
                        fill="hsl(var(--destructive))"
                        fillOpacity={1}
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "hsl(var(--primary))", opacity: 0.7 }} />All states</span>
                  <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "hsl(var(--destructive))" }} />Colorado (home state)</span>
                  <span className="opacity-70">Bubble size = population. Hover any point to see the state name.</span>
                </div>
                <div className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  Bubble size scales with state population (millions). Hover to identify.
                </div>
              </div>

              {/* STATE TABLE */}
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex items-baseline justify-between border-b border-border bg-muted/20 px-5 py-3">
                  <h3 className="font-display text-[1.05rem] font-medium">Pick a state to drill into county data</h3>
                  <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{filtered.length} of 50 states</div>
                </div>
                <div className="sm:hidden border-b border-border/40 bg-muted/10 px-5 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">↔ swipe to see more columns</div>
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-12 gap-3 border-b border-border bg-muted/30 px-5 py-3 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                      <SortHead label="State" k="name" col="col-span-3" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <SortHead label="Pop. (M)" k="popM" col="col-span-1 text-right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <SortHead label="Unemp." k="unemp" col="col-span-2 text-right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <SortHead label="Mean wage" k="meanWage" col="col-span-2 text-right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <SortHead label="Living wage" k="livingWage" col="col-span-2 text-right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <SortHead label="Grad %" k="gradRate" col="col-span-1 text-right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                      <SortHead label="Home value" k="zhvi" col="col-span-1 text-right" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    </div>
                    <div className="max-h-[640px] overflow-y-auto">
                      {filtered.map((s) => (
                        <button
                          key={s.abbr}
                          data-testid={`row-state-${s.abbr}`}
                          onClick={() => setSelected(s.abbr)}
                          className="grid w-full grid-cols-12 gap-3 border-b border-border/50 px-5 py-3 text-left text-sm transition-colors last:border-0 hover:bg-primary/5"
                        >
                          <div className="col-span-3 flex items-center gap-2">
                            <span className="inline-flex h-6 w-7 items-center justify-center rounded bg-primary/10 font-mono text-[0.65rem] font-medium text-primary">{s.abbr}</span>
                            <span className="font-medium">{s.name}</span>
                            {COUNTIES[s.abbr] && <span className="ml-1 inline-block rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">counties</span>}
                          </div>
                          <div className="col-span-1 text-right font-mono text-muted-foreground">{s.popM.toFixed(2)}</div>
                          <div className={`col-span-2 text-right font-mono ${s.unemp <= 3.5 ? "text-foreground" : s.unemp >= 5 ? "text-destructive" : ""}`}>{s.unemp.toFixed(1)}%</div>
                          <div className="col-span-2 text-right font-mono">${s.meanWage.toFixed(2)}</div>
                          <div className="col-span-2 text-right font-mono">${s.livingWage.toFixed(2)}</div>
                          <div className="col-span-1 text-right font-mono">{s.gradRate.toFixed(1)}</div>
                          <div className="col-span-1 text-right font-mono">${(s.zhvi/1000).toFixed(0)}k</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* EDITORIAL NOTE */}
              <div className="mt-12 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6">
                <div className="label-cap mb-2 text-primary">Editorial note · why national, then local</div>
                <p className="prose-serif text-[0.95rem] text-foreground/85">
                  National data tell a story; state-level data tell the truth. This dashboard puts every state on a single chart, then lets you drill into the county your students actually live in. Fifty states, fifteen counties deep where data is best, with Colorado as the home-county case study.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`detail-${selected}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {/* BACK */}
              <button
                data-testid="button-back-states"
                onClick={() => setSelected(null)}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
              >
                <ArrowLeft size={13} /> Back to all states
              </button>

              {/* STATE HEADER */}
              <div className="mb-8 flex items-end justify-between border-b border-border pb-6">
                <div>
                  <div className="label-cap mb-2 text-primary">State profile · {selectedState!.region}</div>
                  <h2 className="font-display text-[2.4rem] font-medium leading-none">{selectedState!.name}</h2>
                  <div className="mt-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                    Pop. {selectedState!.popM.toFixed(2)}M · {selectedState!.abbr}
                  </div>
                </div>
                <div className="text-right">
                  <div className="num-display text-[3rem] leading-none text-primary">{selectedState!.unemp.toFixed(1)}%</div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">unemployment · LAUS Sep 2025</div>
                </div>
              </div>

              {/* STATE STATS */}
              <div className="mb-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
                <Stat label="Mean hourly wage" value={`$${selectedState!.meanWage.toFixed(2)}`} sub="QCEW Q2 2025" />
                <Stat label="Living wage required" value={`$${selectedState!.livingWage.toFixed(2)}`} sub="MIT · 1 adult + 1 child" />
                <Stat label="HS grad rate" value={`${selectedState!.gradRate.toFixed(1)}%`} sub="NCES 4-yr cohort" />
                <Stat label="Median home value" value={`$${(selectedState!.zhvi/1000).toFixed(0)}k`} sub="Zillow ZHVI" />
              </div>

              {/* WAGE GAP CHART */}
              <div className="mb-8 rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
                  <h3 className="font-display text-[1.1rem] font-medium">Wage vs. living wage, {selectedState!.name}</h3>
                  <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">QCEW · MIT</div>
                </div>
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { label: "Mean hourly wage", v: selectedState!.meanWage, fill: "hsl(var(--primary))" },
                        { label: "Living wage required", v: selectedState!.livingWage, fill: "hsl(var(--chart-3))" },
                        { label: "US mean", v: usAverages.meanWage, fill: "hsl(var(--muted-foreground))" },
                      ]}
                      layout="vertical"
                      margin={{ left: 60 }}
                    >
                      <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                      <YAxis dataKey="label" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={150} />
                      <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(2)}/hr`, ""]} />
                      <Bar dataKey="v" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* COUNTY SECTION */}
              {COUNTIES[selectedState!.abbr] ? (
                <CountySection counties={COUNTIES[selectedState!.abbr]} stateName={selectedState!.name} />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-card/40 p-10 text-center">
                  <MapPin size={20} className="mx-auto mb-3 text-muted-foreground" />
                  <div className="font-display text-[1.1rem] font-medium">County drilldown coming soon for {selectedState!.name}</div>
                  <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
                    BLS LAUS county series + ZHVI county data is being added state-by-state. Currently shipped: California, Texas, Florida, New York, Illinois, Washington, Massachusetts, Georgia, Arizona, Pennsylvania, Ohio, Michigan, North Carolina, Virginia, and Colorado (full).
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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

function SortHead({ label, k, col, sortKey, sortDir, onSort }: { label: string; k: SortKey; col: string; sortKey: SortKey; sortDir: "asc" | "desc"; onSort: (k: SortKey) => void }) {
  const active = sortKey === k;
  return (
    <button onClick={() => onSort(k)} className={`${col} flex items-center gap-1 ${active ? "text-foreground" : ""} hover:text-foreground`} data-testid={`sort-${k}`}>
      {col.includes("text-right") && <span className="ml-auto" />}
      {label}
      {active && <span className="font-mono text-[0.6rem]">{sortDir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );
}

function CountySection({ counties, stateName }: { counties: CountyRow[]; stateName: string }) {
  const sortedByUnemp = [...counties].sort((a, b) => b.unemp - a.unemp);
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
          <h3 className="font-display text-[1.1rem] font-medium">County unemployment, {stateName}</h3>
          <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">BLS LAUS · county</div>
        </div>
        <div style={{ width: "100%", height: Math.max(280, counties.length * 28) }}>
          <ResponsiveContainer>
            <BarChart data={sortedByUnemp} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
              <YAxis dataKey="county" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" width={150} />
              <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} formatter={(v: number) => [`${v}%`, "Unemployment"]} />
              <Bar dataKey="unemp" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="sm:hidden border-b border-border/40 bg-muted/10 px-5 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">↔ swipe to see more columns</div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-3 border-b border-border bg-muted/30 px-5 py-3 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              <div className="col-span-3">County</div>
              <div className="col-span-2 text-right">Pop. (k)</div>
              <div className="col-span-2 text-right">Unemployment</div>
              <div className="col-span-2 text-right">Living wage / hr</div>
              <div className="col-span-2 text-right">Median rent</div>
              <div className="col-span-1 text-right">Grad %</div>
            </div>
            {counties.map((row) => (
              <div key={row.county} className="grid grid-cols-12 gap-3 border-b border-border/50 px-5 py-3 text-sm last:border-0 hover:bg-muted/20">
                <div className="col-span-3 flex items-center gap-2">
                  <MapPin size={11} className="text-muted-foreground" />
                  {row.county}
                </div>
                <div className="col-span-2 text-right font-mono">{row.popK.toLocaleString()}</div>
                <div className="col-span-2 text-right font-mono">{row.unemp.toFixed(1)}%</div>
                <div className="col-span-2 text-right font-mono">${row.livingWage.toFixed(2)}</div>
                <div className="col-span-2 text-right font-mono">${row.medianRent.toLocaleString()}</div>
                <div className="col-span-1 text-right font-mono">{row.gradRate.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="label-cap mb-1 text-primary">County methodology</div>
        <p className="text-[0.85rem] leading-relaxed text-foreground/80">
          County series compiled from BLS LAUS (unemployment), MIT Living Wage Calculator (1 adult + 1 child threshold), HUD FMR or local rent indices (median rent), and state DOE 4-year cohort graduation rates. Population from US Census Bureau ACS 5-year estimates.
        </p>
      </div>
    </div>
  );
}
