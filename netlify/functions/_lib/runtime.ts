import { withLambda, type LambdaHandler } from "@netlify/aws-lambda-compat";

/** Keep the event-handler interface while using modern Netlify storage context. */
export function withRuntime(handler: LambdaHandler) {
  const adapted = withLambda(handler);
  return (request: Request, context: Parameters<typeof adapted>[1]) => {
    // The adapter preserves headers but does not copy context.ip into the
    // event. Feed the platform's authoritative IP to the existing quota code.
    const headers = new Headers(request.headers);
    if (context.ip) headers.set("x-forwarded-for", context.ip);
    return adapted(new Request(request, { headers }), context);
  };
}
