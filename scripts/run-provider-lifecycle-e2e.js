#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const adapterPath=String(process.env.PROVIDER_ADAPTER_WEBHOOK_PATH||'/webhook/canonical-provider-adapter');
const callbackPath=String(process.env.PROVIDER_CALLBACK_WEBHOOK_PATH||'/webhook/canonical-provider-callback');
const n8nToken=String(process.env.N8N_WEBHOOK_TOKEN||'');
const callbackToken=String(process.env.PROVIDER_CALLBACK_SHARED_TOKEN||'');
if(!base||!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must be HTTPS');process.exit(2);}
if(!callbackToken){console.error('PROVIDER_CALLBACK_SHARED_TOKEN is required');process.exit(2);}
const id='provider-lifecycle-e2e:'+Date.now();
const providerEventId='provider-lifecycle-e2e-event:'+Date.now();
const adapterBody={schemaVersion:'1.0',providerCategory:String(process.env.PROVIDER_LIFECYCLE_CATEGORY||'esignature'),operation:String(process.env.PROVIDER_LIFECYCLE_OPERATION||'create_package'),idempotencyKey:id,correlationId:'provider-lifecycle-e2e',entity:{dealId:String(process.env.PROVIDER_LIFECYCLE_DEAL_ID||'provider-lifecycle-e2e-deal'),propertyId:String(process.env.PROVIDER_LIFECYCLE_PROPERTY_ID||'provider-lifecycle-e2e-property')},payload:{dryRun:false,source:'github-provider-lifecycle-e2e'}};
const headers={'content-type':'application/json'}; if(n8nToken) headers.authorization='Bearer '+n8nToken;
async function post(path,body,extra={}){const r=await fetch(base+path,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});const raw=await r.text();let parsed;try{parsed=JSON.parse(raw)}catch{parsed={raw:raw.slice(0,1200)}}return {status:r.status,parsed};}
async function main(){
const mutation=await post(adapterPath,adapterBody);
const evidence=mutation.parsed?.providerEvidence;
const resourceId=mutation.parsed?.providerResult?.providerResourceId||evidence?.providerResourceId;
if(mutation.status!==200||mutation.parsed?.status!=='accepted'||!resourceId){console.error(JSON.stringify({status:'failed',stage:'provider_mutation',mutation},null,2));process.exit(1);}
const callbackBody={schemaVersion:'1.0',providerCategory:adapterBody.providerCategory,providerEventId,status:String(process.env.PROVIDER_LIFECYCLE_CALLBACK_STATUS||'completed'),providerResourceId:resourceId,entity:adapterBody.entity,correlationId:adapterBody.correlationId};
const callbackHeaders={'content-type':'application/json','x-provider-callback-token':callbackToken};
const first=await post(callbackPath,callbackBody,callbackHeaders);
const replay=await post(callbackPath,callbackBody,callbackHeaders);
const passed=first.status===202&&replay.status===200;
console.log(JSON.stringify({status:passed?'passed':'failed',providerMutation:{httpStatus:mutation.status,providerResourceId:resourceId,providerEvidence:evidence},callback:{first, replay},idempotencyKey:id,providerEventId},null,2));
process.exit(passed?0:1);

}
main().catch(error=>{console.error(error);process.exit(1);});
