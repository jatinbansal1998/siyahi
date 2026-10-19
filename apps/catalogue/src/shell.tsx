import {
  AppSidebar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  Separator,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  type AppSidebarProps,
} from "@siyahi/ui";
import type { ReactNode } from "react";

function Brand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<a href="#/" />}>
          <img src="/icon.svg" alt="" className="size-8 rounded-md bg-sidebar-accent p-1.5" />
          <span className="flex flex-col leading-tight">
            <span className="font-semibold">Siyahi</span>
            <span className="text-xs text-muted-foreground">@siyahi/ui catalogue</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export interface ShellProps {
  nav: AppSidebarProps["navMain"];
  title: string;
  children: ReactNode;
}

/** The sidebar-07 block as an app shell: sidebar, a sticky header with the page's place, then the page. */
export function Shell({ nav, title, children }: ShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar header={<Brand />} navMain={nav} navLabel="Catalogue" />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex w-full max-w-screen-2xl min-w-0 flex-col gap-12 px-4 py-8 md:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
