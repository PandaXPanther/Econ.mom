# econ.mom API rate limits

Every paid-API Netlify Function is wrapped in `netlify/functions/_lib/limits.ts`. It enforces: POST only, origin guard, body size cap, per-IP sliding windows (min, hour, day), and a global daily ceiling. Counters and cache live in Netlify Blobs (`api-quota` strong consistency, `api-cache` eventual). Pre-check then increment, so a blocked request never bumps the counter.

## Limits

Sized so a real student grinding samples or FRQs never hits a wall. Only sustained automation trips the caps.

| Bucket | Functions | /min | /hr | /day per IP | /day global | Body | Cache |
|---|---|---|---|---|---|---|---|
| `perplexity` | `news-translate` | 8 | 30 | 60 | 200 | 2 KB | 24 h |
| `gemini-text` | `gemini-news`, `-shock`, `-preset`, `-scenario`, `-inflation-explain` | 6 | 25 | 60 | 200 | 6 KB | 12 to 24 h |
| `gemini-paper` | `gemini-paper` | 2 | 8 | 15 | 40 | 80 KB | 24 h |
| `gemini-frq-grade` | `grade-frq` | 3 | 12 | 25 | 50 | 350 KB | none |
| `gemini-frq-gen` | `generate-frq` | 4 | 15 | 30 | 60 | 2 KB | 12 h |
| `gemini-tariff` | `tariff-sector-data` | 3 | 12 | 25 | 60 | 4 KB | none |

The `gemini-*` bucket names and endpoint URLs are retained for compatibility. These functions now call OpenAI. Existing `LIMIT_GEMINI_*` overrides and counters continue to apply. Cache entries use an OpenAI/schema-version/model namespace; changing `OPENAI_MODEL` does not reuse a previous model's responses. Student grades are never cached.

Counters reset on UTC date boundaries.

## Overrides

Tweak any limit in the Netlify dashboard without a redeploy. Pattern: `LIMIT_<SERVICE>_<FIELD>` where `<FIELD>` is `PERMIN`, `PERHOUR`, `PERDAY`, `GLOBALDAY`, or `BODYMAX`. Example: `LIMIT_PERPLEXITY_GLOBALDAY=50`.

## Secrets

`OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `FRED_API_KEY`. Set in Netlify env, never commit. `OPENAI_API_KEY` is only needed by Functions; do not expose it to the frontend or put it in `netlify.toml`. Optional `OPENAI_MODEL` defaults to `gpt-6.1-terra`. `AI_DISABLED=1` still disables AI functions.

## Budget

Perplexity is unchanged. OpenAI is metered: daily request caps, bounded output tokens and response caching control usage; there is no assumption of a free tier. Reasoning is disabled for latency, provider calls are not automatically retried, and Responses storage is disabled. Default provider deadline is 20 seconds; grading/generation allow 35 seconds and inflation allows 15 seconds with its deterministic fallback. These budgets leave headroom within Netlify's 60-second synchronous execution limit for quota/cache operations. Request caps are best-effort read/write counters, not atomic spend limits, and fail open when Blobs is unavailable; configure project spending controls in OpenAI as well.

## Adding a new function

```ts
import { enforce, getCachedJSON, setCachedJSON, hashStable, json } from "./_lib/limits";

export const handler: Handler = async (event) => {
  const blocked = await enforce(event, {
    service: "my-service",
    perMin: 3, perHour: 10, perDay: 25, perDayGlobal: 200, maxBodyBytes: 2048,
  });
  if (blocked) return blocked;

  const cached = await getCachedJSON(cacheKey, 60 * 60 * 12);
  if (cached) return json(200, { ...cached, cached: true });

  // call paid API
  await setCachedJSON(cacheKey, result, 60 * 60 * 12);
  return json(200, { ...result, cached: false });
};
```
