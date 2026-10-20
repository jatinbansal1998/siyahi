import { AppSidebar, SidebarProvider } from "@siyahi/ui";
import {
  BlocksIcon,
  ChartAreaIcon,
  CodeIcon,
  FileTextIcon,
  HouseIcon,
  LayersIcon,
  PaletteIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

// No `items` on a view, so each one is a plain link.
const views = [
  { title: "Overview", url: "#/overview", icon: <HouseIcon /> },
  { title: "Foundations", url: "#/foundations", icon: <PaletteIcon /> },
  { title: "Components", url: "#/components", icon: <LayersIcon /> },
  { title: "Inputs and overlays", url: "#/inputs", icon: <SlidersHorizontalIcon /> },
  { title: "Data", url: "#/data", icon: <ChartAreaIcon /> },
  { title: "Blocks", url: "#/blocks", icon: <BlocksIcon />, isActive: true },
  { title: "Reports", url: "#/reports", icon: <FileTextIcon /> },
  // linkProps go onto the anchor: here a new tab, in an app often onMouseEnter to prefetch the view's data.
  {
    title: "Source",
    url: "https://github.com/jatinbansal1998/siyahi",
    icon: <CodeIcon />,
    linkProps: { target: "_blank", rel: "noreferrer" },
  },
];

export default function AppSidebarExample() {
  return (
    // In an app, AppSidebar sits fixed at the edge; collapsible="none" draws it in place here.
    <SidebarProvider className="min-h-0">
      <AppSidebar collapsible="none" navMain={views} navLabel="Views" className="rounded-lg border" />
    </SidebarProvider>
  );
}
