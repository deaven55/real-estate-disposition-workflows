#!/usr/bin/env node
const required=['N8N_BASE_URL','INSULACRM_API_BASE_URL'];
const optional=['N8N_WEBHOOK_TOKEN','INSULACRM_API_TOKEN','PROVIDER_CALLBACK_SHARED_TOKEN'];
const live=process.env.PROVIDER_CONTRACT_DRY_RUN==='false'; if(live&&!process.env.PROVIDER_CALLBACK_SHARED_TOKEN){console.error('PROVIDER_CALLBACK_SHARED_TOKEN is required for live provider verification');process.exit(1);}
const providerGroups={
  communications:['COMMUNICATIONS_PROVIDER','COMMUNICATIONS_API_BASE_URL','COMMUNICATIONS_API_TOKEN'],
  esignature:['ESIGNATURE_PROVIDER','ESIGNATURE_API_BASE_URL','ESIGNATURE_API_TOKEN'],
  titleClosing:['TITLE_CLOSING_PROVIDER','TITLE_CLOSING_API_BASE_URL','TITLE_CLOSING_API_TOKEN'],
  funds:['FUNDS_PROVIDER','FUNDS_API_BASE_URL','FUNDS_API_TOKEN']
};
const missing=required.filter(k=>!process.env[k]);
const invalid=[];
for(const k of required) if(process.env[k]&&!/^https:\/\//i.test(process.env[k])) invalid.push(k+' must use HTTPS');
const providerStatus={};
for(const [name,keys] of Object.entries(providerGroups)){
 const configured=keys.every(k=>Boolean(process.env[k]));
 const partial=keys.some(k=>Boolean(process.env[k]));
 providerStatus[name]={configured,partial,missing:keys.filter(k=>!process.env[k])};
}
if(missing.length||invalid.length){
 console.error(JSON.stringify({status:'failed',missing,invalid,providerStatus},null,2));
 process.exit(1);
}
console.log(JSON.stringify({status:'passed',required,optionalPresent:optional.filter(k=>Boolean(process.env[k])),providerStatus},null,2));
