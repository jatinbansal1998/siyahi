import reportCss from "@siyahi/ui/report.css?raw";
import { Code } from "../code";
import { Lead } from "../example";
import type { Page } from "../page";

const RULES = [
  "Never paint html or body beyond the base styles report.css sets.",
  "Fluid width. No outer card and no banner title.",
  "A panel with its own background gets 16px padding and var(--radius).",
  "Charts get fixed pixel heights.",
  "Never use 100vh.",
];

const SAMPLE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>Week ending 17 October</title>
    <style>
      /* paste report.css here */
      .panel { background: var(--card); padding: 16px; border-radius: var(--radius); }
      .up { color: var(--positive); }
      .down { color: var(--negative); }
    </style>
  </head>
  <body>
    <h1>Week ending 17 October</h1>
    <p>Nifty 50 closed at 25,145, <span class="up">▲ 1.2%</span> on the week.</p>
    <div class="panel">…</div>
  </body>
</html>`;

export const reports: Page = {
  id: "reports",
  title: "Reports",
  lead: "Static HTML reports skip React. They inline report.css, generated from the same theme, and follow five layout rules.",
  sections: [
    {
      id: "report-css",
      title: "report.css",
      body: (
        <>
          <Lead>
            The theme's variables for both schemes, a system font stack with Geist first, and base body styles. It makes
            no network requests. Copy it from @siyahi/ui/report.css into the report's style tag at write time, so each
            report is a dated, self-contained snapshot.
          </Lead>
          <Code>{reportCss}</Code>
        </>
      ),
    },
    {
      id: "report-rules",
      title: "The five report rules",
      body: (
        <ol className="flex max-w-prose list-decimal flex-col gap-2 pl-5">
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      ),
    },
    {
      id: "report-sample",
      title: "A minimal report",
      body: <Code>{SAMPLE}</Code>,
    },
  ],
};
