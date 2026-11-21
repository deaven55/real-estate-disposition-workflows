# Production Integration Configuration

## Purpose
Single configuration contract for activating the canonical lifecycle without changing workflow logic.

## Required runtime values

### n8n
- `N8N_BASE_URL`: public HTTPS base URL for the n8n instance.
- Canonical platform webhook: `/webhook/canonical-platform-integration-hardening`
- Lifecycle handoff webhook: `/webhook/canonical-lifecycle-handoff`
- Platform router webhook: `/webhook/platform-event-router`

### InsulaCRM
- `INSULACRM_API_BASE_URL`: verified HTTPS API base URL.
- API authentication must be stored in n8n credentials, not hard-coded into workflow JSON.

Required endpoints:
- `POST /platform/events`
- `POST /platform/idempotency/check`
- `POST /platform/idempotency/claim`
- `POST /platform/state-transition`
- `POST /platform/engine-dispatch`
- `POST /platform/provider-resource/check`
- `POST /analytics/activity`

## Idempotency requirements
1. Check and claim must be atomic at the InsulaCRM layer.
2. A duplicate key returns the original processing metadata.
3. A new key is claimed before engine dispatch.
4. The key is not marked completed until the protected state transition succeeds.
5. Communication/provider side effects use derived idempotency keys.

## State-transition requirements
The server, not n8n, is authoritative for lifecycle state.

The state-transition endpoint must:
- validate current state;
- validate the requested transition;
- atomically persist the new state and audit record;
- return a deterministic conflict for stale/invalid transitions;
- reject ordinary lifecycle advancement from `closed`, `cancelled`, or `disputed`.

## Engine dispatch contract
The dispatch request must include:
- canonicalEngine
- eventType
- idempotencyKey
- correlationId
- canonical entity IDs
- canonical event envelope
- payload

The response must expose a deterministic acceptance field such as `accepted: true`.

## Lifecycle sequence
`lead.created`
→ `seller.qualified`
→ `underwriting.requested`
→ `offer.prepare`
→ `contract.readiness.requested`
→ `buyer.disposition.requested`
→ `title.order.requested`
→ `closing.ready`
→ `financials.reconcile.requested`
→ `profit.realized`

## Activation checklist
- [ ] Set verified `INSULACRM_API_BASE_URL`.
- [ ] Set verified `N8N_BASE_URL`.
- [ ] Configure n8n credentials for InsulaCRM.
- [ ] Replace workflow URL placeholders through deployment configuration.
- [ ] Verify all seven canonical engine dispatch targets.
- [ ] Verify idempotency check/claim behavior under concurrent requests.
- [ ] Verify atomic state transitions.
- [ ] Verify provider-resource lookup returns authoritative `providerResourceExists` before accepting mutating callbacks.
- [ ] Run deterministic E2E cases in `tests/canonical-platform-e2e-cases.json`.
- [ ] Run live lifecycle test from lead creation through financial reconciliation.
- [ ] Test duplicate replay, terminal-state rejection, missing identity, provider failure, timeout, and retry.

## Important
The provider callback boundary now performs an authoritative InsulaCRM provider-resource check for non-communications callbacks before replay handling and lifecycle dispatch.

This file is a deployment contract, not a claim that the external InsulaCRM or provider endpoints already exist. Production status requires live verification.
