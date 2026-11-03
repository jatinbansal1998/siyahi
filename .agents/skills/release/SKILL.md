---
name: release
description: >
  Release Siyahi: prepare the version bump in a PR, merge it, start and verify the
  manual npm/GitHub publish of @siyahi/ui and @siyahi/tools, redeploy the
  catalogue at siyahi.jatinbansal.com by hand, and hand off to the consumers.
  Use when the user says "merged", "deploy", "release", "ship", "publish", or
  asks for a new Siyahi version.
---

# Release

## What ships where

| Unit                                               | Where                                                                                                                    | How                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `@siyahi/ui`, `@siyahi/tools` (one shared version) | npmjs.org, dist-tags `next` and, before 1.0.0, `latest`                                                                  | `publish.yml`, manual               |
| Both tarballs                                      | GitHub release `v<version>` (pre-release) and the rolling `next` release (`siyahi-ui-next.tgz`, `siyahi-tools-next.tgz`) | `publish.yml`, manual               |
| Catalogue (`apps/catalogue`)                       | Cloudflare Worker `siyahi-catalogue`, https://siyahi.jatinbansal.com                                                     | `pnpm deploy:catalogue`, **manual** |

## Trigger

- Merging or pushing to `main` runs CI but publishes nothing. Merge all PRs in
  the intended batch before releasing; a merge alone is not a release request.
- On an explicit release request, dispatch `.github/workflows/publish.yml` on
  `main` once for the completed batch. The workflow rejects other branches and
  runs the full checks before publishing both packages.
- The workflow versions both packages `<base>-next.<N>` using
  `.github/scripts/next-version.mjs`: N is one past the highest `next.N` on npm
  or among `v*` tags. The version is not committed back; the repo keeps its base.
- Skip publication when the batch contains only tests, workflow, docs or skills
  and ships no package or catalogue behavior change. Do not create an empty
  release just because a PR merged.
- **1.0.0 / stable:** no procedure exists and none has been done. Don't invent
  one; ask. The first stable release also deletes the "Point latest at this
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

## Release the merged batch

The user's release request authorizes the dispatch. First confirm every intended
PR is merged and CI is green on the current `main` commit. Merge PRs following
the normal review rules; keep branches and worktrees until the user requests
cleanup. Update the clean main checkout with `git pull --ff-only`.

```bash
cd ~/code/siyahi
R=jatinbansal1998/siyahi
sha=$(git rev-parse HEAD)
gh workflow run publish.yml --repo "$R" --ref main
gh run list --repo "$R" --workflow publish.yml --event workflow_dispatch --commit "$sha" --json databaseId,headSha,status,conclusion,url
```

Identify the dispatch for this exact commit and request, not an older run or
another batch. Record its run ID and URL. Use the host's completion events when
available; do not dispatch again while the release is running. If `main` moved
between the local pull and dispatch, inspect the run's actual `headSha` and
confirm it contains the intended batch before reporting what shipped.

- Run red: stop and report. Do not deploy the catalogue; `deploy:catalogue`
  builds but does not run tests.
- After success, inspect that run's logs and GitHub release to obtain the exact
  published version (`VER`). A GitHub release alone does not prove npm succeeded.
- Check both npm packages and release assets below before deploying. Do not use
  a version inferred from the base or an earlier release.

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
3. The public skill at `skills/siyahi/SKILL.md` pins no package version; its
   instructions read the consumer's installed manifest, examples and
   `report.css`. There is no stylesheet copy to refresh. Reinstall the skill
   from `jatinbansal1998/siyahi` only when the skill itself changes.

## Gotchas

- **npm auth is trusted publishing (OIDC), not a token.** npmjs.com trusts
  `publish.yml` in `jatinbansal1998/siyahi` for both packages, with "Allow npm
  publish" and "Allow npm dist-tag" on. Renaming the workflow, adding a GitHub
  environment, or dropping `id-token: write` breaks the publish. `npm whoami`
  does not work under OIDC and proves nothing about it.
- **A red Publish run after the GitHub release step means npm failed.** The
  `v<VER>` release already holds the tarballs, so a rerun ships as `next.<N+1>`
  and `<VER>` never reaches npm. Bump consumers to the version npm has.
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
