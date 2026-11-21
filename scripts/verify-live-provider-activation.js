#!/usr/bin/env node
const required=['N8N_BASE_URL','INSULACRM_API_BASE_URL','COMMUNICATIONS_PROVIDER','COMMUNICATIONS_API_BASE_URL','COMMUNICATIONS_API_TOKEN','ESIGNATURE_PROVIDER','ESIGNATURE_API_BASE_URL','ESIGNATURE_API_TOKEN','TITLE_CLOSING_PROVIDER','TITLE_CLOSING_API_BASE_URL','TITLE_CLOSING_API_TOKEN','FUNDS_PROVIDER','FUNDS_API_BASE_URL','FUNDS_API_TOKEN','PROVIDER_CALLBACK_SHARED_TOKEN'];
const paths=['COMMUNICATIONS_SEND_MESSAGE_PATH','ESIGNATURE_CREATE_PACKAGE_PATH','ESIGNATURE_VOID_PACKAGE_PATH','TITLE_CLOSING_CREATE_TITLE_ORDER_PATH','TITLE_CLOSING_REQUEST_CLOSING_PATH','FUNDS_CONFIRM_FUNDING_PATH'];
const placeholder=/^(CONFIGURE_|https:\/\/YOUR_|YOUR_|CHANGE_ME|REPLACE_ME)/i;
const missing=required.filter(k=>!process.env[k]);
const invalid=[];
for(const k of required.filter(k=>k.endsWith('_BASE_URL'))) if(process.env[k]&&!/^https:\/\//i.test(process.env[k])) invalid.push(k+' must use HTTPS');
if(process.env.PROVIDER_CONTRACT_DRY_RUN!=='false') invalid.push('PROVIDER_CONTRACT_DRY_RUN must be false for live activation');
const pathIssues=paths.filter(k=>!process.env[k]).map(k=>k+' must be configured');
const placeholderKeys=[...required,...paths].filter(k=>process.env[k]&&placeholder.test(process.env[k]));
const failures=[...missing.map(k=>k+' is missing'),...invalid,...pathIssues,...placeholderKeys.map(k=>k+' still contains a placeholder')];
if(failures.length){console.error(JSON.stringify({status:'blocked',failures},null,2));process.exit(1);}
console.log(JSON.stringify({status:'ready',liveMode:true,providerCategories:['communications','esignature','titleClosing','funds'],callbackAuthentication:'configured',providerOperationPaths:'configured',message:'Configuration preflight passed. This does not prove provider mutation success; live contract tests are still required.'},null,2));