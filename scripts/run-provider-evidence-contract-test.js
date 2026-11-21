#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const webhook=String(process.env.PROVIDER_ADAPTER_WEBHOOK_PATH||'/webhook/canonical-provider-adapter');
const token=process.env.N8N_WEBHOOK_TOKEN||'';
if(!base||!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must be HTTPS');process.exit(2);}
const id='provider-evidence-test:'+Date.now();
const body={schemaVersion:'1.0',providerCategory:'communications',operation:'send_message',idempotencyKey:id,correlationId:'provider-evidence-verification',entity:{dealId:'provider-evidence-test-deal',propertyId:'provider-evidence-test-property'},payload:{dryRun:false,message:'provider evidence contract test'},metadata:{source:'github-provider-evidence-verification',retryCount:0}};
const headers={'content-type':'application/json'}; if(token) headers.authorization='Bearer '+token;
async function main(){
const res=await fetch(base+webhook,{method:'POST',headers,body:JSON.stringify(body)});
const raw=await res.text(); let response; try{response=JSON.parse(raw)}catch{response={raw:raw.slice(0,1000)}}
const providerEvidence=response.providerEvidence;
const passed=res.status===200 && response.status==='accepted' && providerEvidence && providerEvidence.idempotencyKey===id;
console.log(JSON.stringify({status:passed?'passed':'failed',httpStatus:res.status,idempotencyKey:id,providerEvidence,response},null,2));
process.exit(passed?0:1);

}
main().catch(error=>{console.error(error);process.exit(1);});
