# Live Provider Activation Runbook

## Purpose

Move the canonical provider boundary from dry-run verification to controlled live verification without treating configuration as proof of integration.

## Activation gate

The live GitHub Action requires the manual input `confirm_live=LIVE`. The production environment must contain the provider secrets and the deployment must set `PROVIDER_CONTRACT_DRY_RUN=false`.

## Required production secrets

- `N8N_BASE_URL`
- `N8N_WEBHOOK_TOKEN` when the deployed adapter requires it
- `INSULACRM_API_BASE_URL`
- `COMMUNICATIONS_PROVIDER`
- `COMMUNICATIONS_API_BASE_URL`
- `COMMUNICATIONS_API_TOKEN`
- `ESIGNATURE_PROVIDER`
- `ESIGNATURE_API_BASE_URL`
- `ESIGNATURE_API_TOKEN`
- `TITLE_CLOSING_PROVIDER`
- `TITLE_CLOSING_API_BASE_URL`
- `TITLE_CLOSING_API_TOKEN`
- `FUNDS_PROVIDER`
- `FUNDS_API_BASE_URL`
- `FUNDS_API_TOKEN`
- `PROVIDER_CALLBACK_SHARED_TOKEN`

## Controlled activation sequence

1. Run **Live Provider Activation Gate** with `confirm_live=LIVE` and `run_live_contracts=false`.
2. Confirm the configuration preflight passes.
3. Run the same action with `run_live_contracts=true`.
4. Confirm the live provider contract tests pass.
5. Confirm authenticated callback tests pass, including replay protection and resource validation.
6. Confirm provider result evidence is written to InsulaCRM.
7. Confirm no provider callback caused an unauthorized lifecycle transition.
8. Only then consider the provider category activated.

## What the gate proves

The preflight proves required deployment configuration is present, uses HTTPS where required, has no placeholder values, and explicitly enables live mode.

The live contract suite proves actual adapter/provider behavior for the configured environment.

The callback suite proves the callback boundary is authenticated and that replay/resource guardrails are enforced.

## What the gate does not prove

A passing configuration preflight does not prove provider credentials are valid.

A passing adapter healthcheck does not prove every real business mutation is safe.

A passing callback test does not prove every provider-specific callback payload is supported.

Production activation remains contingent on the external provider's real API behavior and InsulaCRM persistence.

## Rollback

If a live provider test fails:

1. Set `PROVIDER_CONTRACT_DRY_RUN=true`.
2. Disable or revoke the affected provider credential.
3. Stop live mutation tests.
4. Preserve the failing request/correlation/idempotency evidence.
5. Re-run dry-run adapter and callback suites before another activation attempt.