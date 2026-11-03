# Static HTML reports

Last verified: 2026-11-03

Read the chosen package's `report.css` (normally
`node_modules/@siyahi/ui/report.css`). Paste the whole file at the start of
the report's `<style>` at write time; never link or trim it. Each report keeps
its own self-contained snapshot. No stylesheet copy is stored in this skill.

- One `<h1>`; `siyahi-shots` waits for it. Add a meaningful `<title>` and
  `<meta name="color-scheme" content="light dark">`.
- Read the package's `agents/report-rules.json` for layout rules. It is
  generated from the same source as the catalogue's Reports page. If an older
  package lacks that file, read the [public report rules source](https://github.com/jatinbansal1998/siyahi/blob/main/apps/catalogue/src/report-rules.json).
- Format with `Intl.NumberFormat("en-IN")`, write times in IST with the zone,
  and put ▲ or ▼ beside coloured changes. Use only theme variables such as
  `var(--positive)` and `var(--chart-1)`.
- Load nothing from the network: no font links or scripts from a content
  delivery network. The report must work as a local file.

From the app root, run
`npx --no-install siyahi-shots file:///absolute/path/index.html --report --out /tmp/report-shots`
using the installed `@siyahi/tools` binary. Read its README for flags, then
open every image it writes. Test report interactions separately.
