import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fixtures, envelope, frq, grade } from "./ai-fixtures";

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach(() => { globalThis.fetch = originalFetch; process.env = { ...originalEnv }; });
function setup() { process.env.OPENAI_API_KEY = "test-only-credential"; delete process.env.GEMINI_API_KEY; delete process.env.AI_DISABLED; }
async function invoke(name: string, body: unknown, extra: Record<string, unknown> = {}) {
  const { handler } = await import(`../netlify/functions/${name}.ts`);
  return handler({ httpMethod: "POST", headers: { origin: "https://econ.mom", host: "econ.mom" }, body: JSON.stringify(body), ...extra }, {});
}

function withBlobs(output: unknown) {
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({siteID:"test-site",token:"test-token",edgeURL:"https://blobs.example",uncachedEdgeURL:"https://blobs.example"})).toString("base64");
  const store = new Map<string,string>();
  let paidRequests=0;
  globalThis.fetch = async (url, init) => {
    const address = new URL(String(url));
    if (address.hostname === "blobs.example") {
      if (init?.method?.toLowerCase() === "put") { store.set(address.pathname, String(init.body)); return new Response(null, {status:200}); }
      return store.has(address.pathname) ? new Response(store.get(address.pathname), {status:200}) : new Response(null, {status:404});
    }
    assert.equal(address.hostname,"api.openai.com"); paidRequests++;
    return Response.json(envelope(output));
  };
  return {store, paidRequests:()=>paidRequests};
}

test("a repeated headline uses cached OpenAI output; a changed model gets a new response", async () => {
  setup(); const fake = withBlobs(fixtures[0].output);
  const first=await invoke("gemini-shock", fixtures[0].input);
  const second=await invoke("gemini-shock", fixtures[0].input);
  assert.equal(first.statusCode,200,first.body);
  assert.equal(second.statusCode,200,second.body);
  assert.equal(JSON.parse(first.body).cached,false);
  assert.equal(JSON.parse(second.body).cached,true);
  assert.equal(fake.paidRequests(),1);
  process.env.OPENAI_MODEL="gpt-6-luna";
  assert.equal(JSON.parse((await invoke("gemini-shock",fixtures[0].input)).body).cached,false);
  assert.equal(fake.paidRequests(),2);
});

test("papers sharing a long prefix do not share a cached answer", async () => {
  setup(); const fake=withBlobs(fixtures[2].output);
  const common="A".repeat(4500);
  await invoke("gemini-paper",{text:common+"The effect is positive."});
  await invoke("gemini-paper",{text:common+"The effect is negative."});
  assert.equal(fake.paidRequests(),2);
});

test("student grades are never read from or written to the response cache", async () => {
  setup(); const fake=withBlobs(grade);
  const input={frq,responses:{a:"Output rises"}};
  assert.equal((await invoke("grade-frq",input)).statusCode,200);
  assert.equal((await invoke("grade-frq",input)).statusCode,200);
  assert.equal(fake.paidRequests(),2);
  assert.equal([...fake.store.keys()].some(key=>key.includes("api-cache")),false);
});

test("the existing quota override still prevents spending after the cap", async () => {
  setup(); process.env.LIMIT_GEMINI_TEXT_PERMIN="1";
  const fake=withBlobs(fixtures[0].output);
  assert.equal((await invoke("gemini-shock",fixtures[0].input)).statusCode,200);
  const blocked=await invoke("gemini-shock",{headline:"A different shock"});
  assert.equal(blocked.statusCode,429);
  assert.equal(JSON.parse(blocked.body).scope,"ip-min");
  assert.equal(fake.paidRequests(),1);
});

test("tariff classifier retains its unrecognized-sector response", async () => {
  setup(); globalThis.fetch=async()=>Response.json(envelope({result:{error:"Sector not recognized."}}));
  const response=await invoke("tariff-sector-data",{sector:"asdfghj"});
  assert.equal(response.statusCode,422);
  assert.equal(JSON.parse(response.body).error,"Sector not recognized.");
});

test("inflation failures preserve supplied component contributions in the fallback", async () => {
  setup(); globalThis.fetch=async()=>new Response("sensitive provider detail",{status:429});
  const response=await invoke("gemini-inflation-explain",{headlineCpi:3,components:{energy:1,shelter:2}});
  const value=JSON.parse(response.body);
  assert.equal(response.statusCode,200);
  assert.equal(value._degraded,true);
  assert.deepEqual(value.drivers.map((d:any)=>d.contribution),[2,1]);
  assert.equal(response.body.includes("sensitive"),false);
});

for (const fixture of fixtures) {
  test(`${fixture.name} preserves its response contract with only an OpenAI key`, async () => {
    setup(); let requests = 0;
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://api.openai.com/v1/responses");
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer test-only-credential");
      const payload = JSON.parse(String(init?.body));
      assert.equal(payload.store, false);
      assert.equal(payload.text.format.type, "json_schema");
      assert.equal(payload.text.format.strict, true);
      requests++;
      return Response.json(envelope(fixture.name === "tariff-sector-data" ? {result:fixture.output} : fixture.output));
    };
    const response = await invoke(fixture.name, fixture.input);
    assert.equal(response.statusCode, 200, response.body);
    const value = JSON.parse(response.body);
    for (const [key, expected] of Object.entries(fixture.output)) {
      if (key === "watchVariables" || key === "id") continue;
      assert.deepEqual(value[key], expected, key);
    }
    assert.equal(requests, 1);
    if (fixture.name === "gemini-shock") assert.equal(value.watchVariables[0].sourceUrl, "https://fred.stlouisfed.org/series/DCOILWTICO");
  });
  test(`${fixture.name} retains disabled, method, origin and body-size guards`, async () => {
    setup(); globalThis.fetch = async () => { throw new Error("Paid API must not be called"); };
    process.env.AI_DISABLED = "1";
    assert.equal((await invoke(fixture.name, fixture.input)).statusCode, 503);
    delete process.env.AI_DISABLED;
    assert.equal((await invoke(fixture.name, fixture.input, {httpMethod: "GET"})).statusCode, 405);
    assert.equal((await invoke(fixture.name, fixture.input, {headers: {origin: "https://other.example", host: "other.example"}})).statusCode, 403);
    assert.equal((await invoke(fixture.name, {}, {body: "x".repeat(360 * 1024)})).statusCode, 413);
  });
}

test("graph grading sends the original image and its part label", async () => {
  setup();
  const image = "data:image/png;base64,aGVsbG8=";
  globalThis.fetch = async (_url, init) => {
    const content = JSON.parse(String(init?.body)).input[0].content;
    assert.deepEqual(content.slice(1), [{type:"input_text", text:"[GRAPH FOR PART a]"}, {type:"input_image", image_url:image, detail:"high"}]);
    return Response.json(envelope(grade));
  };
  const response = await invoke("grade-frq", {frq, responses: {a:"Output rises"}, partImages:{a:image, b:"https://external.example/image.png"}});
  assert.equal(response.statusCode, 200, response.body);
});

for (const fixture of fixtures) {
  test(`${fixture.name} rejects malformed output before it reaches the client`, async () => {
    setup(); globalThis.fetch = async () => Response.json(envelope({unexpected:"missing required fields"}));
    const response = await invoke(fixture.name, fixture.input);
    const body = JSON.parse(response.body);
    if (fixture.name === "gemini-inflation-explain") assert.equal(body._degraded, true);
    else assert.equal(response.statusCode, 502, response.body);
  });
}
