# Canonical Provider Integration Contract

## Purpose

Define one adapter boundary for external providers so canonical engines never depend on vendor-specific response shapes.

## Provider categories

| Category | Canonical capability | Required outcome |
|---|---|---|
| Communications | seller/buyer outreach | accepted, provider message ID, delivery status |
| E-signature | signature package | package created, signer state, executed/declined/voided/expired |
| Title/Closing | title order and closing coordination | order ID, title state, clearance/exception state, closing status |
| Funds | funding/settlement confirmation | funding reference, amount, status, reconciliation evidence |

## Common request envelope

Every provider adapter receives:

```json
{
  "schemaVersion": "1.0",
  "providerCategory": "esignature",
  "operation": "create_package",
  "idempotencyKey": "provider:...",
  "correlationId": "corr_...",
  "entity": {
    "dealId": "deal_123",
    "propertyId": "property_123"
  },
  "payload": {},
  "metadata": {
    "retryCount": 0,
    "source": "canonical-engine"
  }
}
```

## Common response envelope

Success:

```json
{
  "accepted": true,
  "providerCategory": "esignature",
  "operation": "create_package",
  "providerRequestId": "req_123",
  "providerResourceId": "pkg_123",
  "status": "accepted"
}
```

Failure:

```json
{
  "accepted": false,
  "code": "PROVIDER_REJECTED",
  "retryable": false,
  "providerRequestId": "req_123"
}
```

## Required behavior

1. Provider credentials live in n8n credentials or deployment secret storage.
2. No provider secret is committed to workflow JSON.
3. Every mutating provider call has a deterministic idempotency key.
4. Retries are bounded and use the same logical idempotency key.
5. Provider response IDs are persisted to InsulaCRM.
6. Provider failures are represented as canonical events rather than silently swallowed.
7. Communication dispatch is separated from lifecycle state transitions.
8. Webhook callbacks are authenticated and deduplicated before changing lifecycle state.
9. Provider timeouts must not be interpreted as successful mutation.
10. A provider adapter must expose enough evidence for audit/reconciliation.

## Minimum provider test matrix

- success
- validation rejection
- authentication failure
- rate limit
- timeout
- transient 5xx
- duplicate idempotency key
- callback replay
- callback with unknown resource
- cancellation/void/expiration where supported

This contract is vendor-neutral. A specific provider is not considered integrated until its adapter implements this contract and passes the live verification suite.
