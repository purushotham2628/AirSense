import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import AirQuality from "@/pages/AirQuality";
import HealthAdvisory from "@/pages/HealthAdvisory";
import Notifications from "@/pages/Notifications";
import ExportData from "@/pages/ExportData";
import Settings from "@/pages/Settings";
import MapView from "@/pages/MapView";
import IoTDevices from "@/pages/IoTDevices";
import MLPredictions from "@/pages/MLPredictions";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/air-quality" component={AirQuality} />
      <Route path="/health" component={HealthAdvisory} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/map" component={MapView} />
      <Route path="/iot-devices" component={IoTDevices} />
      <Route path="/ml-predictions" component={MLPredictions} />
      <Route path="/export" component={ExportData} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Custom sidebar width for air quality monitoring dashboard
  const style = {
    "--sidebar-width": "20rem",       // 320px for better content
    "--sidebar-width-icon": "4rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="h-6 w-px bg-border mx-2" />
                  <h1 className="font-semibold text-sm">Bengaluru Air Quality Monitor</h1>
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto p-6">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
