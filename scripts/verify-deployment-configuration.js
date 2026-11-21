#!/usr/bin/env node
const required = [
  'N8N_BASE_URL',
  'INSULACRM_API_BASE_URL',
  'CANONICAL_PLATFORM_WEBHOOK_PATH',
  'CANONICAL_LIFECYCLE_HANDOFF_WEBHOOK_PATH',
  'PLATFORM_EVENT_ROUTER_WEBHOOK_PATH',
  'PROVIDER_ADAPTER_WEBHOOK_PATH',
  'PROVIDER_CALLBACK_WEBHOOK_PATH'
];

const optionalSecrets = [
  'N8N_WEBHOOK_TOKEN',
  'INSULACRM_API_TOKEN',
  'PROVIDER_CALLBACK_SHARED_TOKEN'
];

const urls = ['N8N_BASE_URL', 'INSULACRM_API_BASE_URL'];
const paths = required.filter(k => k.endsWith('_PATH'));

const missing = required.filter(k => !String(process.env[k] || '').trim());
const invalidUrls = urls
  .filter(k => process.env[k])
  .filter(k => !/^https:\/\//i.test(String(process.env[k]).replace(/\/$/, '')));

const invalidPaths = paths
  .filter(k => process.env[k])
  .filter(k => !String(process.env[k]).startsWith('/'));

const duplicatePaths = [];
const seen = new Map();
for (const key of paths) {
  const value = String(process.env[key] || '').trim();
  if (!value) continue;
  if (seen.has(value)) duplicatePaths.push(`${value}: ${seen.get(value)} and ${key}`);
  else seen.set(value, key);
}

const liveProvider = String(process.env.PROVIDER_CONTRACT_DRY_RUN || 'true').toLowerCase() === 'false';
const liveProviderMissing = liveProvider
  ? ['PROVIDER_CALLBACK_SHARED_TOKEN'].filter(k => !String(process.env[k] || '').trim())
  : [];

const result = {
  status: missing.length || invalidUrls.length || invalidPaths.length || duplicatePaths.length || liveProviderMissing.length ? 'failed' : 'passed',
  required,
  missing,
  invalidUrls,
  invalidPaths,
  duplicatePaths,
  liveProvider,
  liveProviderMissing,
  optionalSecretsPresent: optionalSecrets.filter(k => Boolean(process.env[k])),
  webhookPaths: Object.fromEntries(paths.map(k => [k, process.env[k] || null]))
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'passed' ? 0 : 1);
