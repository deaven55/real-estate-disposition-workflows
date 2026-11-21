#!/usr/bin/env node
const base=String(process.env.INSULACRM_API_BASE_URL||'').replace(/\/$/,'');
const category=String(process.env.PROVIDER_RESOURCE_TEST_CATEGORY||'esignature').trim();
const resourceId=String(process.env.PROVIDER_RESOURCE_TEST_ID||'').trim();
const token=String(process.env.INSULACRM_API_TOKEN||'').trim();
if(!base||!/^https:\/\//i.test(base)){console.error('INSULACRM_API_BASE_URL must be HTTPS');process.exit(2);}
if(!resourceId){console.error('PROVIDER_RESOURCE_TEST_ID is required');process.exit(2);}
const body={providerCategory:category,providerResourceId:resourceId,entity:{dealId:String(process.env.PROVIDER_RESOURCE_TEST_DEAL_ID||'provider-resource-test-deal')},correlationId:'provider-resource-verification'};
const headers={'content-type':'application/json'};
if(token) headers.authorization='Bearer '+token;
const res=await fetch(base+'/platform/provider-resource/check',{method:'POST',headers,body:JSON.stringify(body)});
const raw=await res.text();
let response; try{response=JSON.parse(raw)}catch{response={raw:raw.slice(0,1000)}}
const hasBoolean=typeof response.providerResourceExists==='boolean'||typeof response.known==='boolean';
const known=typeof response.providerResourceExists==='boolean'?response.providerResourceExists:response.known;
const passed=res.ok&&hasBoolean;
console.log(JSON.stringify({status:passed?'passed':'failed',httpStatus:res.status,providerCategory:category,providerResourceId:resourceId,providerResourceExists:known,response},null,2));
process.exit(passed?0:1);
