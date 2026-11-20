# Canonical Platform Event Contract

## Purpose
This is the single event envelope shared by the eight canonical engines. Historical WF-* workflows are reference implementations only.

## Required envelope
schemaVersion: "1.0"
eventId: "evt_..."
eventType: "lead.created"
occurredAt: "2026-11-20T00:00:00.000Z"
source: "n8n"
idempotencyKey: "lead:created:lead_123:evt_..."
entity:
  leadId: "lead_123"
  sellerId: "seller_123"
  propertyId: "property_123"
  dealId: "deal_123"
  buyerId: null
  portfolioId: "portfolio_123"
payload: {}
metadata:
  correlationId: "corr_..."
  actorType: "system"
  actorId: "workflow_100"
  retryCount: 0

## Required semantics
- eventId uniquely identifies the source event.
- idempotencyKey is stable across retries of the same logical event.
- eventType is lowercase and dot-delimited.
- entity carries canonical IDs; missing IDs are null, not fabricated.
- payload carries event-specific data and must not replace the canonical envelope.
- metadata.correlationId remains unchanged across the full deal lifecycle.

## Canonical engine routing
- lead.*, seller.*, outreach.*, appointment.* -> lead-seller
- property.*, comp.*, arv.*, repair.*, underwriting.*, risk.*, mao.* -> underwriting-risk
- offer.*, counteroffer.*, negotiation.* -> negotiation-offer
- contract.*, esignature.*, signature.*, execution.* -> contract-esignature
- buyer.*, assignment.*, disposition.*, pof.* -> buyer-disposition
- title.*, lien.*, tax.*, closing.*, settlement.*, funds.* -> title-closing
- profit.*, payout.*, finance.*, analytics.*, kpi.*, forecast.* -> financials-analytics

## Idempotency contract
The InsulaCRM integration layer must expose a durable check-and-claim operation.
- Input: idempotencyKey, eventType, canonical entity IDs.
- Existing key: return alreadyProcessed=true and original processing metadata.
- New key: atomically claim the key before engine dispatch.
- Never mark a key processed before the protected state transition succeeds.
- Replays must not create duplicate communications, contracts, assignments, closings, or financial entries.

## State-transition contract
State changes must be atomic and server-authoritative.
- Server verifies current state and allowed transition.
- Server writes the new state and audit event atomically.
- Invalid or stale transitions return a deterministic conflict response.
- Protected terminal states (closed, cancelled, disputed) cannot be advanced by ordinary lifecycle events.

## HTTP response preservation
Every n8n HTTP Request that retrieves or persists data must preserve the original event context. Do not let a response body replace the workflow payload used by later nodes.
1. Capture original event in a named node.
2. Call InsulaCRM/provider.
3. Merge provider response with the captured event.
4. Continue using the merged object.

## Decision vs communication
Decision engines calculate and persist decisions first. Communication dispatch is a separate side effect using a derived idempotency key such as engine:dispatch:baseIdempotencyKey. A failed communication must not silently roll back a durable underwriting, negotiation, contract, or closing decision.

## Production gates
1. Replace every YOUR_INSULACRM_API placeholder.
2. Validate the envelope against this contract.
3. Implement durable atomic idempotency claim/check.
4. Implement authoritative atomic state transitions.
5. Verify provider credentials/endpoints.
6. Run tests/canonical-platform-e2e-cases.json.
7. Confirm duplicate/replay, terminal-state, missing-ID, provider-failure, and retry behavior.
