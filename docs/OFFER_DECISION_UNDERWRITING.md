# WF-016 Offer Decision Underwriter

WF-016 calls the canonical InsulaCRM offer-decision endpoint.

Webhook:
`POST /webhook/wholestack-offer-decision-v1`

Required:
- `dealId`

Optional overrides:
- `arv`
- `repairs`
- `asking_price`
- `assignment_fee_target`
- `closing_costs`
- `holding_costs`
- `selling_costs`
- `arv_confidence`
- `comp_count`

The workflow is inactive by default. Production use requires configured InsulaCRM API credentials and a real n8n execution test.