import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import express from "express";
import { createServer } from "node:http";
import { registerRoutes } from "../server/routes";
import { envelope, frq, grade } from "./ai-fixtures";
const savedFetch=globalThis.fetch;
const savedEnv={...process.env};
afterEach(()=>{globalThis.fetch=savedFetch;process.env={...savedEnv};});

test("Express preserves the grading and legacy graph endpoint contracts", async () => {
  process.env.OPENAI_API_KEY="test"; delete process.env.GEMINI_API_KEY;
  globalThis.fetch=async()=>Response.json(envelope(grade));
  const app=express(); app.use(express.json());
  const server=createServer(app); await registerRoutes(server,app);
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  const address=server.address() as {port:number};
  try {
    const response=await savedFetch(`http://127.0.0.1:${address.port}/api/grade-frq`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({frq,responses:{a:"Output rises"}})});
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),grade);
    assert.equal((await savedFetch(`http://127.0.0.1:${address.port}/api/grade-graph`,{method:"POST"})).status,410);
    delete process.env.OPENAI_API_KEY;
    assert.equal((await savedFetch(`http://127.0.0.1:${address.port}/api/grade-frq`,{method:"POST"})).status,503);
  } finally { await new Promise<void>(resolve=>server.close(()=>resolve())); }
});
