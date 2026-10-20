import { AppSidebar, SidebarProvider } from "@siyahi/ui";
import {
  BlocksIcon,
  ChartAreaIcon,
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
];

export default function AppSidebarExample() {
  return (
    // In an app, AppSidebar sits fixed at the edge; collapsible="none" draws it in place here.
    <SidebarProvider className="min-h-0">
      <AppSidebar collapsible="none" navMain={views} navLabel="Views" className="rounded-lg border" />
    </SidebarProvider>
  );
}
