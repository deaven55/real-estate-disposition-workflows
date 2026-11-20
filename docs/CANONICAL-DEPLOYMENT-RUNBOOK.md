# Canonical Deployment Runbook

## 1. Configure runtime
Set these values in the n8n deployment environment:

- `N8N_BASE_URL`
- `INSULACRM_API_BASE_URL`

Configure the InsulaCRM authentication credential inside n8n. Do not put secrets in workflow JSON or Git.

## 2. Import canonical workflows

Import these production-boundary workflows into the same n8n instance:

- `workflows/canonical-platform-integration-hardening.json`
- `workflows/102-canonical-lifecycle-event-handoff.json`
- `workflows/100-platform-orchestrator-canonical-engine-router.json`
- all seven `workflows/canonical-*-engine.json` files

Activate only after the webhook paths and credentials have been reviewed.

## 3. Verify webhook paths

Expected paths:

- `/webhook/canonical-platform-integration-hardening`
- `/webhook/canonical-lifecycle-handoff`
- `/webhook/platform-event-router`

The lifecycle handoff must call the canonical platform hardening webhook, not a competing workflow chain.

## 4. Verify InsulaCRM contract

The API must expose the endpoints documented in `docs/INSULACRM-API-CONTRACT.md`.

Required production guarantees:

- idempotency check/claim is atomic;
- state transitions are authoritative and atomic;
- terminal states reject ordinary lifecycle advancement;
- engine dispatch returns deterministic acceptance;
- activity writes are auditable.

## 5. Smoke test without creating a deal

First test configuration and authentication against a non-production/test tenant or staging API.

Do not send a synthetic `lead.created` event to production merely to prove connectivity. A live lifecycle test should use an explicitly created test record and be reversible.

## 6. Required live E2E test

Run one controlled test record through:

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

Record the correlation ID and idempotency keys for every step.

## 7. Failure tests

Before production activation, verify:

- duplicate event replay is blocked;
- concurrent duplicate requests cannot both claim the same idempotency key;
- missing canonical identity is rejected;
- stale state transition is rejected;
- `closed`, `cancelled`, and `disputed` records cannot advance normally;
- provider timeout does not create duplicate communication;
- provider failure can be retried safely.

## 8. Production gate

The system is production-ready only when the live E2E test and failure tests pass against the real configured services. Repository validation alone is not evidence of production connectivity.
