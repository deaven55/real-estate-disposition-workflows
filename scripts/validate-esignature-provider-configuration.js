#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'../config/esignature-provider-contract.json'),'utf8'));
const cases=JSON.parse(fs.readFileSync(path.join(__dirname,'../tests/canonical-esignature-provider-cases.json'),'utf8')).cases;
const errors=[];
const ops=cfg.operations||{};
const statusMap=cfg.canonicalStatusMap||{};
for(const c of cases){
 if(c.expectedOperation && !ops[c.expectedOperation]) errors.push(c.id+': missing operation '+c.expectedOperation);
 if(c.expectedLifecycleEvent && !Object.values(statusMap).includes(c.expectedLifecycleEvent)) errors.push(c.id+': lifecycle event not mapped');
}
if(!cfg.productionGate?.requiresRealProvider||!cfg.productionGate?.requiresLiveCredentials||!cfg.productionGate?.requiresLiveCreateAndCallbackTest) errors.push('production gate incomplete');
const result={status:errors.length?'failed':'passed',caseCount:cases.length,errors,operations:Object.keys(ops),statusMap};
console.log(JSON.stringify(result,null,2));
process.exit(errors.length?1:0);
