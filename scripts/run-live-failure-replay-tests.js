#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const webhook=String(process.env.CANONICAL_PLATFORM_WEBHOOK_PATH||'/webhook/canonical-platform-integration-hardening');
const token=process.env.N8N_WEBHOOK_TOKEN||'';
if(!base){console.error('Missing N8N_BASE_URL');process.exit(2);}
if(!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must use HTTPS');process.exit(2);}

const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'../tests/canonical-platform-failure-cases.json'),'utf8')).cases;
async function post(c,key){
  const body={schemaVersion:'1.0',eventId:'failure-'+Date.now(),eventType:c.eventType,occurredAt:new Date().toISOString(),source:'github-live-failure-test',idempotencyKey:key,correlationId:'failure-suite',engine:c.engine,leadId:c.leadId,dealId:c.dealId,propertyId:c.propertyId,dealStatus:c.dealStatus,payload:{failureTest:true}};
  const headers={'content-type':'application/json'}; if(token) headers.authorization='Bearer '+token;
  const res=await fetch(base+webhook,{method:'POST',headers,body:JSON.stringify(body)});
  const raw=await res.text(); let response; try{response=JSON.parse(raw);}catch{response={raw:raw.slice(0,1000)};}
  return {status:res.status,ok:res.ok,response};
}
const results=[];
for(const c of cases){
  const key='failure-suite:'+c.id+':'+Date.now();
  const first=await post(c,key);
  let actual=first.response?.reason||first.response?.canonicalIntegration?.action||first.response?.status||'';
  let passed=String(actual).toLowerCase().includes(String(c.expectedReason).toLowerCase());
  if(c.replay){
    const second=await post(c,key);
    const secondActual=second.response?.reason||second.response?.canonicalIntegration?.action||second.response?.status||'';
    passed=passed && String(secondActual).toLowerCase().includes('replay_blocked');
    results.push({id:c.id,first,second,passed});
  } else results.push({id:c.id,first,passed});
}
const failed=results.filter(x=>!x.passed);
console.log(JSON.stringify({status:failed.length?'failed':'passed',results},null,2));
process.exit(failed.length?1:0);
