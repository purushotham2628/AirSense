import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Wind, BarChart3, Heart, Bell, Settings, Download, Map, Wifi, Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Air Quality",
    url: "/air-quality",
    icon: Wind,
  },
  {
    title: "ML Predictions",
    url: "/ml-predictions",
    icon: Brain,
  },
  {
    title: "Health Advisory",
    url: "/health",
    icon: Heart,
  },
  {
    title: "Map View",
    url: "/map",
    icon: Map,
  },
  {
    title: "IoT Devices",
    url: "/iot-devices",
    icon: Wifi,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    badge: "2"
  },
  {
    title: "Export Data",
    url: "/export",
    icon: Download,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Wind className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-semibold text-lg">AirWatch</h2>
            <p className="text-xs text-muted-foreground">Bengaluru Monitor</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Current Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Live AQI</span>
                <span className="font-mono font-medium">125</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-chart-2 text-white text-xs">Moderate</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-xs text-muted-foreground">2m ago</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground text-center">
          <p>Powered by OpenWeather API</p>
          <p>Last sync: {new Date().toLocaleTimeString()}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}