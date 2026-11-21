# Next 3 — Provider Integration Batch

Date: 2026-11-20

## Implemented

### 1. Canonical provider adapter boundary
File: `workflows/canonical-provider-adapter-boundary.json`

One vendor-neutral n8n boundary now handles:
- Communications: `send_message`
- E-signature: `create_package`, `void_package`
- Title/Closing: `create_title_order`, `request_closing`
- Funds: `confirm_funding`

It validates the request, resolves the configured provider endpoint, sends deterministic idempotency/correlation headers, uses bounded retries, normalizes the provider response, and persists provider evidence to InsulaCRM through `POST /platform/provider-result`.

### 2. Canonical provider callback boundary
File: `workflows/canonical-provider-callback-boundary.json`

It provides an authenticated n8n webhook for provider callbacks, normalizes callback statuses into canonical lifecycle events, checks replay/idempotency before dispatch, and forwards accepted callbacks into the existing canonical platform integration boundary.

Supported callback mappings include:
- e-signature: signed, declined, voided, expired
- title/closing: cleared, exception, closing-ready, completed
- communications: delivered, failed
- funds: confirmed, failed, reconciled

### 3. Live provider contract verification
Files:
- `scripts/run-provider-contract-tests.js`
- updated `scripts/run-provider-integration-verification.js`
- updated `.github/workflows/provider-integration-verification.yml`

The verification suite now targets the real canonical adapter webhook instead of a placeholder healthcheck route and exercises all four provider categories.

## Documentation hardened

- `docs/CANONICAL-PROVIDER-INTEGRATION-CONTRACT.md`
- `docs/INSULACRM-API-CONTRACT.md`

The InsulaCRM contract now includes `POST /platform/provider-result`.

## Validation

The two new n8n workflow JSON files were fetched back from GitHub and parsed successfully as valid JSON.

## Current production status

Still **not production-live**. The adapter boundary is implemented, but live provider connectivity requires real provider endpoints, credentials, imported/activated n8n workflows, InsulaCRM support for `/platform/provider-result`, and successful live mutation/callback tests.

## Next concrete step

Take the first real provider—preferably the e-signature provider because it is directly on the contract-to-buyer lifecycle—and implement its exact API request/response mapping behind this adapter without changing the canonical business engines.


## Follow-up batch: E-signature wiring

1. Hardened `canonical-contract-esignature-engine.json` to use `INSULACRM_API_BASE_URL` and recognize canonical signed lifecycle events such as `contract.signed`.
2. Added `workflows/canonical-esignature-provider-request-mapper.json` to translate canonical signature requests into the vendor-neutral provider adapter contract and return lifecycle events.
3. Added `tests/canonical-esignature-provider-cases.json` and `scripts/validate-esignature-provider-contract.js` for deterministic contract coverage.

The mapper remains provider-neutral until a specific e-signature vendor and API contract are configured.

## Follow-up batch: provider configuration and callback security

1. Added `config/esignature-provider-contract.json` as the deployment-neutral e-signature API/callback contract manifest.
2. Added `scripts/validate-esignature-provider-configuration.js` to fail configuration checks when provider URL, credentials, or contract fields are missing/invalid.
3. Hardened `canonical-provider-callback-boundary.json` to require `PROVIDER_CALLBACK_SHARED_TOKEN` and a matching callback header before any provider event can reach lifecycle state transition. Added the required deployment variables to `.env.example`.

This still intentionally does not name or claim a specific e-signature vendor. The next vendor-specific step requires the actual provider/API contract and credentials.

## Next 3: e-signature contract verification layer

1. Hardened the e-signature validator so canonical provider cases and production-gate requirements are checked together.
2. Added GitHub Actions CI validation for the e-signature provider contract, mapper, callback boundary, and canonical test cases.
3. Added `docs/ESIGNATURE-PROVIDER-VALIDATION.md` documenting the exact CI/runtime boundary: CI validates the contract, while live provider credentials and create/callback behavior require deployment verification.


## Next 3: provider adapter execution hardening

1. Made provider operation paths deployment-configurable instead of fixed in workflow JSON.
2. Added an explicit dry-run gate so provider contract verification can exercise the adapter without mutating a real external account.
3. Updated provider contract tests and `.env.example` so dry-run is the safe default; setting `PROVIDER_CONTRACT_DRY_RUN=false` is an explicit live-provider test decision.


## Next 3: provider execution and failure controls

1. Dry-run mode no longer requires live provider URL/token configuration, so adapter verification can run safely against a deployed n8n boundary without external mutation.
2. Provider outcomes now classify failures into authentication, timeout, rate-limit, 5xx, validation/rejection, and unknown categories while preserving retryability and provider IDs.
3. Added `scripts/run-provider-adapter-matrix.js` and wired it into the manual provider integration verification workflow to exercise e-signature, communications, title/closing, funds, and unsupported-operation cases.
