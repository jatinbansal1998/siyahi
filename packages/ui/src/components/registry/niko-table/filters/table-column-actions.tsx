// Registry: @niko-table/data-table
// Origin: https://niko-table.com/r/data-table.json
// Licence: MIT, Copyright (c) 2025 Semir N., original work (c) 2025 WebDevSimplified, https://github.com/Semkoo/niko-table-registry/blob/main/LICENSE
// Copied: 2026-10-20, sha256 0a567472d24e9f0391fa689a528fb2392870a521f29065c6f758837182b92a63
// Siyahi edit: the trigger is passed as Base UI's render prop, so the
// default Button is not nested inside the trigger's own button.
// Siyahi edit: the label and the actions sit in a DropdownMenuGroup. Base UI's
// Menu.GroupLabel throws outside a Menu.Group, which crashed the menu on open.
import React from "react"
import { MoreVertical } from "lucide-react"

import { Button } from "@siyahi/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@siyahi/ui/components/ui/dropdown-menu"
import { cn } from "@siyahi/ui/lib/utils"

export interface TableColumnActionsProps {
  children: React.ReactNode
  className?: string
  /**
   * Optional label shown at the top of the dropdown.
   * @default "Column Actions"
   */
  label?: string
  /**
   * Whether to show a visual indicator when actions are active.
   */
  isActive?: boolean
  /**
   * Custom trigger element. If not provided, uses a MoreVertical icon button.
   */
  trigger?: React.ReactElement
  /**
   * Alignment of the dropdown content.
   * @default "end"
   */
  align?: "start" | "center" | "end"
}

/**
 * A simple dropdown container for composing column actions.
 *
 * Use with `*Options` components to compose actions in a single dropdown:
 *
 * @example
 * ```tsx
 * <TableColumnActions>
 *   <TableColumnSortOptions />
 *   <TableColumnPinOptions />
 *   <TableColumnHideOptions />
 * </TableColumnActions>
 * ```
 *
 * For standalone dropdowns, use the `*Menu` variants instead:
 * ```tsx
 * <TableColumnSortMenu />
 * <TableColumnPin />
 * ```
 */
export function TableColumnActions({
  children,
  className,
  label = "Column Actions",
  isActive = false,
  trigger,
  align = "end",
}: TableColumnActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-7 transition-opacity group-hover:opacity-100 dark:text-muted-foreground",
              isActive ? "text-primary opacity-100" : "opacity-0",
              className,
            )}
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        )}
      />
      <DropdownMenuContent align={align} className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            {label}
          </DropdownMenuLabel>
          {children}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableColumnActions.displayName = "TableColumnActions"
