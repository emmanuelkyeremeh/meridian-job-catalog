# Meridian Job Catalog

Meridian Job Catalog is a local JavaScript toolkit for cleaning, deduplicating, searching and filtering job listings, extracted from the existing Meridian job-search application. It uses deterministic text rules to identify Africa-inclusive location signals and leaves ambiguous listings for manual review.

This is the public job-catalogue component, not the complete production website. See [PROVENANCE.md](PROVENANCE.md) for its preserved development history and extraction scope.

## Run locally

Requires Node.js 22 or newer and npm. No credentials or `.env` file are required.

```sh
npm ci --ignore-scripts
npm run demo
npm run catalog -- examples/jobs.json --q backend --experience entry --verdict yes
npm run catalog -- examples/jobs.json --verdict review
npm test
npm run check:scope
```

`npm run demo` writes a JSON catalogue to your terminal. The bundled five records are fictional and use reserved `.example` domains. There are no automatic network requests and no production-database connection.

## Input and output

Input is a JSON array. Each record requires string fields `title`, `company`, `location`, `description`, and `url`; `salary` is optional. Use public job information or fictional fixtures, never candidate records, CVs, credentials or personal information. The allowlist discards extra object fields, but does not guarantee that free-text descriptions or URLs are free of sensitive information; inspect inputs yourself.

Output contains normalized plain-text descriptions, stable URL-based IDs, experience levels, salary metadata, canonical paths, rule verdicts and reasons, plus duplicate and verdict counts. Filters accept text search, experience levels (`intern,entry,mid,senior,lead,executive,unknown`) and verdict (`yes,no,review,all`).

A `yes` verdict describes signals in the listing, not a verified hiring promise, immigration decision or assessment of a person. Rules can misread contradictory postings. Check the original employer's requirements. Ambiguous records remain `review`; there is no automatic AI fallback.

## Scope

The current edition has no AI SDKs or model calls, model training, account system, resume processing, application tracking, analytics, payments, database integration or external-service configuration. It reads a local JSON file and writes JSON. An `.env.example` documents that credentials are unnecessary; do not copy the production application's `.env` here.

## Development

The retained Meridian modules cover location-signal rules, job-description cleanup, experience detection, stable identifiers, URL slugs, salary extraction and Workday URL normalization. The CLI composes these modules into a standalone workflow. The tests include inherited regression cases and end-to-end coverage of the extracted workflow. CI runs the scope check, tests and fictional-data demo.

See [ROADMAP.md](ROADMAP.md) for planned engineering work and [SUBMISSION.md](SUBMISSION.md) for a transparent BYOP description. Alignerr has not approved this extracted edition. Repository readiness does not establish project eligibility, guarantee assignment or authorize paid work.
