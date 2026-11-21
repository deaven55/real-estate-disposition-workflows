# WF-018 Jurisdiction Compliance Gate

Webhook: `POST /webhook/wholestack-jurisdiction-compliance-v1`

WF-018 calls the canonical InsulaCRM compliance endpoint:
`POST /api/v1/deals/{dealId}/compliance/check`

The gate is deliberately conservative. It returns REVIEW when a state is not curated instead of assuming wholesaling is permitted.

For North Carolina, the current profile flags license/legal review because Chapter 93A requires a license to act as a real estate broker and defines broker activity broadly. This workflow does not treat proposed legislation as current law.

Required environment:
- `INSULA_CRM_BASE_URL`
- `INSULA_CRM_API_KEY`

This is an operational compliance control, not legal advice. Exact transaction structure should be reviewed by qualified state counsel or the applicable real-estate regulator before automated solicitation, negotiation, contract marketing, or assignment.
