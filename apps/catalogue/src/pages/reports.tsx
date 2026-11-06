import { FileTextIcon } from "lucide-react";
import reportCss from "@siyahi/ui/report.css?raw";
import { Code } from "../code";
import type { Page } from "../page";
import reportRules from "../report-rules.json";

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
  icon: <FileTextIcon />,
  lead: "Static HTML reports skip React. They inline report.css, generated from the same theme, and follow five layout rules.",
  layout: "stack",
  families: [
    {
      id: "report-css",
      title: "report.css",
      lead: "The theme's variables for both schemes, a system font stack with Geist first, and base body styles.",
      rules: [
        "It makes no network requests.",
        "Copy it from @siyahi/ui/report.css into the report's style tag at write time, so each report is a dated, self-contained snapshot.",
      ],
      body: <Code className="max-h-96">{reportCss}</Code>,
    },
    {
      id: "report-rules",
      title: "The five report rules",
      lead: "The layout rules every static report follows.",
      body: (
        <ol className="flex max-w-prose list-decimal flex-col gap-2 pl-5">
          {reportRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      ),
    },
    {
      id: "report-sample",
      title: "A minimal report",
      lead: "The smallest page that follows the rules: report.css pasted in, figures in panels, gains and losses in their colours.",
      body: <Code>{SAMPLE}</Code>,
    },
  ],
};
