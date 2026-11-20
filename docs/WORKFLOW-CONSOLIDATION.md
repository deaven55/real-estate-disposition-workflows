# Workflow Consolidation — Canonical Platform Architecture

## Purpose

The repository contains a large set of workflow scaffolds that were built incrementally. They remain useful as reference implementations and testable logic, but the production platform must not execute every historical workflow as an independent copy of the same business logic.

The canonical production architecture is organized into eight engines:

1. Lead Acquisition & Intake
2. Seller Engagement
3. Underwriting & Risk
4. Negotiation & Offer
5. Contract & E-Signature
6. Buyer Disposition
7. Title & Closing
8. Financials & Analytics

## Canonical rule

InsulaCRM is the system of record for seller, property, lead, deal, buyer, negotiation, contract, assignment, closing and financial state.

A production engine should:
- read canonical state from InsulaCRM;
- perform one bounded business decision;
- write the resulting state/event back to InsulaCRM;
- emit an idempotent event;
- hand off to the next engine through an explicit contract.

Historical workflows should not create competing permanent state.

## Consolidation map

### Lead Acquisition & Intake
Reference workflows: 01, 36–44, 92–94.

Canonical responsibilities:
- campaign execution request
- lead intake
- deduplication
- attribution
- consent/suppression
- AI qualification
- priority scoring
- routing

### Seller Engagement
Reference workflows: 03, 04, 10, 45–48, 71–75, 95–96.

Canonical responsibilities:
- outbound communication
- response intake
- intent classification
- motivation extraction
- follow-up SLA
- appointments
- seller conversation state

### Underwriting & Risk
Reference workflows: 01, 48–51.

Canonical responsibilities:
- property enrichment
- comps
- ARV
- repairs
- MAO
- risk
- profitability
- offer readiness

### Negotiation & Offer
Reference workflows: 11–15, 52, 75–78, 97–99.

Canonical responsibilities:
- offer generation
- protected MAO
- counteroffer evaluation
- negotiation rounds
- controlled concessions
- seller response routing
- acceptance/walk-away/re-engagement

The newer WF-459–461 workflows are treated as reference logic for this canonical negotiation engine, not additional independent negotiation systems.

### Contract & E-Signature
Reference workflows: 16, 53, 57–61, 79–81.

Canonical responsibilities:
- contract readiness
- document package
- signature routing
- signature evidence
- execution reconciliation

### Buyer Disposition
Reference workflows: 17–25 and related buyer workflows.

Canonical responsibilities:
- assignment package
- buyer matching
- buyer outreach
- buyer interest
- buyer offer
- exclusivity/lock
- POF
- due diligence
- assignment approval

### Title & Closing
Reference workflows: 25–27, 60–63, 81–85.

Canonical responsibilities:
- title order
- title/lien/tax risk
- clearance
- closing date
- settlement
- funds confirmation
- closing finalization

### Financials & Analytics
Reference workflows: 28–41, 64–70, 86–91.

Canonical responsibilities:
- settlement reconciliation
- profit
- owner distribution
- closed-deal archive
- portfolio KPIs
- source attribution
- ROI
- forecasting
- budget/capacity planning

## Known consolidation requirements

1. Replace placeholder InsulaCRM URLs with the verified production API base URL.
2. Define canonical request/response schemas for each engine.
3. Prevent HTTP response replacement from dropping original event fields.
4. Centralize idempotency and replay protection.
5. Centralize DNC/consent/suppression enforcement.
6. Centralize protected-MAO retrieval and validation.
7. Make state transitions atomic in InsulaCRM.
8. Separate decision events from communication dispatch.
9. Make financial writes auditable and authoritative.
10. Add integration tests for the complete lifecycle.

## Execution policy

New work should extend a canonical engine or a missing capability. Do not create another workflow whose primary responsibility duplicates an existing engine.

The next implementation phase is integration and consolidation, not workflow-number inflation.
