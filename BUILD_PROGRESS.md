# Character database build progress

## 28 November 2026 — personal roster and modding

Jeff clarified the current task: readable stats for **his characters**, modding and speed/turn-order planning. Battle simulation is outside this task. Branch: `feature/mechanics-database`; existing review: PR #2.

### Completed

- Reconciled the published feature implementation and newer main roster snapshots. The earlier recovery checkpoint on `development/phase1-recovery` predates the mechanics implementation. No other local checkout or unfinished edits were changed.
- Reused the existing verified-source reader with an optional requested-file list. The personal builder reads only gameData/statMod definitions and source license/version metadata.
- Calculated all **233 owned characters** from the saved **27 November 2026, 12:45:24 pm AEDT** roster. The existing 421-profile mechanics library is a separate game reference.
- Added 13 readable stats, modless/equipped/mod contribution breakdowns, six-slot mod details, set summaries, search/filter/sort, filtered CSV and squad copying.
- Added manual five-character opening-order comparison with planned speed, flat speed bonuses and initial TM; unknown values, invalid entries and equal-time ties are explicit.
- Integrated optional stat calculation into the current public roster refresh. A failed or version-mismatched calculation preserves prior stats; the page detects stale stats without blocking roster refresh.
- Preserved main's four newer roster commits by using their exact saved input files. Production Worker code and configuration were not changed in this continuation.
- Updated a stale regression assertion that incorrectly prohibited Piett advancing beyond R6; the latest saved roster has him at R9.

### Evidence

- `npm test`: 16 tests passed, including real-calculator synthetic fixtures proving speed-set percentage applies before currently equipped gear speed, reduced bonuses for underlevelled sets, null-versus-zero, roster isolation and manual opening-order behavior.
- `node scripts/modding/build.mjs --source-repo ...`: 233 character records; zero character-wide calculation failures.
- `node scripts/modding/build.mjs --verify`: roster timestamps and both input hashes verified.
- Rebuilt with an empty source cache and again with the populated cache; both files exactly matched the committed stat snapshot.
- Inquisitor speed cross-check matches Jeff's reported speeds: Fifth 331; Seventh 288; Eighth 256; Second 237; Ninth 202.
- Existing progression, squad-allocation and private-data checks passed. The private-data test intentionally exercises safe failure responses with synthetic credentials.
- Local browser: search and Fifth Brother breakdown verified; five-character manual selection verified; moving Ninth to 400 puts her first, 331 reports an unresolved tie, initial TM 101% is rejected and 50% changes first-fill ordering.
- Full desktop and 390px phone browser suite passed in [GitHub CI](https://github.com/jeffkites/Swgoh-data/actions/runs/46139310313) at `33bd97d`. This covers all presets, filters, six mod slots, speed edits, TM, ties, the five-character limit, CSV and page width. The first CI run caught a malformed Inquisitors option; `33bd97d` corrected it, and the full suite then passed. The container's separate Chromium wrapper lacks its binary; cloud-browser checks and CI supplied the browser verification.
- The [existing mechanics pipeline](https://github.com/jeffkites/Swgoh-data/actions/runs/46139310286) also passed at `33bd97d`; PR publication was skipped as intended.

### Remaining review boundary

Implementation and verification are complete: code `ea00e17`, browser-selector fix `33bd97d`, PR #2 open for review. Subsequent handoff documentation does not change the tested source. Exact next step: review the personal modding page; do not merge, deploy the live dashboard or start a battle simulator automatically. The latest saved roster is over 24 hours old and correctly labelled; a fresh public refresh will update mods/stats together once this feature is merged.

Earlier source-download HTTP 403 failures were addressed by commits `eabe4f7` and `afdd6fd`; the latest pre-continuation mechanics CI at `8da9028` succeeded. Do not repeat that repair without a new failure.

## 28 November 2026 — live publication and refresh repair

Jeff reports that the live site still shows old data after refreshing and expects the new pages to be live. This supersedes the earlier pre-publication boundary above. Scope: publish the tested pages to the existing GitHub Pages site, repair the public roster refresh and verify fresh character stats. Preserve the production Worker configuration and keep battle simulation outside this task.

- His button-triggered refresh, run `46140557579`, fetched 285 units at 22:35:05 AEDT but failed before saving because the validator rejected a name equal to its ID. The canonical catalog contains the valid `STAP` → `STAP` mapping.
- Replaced that heuristic with catalog-based name/type/identity validation, before snapshot writes and in the workflow/dashboard browser check. Added four focused regression tests, including accepting STAP while rejecting unresolved definitions.
- All four Python tests, 16 JavaScript tests, progression checks and squad checks pass locally. Full PR checks and live publication verification are pending.
- Restored both Wrangler configuration files to the existing main versions so publishing these static pages does not change production Worker configuration.

### Publication completed

- Fix `3e5911d` passed PR checks; PR #2 merged as `3b4c6e9`.
- Main checks passed: character stats/browser `46141148712`, existing dashboard `46141148703`, mechanics publication `46141148661`.
- Refresh run `46141148715` succeeded, including the calculated-stat step. Commit `4fb0964` contains 285 roster units and 234 personal characters, with both snapshots dated **28 November 2026, 10:42:42 pm AEDT**. STAP is correctly named and accepted.
- Pages deployment `46141170862` succeeded for `4fb0964`. Browser verification at `https://jeffkites.github.io/Swgoh-data/modding/` showed 234 characters, the current timestamp, and Inquisitor speeds: Seventh 331, Fifth 315, Eighth 256, Ninth 244, Second 237.
- Reverified fresh snapshot hashes/timestamps with `node scripts/modding/build.mjs --verify`; progression and squad checks still pass.
- Live publication and refresh repair are complete. No active implementation claim remains; the earlier review boundary in this document is historical.
