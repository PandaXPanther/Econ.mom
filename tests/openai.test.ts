import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { requestOpenAI, aiCacheKey } from "../shared/openai";
import { envelope, fixtures } from "./ai-fixtures";

const savedFetch = globalThis.fetch;
const savedEnv = { ...process.env };
afterEach(() => { globalThis.fetch = savedFetch; process.env = { ...savedEnv }; });
const preset = fixtures.find((fixture) => fixture.name === "gemini-preset")!.output;

for (const [name, response] of [
  ["reasoning item before the message", envelope(preset)],
  ["split output text", {status:"completed", output:[{type:"message", content:[{type:"output_text", text:JSON.stringify(preset).slice(0, 15)}, {type:"output_text", text:JSON.stringify(preset).slice(15)}]}]}],
] as const) {
  test(`parses ${name} without losing JSON`, async () => {
    globalThis.fetch = async () => Response.json(response);
    assert.deepEqual(await requestOpenAI("test", "preset", "JSON please"), preset);
  });
}
for (const [name, response] of [
  ["refusal", {status:"completed", output:[{type:"message", content:[{type:"refusal", refusal:"No"}]}]}],
  ["truncation", {...envelope(preset), status:"incomplete"}],
  ["empty output", {status:"completed", output:[]}],
  ["missing output", {status:"completed"}],
  ["wrong enum", envelope({...fixtures[0].output, type:"nonsense"})],
  ["non-JSON", {status:"completed", output:[{type:"message", content:[{type:"output_text", text:"not JSON"}]}]}],
] as const) {
  test(`rejects ${name} as a controlled provider error`, async () => {
    globalThis.fetch = async () => Response.json(response);
    await assert.rejects(requestOpenAI("test", name === "wrong enum" ? "shock" : "preset", "JSON please"), (error: any) => error.statusCode === 502);
  });
}
test("provider and transport errors do not expose credentials or student data", async () => {
  for (const status of [400, 401, 429, 500]) {
    globalThis.fetch = async () => new Response("private-answer private-key", {status});
    await assert.rejects(requestOpenAI("private-key", "preset", "private-answer"), (error: any) => error.statusCode === 502 && !/private/.test(error.message));
  }
  globalThis.fetch = async () => { throw new Error("private-key private-answer"); };
  await assert.rejects(requestOpenAI("private-key", "preset", "private-answer"), (error: any) => error.statusCode === 502 && !/private/.test(error.message));
});
test("deadline remains active while reading the provider body", async () => {
  globalThis.fetch = async (_url, init) => ({ok:true, json: () => new Promise((_resolve, reject) => init!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))}) as Response;
  await assert.rejects(requestOpenAI("test", "preset", "JSON please", {timeoutMs:15}), (error: any) => error.statusCode === 504);
});
test("deadline aborts a request before response headers arrive", async () => {
  globalThis.fetch = async (_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
  await assert.rejects(requestOpenAI("test", "preset", "JSON please", {timeoutMs:15}), (error: any) => error.statusCode === 504);
});
test("provider cache keys differ by model, tool and full input hash", () => {
  process.env.OPENAI_MODEL = "model-a";
  const first = aiCacheKey("paper", "hash-a");
  assert.notEqual(first, aiCacheKey("paper", "hash-b"));
  assert.notEqual(first, aiCacheKey("news", "hash-a"));
  process.env.OPENAI_MODEL = "model-b";
  assert.notEqual(first, aiCacheKey("paper", "hash-a"));
  assert.ok(first.startsWith("openai:"));
});
test("model override and bounded generation are sent to the provider", async () => {
  process.env.OPENAI_MODEL = "  gpt-6-luna  ";
  globalThis.fetch = async (_url, init) => {
    const request = JSON.parse(String(init?.body));
    assert.equal(request.model, "gpt-6-luna");
    assert.equal(request.max_output_tokens, 1200);
    assert.deepEqual(request.reasoning, {effort:"none"});
    return Response.json(envelope(preset));
  };
  assert.deepEqual(await requestOpenAI("test", "preset", "JSON please", {maxOutputTokens:1200}), preset);
});
