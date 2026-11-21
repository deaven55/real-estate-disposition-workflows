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

function assertWorkflowStructure(rel, wf) {
  assert(Array.isArray(wf.nodes), `${rel}: nodes must be an array`);
  assert(wf.nodes.length > 0, `${rel}: workflow has no nodes`);
  assert(wf.connections && typeof wf.connections === 'object', `${rel}: workflow has no connections object`);

  const ids = new Set();
  const names = new Set();
  const nodeNames = new Set(wf.nodes.map(n => n.name));
  const webhookPaths = [];

  for (const node of wf.nodes) {
    assert(node.id, `${rel}: node is missing id`);
    assert(node.name, `${rel}: node is missing name`);
    assert(node.type, `${rel}: node ${node.name} is missing type`);
    assert(!ids.has(node.id), `${rel}: duplicate node id ${node.id}`);
    assert(!names.has(node.name), `${rel}: duplicate node name ${node.name}`);
    ids.add(node.id);
    names.add(node.name);
    if (node.type === 'n8n-nodes-base.webhook' && node.parameters?.path) webhookPaths.push(String(node.parameters.path));
  }

  for (const [source, branches] of Object.entries(wf.connections)) {
    assert(nodeNames.has(source), `${rel}: connection source ${source} does not exist`);
    for (const branch of Object.values(branches || {})) {
      for (const targets of branch || []) {
        for (const target of targets || []) assert(nodeNames.has(target.node), `${rel}: connection target ${target.node} does not exist`);
      }
    }
  }

  assert(new Set(webhookPaths).size === webhookPaths.length, `${rel}: duplicate webhook path inside workflow`);
  return { webhookPaths };
}

function collectEnvReferences(value) {
  const refs = new Set();
  for (const match of JSON.stringify(value).matchAll(/\$env\.([A-Z0-9_]+)/g)) refs.add(match[1]);
  return refs;
}

const workflowFiles = fs.readdirSync(path.join(root, 'workflows'))
  .filter(name => /^canonical-.*\.json$/.test(name) || /^10[0-2]-.*\.json$/.test(name));
assert(workflowFiles.length >= canonical.length, 'expected canonical workflow files are missing');

const allWebhookPaths = new Map();
const allEnvRefs = new Set();
for (const filename of workflowFiles) {
  const rel = `workflows/${filename}`;
  const wf = readJson(rel);
  const { webhookPaths } = assertWorkflowStructure(rel, wf);
  for (const webhookPath of webhookPaths) {
    if (allWebhookPaths.has(webhookPath)) throw new Error(`duplicate webhook path across workflows: ${webhookPath} (${allWebhookPaths.get(webhookPath)} and ${rel})`);
    allWebhookPaths.set(webhookPath, rel);
  }
  for (const ref of collectEnvReferences(wf)) allEnvRefs.add(ref);
  const unresolved = [];
  if (JSON.stringify(wf).includes('YOUR_INSULACRM_API')) unresolved.push('InsulaCRM');
  if (JSON.stringify(wf).includes('YOUR_N8N_BASE_URL')) unresolved.push('n8n');
  if (unresolved.length) console.warn(`${filename}: deployment placeholders pending: ${unresolved.join(', ')}`);
}

for (const [engine, rel] of canonical) assert(workflowFiles.includes(path.basename(rel)), `${engine}: canonical workflow file missing from workflow directory`);

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const declaredEnv = new Set();
for (const line of envExample.split(/\r?\n/)) {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
  if (match) declaredEnv.add(match[1]);
}
const undeclaredEnvRefs = [...allEnvRefs].filter(name => !declaredEnv.has(name));
assert(undeclaredEnvRefs.length === 0, `workflow references undeclared environment variables: ${undeclaredEnvRefs.join(', ')}`);

const router = readJson('workflows/100-platform-orchestrator-canonical-engine-router.json');
const routerText = JSON.stringify(router);
for (const [from, to] of expected) {
  assert(routerText.includes(from), `router missing canonical engine: ${from}`);
  assert(routerText.includes(to), `router missing canonical engine: ${to}`);
}

const hardening = readJson('workflows/canonical-platform-integration-hardening.json');
assert(findNode(hardening, 'Check Idempotency'), 'hardening missing idempotency check');
assert(findNode(hardening, 'Claim Idempotency Before Dispatch'), 'hardening missing idempotency claim');
assert(findNode(hardening, 'Gate Atomic State Transition'), 'hardening missing state-transition gate');
assert(findNode(hardening, 'Request Atomic State Transition'), 'hardening missing state transition');
assert(findNode(hardening, 'Gate Canonical Engine Dispatch'), 'hardening missing engine-dispatch gate');
assert(findNode(hardening, 'Dispatch Canonical Engine'), 'hardening missing engine dispatch');

const handoff = readJson('workflows/102-canonical-lifecycle-event-handoff.json');
assert(findNode(handoff, 'Determine Next Canonical Lifecycle Event'), 'handoff missing lifecycle decision');
assert(findNode(handoff, 'Dispatch Next Lifecycle Event'), 'handoff missing lifecycle dispatch');

console.log('Canonical contract validation passed.');

