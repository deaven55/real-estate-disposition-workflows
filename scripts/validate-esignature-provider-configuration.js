#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'../config/esignature-provider-contract.json'),'utf8'));
const required=['ESIGNATURE_PROVIDER','ESIGNATURE_API_BASE_URL','ESIGNATURE_API_TOKEN'];
const missing=required.filter(k=>!process.env[k]);
const invalid=[];
if(process.env.ESIGNATURE_API_BASE_URL && !/^https:\/\//i.test(process.env.ESIGNATURE_API_BASE_URL)) invalid.push('ESIGNATURE_API_BASE_URL must use HTTPS');
for(const [op,v] of Object.entries(cfg.operations||{})){
 if(!v.method||!v.defaultPath||!Array.isArray(v.requiredRequestFields)) invalid.push(op+' operation contract incomplete');
}
if(!cfg.callbacks?.eventIdField||!cfg.callbacks?.statusField) invalid.push('callback contract incomplete');
const result={status:(missing.length||invalid.length)?'failed':'passed',provider:process.env.ESIGNATURE_PROVIDER||cfg.provider,missing,invalid,operations:Object.keys(cfg.operations||{}),callbackStatusMap:cfg.canonicalStatusMap};
console.log(JSON.stringify(result,null,2));
process.exit(result.status==='passed'?0:1);
