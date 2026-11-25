# SWGOH Combat Engine — Build Progress

## Recovery checkpoint — 25 November 2026

- Phase: 1 — game mechanics database.
- Status: interrupted; local Codex implementation not yet reconciled.
- Verified remote baseline: main at 6c239503f8176e6f37b1550717ed8e17eab8e8d3.
- Recovery branch: development/phase1-recovery (documentation only).
- Published branches at inspection: main, feature/roster-dashboard. Neither had BUILD_PROGRESS.md or AGENTS.md at the repository root.
- This checkpoint does not assert that Codex's local changes were lost or that Phase 1 has not started. Those changes were inaccessible to the reviewer.

## Existing foundation (verified from repository README)

- Static dashboard: index.html, app.js; public roster, squad and GAC Scout views.
- Existing Comlink ingestion: scripts/refresh.py; data/dashboard.json, data/unit-catalog.json, data/player.json and data/refresh.json.
- Existing roster refresh: .github/workflows/refresh-player.yml.
- Existing checks: scripts/check-plan.cjs, scripts/check-squads.cjs, scripts/check-dashboard.mjs, scripts/check-private-data.mjs; dashboard CI is separate from roster refresh.
- Private data uses authenticated Cloudflare Worker routes; keep credentials, inventory and private GAC/TW snapshots out of public artifacts. Avoid changes to worker/ or production deployment configuration during Phase 1 unless independently reviewed.
- README documents relic.currentTier - 2 for character relic levels. Reuse existing identifiers and validate mappings.

## Completed vs pending

- [x] Inspect published branches and current README.
- [x] Identify existing ingestion and validation foundation.
- [x] Establish recovery checkpoint without modifying main.
- [ ] Reconcile Codex local working tree and branch; inspect staged, unstaged and untracked files, recent commits, any local progress document (including BUILD_PROCESS.md).
- [ ] Inventory existing Phase 1 implementation and tests; mark completed tasks only with evidence.
- [ ] Verify source availability, licences, versions and actual schemas (swgoh-utils/gamedata, swgoh-utils/swgoh-comlink, stat-calc, SWGOH.GG, SWGOH Wiki).
- [ ] Implement or finish normalized mechanics records for units, stats, abilities, modifiers, targeting, triggers and effects, with raw-source provenance and explicit unsupported fields.
- [ ] Add incremental refresh, validation and compact per-unit indexes; preserve existing roster pipeline.
- [ ] Add searchable character mechanics view, focused tests, documentation and roadmap.
- [ ] Run existing regression checks and new mechanics tests; report failures and limitations before requesting review.

## Decisions and constraints

- Extend rather than duplicate existing Comlink integration.
- Separate raw source data from normalized public mechanics. Do not commit third-party raw datasets without checking redistribution rights.
- Record version, source, retrieval timestamp and confidence; missing values are unknown, not zero.
- Keep calculation engines and simulation out of Phase 1 except for schema design.
- No invented damage multipliers, formulas or win probabilities.
- Do not reset, clean, stash, switch away from or overwrite a dirty working tree without preserving work. Do not merge or deploy automatically.

## Test evidence

No tests were executed during this remote documentation-only recovery. The existence and behavior of the documented test scripts must be checked locally. No claim of a passing build is made.

## Exact next step for Codex

In the original local checkout, run read-only inspection: git status --short --branch; git log -5 --oneline; git diff --stat; git diff --cached --stat; git ls-files --others --exclude-standard. Read any local BUILD_PROGRESS.md, BUILD_PROCESS.md and AGENTS.md. Do not disclose secrets or private file contents. Compare local progress against this checklist. Incorporate this recovery checkpoint into the local progress document without overwriting more recent information. Continue the first incomplete Phase 1 task with focused tests. Update BUILD_PROGRESS.md and commit tested changes to a dedicated development branch; push for review when safe.

## Subsequent phases

2. Event-driven speed and turn meter.
3. Damage and survivability.
4. Ability interactions and squad synergy.
5. Roster-based GAC/TW counter selection.
6. Limited-coverage, validated battle simulator.

Update this file at each meaningful milestone with date, branch/commit, changed files, evidence, test commands/results, unresolved issues and exact next step. Resume from the latest checkpoint after interruptions.
