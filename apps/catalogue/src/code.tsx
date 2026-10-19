/** A static code sample, for snippets that are not live examples. */
export function Code({ children }: { children: string }) {
  return (
    <pre className="max-w-full min-w-0 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
      <code>{children.trim()}</code>
    </pre>
  );
}
