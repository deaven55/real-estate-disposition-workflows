# WF-014 — NC Property Intelligence Collector

WF-014 adds county-targeted public-source collection to the property-intelligence pipeline.

Flow:

Property/deal address → county source registry → Firecrawl → normalized evidence → InsulaCRM

The collector is evidence-first. It does not calculate ARV, MAO, repairs, or deal score.

## State/county targeting

The workflow is **not locked to Catawba County**. The request can provide `state` and `county`, but county is now optional. If county is omitted, WF-014 resolves the county from the supplied property address using the configured property-research provider. State can also be inferred from supported ZIP prefixes when state is omitted. Known counties can use a curated source registry; any other state/county can enter the source-discovery path, which uses the configured Perplexity provider to identify official government/public-record URLs before Firecrawl collection. Discovered sources are still treated as unverified evidence until the underlying record is validated.

### Current curated county: Catawba County, NC

The first adapter targets official county starting points for GIS/parcel data, real-estate tax records, delinquent-tax searches, permits/inspections, county GIS datasets, and land records.

The county GIS department documents real-estate maps, sale analysis, parcel/deed search and datasets. The county tax portal supports real-estate property lookup and delinquent-bill searching. The county permit portal provides parcel search.

## Environment

- INSULA_CRM_BASE_URL
- INSULA_CRM_API_KEY
- FIRECRAWL_API_KEY
- FIRECRAWL_API_URL (optional)\n- PERPLEXITY_API_KEY (required for counties/states not yet in the curated registry)\n- PERPLEXITY_API_URL (optional)\n- PERPLEXITY_PROPERTY_MODEL (optional)

## Request

POST the n8n webhook with:

{
  "dealId": 123,
  "address": "123 Main St",
  "city": "Hickory",
  "state": "NC",
  "zip": "28601",
  "county": "Catawba"
}

## Important limitation

County web applications may require interactive searches, session state, CAPTCHA, or provider-specific terms. WF-014 therefore uses public starting URLs rather than pretending every page supports direct query-string lookup. A Firecrawl result can be a generic landing page; it must not be treated as a verified property fact.

For production-grade parcel/assessment extraction, the next adapter should use a county-approved downloadable dataset or a stable public GIS/API endpoint where one exists, with a provider-specific parser and source-record identifiers.

## Evidence categories

Current:
- property_record
- tax_record
- tax_delinquency
- permit_record
- county_dataset
- land_record

Next:
- transaction_history
- comparable_sale
- listing_history
- lien_signal
- violation
- flood_risk
- neighborhood_market_signal

## Next integration

WF-014 should feed WF-012 automatically after evidence collection so the full chain becomes:

NC property → public records/evidence → InsulaCRM evidence → AI deal analysis → ARV/repairs/MAO/deal score.
