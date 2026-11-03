import { CopyButton } from "@siyahi/ui";

// Every command on a setup page, for a reader who wants them all at once.
const ALL = ["brew install node@24", "corepack enable", "pnpm install"].join("\n");

export default function CopyButtonExample() {
  return <CopyButton value={ALL} label="Copy all" />;
}
