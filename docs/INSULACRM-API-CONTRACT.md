# InsulaCRM Integration Contract

This document defines the external API contract expected by the canonical n8n workflows. It is intentionally explicit so the external InsulaCRM implementation can be verified before production activation.

## Base URL

Configure one verified HTTPS base URL:

`INSULACRM_API_BASE_URL`

Workflow JSON currently uses `https://YOUR_INSULACRM_API` as a deployment placeholder.

## Required endpoints

| Endpoint | Purpose |
|---|---|
| POST /leads/canonical-context | Load authoritative lead/seller/property context |
| POST /leads/canonical-routing-decision | Persist lead/seller routing decision |
| POST /communications/canonical-seller-outreach | Dispatch seller communication |
| POST /deals/canonical-underwriting-context | Load underwriting inputs |
| POST /deals/canonical-underwriting-decision | Persist underwriting decision |
| POST /deals/canonical-negotiation-context | Load negotiation context |
| POST /deals/canonical-negotiation-decision | Persist negotiation decision |
| POST /communications/canonical-offer-dispatch | Dispatch offer/counteroffer communication |
| POST /contracts/canonical-contract-context | Load contract readiness context |
| POST /contracts/canonical-contract-decision | Persist contract lifecycle decision |
| POST /contracts/canonical-signature-dispatch | Dispatch signature package |
| POST /assignments/canonical-buyer-context | Load buyer/disposition context |
| POST /assignments/canonical-buyer-disposition-decision | Persist buyer/disposition decision |
| POST /assignments/canonical-buyer-distribution | Dispatch buyer distribution |
| POST /closings/canonical-closing-context | Load title/closing context |
| POST /closings/canonical-closing-decision | Persist title/closing decision |
| POST /closings/canonical-closing-coordination | Dispatch closing coordination |
| POST /finance/canonical-financial-context | Load financial context |
| POST /finance/canonical-financial-reconciliation | Persist financial reconciliation |
| POST /analytics/canonical-portfolio-kpi | Persist/retrieve portfolio KPI results |
| POST /analytics/activity | Write canonical audit/activity records |
| POST /platform/events | Persist canonical platform events |
| POST /platform/idempotency/check | Check whether an idempotency key was already processed |
| POST /platform/idempotency/claim | Atomically claim a new idempotency key |
| POST /platform/state-transition | Apply an authoritative lifecycle state transition |
| POST /platform/engine-dispatch | Dispatch an event to its canonical engine |

## Canonical request envelope

Requests that represent lifecycle events must preserve:

```json
{
  "schemaVersion": "1.0",
  "eventId": "evt_...",
  "eventType": "lead.created",
  "occurredAt": "2026-11-20T00:00:00.000Z",
  "source": "n8n",
  "idempotencyKey": "lead:created:lead_123:evt_...",
  "entity": {
    "leadId": "lead_123",
    "sellerId": "seller_123",
    "propertyId": "property_123",
    "dealId": "deal_123",
    "buyerId": null,
    "portfolioId": "portfolio_123"
  },
  "payload": {},
  "metadata": {
    "correlationId": "corr_...",
    "actorType": "system",
    "actorId": "workflow_100",
    "retryCount": 0
  }
}
```

## Idempotency response contract

### Existing key

Return a deterministic response equivalent to:

```json
{
  "alreadyProcessed": true,
  "processedAt": "2026-11-20T00:00:00.000Z",
  "originalEventId": "evt_...",
  "originalCorrelationId": "corr_..."
}
```

### New key

The claim operation must atomically reserve the key:

```json
{
  "claimed": true,
  "idempotencyKey": "lead:created:lead_123:evt_..."
}
```

A race between two identical requests must result in exactly one successful claim.

## State-transition response contract

Success must be deterministic:

```json
{
  "success": true,
  "transitionApplied": true,
  "previousState": "underwriting",
  "newState": "offer_ready",
  "auditEventId": "audit_..."
}
```

Conflict/failure must be deterministic:

```json
{
  "success": false,
  "transitionApplied": false,
  "code": "STATE_CONFLICT",
  "currentState": "closed"
}
```

## Engine-dispatch response contract

Accepted:

```json
{
  "accepted": true,
  "engine": "underwriting-risk",
  "eventId": "evt_..."
}
```

Rejected:

```json
{
  "accepted": false,
  "code": "ENGINE_DISPATCH_REJECTED"
}
```

## Authentication

Credentials must be configured through n8n credential storage or deployment secrets. Do not commit API keys, bearer tokens, passwords, or provider secrets to workflow JSON.

## Verification rule

This contract describes what the canonical workflows require. It does not prove that these endpoints currently exist in InsulaCRM. Production activation requires live endpoint verification and an end-to-end lifecycle test.
