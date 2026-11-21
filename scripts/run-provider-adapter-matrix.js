#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const path=String(process.env.PROVIDER_ADAPTER_WEBHOOK_PATH||'/webhook/canonical-provider-adapter');
if(!base||!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must be HTTPS');process.exit(2);}
const cases=[
 {id:'same-idempotency-key-dry-run',providerCategory:'esignature',operation:'create_package',payload:{dryRun:true},fixedIdempotencyKey:'provider-matrix:collision-test'},
 {id:'success-dry-run',providerCategory:'esignature',operation:'create_package',payload:{dryRun:true}},
 {id:'void-dry-run',providerCategory:'esignature',operation:'void_package',payload:{dryRun:true}},
 {id:'communications-dry-run',providerCategory:'communications',operation:'send_message',payload:{dryRun:true}},
 {id:'title-dry-run',providerCategory:'titleClosing',operation:'create_title_order',payload:{dryRun:true}},
 {id:'funds-dry-run',providerCategory:'funds',operation:'confirm_funding',payload:{dryRun:true}},
 {id:'unsupported-operation',providerCategory:'esignature',operation:'unsupported_operation',payload:{dryRun:true},expectStatus:500}
];
async function run(c){
 const id=c.fixedIdempotencyKey||('provider-matrix:'+c.id+':'+Date.now());
 const body={schemaVersion:'1.0',providerCategory:c.providerCategory,operation:c.operation,idempotencyKey:id,correlationId:id,entity:{dealId:'test-deal',propertyId:'test-property'},payload:c.payload,metadata:{source:'provider-matrix-test'}};
 const headers={'content-type':'application/json'}; if(process.env.N8N_WEBHOOK_TOKEN) headers.authorization='Bearer '+process.env.N8N_WEBHOOK_TOKEN;
 const r=await fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
 return {id:c.id,status:r.status,expected:c.expectStatus??200,passed:r.status===(c.expectStatus??200)};
}
async function main(){
const results=[]; for(const c of cases) results.push(await run(c)); const collisionCase=cases.find(c=>c.fixedIdempotencyKey); if(collisionCase){const a=await run(collisionCase); const b=await run(collisionCase); results.push({id:'idempotency-collision-repeat',status:a.status,secondStatus:b.status,expected:a.status,passed:a.status===b.status});}
const failed=results.filter(x=>!x.passed);
console.log(JSON.stringify({status:failed.length?'failed':'passed',results},null,2));
process.exit(failed.length?1:0);

}
main().catch(error=>{console.error(error);process.exit(1);});
