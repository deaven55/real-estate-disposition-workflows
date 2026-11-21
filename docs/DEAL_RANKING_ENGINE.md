# WF-017 Deal Ranking Engine

Webhook: `POST /webhook/wholestack-deal-ranking-v1`

WF-017 calls the canonical InsulaCRM ranking endpoint:
`POST /api/v1/deals/{dealId}/rank`

The CRM calculates a tenant-safe 0-100 acquisition priority score and A/B/C/D grade using available ARV, repair, offer, seller motivation, comparable-sale strength, property completeness, buyer-match demand, distress signals, and analysis risk flags.

The score is a prioritization heuristic only. It is not an appraisal, CMA, BPO, lending decision, or guarantee of profit.

Required environment:
- `INSULA_CRM_BASE_URL`
- `INSULA_CRM_API_KEY`

The workflow sends an idempotency key per deal/version.

The ranking engine is jurisdiction-agnostic and does not hardcode a county or state.
