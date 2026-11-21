# Provider Live E2E Runbook

## Purpose

Run the provider integration only against a controlled production/test provider account. This verifies the actual boundary rather than only the local contract.

## Required configuration

GitHub production environment secrets:

- `N8N_BASE_URL`
- `N8N_WEBHOOK_TOKEN` when the deployed adapter requires it
- `PROVIDER_CALLBACK_SHARED_TOKEN`
- `INSULACRM_API_BASE_URL`
- `INSULACRM_API_TOKEN` for provider-resource verification
- Provider credentials required by the selected provider category

GitHub production variables:

- `PROVIDER_LIFECYCLE_E2E_ENABLED=true`
- `PROVIDER_LIFECYCLE_CATEGORY`
- `PROVIDER_LIFECYCLE_OPERATION`
- optional `PROVIDER_LIFECYCLE_DEAL_ID`
- optional `PROVIDER_LIFECYCLE_PROPERTY_ID`
- `PROVIDER_CONTRACT_DRY_RUN=false` for live provider contract verification

## Execution order

1. Run the provider adapter dry-run matrix.
2. Verify the InsulaCRM provider-resource endpoint with a known test resource.
3. Run the live provider contract matrix only for approved provider operations.
4. Run the controlled provider lifecycle E2E.
5. Confirm provider evidence contains the same idempotency key and the returned provider resource ID.
6. Confirm the callback is accepted only when InsulaCRM verifies the provider resource.
7. Confirm replaying the identical provider event is ignored without a second lifecycle transition.
8. Inspect InsulaCRM audit/activity records and provider evidence before declaring the integration verified.

## Acceptance criteria

The live lifecycle test passes only when:

- provider mutation returns HTTP 200 and canonical status `accepted`;
- provider evidence is returned;
- a provider resource ID is available;
- the callback returns HTTP 202;
- the same callback replay returns HTTP 200;
- no duplicate lifecycle transition is created for the replay.

A passing GitHub Action is evidence that the configured path behaved correctly for the test case. It is not proof that every provider operation or every production edge case is verified.

## Safety

Use a provider sandbox/test account whenever the provider supports one. Do not enable the live lifecycle variable merely to test workflow syntax. Real provider mutations can create real packages, title orders, closings, messages, or funding operations depending on the selected operation.

