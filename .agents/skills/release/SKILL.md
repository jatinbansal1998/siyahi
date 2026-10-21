---
name: release
description: >
  Release Siyahi: prepare the version bump in a PR, merge it, confirm the
  automatic npm/GitHub publish of @siyahi/ui and @siyahi/tools, redeploy the
  catalogue at siyahi.jatinbansal.com by hand, and hand off to the consumers.
  Use when the user says "merged", "deploy", "release", "ship", "publish", or
  asks for a new Siyahi version.
---

# Release

## What ships where

| Unit                                               | Where                                                                                                                    | How                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `@siyahi/ui`, `@siyahi/tools` (one shared version) | npmjs.org, dist-tags `next` and, before 1.0.0, `latest`                                                                  | `publish.yml`, automatic            |
| Both tarballs                                      | GitHub release `v<version>` (pre-release) and the rolling `next` release (`siyahi-ui-next.tgz`, `siyahi-tools-next.tgz`) | `publish.yml`, automatic            |
| Catalogue (`apps/catalogue`)                       | Cloudflare Worker `siyahi-catalogue`, https://siyahi.jatinbansal.com                                                     | `pnpm deploy:catalogue`, **manual** |

## Trigger

- **Automatic:** every push to `main` runs `.github/workflows/publish.yml`,
  unless it changes only `docs/**`, root `*.md`, `.agents/**` or `.claude/**`;
  those publish nothing, so don't wait for a Publish run after them. The
  workflow versions both packages `<base>-next.<N>` (`.github/scripts/next-version.mjs`: N is one past the
  highest `next.N` on npm or among `v*` tags), so **each merged PR is its own
  release**: 0.1.7 shipped as `next.1`, `.2`, `.3` from three PRs. Consumers pin
  the last one. The bumped version is never committed back; the repo stays at
  the base.
- **Manual:** the base version bump (in the PR), the catalogue deploy, and the
  consumer bumps.
- **1.0.0 / stable:** `publish.yml` says stable versions are "cut by hand", but
  no procedure exists and none has been done. Don't invent one; ask. The PR
  that cuts the first stable version also deletes the "Point latest at this
  pre-release" step from `publish.yml`.

## In the PR

1. Starting a new base version: set `"version"` to it in **both**
   `packages/ui/package.json` and `packages/tools/package.json` (they must
   match or `next-version.mjs` fails). PR title starts with it: `0.1.8: …`.
2. Add or extend the `## 0.1.x` section at the top of `CHANGELOG.md`
   ("Published as `0.1.x-next.<n>` pre-releases."). Skip it when the PR changes
   only tests (`packages/*/test/**`, `apps/*/test/**`) or `.agents/**`: no
   consumer gets anything new.
3. Run CONTRIBUTING.md "Before a pull request" (`pnpm check`, plus shots for
   UI changes).
4. Several PRs for one base: merge one, rebase the next on `main`, re-run
   `pnpm check`. The usual conflict is `CHANGELOG.md`: keep both entries under
   one heading.

## Steps after approval

```bash
R=jatinbansal1998/siyahi
gh pr merge <n> --repo $R --squash --delete-branch --match-head-commit <head-sha>
sha=$(gh pr view <n> --repo $R --json mergeCommit -q .mergeCommit.oid)
gh run list --repo $R --workflow publish.yml --commit "$sha"   # repeat until it appears
gh run watch <run-id> --repo $R --exit-status                   # ~2.5 min
gh release list --repo $R --limit 3                             # the new v<VER> tag
gh run view <run-id> --repo $R --log | grep "Published package"
```

- No Publish run for `$sha` (docs or skill-only merge): nothing was published.
  Stop here.
- Run red: stop and report. Do not deploy the catalogue; `deploy:catalogue`
  only builds, it does not run the tests.
- `VER` is the new `v*` release tag without the `v`. If the grep prints no
  `✅ Published package @siyahi/…@<VER>` lines, npm failed (see Gotchas).
- If the merge touched neither `packages/` nor `apps/catalogue/` outside their
  `test/` folders (for example a workflow, `.gitignore` or test-only change),
  the release is content-identical: skip the catalogue deploy and the consumer
  bumps. `publish.yml` still runs for tests, so report the new `VER` and say it
  ships the same code as the one before.

Then the catalogue, from the main checkout, clean and on `main`:

```bash
cd ~/code/siyahi
git status --short                 # must print nothing
git switch main && git pull --ff-only
pnpm install --frozen-lockfile
(set -a; . ./.env; set +a; pnpm deploy:catalogue)
```

`.env` holds `CLOUDFLARE_API_TOKEN`; check it is set, never print it. Wrangler
ends with `Current Version ID: …`.

## Live check

Not done until each passes or fails explicitly.

```bash
R=jatinbansal1998/siyahi
npm view @siyahi/ui dist-tags --json --prefer-online
npm view @siyahi/tools dist-tags --json --prefer-online
# pass: {"next": "<VER>", "latest": "<VER>"} for both
gh release view v<VER> --repo $R --json isPrerelease,assets -q '[.isPrerelease, [.assets[].name]]'
# pass: true, with siyahi-ui-<VER>.tgz and siyahi-tools-<VER>.tgz

curl -sI https://siyahi.jatinbansal.com | head -1               # HTTP/2 200
js=$(curl -s https://siyahi.jatinbansal.com | grep -o '/assets/index-[^"]*\.js' | head -1)
curl -s "https://siyahi.jatinbansal.com$js" | grep -o '<string unique to this change>' | wc -l
# pass: more than 0 (0.1.7 used "Accordion": 17)
```

For layout changes, also `pnpm shots https://siyahi.jatinbansal.com/`; for font
or loading changes, `node packages/tools/cls.mjs https://siyahi.jatinbansal.com/`.

## After the release (separate repos, describe, don't do here)

1. dash (`~/code/dash`): its release skill's "Siyahi bump"
   (`~/code/dash/.agents/skills/release/SKILL.md`) sets `@siyahi/ui` and
   `@siyahi/tools` to the exact `<VER>`, no caret, the same for both, in a
   dash PR.
2. The Book (`~/code/transactions-analyser`): the same exact `<VER>` for both
   in `dashboard/package.json`, in its own PR.
3. `~/code/agent-skills` needs no bump: `siyahi/SKILL.md` pins no version and
   points at the installed package's README (agent-skills #108). Only if
   `report.css` changed, refresh its copy with
   `siyahi/scripts/refresh-report-css.sh <VER>` in an agent-skills PR, then
   `./install.sh siyahi` after it merges.

## Gotchas

- **A green Publish run can hide an npm failure.** "Publish to npm" is
  `continue-on-error`; on failure the run stays green and only an
  `npm publish failed` annotation shows. The first publish (run 39339828051,
  2026-10-20) failed with `ERR_PNPM_OTP_NON_INTERACTIVE` because `NPM_TOKEN`
  lacked 2FA bypass; that run went red only because the step was not yet
  `continue-on-error`. Always run the `npm view` checks.
- **npm lags.** Right after the run, `dist-tags` can still show the previous
  version. Poll `npm view @siyahi/ui@<VER> version --prefer-online` every ~30 s
  for a few minutes before calling it failed.
- **The catalogue is never deployed by CI.** Forget the manual step and the
  site stays on the old build while npm has the new one.
- `gh pr merge --delete-branch` from a worktree can't delete the local branch
  (it's checked out there). Harmless.

## Rollback (untested, never done)

- npm versions can't be republished. Ship a fix PR (new `next.N`), or move the
  tags back: `npm dist-tag add @siyahi/ui@<good> latest` (and `next`, and the
  same for `@siyahi/tools`). Needs an npm login with publish rights on `@siyahi`.
- Consumers pin the previous exact version; every `next.N` stays on npm and as
  a `v*` GitHub release.
- Catalogue: use the repo's wrangler and the `.env` token, not the global
  `wrangler` (other version, OAuth login). `<version-id>` is the
  `Current Version ID` of the older deploy, or one from `deployments list`:

  ```bash
  cd ~/code/siyahi/apps/catalogue
  (set -a; . ../../.env; set +a; pnpm exec wrangler deployments list; pnpm exec wrangler rollback <version-id>)
  ```
