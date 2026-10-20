// Registry: @shadcn/sidebar-07
// Origin: https://ui.shadcn.com/r/styles/base-vega/sidebar-07.json
// Licence: MIT, Copyright (c) 2023 shadcn, https://github.com/shadcn-ui/ui/blob/main/LICENSE.md
// Copied: 2026-10-20, sha256 926e6f27dc8b1f0d87c3576f113877333e7c58a89f72760fba02b2a001de0584
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@siyahi/ui/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@siyahi/ui/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

// Siyahi edit: the group label is a prop instead of the sample "Platform".
export function NavMain({
  items,
  label = "Navigation",
}: {
  label?: string | undefined
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  // Siyahi edit: an item without sub-items is a plain link, so a nav of flat
  // views navigates; upstream made every item a collapsible group.
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => !item.items?.length ? (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.isActive}
              tooltip={item.title}
              render={<a href={item.url} />}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              render={<SidebarMenuButton tooltip={item.title} />}
            >
              {item.icon}
              <span>{item.title}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton render={<a href={subItem.url} />}>
                      <span>{subItem.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
