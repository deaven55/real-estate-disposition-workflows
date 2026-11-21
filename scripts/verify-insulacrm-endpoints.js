#!/usr/bin/env node
const base = String(process.env.INSULACRM_API_BASE_URL || '').replace(/\/$/, '');
const token = process.env.INSULACRM_API_TOKEN || '';
const endpoints = [
  '/platform/events',
  '/platform/idempotency/check',
  '/platform/idempotency/claim',
  '/platform/state-transition',
  '/platform/engine-dispatch',
  '/analytics/activity'
];

if (!base) {
  console.error('Missing INSULACRM_API_BASE_URL');
  process.exit(2);
}
if (!/^https:\/\//i.test(base)) {
  console.error('INSULACRM_API_BASE_URL must use HTTPS');
  process.exit(2);
}

async function check(pathname) {
  const headers = {'content-type':'application/json'};
  if (token) headers.authorization = 'Bearer ' + token;
  const res = await fetch(base + pathname, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      schemaVersion: '1.0',
      eventType: 'platform.healthcheck',
      idempotencyKey: 'healthcheck:' + pathname,
      correlationId: 'healthcheck',
      payload: {dryRun: true}
    })
  });
  const body = await res.text();
  return {pathname, status: res.status, ok: res.ok, body: body.slice(0, 500)};
}

const results = [];
for (const endpoint of endpoints) {
  try { results.push(await check(endpoint)); }
  catch (error) { results.push({pathname:endpoint, status:0, ok:false, body:String(error.message)}); }
}

console.log(JSON.stringify({base, results}, null, 2));
if (results.some(r => !r.ok)) process.exit(1);
