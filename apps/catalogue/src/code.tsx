import { CodeBlock, CodeBlockActions, CodeBlockContent, CodeBlockCopyButton } from "@siyahi/ui";

/** A static code sample with a copy button, for snippets that are not live examples. */
export function Code({ children, className }: { children: string; className?: string }) {
  const code = children.trim();
  return (
    <CodeBlock size="sm">
      <CodeBlockActions>
        <CodeBlockCopyButton value={code} />
      </CodeBlockActions>
      <CodeBlockContent className={className}>{code}</CodeBlockContent>
    </CodeBlock>
  );
}
