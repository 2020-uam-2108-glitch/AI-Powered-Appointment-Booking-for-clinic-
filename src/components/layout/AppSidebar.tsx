import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Stethoscope,
  Settings,
  HelpCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Appointments", url: "/admin/appointments", icon: Calendar },
  { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
  { title: "Patients", url: "/admin/patients", icon: Users },
];

const staffItems = [
  { title: "Conversations", url: "/admin/conversations", icon: MessageSquare },
];

const settingsItems = [
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Help & FAQs", url: "/doctors", icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-accent text-accent-foreground font-medium">
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {renderGroup("Management", mainItems)}
        {renderGroup("Staff", staffItems)}
        {renderGroup("Other", settingsItems)}
      </SidebarContent>
    </Sidebar>
  );
}
