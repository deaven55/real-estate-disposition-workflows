#!/usr/bin/env node
const base=String(process.env.N8N_BASE_URL||'').replace(/\/$/,'');
const webhook=String(process.env.CANONICAL_PLATFORM_WEBHOOK_PATH||'/webhook/canonical-platform-integration-hardening');
const token=process.env.N8N_WEBHOOK_TOKEN||'';
const timeoutMs=Number(process.env.E2E_REQUEST_TIMEOUT_MS||15000);

if(!base){console.error('Missing N8N_BASE_URL');process.exit(2);}
if(!/^https:\/\//i.test(base)){console.error('N8N_BASE_URL must use HTTPS');process.exit(2);}
if(!webhook.startsWith('/')){console.error('CANONICAL_PLATFORM_WEBHOOK_PATH must start with /');process.exit(2);}
if(!Number.isFinite(timeoutMs)||timeoutMs<1000||timeoutMs>60000){console.error('E2E_REQUEST_TIMEOUT_MS must be between 1000 and 60000');process.exit(2);}

const runId=process.env.E2E_RUN_ID||'e2e-'+Date.now();
const leadId=process.env.E2E_LEAD_ID||`${runId}-lead`;
const dealId=process.env.E2E_DEAL_ID||`${runId}-deal`;
const propertyId=process.env.E2E_PROPERTY_ID||`${runId}-property`;
const correlationId=`${runId}-lifecycle`;

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
  const eventId=`${runId}-event-${String(step).padStart(2,'0')}`;
  const body={
    schemaVersion:'1.0',
    eventId,
    eventType,
    occurredAt:new Date().toISOString(),
    source:'github-live-e2e',
    idempotencyKey:`e2e:${runId}:${step}`,
    correlationId,
    engine,
    leadId,
    dealId,
    propertyId,
    payload:{
      e2e:true,
      isolatedTestRun:true,
      runId,
      step,
      expectedNextEventType:sequence[step-1]?.[2]||null
    }
  };
  const headers={'content-type':'application/json','user-agent':'canonical-wholesaling-live-e2e/1.0'};
  if(token) headers.authorization=`Bearer ${token}`;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const res=await fetch(base+webhook,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal});
    const raw=await res.text();
    let parsed;
    try{parsed=JSON.parse(raw);}catch{parsed={raw:raw.slice(0,1000)};}
    return {
      step,eventId,eventType,engine,status:res.status,ok:res.ok,
      response:parsed,
      responseContentType:res.headers.get('content-type')||''
    };
  }finally{
    clearTimeout(timer);
  }
}

async function main(){
  const results=[];
  console.log(JSON.stringify({
    status:'started',
    runId,
    base,
    webhook,
    leadId,
    dealId,
    propertyId,
    correlationId,
    steps:sequence.length
  }));
  for(let i=0;i<sequence.length;i++){
    const [eventType,engine,next]=sequence[i];
    let r;
    try{r=await post(eventType,engine,i+1);}
    catch(error){
      r={
        step:i+1,eventType,engine,status:0,ok:false,
        error:error.name==='AbortError'?`request_timeout_${timeoutMs}ms`:String(error.message||error)
      };
    }
    results.push({...r,expectedNextEventType:next});
    console.log(JSON.stringify({runId,step:i+1,eventType,engine,status:r.status,ok:r.ok}));
    if(!r.ok){
      console.error(JSON.stringify({status:'failed',runId,failedStep:i+1,results},null,2));
      process.exit(1);
    }
  }
  console.log(JSON.stringify({
    status:'passed',
    runId,
    leadId,
    dealId,
    propertyId,
    correlationId,
    steps:results
  },null,2));
}
main().catch(error=>{console.error(JSON.stringify({status:'failed',error:String(error.message||error)},null,2));process.exit(1);});
