#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const path=String(process.env.PROVIDER_ADAPTER_WEBHOOK_PATH||'/webhook/canonical-provider-adapter');
if(!base||!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must be HTTPS');process.exit(2);}
const live=process.env.PROVIDER_CONTRACT_DRY_RUN==='false'; if(live&&!process.env.PROVIDER_CALLBACK_SHARED_TOKEN) { console.error('PROVIDER_CALLBACK_SHARED_TOKEN is required for live provider verification'); process.exit(2); }
const cases=[
  {providerCategory:'communications',operation:'send_message'},
  {providerCategory:'esignature',operation:'create_package'},
  {providerCategory:'titleClosing',operation:'create_title_order'},
  {providerCategory:'funds',operation:'confirm_funding'}
];
async function run(c){
  const id='provider-contract-test:'+c.providerCategory+':'+c.operation+':'+Date.now();
  const body={schemaVersion:'1.0',providerCategory:c.providerCategory,operation:c.operation,idempotencyKey:id,correlationId:'provider-contract-test',entity:{dealId:'test-deal',propertyId:'test-property'},payload:{dryRun:!live},metadata:{source:'provider-contract-test'}};
  const headers={'content-type':'application/json'};
  if(process.env.N8N_WEBHOOK_TOKEN) headers.authorization='Bearer '+process.env.N8N_WEBHOOK_TOKEN;
  const r=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
  const raw=await r.text();
  let parsed;
  try{parsed=JSON.parse(raw)}catch{parsed={raw:raw.slice(0,1000)}}
  const responseContractOk=parsed&&typeof parsed==='object'&&('status' in parsed||'accepted' in parsed||'providerResult' in parsed); return {case:c,status:r.status,ok:r.ok&&responseContractOk,responseContractOk,response:parsed};
}
const results=[];
for(const c of cases) results.push(await run(c));
const failed=results.filter(x=>!x.ok);
console.log(JSON.stringify({status:failed.length?'failed':'passed',results},null,2));
process.exit(failed.length?1:0);
