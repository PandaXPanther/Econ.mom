// Shared rate-limit + cache + origin-guard for every paid API function.
//
// Backed by Netlify Blobs (free, built in, zero config). Counters are stored
// per IP + service + time-window, plus a per-service global daily cap so a
// distributed abuse burst still hits a wall.
//
// Usage in a function:
//
//   import { enforce, getCachedJSON, setCachedJSON, hashStable, json } from "./_lib/limits";
//   const blocked = await enforce(event, { service: "perplexity", perMin: 8, perHour: 30, perDay: 60, perDayGlobal: 200, maxBodyBytes: 2048 });
//   if (blocked) return blocked;
//   ...
//
// All thresholds can be overridden at runtime via env vars like
// LIMIT_PERPLEXITY_PERMIN, LIMIT_PERPLEXITY_PERHOUR, LIMIT_PERPLEXITY_PERDAY,
// LIMIT_PERPLEXITY_GLOBALDAY so we can tighten without redeploying.

import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

// ---------- helpers ----------

export function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  };
}

export function hashStable(input: unknown): string {
  const s = typeof input === "string" ? input : JSON.stringify(input);
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}

function clientIp(event: any): string {
  const fwd = (event.headers?.["x-forwarded-for"] || event.headers?.["X-Forwarded-For"] || "")
    .toString()
    .split(",")[0]
    .trim();
  if (fwd) return fwd;
  const real = event.headers?.["x-real-ip"] || event.headers?.["X-Real-IP"];
  if (real) return real.toString();
  // Netlify ships a client-ip header on edge functions; fall back to a host-bound bucket
  return event.headers?.["client-ip"] || "unknown";
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function allowedOrigin(event: any): boolean {
  const origin = (event.headers?.origin || event.headers?.Origin || "").toString();
  const referer = (event.headers?.referer || event.headers?.Referer || "").toString();
  const host = (event.headers?.host || event.headers?.Host || "").toString();

  // Allow netlify deploy previews and local dev
  const allowExtras = (process.env.RATE_LIMIT_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowList = [
    "https://econ.mom",
    "https://www.econ.mom",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:8888",
    ...allowExtras,
  ];

  const matches = (url: string) =>
    !!url && allowList.some((a) => url === a || url.startsWith(a + "/"));

  // Allow Netlify preview deploys (*.netlify.app)
  const netlifyPreview = (url: string) => /^https:\/\/[\w-]+--.+\.netlify\.app(\/|$)/.test(url);
  // Allow the production Netlify site host as a safety net
  const netlifyApex = (url: string) => /^https:\/\/[\w-]+\.netlify\.app(\/|$)/.test(url);

  if (matches(origin) || matches(referer)) return true;
  if (netlifyPreview(origin) || netlifyPreview(referer)) return true;
  if (netlifyApex(origin) || netlifyApex(referer)) return true;

  // Same-origin browser POSTs from the static site sometimes drop Origin/Referer;
  // accept if the request host matches our allowed apex.
  if (host && (host === "econ.mom" || host === "www.econ.mom")) return true;

  return false;
}

// ---------- counters ----------

type LimitOpts = {
  service: string;
  perMin?: number;
  perHour?: number;
  perDay?: number;
  perDayGlobal?: number;
  maxBodyBytes?: number;
};

function readEnvOverrides(o: LimitOpts): Required<Omit<LimitOpts, "service" | "maxBodyBytes">> & {
  service: string;
  maxBodyBytes: number;
} {
  const key = o.service.replace(/-/g, "_").toUpperCase();
  return {
    service: o.service,
    perMin: envInt(`LIMIT_${key}_PERMIN`, o.perMin ?? 5),
    perHour: envInt(`LIMIT_${key}_PERHOUR`, o.perHour ?? 20),
    perDay: envInt(`LIMIT_${key}_PERDAY`, o.perDay ?? 50),
    perDayGlobal: envInt(`LIMIT_${key}_GLOBALDAY`, o.perDayGlobal ?? 500),
    maxBodyBytes: envInt(`LIMIT_${key}_BODYMAX`, o.maxBodyBytes ?? 4096),
  };
}

function quotaStore() {
  return getStore({ name: "api-quota", consistency: "strong" });
}

function cacheStore() {
  return getStore({ name: "api-cache", consistency: "eventual" });
}

async function bumpCounter(key: string, ttlSec: number): Promise<number> {
  const store = quotaStore();
  const raw = await store.get(key, { type: "json" }).catch(() => null) as
    | { count: number; createdAt: number }
    | null;
  const now = Date.now();
  // Expire stale entries (in case we ever change window math)
  if (raw && now - raw.createdAt < ttlSec * 1000) {
    const next = { count: raw.count + 1, createdAt: raw.createdAt };
    await store.setJSON(key, next, { metadata: { ttl: ttlSec } });
    return next.count;
  }
  const next = { count: 1, createdAt: now };
  await store.setJSON(key, next, { metadata: { ttl: ttlSec } });
  return 1;
}

async function peekCounter(key: string): Promise<number> {
  const store = quotaStore();
  const raw = await store.get(key, { type: "json" }).catch(() => null) as
    | { count: number; createdAt: number }
    | null;
  return raw?.count ?? 0;
}

function windowKeys(ip: string, service: string): {
  minKey: string;
  hourKey: string;
  dayKey: string;
  globalDayKey: string;
} {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return {
    minKey: `ip:${ip}:${service}:${yyyy}${mm}${dd}T${hh}${mi}`,
    hourKey: `ip:${ip}:${service}:${yyyy}${mm}${dd}T${hh}`,
    dayKey: `ip:${ip}:${service}:${yyyy}${mm}${dd}`,
    globalDayKey: `global:${service}:${yyyy}${mm}${dd}`,
  };
}

// ---------- public API ----------

/**
 * Enforces rate limits, body size, and origin. Returns a Netlify Function
 * response object if the request should be rejected, otherwise null.
 */
export async function enforce(event: any, opts: LimitOpts) {
  const cfg = readEnvOverrides(opts);

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // Soft origin check: refuse cross-site browser requests.
  if (!allowedOrigin(event)) {
    return json(403, { error: "Origin not allowed" });
  }

  // Body size cap.
  const body = event.body || "";
  if (body.length > cfg.maxBodyBytes) {
    return json(413, {
      error: `Request body exceeds ${cfg.maxBodyBytes} bytes. This endpoint is rate-limited; please shorten your input.`,
    });
  }

  const ip = clientIp(event);

  const { minKey, hourKey, dayKey, globalDayKey } = windowKeys(ip, cfg.service);

  // Pre-check (peek) so we never increment a counter on a request that is
  // already over the limit. This keeps the wallet safe under bursty load.
  const [m, h, d, g] = await Promise.all([
    peekCounter(minKey),
    peekCounter(hourKey),
    peekCounter(dayKey),
    peekCounter(globalDayKey),
  ]);

  if (g >= cfg.perDayGlobal) {
    return json(
      429,
      {
        error: "Daily global capacity reached. This is a budget guardrail. Try again tomorrow.",
        scope: "global-day",
      },
      { "Retry-After": "3600" }
    );
  }
  if (d >= cfg.perDay) {
    return json(
      429,
      { error: `Daily per-user cap reached (${cfg.perDay}/day). Try again tomorrow.`, scope: "ip-day" },
      { "Retry-After": "3600" }
    );
  }
  if (h >= cfg.perHour) {
    return json(
      429,
      { error: `Hourly cap reached (${cfg.perHour}/hour). Take a breather and try again later.`, scope: "ip-hour" },
      { "Retry-After": "300" }
    );
  }
  if (m >= cfg.perMin) {
    return json(
      429,
      { error: `Slow down (${cfg.perMin}/min). Try again in a minute.`, scope: "ip-min" },
      { "Retry-After": "30" }
    );
  }

  // Increment all 4 in parallel. Each gets a TTL slightly larger than its window.
  await Promise.all([
    bumpCounter(minKey, 90),
    bumpCounter(hourKey, 60 * 65),
    bumpCounter(dayKey, 60 * 60 * 26),
    bumpCounter(globalDayKey, 60 * 60 * 26),
  ]);

  return null;
}

/** Read a cached JSON response by key, or null if missing/expired. */
export async function getCachedJSON<T = unknown>(key: string, ttlSec: number): Promise<T | null> {
  const store = cacheStore();
  const raw = await store
    .get(`cache:${key}`, { type: "json" })
    .catch(() => null) as { value: T; createdAt: number } | null;
  if (!raw) return null;
  if (Date.now() - raw.createdAt > ttlSec * 1000) return null;
  return raw.value;
}

/** Write a cached JSON response under a key. */
export async function setCachedJSON(key: string, value: unknown, ttlSec: number): Promise<void> {
  const store = cacheStore();
  await store.setJSON(
    `cache:${key}`,
    { value, createdAt: Date.now() },
    { metadata: { ttl: ttlSec } }
  );
}
