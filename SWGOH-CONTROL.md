# SWGOH modeling control document

Updated 25 November 2026 (Sydney). Use this file to coordinate work on the SWGOH mechanics database across Codex, Google Antigravity, and Claude.

## Start and hand off

1. Open the same `Swgoh-data` checkout or obtain the latest shared branch and control document. Read this file, then run `git status -sb` and `git log -1 --oneline`. Read the latest handoff and inspect the relevant changes before repeating any work.
2. Pick one ready task and record your tool or name, branch, and file scope in its row. Save the claim before editing. Use one writer at a time in the same checkout. Across devices, share the claim first and give each parallel task its own branch and distinct file scope. If you cannot share a claim directly, have the person coordinating the work record it before you start.
3. Before stopping, update the task status and handoff with changed files, commands and results, any blocker, and the exact next step. Include the commit or PR when available. For unfinished local edits, record where the checkout is. Mark work done when its acceptance check passes.

Use the repo copy as the source of truth. Share it with the code on an authorized branch if working across devices. For a web chat without repo access, paste the current file and the public code or test output needed for the claim. Ask for a patch and a handoff update, then apply both to the repo before starting another session. Keep credentials, private player data, and raw game snapshots out of handoffs and public branches.

## Working across Codex, Antigravity, and Claude

Use each tool in its own app under your existing account. Start with Antigravity on the local checkout for M1. If its session ends mid-task, record the last file changed, the last check run, and the next command before resuming that same task in Codex. Update the claim to show who is picking it up.

Claude in the browser can review a patch or help diagnose a specific failure. Give it the latest handoff and the smallest relevant excerpt of public source or test output. Keep the patch owner responsible for applying any accepted fixes and recording the result. Once M1 passes, the next available tool can claim M2.

## Current state

- Branch `feature/mechanics-database` at base commit `6c23950`. The mechanics feature is in local edits, including the dashboard entry, workflow, browser UI, normalizers, and tests.
- `node --test mechanics/test/*.test.mjs` passed 10 tests on 25 November.
- `scripts/mechanics/units.mjs` is implemented and verified.
- `node scripts/mechanics/update.mjs` built and verified 421 unit profiles for game version `0.41.1:uE5ua8JhTzqQZSsu57R4Iw` into `mechanics/data/` (gitignored).
- `node scripts/mechanics/update.mjs --verify` passes and confirms all 421 unit profiles and dataset shard checksums.
- `node mechanics/test/browser.mjs --generated-data` passed all browser tests using Playwright & Chromium.
- Privacy boundary verified with `node scripts/check-private-data.mjs` (PASS).
- Workflow `.github/workflows/mechanics.yml` reviewed: verified that snapshot generation runs in CI and publishes isolated output to the dedicated `mechanics-db-v1` branch without committing raw data to `main`.
- The separate roster progression plan lives in [GOALS.md](GOALS.md). Mechanics field notes live in [docs/mechanics/combat-fields.md](docs/mechanics/combat-fields.md).

## Work queue

| Task | Status | Owner / branch | Acceptance check |
| --- | --- | --- | --- |
| M1. Restore the unit/stat adapter | Completed | Google Antigravity / feature/mechanics-database (`scripts/mechanics/units.mjs`) | Recover prior work if available. Otherwise implement the `buildUnits` contract in `scripts/mechanics/units.mjs` using the source collections and snapshot schema. Run the mechanics tests and confirm the updater builds and verifies a snapshot. |
| M2. Verify the mechanics browser UI with generated data | Completed | Google Antigravity / feature/mechanics-database (`mechanics/test/browser.mjs`) | Run `node mechanics/test/browser.mjs --generated-data` with Playwright available and record results. |
| M3. Review the feature for GitHub delivery | Completed | Google Antigravity / feature/mechanics-database | Review the full diff and workflow, confirm generated data and credentials are excluded, and record the branch or PR and publication status. |

## Latest handoff

- **Completed** — M1, M2, and M3 are all completed and verified:
  - **M1**: Implemented `scripts/mechanics/units.mjs` (`buildUnits`), normalized 421 unit profiles, and verified snapshot build.
  - **M2**: Ran `node mechanics/test/browser.mjs --generated-data` using Playwright & Chromium; all browser interaction, routing, and mobile viewport tests passed.
  - **M3**: Reviewed full diff and `.github/workflows/mechanics.yml`. Confirmed that generated snapshot directories (`/mechanics/data/`, staging, lock, backups) and `node_modules/` are cleanly excluded by `.gitignore`. Confirmed no player credentials, API tokens, or private keys are exposed or staged. Ran `node scripts/check-private-data.mjs` (PASS).
- **Next** — stage/commit local mechanics feature changes on `feature/mechanics-database` (`.github/workflows/mechanics.yml`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `SWGOH-CONTROL.md`, `docs/`, `mechanics/`, `scripts/mechanics/`), push branch to remote, and open Pull Request into `main`.
- **Location** — local `Swgoh-data` checkout on `feature/mechanics-database` (`C:\Users\User\Documents\ChatGPT\S2goh\Swgoh-data`).
