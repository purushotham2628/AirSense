import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";

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
  const [liveAQI, setLiveAQI] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Loading");
  const [updateTime, setUpdateTime] = useState<string>("now");

  useEffect(() => {
    const fetchLiveAQI = async () => {
      try {
        const response = await fetch("/api/aqi/Bengaluru");
        if (response.ok) {
          const data = await response.json();
          setLiveAQI(data.currentAQI);
          
          // Determine status based on AQI
          const aqi = data.currentAQI;
          if (aqi <= 50) setStatus("Good");
          else if (aqi <= 100) setStatus("Moderate");
          else if (aqi <= 150) setStatus("Unhealthy for Sensitive");
          else if (aqi <= 200) setStatus("Unhealthy");
          else if (aqi <= 300) setStatus("Very Unhealthy");
          else setStatus("Hazardous");
          
          setUpdateTime("just now");
        }
      } catch (error) {
        console.error("Failed to fetch live AQI:", error);
        setStatus("Unavailable");
      }
    };

    fetchLiveAQI();
    const interval = setInterval(fetchLiveAQI, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
              <motion.div 
                className="flex justify-between text-sm"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-muted-foreground">Live AQI</span>
                <span className="font-mono font-medium">
                  {liveAQI !== null ? liveAQI : "Loading..."}
                </span>
              </motion.div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Badge 
                    className={
                      status.includes("Good") ? "bg-green-500" :
                      status.includes("Moderate") ? "bg-yellow-500" :
                      status.includes("Unhealthy for Sensitive") ? "bg-orange-500" :
                      status.includes("Unhealthy") && !status.includes("Sensitive") ? "bg-red-500" :
                      status.includes("Very") ? "bg-purple-600" :
                      "bg-chart-2"
                    }
                  >
                    {status}
                  </Badge>
                </motion.div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-xs text-muted-foreground">{updateTime}</span>
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