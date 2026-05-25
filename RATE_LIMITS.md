# econ.mom API rate limits

Every paid-API Netlify Function is wrapped in `netlify/functions/_lib/limits.ts`. The wrapper enforces, per request:

- **POST only** (`405` otherwise)
- **Origin guard** — econ.mom, www.econ.mom, Netlify previews (`*.netlify.app`, `*--*.netlify.app`), localhost. Extra allow-list via env `RATE_LIMIT_ALLOWED_ORIGINS` (comma-separated).
- **Body size cap** — service-specific. `413` if exceeded.
- **Per-IP** sliding windows (minute, hour, day) backed by Netlify Blobs (`api-quota` store, strong consistency). `429` with `Retry-After` if exceeded.
- **Global daily cap** — hard budget guardrail per service.
- **Pre-check then increment** — counters are peeked first, so an over-limit request never bumps the counter. Stops wallet drain under stampede.

Cached responses are stored in the `api-cache` Blobs store with TTL. Cached returns include `"cached": true` for transparency.

## Active limits

| Service bucket | Functions | Per Min | Per Hour | Per Day / IP | Global / Day | Body cap | Cache TTL |
|---|---|---|---|---|---|---|---|
| `perplexity` | `news-translate` | 2 | 6 | 15 | 150 | 1 KB | 24 h |
| `gemini-text` (shared) | `gemini-news`, `gemini-shock`, `gemini-preset`, `gemini-scenario`, `gemini-inflation-explain` | 4 | 15 | 30 | 400 | 4 KB | 12 to 24 h |
| `gemini-paper` | `gemini-paper` | 2 | 8 | 15 | 150 | 80 KB | 24 h |
| `gemini-frq-grade` | `grade-frq` | 2 | 8 | 15 | 200 | 350 KB | none (per-student) |
| `gemini-frq-gen` | `generate-frq` | 3 | 12 | 25 | 250 | 2 KB | 12 h |

Counters and caches reset on UTC date boundaries.

## Env var overrides

Every limit can be tightened or loosened in the Netlify dashboard without a redeploy. Variables follow the pattern `LIMIT_<SERVICE>_<FIELD>` where `<SERVICE>` is the bucket name uppercased with `-` → `_` and `<FIELD>` is one of `PERMIN`, `PERHOUR`, `PERDAY`, `GLOBALDAY`, `BODYMAX`.

Examples:

- `LIMIT_PERPLEXITY_GLOBALDAY=50` (tighten the global Perplexity cap)
- `LIMIT_GEMINI_TEXT_PERMIN=2` (slow the shared Gemini bucket)
- `LIMIT_GEMINI_FRQ_GRADE_PERDAY=5` (lock down free FRQ grading)

## Required secrets

- `GEMINI_API_KEY` — already configured
- `PERPLEXITY_API_KEY` — required for `news-translate`. Set in Netlify env. Never commit.
- `FRED_API_KEY` — already configured

## Budget math

- `$100` Perplexity budget on the cheap `sonar` model with citations.
- 150 global requests/day cap = ~4,500/month maximum.
- Estimated max spend: ~$20 to $30/month under sustained traffic. The 24h cache means viral spikes on the same headline cost a single API call.

## Architecture notes

- Counter store: `getStore({ name: "api-quota", consistency: "strong" })` so race conditions on increment cannot exceed the cap by more than a fraction.
- Cache store: `getStore({ name: "api-cache", consistency: "eventual" })`. Stale reads are acceptable.
- Free tier Netlify Blobs: 100k reads + 100k writes + 100 GB/month. Our usage budget is well below that.

## Adding a new rate-limited function

```ts
import { enforce, getCachedJSON, setCachedJSON, hashStable, json } from "./_lib/limits";

export const handler: Handler = async (event) => {
  const blocked = await enforce(event, {
    service: "my-service",
    perMin: 3, perHour: 10, perDay: 25, perDayGlobal: 200, maxBodyBytes: 2048,
  });
  if (blocked) return blocked;

  // ...validate body, build cacheKey from normalized inputs...
  const cached = await getCachedJSON(cacheKey, 60 * 60 * 12);
  if (cached) return json(200, { ...cached, cached: true });

  // ...call paid API...

  await setCachedJSON(cacheKey, result, 60 * 60 * 12);
  return json(200, { ...result, cached: false });
};
```
