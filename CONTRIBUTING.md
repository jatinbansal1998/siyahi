# Contributing

## Install before you write

For any UI need, take the first of these that works:

1. A shadcn/ui component: `pnpm --filter @siyahi/ui exec shadcn add <name>`.
2. An item from a shadcn-format registry in the
   [directory](https://ui.shadcn.com/r/registries.json).
3. A composition of those with props, shown in the catalogue.
4. Our own component in `packages/ui/src/components/siyahi`, kept under about
   60 lines. Say in the pull request why nothing above would do.

## Never edit shadcn core

Files in `packages/ui/src/components/ui` and `src/hooks/use-mobile.ts` are
exactly what `shadcn add` wrote. They are not formatted or linted, so
`shadcn add --overwrite <name>` can refresh them at any time. To change how a
component looks, change the theme; to change what it does, compose it.

## Registry add-ons

An add-on from a third-party registry is copied once and then ours to edit.
Before copying, read the code and confirm a licence that allows it (MIT or
similar). No clear licence, no copy. Then:

1. Install it with the shadcn CLI into a scratch project whose `components.json`
   aliases match `packages/ui/components.json`, and move the files under
   `packages/ui/src/components/registry/<source>/`.
2. Start each file with this header, where the hash is the SHA-256 of the file
   as the CLI wrote it (`sha256sum file`):

   ```
   // Registry: @<registry>/<item>
   // Origin: <item JSON URL>
   // Licence: <licence>, Copyright (c) <holder>, <licence URL>
   // Copied: <YYYY-MM-DD>, sha256 <hash>
   ```

3. Mark every edit with a `// Siyahi edit:` line saying what changed and why.
4. Add the origin to `THIRD_PARTY_NOTICES.md` and run `pnpm generate`, which
   rewrites `registry.lock.json` and the `@siyahi/ui` barrel.

## Colours and sizes

`packages/ui/styles/siyahi.css` is the only file that holds a colour value.
Every pair the theme promises is checked by `packages/tools/contrast.mjs` in
the build: 4.5:1 for text on the canvas, the card and its own fill, 3:1 for
chart colours against the card and against the next chart colour. When a
check fails, change the value, never the bar.

## Before a pull request

```sh
pnpm check
pnpm --filter @siyahi/catalogue build && pnpm --filter @siyahi/catalogue preview
pnpm shots http://localhost:4173/#/data   # in another shell
```

`pnpm check` formats, lints, looks for unused code, fails on stale generated
files, builds (with the contrast check), typechecks and tests. Put the shots
for every page you changed in the pull request, light and dark, 1920 and 390.
