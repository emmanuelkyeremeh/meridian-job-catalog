# Meridian extraction provenance

This repository is a standalone, deterministic job-catalogue component extracted from the existing Meridian backend. It is not the complete production service at hiremeridian.com. The full service contains account and AI features that are outside this edition.

The first 12 commits were created by path-filtering the original local `meridian-backend` main branch with `git fast-export` and `git fast-import`. Relevant file content, author identity, dates and commit messages were retained. Commit IDs changed because unrelated paths were excluded. This is an extraction, not a claim that the source project never had excluded features.

Source backend HEAD at extraction: `7c19cdb`.
Some original commits describe broader changes than their retained files because only the following paths were selected:

- `src/lib/africa-rules-classifier.js`
- `src/lib/africa-rules-classifier.test.js`
- `src/lib/description-utils.js`
- `src/lib/description-utils.test.js`
- `src/lib/jobExperience.js`
- `src/lib/jobExperience.test.js`
- `src/lib/jobSlug.js`
- `src/lib/jobSlug.test.js`
- `src/lib/jobUtils.js`
- `src/lib/jobUtils.test.js`
- `src/lib/salarySchema.js`
- `src/lib/workday-url-utils.js`

The public-edition preparation commit removes optional model-related routing from the retained rule module and adds a standalone local workflow, fictional examples, documentation and integration tests. Current uncommitted improvements to the source rule module and its tests were incorporated explicitly in that preparation commit; no other uncommitted source changes were copied.

This repo does not include source `.env` files, source dependency manifests, databases, production records, CV features, authentication, payment code, model training or evaluation pipelines. Those files are excluded from the entire published history, not just the latest commit.

Historical helper names/comments may mention models because this code formerly participated in a broader pipeline. Historical commits are provenance, not runnable releases; run the current main branch using its package manifest.
