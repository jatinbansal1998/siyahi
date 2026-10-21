# Third-party notices

Siyahi is MIT licensed (see `LICENSE`). It contains code copied from the
projects below, each under the MIT licence. Every copied file starts with a
header naming its registry item, origin URL, licence and the SHA-256 of the
file as copied; `packages/ui/registry.lock.json` lists them all and
`pnpm generate:check` fails if a copied file is not named here.

## Copied into `@siyahi/ui`

| What                                                                                  | Where in the package                                     | Origin                                                                                                                                                                                                                                                                                                                                                              | Licence                                                                             |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| shadcn/ui core components (installed with `shadcn add`, never edited)                 | `src/components/ui/*`, `src/hooks/use-mobile.ts`         | https://github.com/shadcn-ui/ui                                                                                                                                                                                                                                                                                                                                     | MIT, Copyright (c) 2023 shadcn                                                      |
| shadcn `tailwind.css` (variants and utilities the components use)                     | `styles/shadcn.css`                                      | https://github.com/shadcn-ui/ui/tree/main/packages/shadcn                                                                                                                                                                                                                                                                                                           | MIT, Copyright (c) 2023 shadcn                                                      |
| shadcn block `sidebar-07`                                                             | `src/components/registry/sidebar-07/*`                   | https://ui.shadcn.com/r/styles/base-vega/sidebar-07.json                                                                                                                                                                                                                                                                                                            | MIT, Copyright (c) 2023 shadcn                                                      |
| shadcn block `dashboard-01`, `SectionCards` only                                      | `src/components/registry/dashboard-01/section-cards.tsx` | https://ui.shadcn.com/r/styles/base-vega/dashboard-01.json                                                                                                                                                                                                                                                                                                          | MIT, Copyright (c) 2023 shadcn                                                      |
| Heatmaps: calendar, weekday by hour, status timeline                                  | `src/components/registry/heatmap/*`                      | https://shadcn-heatmap.pages.dev/r/calendar-heatmap.json, https://shadcn-heatmap.pages.dev/r/weekday-heatmap.json, https://shadcn-heatmap.pages.dev/r/status-heatmap.json (source: https://github.com/rutopio/shadcn-heatmap)                                                                                                                                       | MIT, Copyright (c) 2026 ChingRu                                                     |
| niko-table data table on TanStack Table                                               | `src/components/registry/niko-table/*`                   | https://niko-table.com/r/data-table.json, https://niko-table.com/r/data-table-core.json, https://niko-table.com/r/data-table-ui.json, https://niko-table.com/r/data-table-faceted-filter.json, https://niko-table.com/r/data-table-column-sort.json, https://niko-table.com/r/data-table-search-filter.json (source: https://github.com/Semkoo/niko-table-registry) | MIT, Copyright (c) 2025 Semir N.; original work Copyright (c) 2025 WebDevSimplified |
| shadcn chart blocks `chart-bar-multiple`, `chart-area-stacked`, `chart-line-multiple` | `src/components/registry/charts/*`                       | https://ui.shadcn.com/r/styles/new-york-v4/chart-bar-multiple.json, https://ui.shadcn.com/r/styles/new-york-v4/chart-area-stacked.json, https://ui.shadcn.com/r/styles/new-york-v4/chart-line-multiple.json                                                                                                                                                         | MIT, Copyright (c) 2023 shadcn                                                      |
| dashboardcn ranked list (`BarList`) and stacked bar (`DistributionBar`)               | `src/components/registry/dashboardcn/*`                  | https://dashboardcn.com/r/bar-list.json, https://dashboardcn.com/r/distribution-bar.json (source: https://github.com/NoahGdev/dashboardcn)                                                                                                                                                                                                                          | MIT, Copyright (c) 2026 dashboardcn contributors                                    |

## Runtime dependencies with attribution terms

| Package                                                         | Licence                                            | Note                                                                                                                                      |
| --------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `lightweight-charts` (TradingView)                              | Apache-2.0                                         | `PriceChart` keeps the library's attribution logo on by default; see https://github.com/tradingview/lightweight-charts/blob/master/NOTICE |
| `@fontsource-variable/geist`, `@fontsource-variable/geist-mono` | SIL Open Font License 1.1 (fonts), MIT (packaging) | Geist by Vercel                                                                                                                           |

Every other dependency is installed from npm under its own licence and is not
copied into this repository.

## The MIT licence text

Each MIT notice above carries this permission text:

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
