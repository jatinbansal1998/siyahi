import { CodeBlock, CodeBlockActions, CodeBlockContent, CodeBlockCopyButton, CodeBlockHeader } from "@siyahi/ui";

/** A static code sample with its copy button in a header row, for snippets that are not live examples. */
export function Code({ children, className }: { children: string; className?: string }) {
  const code = children.trim();
  return (
    <CodeBlock size="sm">
      <CodeBlockHeader>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent className={className}>{code}</CodeBlockContent>
    </CodeBlock>
  );
}
