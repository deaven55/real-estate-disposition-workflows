# WF-019 — Acquisition-to-Underwriting Orchestrator

WF-019 is the single pipeline entry point for turning a canonical deal/property request into an evidence-backed underwriting and jurisdiction review sequence.

## Webhook

POST `/webhook/wholestack-acquisition-orchestrator-v1`

Required:
- `dealId`
- `address`
- `city`
- `state`

Optional:
- `zip`
- `county`
- `property_type`
- `square_footage`
- `bedrooms`
- `bathrooms`
- `year_built`
- `acreage`
- `maxComps`
- `activity`

## Pipeline

1. **WF-014** — state/county property intelligence collection, evidence extraction, canonical property reconciliation.
2. **WF-015** — closed-sales research, comp persistence, ARV calculation.
3. **WF-016** — offer decision underwriting.
4. **WF-017** — acquisition-priority ranking.
5. **WF-018** — jurisdiction compliance gate.

WF-019 preserves the result from every stage and returns one consolidated pipeline response.

## Important controls

- State/county remain dynamic; WF-014 is not limited to Catawba County.
- Missing county can be resolved by WF-014.
- WF-015 receives only supplied property facts; it does not fabricate missing facts.
- WF-016 and WF-017 rely on canonical InsulaCRM values when overrides are not supplied.
- WF-018 is intentionally last in this analytical chain, but its result is the control signal for any downstream automated seller/buyer activity.
- A compliance result that does not explicitly allow automation must remain in review.
- This workflow does not itself send seller or buyer outreach.

## Required environment

- `N8N_INTERNAL_BASE_URL`
- Downstream WF-014 through WF-018 environment variables.

## Validation

The workflow is committed as valid JSON with deterministic node-to-node connections. n8n execution still needs to be performed in the connected n8n environment before production activation.
