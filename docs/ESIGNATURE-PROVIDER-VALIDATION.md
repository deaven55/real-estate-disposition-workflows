# E-Signature Provider Contract Validation

The e-signature boundary is now validated in CI against the canonical provider contract and canonical e-signature test cases.

## What CI verifies

- create-package and void-package operations exist.
- Canonical callback statuses map to canonical lifecycle events.
- Production gate requires a real provider, live credentials, and live create/callback verification.
- Contract test cases remain aligned with the provider manifest.

## What CI does not prove

CI does not call a real provider. Vendor credentials and live API behavior remain deployment/runtime verification steps.
