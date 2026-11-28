# Character stat sources

This page uses Jeff's saved public Comlink roster and equipped mods. Unequipped mods and private inventory are excluded.

Stat calculations use [swgoh-utils/swgoh-stat-calc](https://github.com/swgoh-utils/swgoh-stat-calc), version 1.0.1 (MIT), maintained from Crinolo's calculator. Definitions come from [swgoh-utils/gamedata](https://github.com/swgoh-utils/gamedata) (GPL-3.0). `data/modding.json` records the exact revision, game version and source checksums. The accompanying source licenses are retained here.

“Without mods” includes the character's current level, rarity, equipped gear and relics. “From mods” is the difference between the equipped and unmodded calculations, including completed mod-set bonuses. Percentage differences use percentage points. The opening-order tool compares `(1 - startingTM / 100) / effectiveSpeed` using manually supplied bonuses; it does not infer leader or unique abilities. Equal results are explicitly unresolved.

This project is not endorsed by or affiliated with EA or its licensors. Game names and third-party material retain their respective rights.
