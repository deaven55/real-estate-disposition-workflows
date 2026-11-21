#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const webhook=String(process.env.CANONICAL_PLATFORM_WEBHOOK_PATH||'/webhook/canonical-platform-integration-hardening');
const token=process.env.N8N_WEBHOOK_TOKEN||'';
if(!base){console.error('Missing N8N_BASE_URL');process.exit(2);}
if(!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must use HTTPS');process.exit(2);}

const leadId=process.env.E2E_LEAD_ID||'e2e-lead-'+Date.now();
const dealId=process.env.E2E_DEAL_ID||'e2e-deal-'+Date.now();
const propertyId=process.env.E2E_PROPERTY_ID||'e2e-property-'+Date.now();
const correlationId='e2e-lifecycle-'+Date.now();

const sequence=[
  ['lead.created','lead-seller','seller.qualified'],
  ['seller.qualified','lead-seller','underwriting.requested'],
  ['underwriting.approved','underwriting-risk','offer.prepare'],
  ['offer.accepted','negotiation-offer','contract.readiness.requested'],
  ['contract.signed','contract-esignature','buyer.disposition.requested'],
  ['buyer.locked','buyer-disposition','title.order.requested'],
  ['title.cleared','title-closing','closing.ready'],
  ['closing.completed','title-closing','financials.reconcile.requested'],
  ['financials.reconciled','financials-analytics','profit.realized']
];

async function post(eventType,engine,step){
  const body={
    schemaVersion:'1.0',
    eventId:'e2e-'+step+'-'+Date.now(),
    eventType,
    occurredAt:new Date().toISOString(),
    source:'github-live-e2e',
    idempotencyKey:'e2e:'+correlationId+':'+step,
    correlationId,
    engine,
    leadId,
    dealId,
    propertyId,
    payload:{e2e:true,step,expectedNextEventType:sequence[step-1]?.[2]||null}
  };
  const headers={'content-type':'application/json'};
  if(token) headers.authorization='Bearer '+token;
  const res=await fetch(base+webhook,{method:'POST',headers,body:JSON.stringify(body)});
  const raw=await res.text();
  let parsed; try{parsed=JSON.parse(raw);}catch{parsed={raw:raw.slice(0,1000)};}
  return {step,eventType,engine,status:res.status,ok:res.ok,response:parsed};
}

const results=[];
for(let i=0;i<sequence.length;i++){
  const [eventType,engine,next]=sequence[i];
  const r=await post(eventType,engine,i+1);
  results.push({...r,expectedNextEventType:next});
  if(!r.ok){
    console.error(JSON.stringify({status:'failed',results},null,2));
    process.exit(1);
  }
}
const failed=results.filter(r=>r.status<200||r.status>=300);
console.log(JSON.stringify({status:failed.length?'failed':'passed',base,leadId,dealId,propertyId,correlationId,steps:results},null,2));
process.exit(failed.length?1:0);
