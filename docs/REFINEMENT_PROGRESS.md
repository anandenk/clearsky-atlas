# Post-Prototype-1 desktop refinements

User request: seven issues, one CLI worker per issue, bounded parallel batches. The immutable Prototype 1 tag remains `6dc04f3`; development starts from `8961c55` on `development/prototype-2`. No push is authorized for this work. The separate frontend worktree/preview remains frozen. Generated next-env.d.ts is preserved unstaged; baseline bytes/patch are in artifacts/refinement/.

| Issue | Worker | State |
| --- | --- | --- |
| Nearby essentials contrast/readability | p2-contrast | integrated; rendered check pending |
| Current product menu; tuck away development tools | p2-menu | integrated; rendered check pending |
| Flexible, source-backed address normalization/resolution | p2-address | running |
| Unclutter facility directory/search | p2-directory | integrated; rendered check pending |
| Replace per-place three-dot menu with direct remove X | p2-chips | integrated; rendered check pending |
| Focused place immediately requests City, without relief lag | p2-city | launching |
| Hide/park Compare Geography behind explicit opt-in | p2-geography | launching |

Workers leave owned changes uncommitted. The integration owner reviews, commits, merges and verifies the combined desktop UI. Running browser tests remains sequential. Final results, limitations and scope adjustments will be recorded here.

## Accepted scope adjustments

The user removed the normal per-place reference/replacement/reordering menus in favor of a direct X. Existing tests will exercise first-remaining reference recovery and signed comparisons through insertion order. The original capabilities remain backlog items; reactivation requires a coherent interaction design and user review. Linked geography is retained only as an explicit experimental opt-in, with its regression suites opting in. Mobile remains deferred.

Baseline on production :3000, headless installed Chrome, 1440×960, three CLI workers active: City selected at 1,825 ms after chip click and landscape relief reached zero at 2,941 ms. Directory status had a 0 px input gap and two result columns. This is one bounded observation, not device certification. Raw samples/screenshots are in `artifacts/refinement/before.json` and `*-before.png`.
