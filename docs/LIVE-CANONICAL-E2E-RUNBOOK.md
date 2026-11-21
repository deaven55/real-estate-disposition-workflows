# Live Canonical E2E Test Runbook

## Purpose

This runbook defines the controlled live verification sequence for the canonical wholesaling lifecycle. It is intentionally separate from deterministic contract validation.

## Required GitHub Actions configuration

Production environment secrets:

- `N8N_BASE_URL` — public HTTPS n8n base URL.
- `N8N_WEBHOOK_TOKEN` — optional bearer token required by the deployed webhook.

Optional production environment variable:

- `CANONICAL_PLATFORM_WEBHOOK_PATH` — defaults to `/webhook/canonical-platform-integration-hardening`.

InsulaCRM credentials remain configured on the n8n deployment and are verified separately by the InsulaCRM live verification workflow.

## Test 1 — Lead to Profit

Run **Live Canonical Lifecycle E2E** manually.

The runner sends these canonical events in order:

`lead.created`
→ `seller.qualified`
→ `underwriting.approved`
→ `offer.accepted`
→ `contract.signed`
→ `buyer.locked`
→ `title.cleared`
→ `closing.completed`
→ `financials.reconciled`

Each request must return HTTP 2xx. The runner stops immediately on the first failed step.

Use dedicated E2E records or an isolated test environment. Do not point this at a real seller/deal unless the downstream systems are explicitly configured for test data.

## Test 2 — Failure and replay protection

Run **Live Canonical Failure and Replay Tests** manually.

Expected results:

1. Missing canonical identity is blocked.
2. A `closed` deal is blocked by the protected-state guard.
3. Reusing the same idempotency key is blocked as a replay on the second request.

## Test 3 — InsulaCRM endpoint verification

Run **InsulaCRM Live Endpoint Verification** manually.

All six required platform endpoints must accept the dry-run health-check request:

- `/platform/events`
- `/platform/idempotency/check`
- `/platform/idempotency/claim`
- `/platform/state-transition`
- `/platform/engine-dispatch`
- `/analytics/activity`

## Production gate

The canonical lifecycle is not considered live merely because the GitHub Actions files exist.

Production acceptance requires:

- InsulaCRM endpoint verification passes.
- Lead-to-Profit live E2E passes.
- Failure/replay suite passes.
- n8n execution logs confirm the canonical engine dispatches.
- InsulaCRM confirms durable idempotency and atomic state transitions.
- Provider-specific tests pass for e-signature, communications, title/closing and funds workflows.
- No test uses real customer data without explicit isolation/authorization.
