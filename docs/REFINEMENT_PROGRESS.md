# Post-Prototype-1 desktop refinements

User request: seven issues, one CLI worker per issue, bounded parallel batches. The immutable Prototype 1 tag remains `6dc04f3`; development starts from `8961c55` on `development/prototype-2`. No push is authorized for this work. The separate frontend worktree/preview remains frozen. Generated next-env.d.ts is preserved unstaged; baseline bytes/patch are in artifacts/refinement/.

| Issue | Worker | State |
| --- | --- | --- |
| Nearby essentials contrast/readability | p2-contrast | integrated; rendered check pending |
| Current product menu; tuck away development tools | p2-menu | integrated; rendered check pending |
| Flexible, source-backed address normalization/resolution | p2-address | running |
| Unclutter facility directory/search | p2-directory | launching |
| Replace per-place three-dot menu with direct remove X | p2-chips | launching |
| Focused place immediately requests City, without relief lag | p2-city | queued |
| Hide/park Compare Geography behind explicit opt-in | p2-geography | queued |

Workers leave owned changes uncommitted. The integration owner reviews, commits, merges and verifies the combined desktop UI. Running browser tests remains sequential. Final results, limitations and scope adjustments will be recorded here.
