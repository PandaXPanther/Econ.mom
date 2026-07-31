// Netlify Function: cheap public endpoint that reports whether AI features
// are enabled. Frontend hooks poll this on mount so they can hide AI-powered
// UI when we flip AI_DISABLED=1 in Netlify env vars (no redeploy required).
//
// No rate limit needed: this is a tiny env-var read, cached hard on the client.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const enabled = process.env.AI_DISABLED !== "1";
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // Short cache so users see the flip within a minute or two.
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
    body: JSON.stringify({ enabled }),
  };
};
