# Siyahi build plan

Orchestrated from one T3 Code thread. Each unit runs in its own thread (Claude Opus 5.5,
extra-high effort, own worktree) and ends in a PR. Every PR: Grok 4.7 review, green CI,
screenshots in light and dark at 1920 and 390, then the orchestrator merges and deploys.
The design is `docs/superpowers/specs/2026-10-20-siyahi-design.md`; it wins over this file.

Toolkit for the siyahi repo, taken from t3code: pnpm 11, Node 24, TypeScript 7, Vite+
(`vp lint` = oxlint, `vp fmt` = oxfmt, `vp test` = vitest, `vp check` = the gate), knip,
a pnpm catalog for shared versions. Newest stable of everything, no pre-releases.

Common rules for every PR:
- `.coderabbit.yaml` with auto review disabled is in every repo touched.
- Screenshots go to a gitignored `shots/` folder in the worktree; the thread reports the
  absolute paths so the orchestrator can view them.
- Install before you write. Justify any component we write in the PR body.
- No raw colours or sizes outside the theme file. Lint and contrast check pass.

| # | Repo | Unit | Depends on |
|---|---|---|---|
| 1 | siyahi | Workspace: `@siyahi/ui`, `@siyahi/tools`, theme, components, catalogue, icon, README, LICENSE, notices, report.css, CI (check, publish `next` on main) | design |
| 2 | siyahi | Deploy catalogue to siyahi.jatinbansal.com from the Dell (wrangler, custom domain) | 1 merged and published |
| 3 | agent-skills | `siyahi` skill, delete `kajal`, uninstall step in `install.sh`, rewrite `dashboard-publisher`, fix `skill-maintainer`, README table; install | 1 published |
| 4 | market-flow | Point the report skill at `report.css` | 3 |
| 5 | dash | Package install, layered Mantine, shell on the package, Dell page, scaffold and `check:page` updates, style guide deleted, deploy | 1 published |
| 6 | transactions-analyser | React shell hosting vanilla views through an adapter; `styles.css` in `@layer legacy` | 1 published |
| 7 | transactions-analyser | Holdings | 6 |
| 8 | transactions-analyser | Realized + fills modal (old Check opens it via adapter) | 7 |
| 9 | transactions-analyser | Cash flow | 8 |
| 10 | transactions-analyser | Money | 9 |
| 11 | transactions-analyser | Mutual Funds | 10 |
| 12 | transactions-analyser | Discipline | 11 |
| 13 | transactions-analyser | Check | 12 |
| 14 | transactions-analyser | Remove adapter, `styles.css`, `web/kajal/`; preflight fully on | 13 |
| 15 | dash | A new dash page on Siyahi: "How we set up a Node and TypeScript project", the tooling best practices taken from t3code (pnpm, Node 24, TypeScript 7, Vite+ with oxlint/oxfmt/vitest, knip, pnpm catalog, CI shape) and what Siyahi adopted; published through the publisher skill | 5 |

Status, 2026-10-20 09:30 IST: units 1, 2, 3, 4 and 5 are done and deployed (siyahi #1 #2,
catalogue live, agent-skills #95 installed, market-flow #2, dash #82 deployed). npm publishing
works since Jatin replaced the token at 01:25 UTC: `@siyahi/ui@0.1.0-next.3` and
`@siyahi/tools@0.1.0-next.3` are on npmjs under the `next` tag (and, because it was the first
publish, also `latest`; re-point `latest` when 1.0.0 ships). Every merge to main also uploads
the tarballs to a GitHub release. dash and The Book still install from the v0.1.0-next.1
tarballs; they switch to `@siyahi/ui@next` when they bump to 0.1.1 (siyahi #3).

Status, 2026-10-20 14:58 IST: `latest` now follows `next` on every publish until 1.0.0
(siyahi #6, #7), so the note above about re-pointing `latest` no longer applies. Unit 7 is in
review (transactions-analyser #23): The Book installs `@siyahi/ui@0.1.1-next.1` from npm, and
its Holdings view is the first React port. The package gaps it found shipped in siyahi #8 as
`@siyahi/ui@0.1.2-next.1` and `@siyahi/tools@0.1.2-next.1` (`next` and `latest`): the data
table column menus no longer crash, the pinned column and sticky header take the card's colour,
`Treemap` gained `onHover`, `range`, item `key`, nullable `change` and `group`, and `BarList`
items gained `detail`. The catalogue is redeployed with them. The Book takes these by bumping
to 0.1.2-next.1; #23's workarounds (sortable header buttons, the `<g>`-index tooltip, the
`SYMBOL · Broker` tile names, labels carrying secondary figures) can then go. The font fix
(siyahi #9) moves to 0.1.3.

Status, 2026-10-20: 0.1.5 switches the shadcn style from `base-vega` to `base-luma` (siyahi #12); flat cards (no `shadow-md` on stat tiles) are the open decision for 0.1.6.

Deploy steps the orchestrator runs after each merge:
- dash: `git pull --ff-only` in `~/code/dash`, `npm run deploy`, open the live page.
- The Book: wait for the `native-image` workflow, `git pull --ff-only` in
  `~/code/transactions-analyser`, `DATA_INGESTION_BIN=~/.local/share/transactions-analyser/data-ingestion
  ingestion-cli/scripts/fetch-native-binary.sh`, `systemctl --user restart portfolio`,
  check `http://127.0.0.1:9090`.
