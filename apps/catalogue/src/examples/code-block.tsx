import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@siyahi/ui";

const CHECK = "openssl s_client -connect example.com:443 -servername example.com -showcerts </dev/null";

const LOG = Array.from(
  { length: 24 },
  (_, i) =>
    `19:${String(33 + Math.floor(i / 4)).padStart(2, "0")}:${String((i * 15) % 60).padStart(2, "0")}  memory.pressure some avg10=${(12 + i * 3.1).toFixed(2)}`,
).join("\n");

export default function CodeBlockExample() {
  return (
    <div className="flex flex-col gap-4">
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>Show the chain a server sends</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={CHECK} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent wrap>{CHECK}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock size="sm">
        <CodeBlockActions>
          <CodeBlockCopyButton value={LOG} />
        </CodeBlockActions>
        <CodeBlockContent className="max-h-48">{LOG}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}
