<div align="center">

# Real Estate Disposition. Wholesaling Buyer-Side Automation (n8n Backend)

### 10 production n8n workflows, 127 nodes. The complete deal-to-buyer engine behind an all-in-one wholesaling SaaS: intake, scoring, buyer matching, distribution, follow-up, and lifecycle management.

[![n8n](https://img.shields.io/badge/n8n-workflows-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)
[![Nodes](https://img.shields.io/badge/total_nodes-127-6366F1?style=for-the-badge)](#)
[![Workflows](https://img.shields.io/badge/workflows-10-10B981?style=for-the-badge)](#)
[![Live Demo](https://img.shields.io/badge/dashboard-live-6D28D9?style=for-the-badge&logo=vercel&logoColor=white)](https://bids-dashboard.vercel.app)

</div>

---

## What This Is

Real Estate Disposition is an all-in-one real estate wholesaling platform. This repository is the **n8n automation backend**: 10 workflows that take a raw property deal, score it, match it to the right cash buyers, distribute it, and manage the full lifecycle from first ping to closed or expired.

The companion frontend dashboard lives here: **[bids-dashboard.vercel.app](https://bids-dashboard.vercel.app)** ([source](https://github.com/rafiulislam4246/bids-dashboard)).

Every workflow is sanitized. API keys, credentials, Convex deployment URLs, the n8n host, phone numbers, Slack channels, and client identity have been replaced with placeholders. The logic, node wiring, and code-node JavaScript are intact and importable.

> Shared for portfolio and reference. To run them you supply your own Convex deployment, Close CRM, Resend, and Slack credentials (see Setup).

---

## The Deal Lifecycle

```
Deal submitted ──▶ WF-001 Intake & Enrichment (validate, score 0-100, pick strategy)
                        │
                        ▼
                   WF-002 Intelligent Distribution (match buyers by market/price/strategy/tier)
                        │
        ┌───────────────┼────────────────────────────┐
        ▼               ▼                             ▼
  WF-003 Response   WF-004 Follow-Up Engine     WF-006 Deal Package Delivery
  Handler           (escalating drip, biz-hours) (email + SMS on interest)
  (intent routing)
        │
        ▼
  WF-010 Seller Communication (status-based seller SMS updates)

Buyers side:  WF-005 Buyer Onboarding (opt-in) → WF-008 Buyer Scoring Engine (nightly tier re-scoring)
Ops side:     WF-007 Deal Lifecycle Manager (expire/hold release) · WF-009 Analytics & Reporting (weekly Slack)
```

---

## The Workflows

### WF-001. Deal Intake & Enrichment — 10 nodes
Webhook receives a raw property deal, validates and normalizes the required fields and the address, computes a margin plus a weighted 0-100 deal score, and picks the best exit strategy (Flip, BRRRR, Rental, or Wholesale). Stores the deal in Convex, fires the distribution webhook, and posts a Slack alert.

### WF-002. Intelligent Distribution — 16 nodes
Fetches the deal, pulls a priority queue and all buyer leads from Close CRM, and smart-matches buyers by market, price, strategy, property type, and tier while skipping protected statuses. Caps sends per tier (hot 5 / warm 15 / cold 30), sends a tiered "market ping" SMS, and writes distribution records with a rate-limit wait.

### WF-003. Response Handler — 14 nodes
Webhook parses inbound buyer SMS from Close, keyword-classifies intent (interested, pass, DNC, pause, reactivate, question, other) with a confidence score, and routes through a Switch to the right auto-reply or CRM task, then Slack-notifies.

### WF-004. Follow-Up Engine — 18 nodes
Schedule-triggered. Pulls due follow-ups from Convex, filters out dead deals, and enforces per-buyer-timezone business hours (rescheduling if outside them). Picks an escalating follow-up template by status and touch count, checks the buyer's Close protected status before sending, sends the SMS, increments the count, and marks the distribution exhausted after the final touch.

### WF-005. Buyer Onboarding — 15 nodes
Webhook validates buyer criteria, normalizes the phone to E.164, and dedupes against Convex (handling DNC, pending, and inactive cases). Creates the buyer in Convex and a Close CRM lead with mapped custom fields, links the IDs, sends a compliant opt-in (YES/STOP) SMS, and Slack-notifies.

### WF-006. Deal Package Delivery — 9 nodes
Webhook fetches the deal and buyer, assembles a formatted deal-package email (property, financials, analysis), sends it via Resend, updates the distribution status to package_sent, sends an SMS confirmation, and Slack-notifies.

### WF-007. Deal Lifecycle Manager — 15 nodes
Daily 9 AM cron. Finds past-expiration active deals and expired holds in parallel, marks deals expired with an auto post-mortem, releases expired holds and bumps the deal round, re-triggers distribution if rounds remain, and posts a Slack summary.

### WF-008. Buyer Scoring Engine — 10 nodes
Daily 9 AM cron. Loops all active, paused, and inactive buyers, pulls each buyer's distributions, and computes engagement, reliability, velocity, and purchase sub-scores plus an overall score. Reassigns the tier (hot / warm / cold), writes scores to Convex, and on a tier change merges and syncs the tier custom field back to Close (with rate-limit waits).

### WF-009. Analytics & Reporting — 6 nodes
Daily 9 AM cron. Pulls this week's deals, exhausted distributions, and market intelligence from Convex, computes deal-flow-by-status, average deal score, and hot/cold/dead market counts, then posts a formatted weekly report to Slack.

### WF-010. Seller Communication — 14 nodes
Webhook fetches a deal, confirms it has a seller, and selects a status- and event-based SMS template (active, first_interest, reserved, package_sent, under_contract, expired, sold). Verifies the seller is not DNC or a protected Close status, sends the update SMS, and records last-contacted.

---

## Patterns Worth Studying

- **Weighted deal scoring** with a transparent 0-100 formula and rule-based strategy selection (WF-001).
- **Multi-dimensional buyer matching** with tier caps and protected-status exclusion (WF-002).
- **Timezone-aware business-hours enforcement** with automatic rescheduling (WF-004).
- **Compliant opt-in flow** (YES/STOP) with E.164 normalization and DNC-aware dedup (WF-005).
- **Nightly re-scoring** that reassigns tiers and syncs only on change to avoid CRM write storms (WF-008).
- **Protected-status guards** before every outbound send, so hot/human-handled leads never get an automated text.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Orchestration | n8n |
| State + backend | Convex (HTTP actions) |
| CRM | Close CRM |
| Email | Resend |
| Alerts + reports | Slack |
| Compliance | opt-in/opt-out, DNC + protected-status guards, business-hours windows |

---

## Setup

1. Import a workflow JSON into your n8n instance (Workflows → Import from File).
2. Replace placeholders: `YOUR_CONVEX_DEPLOYMENT` (your Convex URL), `YOUR_N8N_HOST` (your n8n host), and set env vars `SLACK_WEBHOOK_Real Estate Disposition`, `RESEND_API_KEY`.
3. Add your own n8n credentials for Close CRM (HTTP Basic) and Slack (credentials were stripped for publishing).
4. Point the Convex HTTP endpoints at your own backend (schemas not included).

---

## About

Built by **Rafiul Islam**. AI Voice Agent Systems Architect and Full-Stack Automation Engineer.

- Portfolio: [rafiul-dev.vercel.app](https://rafiul-dev.vercel.app)
- Frontend dashboard: [bids-dashboard.vercel.app](https://bids-dashboard.vercel.app)
- Part of 200+ production workflows across 15+ products. Backend architecture walkthroughs available on request.

---

## License

Shared for portfolio and reference. The Real Estate Disposition product, brand, and backend (Convex schemas, CRM configuration, business logic) are proprietary.


## InsulaCRM Integration Status

InsulaCRM is the canonical seller/property/deal/buyer CRM for the unified wholesaling OS. The disposition workflows remain reference automation until their exact workflow files and backend contracts are imported into the integration branch. Do not introduce a second permanent CRM database; disposition automations should write through InsulaCRM API v1 using tenant-scoped API keys and deterministic idempotency keys.

Planned integration order:
1. Deal Intake & Enrichment → InsulaCRM deal/property identity.
2. Intelligent Distribution → InsulaCRM buyer/deal relationships.
3. Buyer Onboarding → InsulaCRM buyer identity and buy box.
4. Buyer Scoring → InsulaCRM buyer score/tier.
5. Deal Package Delivery → InsulaCRM deal activity.
6. Response/Follow-Up/Lifecycle/Seller Communication → InsulaCRM activities and deal state.

The source workflows are preserved during migration; Close CRM/Convex remain transport/staging dependencies until each replacement is independently verified.


## AI deal analysis

WF-011 (`workflows/11-ai-deal-analysis.json`) provides a reusable AI analysis endpoint. It accepts a canonical deal context, asks the configured OpenAI model to analyze only supplied evidence, validates the JSON response, and writes the result to InsulaCRM's tenant-scoped deal-analysis API. Configure `OPENAI_API_KEY`, optionally `OPENAI_DEAL_ANALYSIS_MODEL`, `INSULA_CRM_BASE_URL`, and `INSULA_CRM_API_KEY`. This workflow deliberately does not invent comps or market facts; a later property-intelligence adapter can supply verified comp/recon evidence.


### WF-012 — Property Intelligence Evidence Pipeline

`workflows/12-property-intelligence-evidence.json` is the evidence-first bridge between property intelligence and AI deal analysis.

Flow:
1. Receive a deal ID plus an evidence bundle.
2. Fetch the canonical deal from InsulaCRM.
3. Normalize evidence into a provider-neutral schema.
4. Persist each evidence item to InsulaCRM with deterministic idempotency.
5. Build an evidence-first analysis context.
6. Call WF-011 AI Deal Analysis.
7. Return the resulting analysis.

Required env vars:
- `INSULA_CRM_BASE_URL`
- `INSULA_CRM_API_KEY`
- `N8N_INTERNAL_BASE_URL`

WF-012 intentionally does not invent comps or query an unconfigured provider. External data-provider adapters can be added later without changing the CRM evidence contract.


### WF-013 — Property Recon Provider Adapter

`workflows/13-property-recon-provider.json` adds the first real external-evidence adapter layer.

It accepts:
- deal ID
- address/city/state/ZIP
- optional property URLs
- optional notes

It can use:
- `PERPLEXITY_API_KEY` for property/market research
- `PERPLEXITY_API_URL` (optional override)
- `PERPLEXITY_PROPERTY_MODEL` (optional override)
- `FIRECRAWL_API_KEY` for supplied property/public-record/listing pages
- `FIRECRAWL_API_URL` (optional override)
- `N8N_INTERNAL_BASE_URL`

The adapter converts the results into the provider-neutral evidence schema and sends them to WF-012. It does not write AI conclusions directly into the CRM; evidence is stored first, then WF-011 performs the evidence-constrained analysis.

This keeps external providers replaceable and makes every analysis traceable back to collected evidence.


### WF-014 — State/County Property Intelligence Collector

`workflows/14-nc-property-intelligence-collector.json` adds state/county-targeted public-source collection. The search contract is state-agnostic: the caller supplies a US state and optionally a county. If county is omitted, the workflow resolves it from the property address before source selection.

The first curated county adapter is **Catawba County, NC** and targets official starting points for:
- parcel/GIS records
- real-estate tax records
- delinquent-tax searches
- permits/inspections
- county GIS datasets
- land records

The curated registry is maintained in `config/nc-property-sources.json`. Unknown state/county combinations fall back to official-source discovery through the configured research provider, so the workflow is not limited to North Carolina.

Required env vars:
- `INSULA_CRM_BASE_URL`
- `INSULA_CRM_API_KEY`
- `FIRECRAWL_API_KEY`
- `FIRECRAWL_API_URL` (optional)
- `PERPLEXITY_API_KEY` (required for county resolution/discovery when county is not supplied or not curated)
- `PERPLEXITY_API_URL` (optional)
- `PERPLEXITY_PROPERTY_MODEL` (optional)

WF-014 stores provider output as evidence in InsulaCRM. It does not treat a landing page or scraped text as a verified property fact and does not calculate ARV/MAO itself. WF-014 is intentionally provider-neutral: it collects source evidence, then extracts evidence-constrained structured property facts such as owner, parcel ID, assessed value, acreage, building size, sales history, tax status, permits, zoning, and legal description. Fields not explicitly supported by source text remain null. WF-014 does not calculate ARV/MAO. WF-014 now aggregates all collected source evidence, extracts evidence-constrained structured facts with OpenAI Structured Outputs, and hands the single bundle to WF-012. WF-012 remains the canonical evidence persistence + AI-analysis bridge, preventing duplicate evidence writes from the collector. The next hardening step is stable county dataset/API parsing and canonical property-field reconciliation across multiple sources.


### Canonical property intelligence reconciliation

WF-014 now calls InsulaCRM's property-intelligence reconciliation endpoint after aggregating source evidence. This writes evidence-backed owner, parcel, assessment, tax, acreage, zoning, sale, permit, and other stable property facts into the canonical Property record while retaining per-field provenance. Source precedence is deterministic and stronger existing provenance is preserved. WF-012 is then called with the original aggregated evidence bundle for evidence-first AI deal analysis.


### WF-017 Deal Ranking Engine

- `workflows/17-deal-ranking-engine.json` ranks acquisition opportunities through the canonical InsulaCRM ranking endpoint.
- Supports ARV, repairs, offer spread, motivation, comps, buyer demand, property completeness, distress signals, and risk flags.
- Jurisdiction-agnostic; no county/state is hardcoded.


### WF-018 Jurisdiction Compliance Gate

- `workflows/18-jurisdiction-compliance-gate.json` checks the transaction jurisdiction before automated acquisition/disposition activity.
- Unknown states return REVIEW rather than being assumed compliant.
- North Carolina uses a conservative review profile reflecting current Chapter 93A/NCREC guidance.
- This is an operational control, not legal advice.


### Deal Priority Queue API

The unified dashboard read model is now provided by InsulaCRM at `GET /api/v1/deal-queue`. It is tenant-scoped and supports state, county, city, stage, ranking grade/score, underwriting decision, ARV availability, buyer-match availability, compliance status, and queue sorting. Each item includes seller, canonical property intelligence, ARV/repairs/offer underwriting, ranking, buyer demand, compliance, and explicit missing-data/work-queue actions. Unknown jurisdictions remain REVIEW; current North Carolina automation is conservatively blocked pending jurisdiction clearance. This endpoint is a read model and does not replace canonical CRM records.


### WF-019 — Acquisition-to-Underwriting Orchestrator

- `workflows/19-acquisition-to-underwriting-orchestrator.json` is the unified pipeline entry point.
- Accepts a state/county/property request and runs WF-014 → WF-015 → WF-016 → WF-017 → WF-018 in sequence.
- Preserves each stage result and returns one consolidated pipeline response.
- State/county are dynamic; Catawba County is not hardcoded as the operating boundary.
- WF-018 remains the downstream automation control signal; REVIEW does not become an automatic seller/buyer action.
- n8n execution is still required before production activation.
