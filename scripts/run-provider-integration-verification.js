#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const webhook=String(process.env.PROVIDER_ADAPTER_WEBHOOK_PATH||'/webhook/canonical-provider-adapter');
const token=process.env.N8N_WEBHOOK_TOKEN||'';
if(!base){console.error('Missing N8N_BASE_URL');process.exit(2);}
if(!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must use HTTPS');process.exit(2);}
const cases=[
  ['communications','send_message'],
  ['esignature','create_package'],
  ['titleClosing','create_title_order'],
  ['funds','confirm_funding']
];
async function post(category,operation){
 const id='provider-test:'+category+':'+operation+':'+Date.now();
 const body={schemaVersion:'1.0',providerCategory:category,operation,idempotencyKey:id,correlationId:'provider-verification',entity:{dealId:'provider-test-deal',propertyId:'provider-test-property'},payload:{dryRun:true},metadata:{source:'github-provider-verification',retryCount:0}};
 const headers={'content-type':'application/json'}; if(token) headers.authorization='Bearer '+token;
 const res=await fetch(base+webhook,{method:'POST',headers,body:JSON.stringify(body)});
 const raw=await res.text(); let response; try{response=JSON.parse(raw)}catch{response={raw:raw.slice(0,1000)}}
 return {category,operation,status:res.status,ok:res.ok,response};
}
const results=[];
for(const [category,operation] of cases) results.push(await post(category,operation));
const failed=results.filter(x=>!x.ok);
console.log(JSON.stringify({status:failed.length?'failed':'passed',results},null,2));
process.exit(failed.length?1:0);
