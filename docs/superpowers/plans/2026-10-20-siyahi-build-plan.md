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

Status, 2026-10-20 early morning: unit 1 merged (#1, #2), unit 2 done (catalogue live at
https://siyahi.jatinbansal.com). npm publish is blocked: the NPM_TOKEN was created without
2FA bypass, so the registry asks for a one-time code. Until Jatin replaces the token (granular,
publish on @siyahi, bypass 2FA) or sets up trusted publishing after the first publish, every
merge to main ships the two tarballs on a GitHub release (`v<version>` and rolling `next`), and
dash and The Book install from `https://github.com/jatinbansal1998/siyahi/releases/download/v0.1.0-next.1/...`
with `allow-remote=root` in `.npmrc`. Switching them to `@siyahi/ui@next` is one line each.

Deploy steps the orchestrator runs after each merge:
- dash: `git pull --ff-only` in `~/code/dash`, `npm run deploy`, open the live page.
- The Book: wait for the `native-image` workflow, `git pull --ff-only` in
  `~/code/transactions-analyser`, `DATA_INGESTION_BIN=~/.local/share/transactions-analyser/data-ingestion
  ingestion-cli/scripts/fetch-native-binary.sh`, `systemctl --user restart portfolio`,
  check `http://127.0.0.1:9090`.
