const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const canonical = [
  ['lead-seller', 'workflows/canonical-lead-seller-engagement-engine.json'],
  ['underwriting-risk', 'workflows/canonical-underwriting-risk-engine.json'],
  ['negotiation-offer', 'workflows/canonical-negotiation-offer-engine.json'],
  ['contract-esignature', 'workflows/canonical-contract-esignature-engine.json'],
  ['buyer-disposition', 'workflows/canonical-buyer-disposition-engine.json'],
  ['title-closing', 'workflows/canonical-title-closing-engine.json'],
  ['financials-analytics', 'workflows/canonical-financials-analytics-engine.json']
];

const expected = [
  ['lead-seller', 'underwriting-risk'],
  ['underwriting-risk', 'negotiation-offer'],
  ['negotiation-offer', 'contract-esignature'],
  ['contract-esignature', 'buyer-disposition'],
  ['buyer-disposition', 'title-closing'],
  ['title-closing', 'financials-analytics']
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function findNode(wf, name) {
  return wf.nodes.find(n => n.name === name);
}

for (const [engine, rel] of canonical) {
  const wf = readJson(rel);
  assert(wf.nodes?.length, `${engine}: workflow has no nodes`);
  assert(wf.connections, `${engine}: workflow has no connections`);
  assert(
    !JSON.stringify(wf).includes('YOUR_INSULACRM_API'),
    `${engine}: unresolved InsulaCRM placeholder remains`
  );
  assert(
    !JSON.stringify(wf).includes('YOUR_N8N_BASE_URL'),
    `${engine}: unresolved n8n placeholder remains`
  );
}

const router = readJson('workflows/100-platform-orchestrator-canonical-engine-router.json');
const routerText = JSON.stringify(router);
for (const [from, to] of expected) {
  assert(routerText.includes(from), `router missing canonical engine: ${from}`);
  assert(routerText.includes(to), `router missing canonical engine: ${to}`);
}

const hardening = readJson('workflows/canonical-platform-integration-hardening.json');
assert(findNode(hardening, 'Check Idempotency'), 'hardening missing idempotency check');
assert(findNode(hardening, 'Claim Idempotency Before Dispatch'), 'hardening missing idempotency claim');
assert(findNode(hardening, 'Request Atomic State Transition'), 'hardening missing state transition');
assert(findNode(hardening, 'Dispatch Canonical Engine'), 'hardening missing engine dispatch');

const handoff = readJson('workflows/102-canonical-lifecycle-event-handoff.json');
assert(findNode(handoff, 'Determine Next Canonical Lifecycle Event'), 'handoff missing lifecycle decision');
assert(findNode(handoff, 'Dispatch Next Lifecycle Event'), 'handoff missing lifecycle dispatch');

console.log('Canonical contract validation passed.');
console.log('NOTE: this test intentionally fails until deployment placeholders are replaced in the workflow JSON or deployment templating injects verified runtime URLs.');
