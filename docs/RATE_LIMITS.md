# econ.mom API rate limits

Every paid-API Netlify Function is wrapped in `netlify/functions/_lib/limits.ts`. It enforces: POST only, origin guard, body size cap, per-IP sliding windows (min, hour, day), and a global daily ceiling. Counters and cache live in Netlify Blobs (`api-quota` strong consistency, `api-cache` eventual). Pre-check then increment, so a blocked request never bumps the counter.

## Limits

Sized so a real student grinding samples or FRQs never hits a wall. Only sustained automation trips the caps.

| Bucket | Functions | /min | /hr | /day per IP | /day global | Body | Cache |
|---|---|---|---|---|---|---|---|
| `perplexity` | `news-translate` | 8 | 30 | 60 | 200 | 2 KB | 24 h |
| `gemini-text` | `gemini-news`, `-shock`, `-preset`, `-scenario`, `-inflation-explain` | 12 | 60 | 120 | 600 | 6 KB | 12 to 24 h |
| `gemini-paper` | `gemini-paper` | 4 | 15 | 25 | 200 | 80 KB | 24 h |
| `gemini-frq-grade` | `grade-frq` | 6 | 25 | 60 | 300 | 350 KB | none |
| `gemini-frq-gen` | `generate-frq` | 8 | 30 | 60 | 350 | 2 KB | 12 h |

Counters reset on UTC date boundaries.

## Overrides

Tweak any limit in the Netlify dashboard without a redeploy. Pattern: `LIMIT_<SERVICE>_<FIELD>` where `<FIELD>` is `PERMIN`, `PERHOUR`, `PERDAY`, `GLOBALDAY`, or `BODYMAX`. Example: `LIMIT_PERPLEXITY_GLOBALDAY=50`.

## Secrets

`GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `FRED_API_KEY`. Set in Netlify env, never commit.

## Budget

Perplexity Sonar at 200/day global caps spend around $30 to $40/month. The 24h cache means viral spikes on the same headline cost one API call. Gemini at 600/day stays well inside free-tier limits.

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
