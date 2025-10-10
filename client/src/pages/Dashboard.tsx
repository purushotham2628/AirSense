import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AQICard from "@/components/AQICard";
import WeatherCard from "@/components/WeatherCard";
import PollutantCard from "@/components/PollutantCard";
import AQIChart from "@/components/AQIChart";
import HealthAdvisory from "@/components/HealthAdvisory";
import NotificationPanel from "@/components/NotificationPanel";
import AIChatbot from "@/components/AIChatbot";
import GeoCityComparison from "@/components/GeoCityComparison";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, AlertTriangle, Bot, MapPin } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cityData, setCityData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const chatbotRef = useRef<{ sendMessage: (msg: string) => void } | null>(null);

  const fetchCityData = async () => {
    setError(null);
    setCityData(null);
    try {
      const cityListResponse = await fetch("http://localhost:5000/api/cities/supported");
      if (!cityListResponse.ok) {
        setError("API request failed: " + cityListResponse.status);
        return;
      }
      const cityListData = await cityListResponse.json();

      if (!cityListData.cities || !Array.isArray(cityListData.cities) || cityListData.cities.length === 0) {
        setError("API returned empty cities array.");
        return;
      }

      const city = cityListData.cities.find(
        (c: any) =>
          (c.name || "").toLowerCase() === "bengaluru" ||
          (c.name || "").toLowerCase() === "bangalore"
      );

      if (!city) {
        setError('Could not find "Bengaluru" or "Bangalore" in supported cities.');
        return;
      }

      // Fetch AQI data
      const aqiResponse = await fetch(`http://localhost:5000/api/aqi/${encodeURIComponent(city.name)}`);
      if (!aqiResponse.ok) {
        setError("Failed to fetch AQI data: " + aqiResponse.status);
        return;
      }
      const aqiData = await aqiResponse.json();

      // Fetch weather data separately from correct endpoint
      const weatherResponse = await fetch(`http://localhost:5000/api/weather/${encodeURIComponent(city.name)}`);
      if (!weatherResponse.ok) {
        setError("Failed to fetch weather data: " + weatherResponse.status);
        return;
      }
      const weatherData = await weatherResponse.json();

      setCityData({
        location: city.name,
        lat: city.lat,
        lon: city.lon,
        state: city.state,
        aqi: aqiData.currentAQI ?? 0,
        temperature: weatherData.temperature ?? 0,
        humidity: weatherData.humidity ?? 0,
        windSpeed: weatherData.windSpeed ?? 0,
        visibility: weatherData.visibility ?? 8,
        condition: weatherData.condition ?? "Unknown",
        pollutants: aqiData.pollutants ?? {},
      });
    } catch (e: any) {
      setError("Fetch failed: " + e.message);
    }
  };

  useEffect(() => {
    fetchCityData();
    // eslint-disable-next-line
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCityData();
    setIsRefreshing(false);
  };

  const handleExportData = () => setLocation("/export");

  const mockChartData = [
    { time: '00:00', aqi: 45, predicted: 48 },
    { time: '02:00', aqi: 52, predicted: 55 },
    { time: '04:00', aqi: 38, predicted: 42 },
    { time: '06:00', aqi: 65, predicted: 68 },
    { time: '08:00', aqi: 85, predicted: 82 },
    { time: '10:00', aqi: 78, predicted: 75 },
    { time: '12:00', aqi: 92, predicted: 95 },
    { time: '14:00', aqi: 105, predicted: 108 },
    { time: '16:00', aqi: 115, predicted: 112 },
    { time: '18:00', aqi: 98, predicted: 102 },
    { time: '20:00', aqi: 76, predicted: 78 },
    { time: '22:00', aqi: 58, predicted: 62 }
  ];

  const mockNotifications = [
    {
      id: '1',
      type: 'alert' as const,
      title: 'High AQI Alert',
      message: 'AQI levels in Whitefield have exceeded 150. Avoid outdoor activities.',
      timestamp: '5 minutes ago',
      read: false
    },
    {
      id: '2',
      type: 'warning' as const,
      title: 'Pollution Spike Detected',
      message: 'PM2.5 levels rising rapidly in Electronic City area.',
      timestamp: '15 minutes ago',
      read: false
    }
  ];

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium text-red-500">
        {error}
      </div>
    );
  }
  if (!cityData) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium">
        Loading live air quality data...
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and predictions for {cityData.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportData}
            data-testid="button-export-data"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-chart-4 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Air Quality Alert</p>
          <p className="text-xs text-muted-foreground">
            Current AQI levels are {cityData.aqi > 100 ? "unhealthy" : "moderate"}.{" "}
            {cityData.aqi > 100
              ? "Limit outdoor activities."
              : "Air quality is good today."}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AQICard
          aqi={cityData.aqi}
          location={cityData.location}
          lastUpdated="Just now"
          trend="stable"
        />
        <WeatherCard
          temperature={cityData.temperature}
          humidity={cityData.humidity}
          windSpeed={cityData.windSpeed}
          visibility={cityData.visibility ?? 8}
          location={cityData.location}
          condition={cityData.condition}
        />
        <HealthAdvisory aqi={cityData.aqi} location={cityData.location} />
      </div>

      {/* Pollutants Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pollutant Levels</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <PollutantCard name="PM2.5" value={cityData.pollutants.pm25 ?? 0} unit="μg/m³" safeLimit={25} trend="up" />
          <PollutantCard name="PM10" value={cityData.pollutants.pm10 ?? 0} unit="μg/m³" safeLimit={50} trend="down" />
          <PollutantCard name="CO" value={cityData.pollutants.co ?? 0} unit="mg/m³" safeLimit={2.0} trend="stable" />
          <PollutantCard name="O₃" value={cityData.pollutants.o3 ?? 0} unit="μg/m³" safeLimit={100} trend="up" />
          <PollutantCard name="NO₂" value={cityData.pollutants.no2 ?? 0} unit="μg/m³" safeLimit={40} trend="down" />
          <PollutantCard name="SO₂" value={cityData.pollutants.so2 ?? 0} unit="μg/m³" safeLimit={20} trend="stable" />
        </div>
      </div>

      {/* Charts and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AQIChart
            data={mockChartData}
            title="AQI Trends & Predictions"
            showPrediction={true}
          />
        </div>
        <div>
          <NotificationPanel notifications={mockNotifications} />
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <span className="text-sm text-muted-foreground">
            Ask questions or use voice commands
          </span>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AIChatbot
            ref={chatbotRef}
            sessionId={`dashboard-${new Date().getDate()}`}
            location={cityData.location}
            className="h-80"
          />
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-medium mb-3">Quick Commands</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3"
                  onClick={() => chatbotRef.current?.sendMessage("What's the current AQI?")}
                >
                  <span className="text-xs">"What's the current AQI?"</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3"
                  onClick={() => chatbotRef.current?.sendMessage("Is it safe to exercise outside?")}
                >
                  <span className="text-xs">"Is it safe to exercise outside?"</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3"
                  onClick={() => chatbotRef.current?.sendMessage("Will pollution be high tomorrow?")}
                >
                  <span className="text-xs">"Will pollution be high tomorrow?"</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto py-2 px-3"
                  onClick={() => chatbotRef.current?.sendMessage("Should I wear a mask today?")}
                >
                  <span className="text-xs">"Should I wear a mask today?"</span>
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Voice Assistant Features
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Speech recognition in supported browsers</li>
                <li>• Natural language understanding for air quality queries</li>
                <li>• Text-to-speech responses</li>
                <li>• Context-aware recommendations</li>
                <li>• Real-time AQI data integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Geo-Comparison Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Multi-City Comparison</h2>
          <span className="text-sm text-muted-foreground">
            Compare AQI across Indian cities
          </span>
        </div>
        <GeoCityComparison />
      </div>
    </div>
  );
}
