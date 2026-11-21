#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const path=String(process.env.PROVIDER_CALLBACK_WEBHOOK_PATH||'/webhook/canonical-provider-callback');
if(!base||!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must be HTTPS');process.exit(2);}
if(!process.env.PROVIDER_CALLBACK_SHARED_TOKEN){console.error('PROVIDER_CALLBACK_SHARED_TOKEN is required');process.exit(2);}
const token=process.env.PROVIDER_CALLBACK_SHARED_TOKEN;
const cases=[
 {id:'missing-resource-id',body:{providerCategory:'esignature',providerEventId:'callback-test-missing-resource',status:'completed'},expect:500},
 {id:'unknown-resource',body:{providerCategory:'esignature',providerEventId:'callback-test-unknown-resource',status:'completed',providerResourceId:'unknown-provider-resource',providerResourceExists:false},expect:500},
 {id:'unsupported-status',body:{providerCategory:'esignature',providerEventId:'callback-test-unsupported-status',status:'mystery',providerResourceId:'pkg-test',providerResourceExists:true},expect:500},
 {id:'communications-delivered',body:{providerCategory:'communications',providerEventId:'callback-test-communication',status:'delivered'},expect:202}
];
async function run(c){
 const headers={'content-type':'application/json','x-provider-callback-token':token};
 const r=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(c.body)});
 const raw=await r.text(); return {id:c.id,status:r.status,expected:c.expect,passed:r.status===c.expect,response:raw.slice(0,500)};
}
const results=[]; for(const c of cases) results.push(await run(c));
const failed=results.filter(x=>!x.passed);
console.log(JSON.stringify({status:failed.length?'failed':'passed',results},null,2));
process.exit(failed.length?1:0);
