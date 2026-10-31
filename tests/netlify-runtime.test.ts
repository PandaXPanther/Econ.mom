import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fixtures, envelope } from "./ai-fixtures";
const savedFetch=globalThis.fetch;
const savedEnv={...process.env};
afterEach(()=>{globalThis.fetch=savedFetch;process.env={...savedEnv};});
for(const fixture of fixtures) {
  test(`${fixture.name} serves the same JSON through Netlify's Request/Response runtime`,async()=>{
    process.env.OPENAI_API_KEY="test";delete process.env.AI_DISABLED;
    globalThis.fetch=async()=>Response.json(envelope(fixture.name==='tariff-sector-data'?{result:fixture.output}:fixture.output));
    const module=await import(`../netlify/functions/${fixture.name}.ts`);
    assert.equal(typeof module.default,"function","Function must use the runtime that provides Netlify Blobs context");
    const request=new Request(`https://econ.mom/api/${fixture.name}`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://econ.mom'},body:JSON.stringify(fixture.input)});
    const response=await module.default(request,{requestID:'test',account:{id:'test'},deploy:{id:'test'},site:{id:'test'},ip:'127.0.0.1'});
    assert.equal(response.status,200,await response.clone().text());
    const value=await response.json();
    assert.ok(Object.keys(fixture.output).every(key=>key in value));
    process.env.AI_DISABLED='1';
    const blocked=await module.default(new Request(`https://econ.mom/api/${fixture.name}`),{requestID:'test',account:{id:'test'},deploy:{id:'test'},site:{id:'test'},ip:'127.0.0.1'});
    assert.equal(blocked.status,503);
  });
}
