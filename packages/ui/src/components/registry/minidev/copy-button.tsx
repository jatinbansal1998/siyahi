// Registry: @minidev/copy-button
// Origin: https://ui.minidev.pro/r/copy-button.json
// Licence: MIT, Copyright (c) 2026 MiniDev, https://github.com/amankaushik481/minidev-ui/blob/main/LICENSE
// Copied: 2026-10-22, sha256 67f491ea6c947ebf3bf058423a373347badd49ad07861e022599ebdbb11cab44
// Siyahi edit: "Copied" stays for 2 s, as CodeBlockCopyButton's does, and the
// timer is cleared if the button goes away first, so no state is set after
// it unmounts.
// Siyahi edit: the check has no text-success (Siyahi has no such token and
// keeps colour for meaning), and both icons take data-icon="inline-start" so
// Button spaces them from the label.
"use client"
import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { cn } from "@siyahi/ui/lib/utils"
import { Button, buttonVariants } from "@siyahi/ui/components/ui/button"
import { type VariantProps } from "class-variance-authority"

function CopyButton({
  value,
  className,
  variant = "outline",
  size = "sm",
  label = "Copy",
  copiedLabel = "Copied",
  ...props
}: {
  value: string
  label?: string
  copiedLabel?: string
} & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      data-slot="copy-button"
      className={cn(className)}
      aria-label={copied ? copiedLabel : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
        } catch {
          /* ignore */
        }
      }}
      {...props}
    >
      {copied ? (
        <CheckIcon data-icon="inline-start" />
      ) : (
        <CopyIcon data-icon="inline-start" />
      )}
      {copied ? copiedLabel : label}
    </Button>
  )
}
export { CopyButton }
