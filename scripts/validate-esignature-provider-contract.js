#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const file=path.join(__dirname,'canonical-esignature-provider-cases.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
const allowed=['signature_request','contract.signature.requested','signature.void','contract.signed','contract.signature.declined','contract.signature.expired','contract.voided'];
const failures=[];
for(const c of data.cases){
 if(!c.id||!c.eventType) failures.push(c.id||'unknown');
 if(!allowed.includes(c.eventType)) failures.push(c.id+':unsupported-event');
 if(c.expectedOperation && !['create_package','void_package'].includes(c.expectedOperation)) failures.push(c.id+':unsupported-operation');
}
console.log(JSON.stringify({status:failures.length?'failed':'passed',caseCount:data.cases.length,failures},null,2));
process.exit(failures.length?1:0);
