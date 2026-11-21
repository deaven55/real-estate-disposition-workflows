# WF-015 Comparable Sales + ARV

WF-015 accepts a deal and subject-property facts, researches closed comparable sales, and sends only explicit sale evidence to the canonical InsulaCRM comparable-sales API.

Webhook:
`POST /webhook/wholestack-comps-arv-v1`

Required input:
- `dealId`
- `address`
- `state`

Recommended input:
- `city`
- `zip`
- `county`
- `property_type`
- `square_footage`
- `bedrooms`
- `bathrooms`
- `year_built`
- `acreage`

The workflow uses Perplexity only as a research/retrieval layer. It instructs the provider not to invent sales or missing facts and requires source provenance for every returned comp.

The canonical InsulaCRM endpoint persists the comps and calculates ARV. WF-015 does not calculate MAO itself; the resulting ARV is fed into the existing DealAnalysisService, which recalculates MAO and projected assignment metrics.

Required environment:
- `PERPLEXITY_API_KEY`
- `PERPLEXITY_API_URL` (optional)
- `PERPLEXITY_PROPERTY_MODEL` (optional)
- `INSULA_CRM_BASE_URL`
- `INSULA_CRM_API_KEY`

The workflow is inactive by default and still requires a real n8n execution against configured services before production use.
