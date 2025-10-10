import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Wind, Thermometer, Droplets } from "lucide-react";
import PollutantCard from "@/components/PollutantCard";
import AQIChart from "@/components/AQIChart";
import { cn } from "@/lib/utils";

interface AQIData {
  currentAQI: number;
  location: string;
  pollutants: {
    pm25: number;
    pm10: number;
    co: number;
    o3: number;
    no2: number;
    so2: number;
  };
  timestamp: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility?: number;
  condition?: string;
}

export default function AirQuality() {
  const [aqiData, setAqiData] = useState<AQIData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const aqiResponse = await fetch('/api/aqi/bengaluru');
      if (!aqiResponse.ok) throw new Error('Failed to fetch AQI data');
      const aqiJson = await aqiResponse.json();

      const weatherResponse = await fetch('/api/weather/bengaluru');
      if (!weatherResponse.ok) throw new Error('Failed to fetch Weather data');
      const weatherJson = await weatherResponse.json();

      setAqiData(aqiJson);
      setWeatherData(weatherJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAqiData(null);
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "bg-chart-1 text-white" };
    if (aqi <= 100) return { label: "Moderate", color: "bg-chart-2 text-white" };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "bg-chart-3 text-white" };
    if (aqi <= 200) return { label: "Unhealthy", color: "bg-chart-4 text-white" };
    if (aqi <= 300) return { label: "Very Unhealthy", color: "bg-chart-5 text-white" };
    return { label: "Hazardous", color: "bg-chart-5 text-white" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Air Quality Details</h1>
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        {/* Loading skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Air Quality Details</h1>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error: {error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please check your internet connection and API configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!aqiData || !weatherData) return null;

  const category = getAQICategory(aqiData.currentAQI);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Air Quality Details</h1>
          <p className="text-muted-foreground">Comprehensive pollution monitoring for {aqiData.location}</p>
        </div>
        <Button onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Current AQI Overview */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Air Quality Index</span>
            <Badge className={category.color}>{category.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl font-bold font-mono">{aqiData.currentAQI}</div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{aqiData.location}</p>
              <p>Updated: {new Date(aqiData.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
          <Progress value={Math.min((aqiData.currentAQI / 300) * 100, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0 (Good)</span>
            <span>300+ (Hazardous)</span>
          </div>
        </CardContent>
      </Card>

      {/* Weather Conditions */}
      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wind className="h-5 w-5" />
            Weather Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <div>
                <div className="font-medium">{weatherData.temperature}°C</div>
                <div className="text-xs text-muted-foreground">Temperature</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-medium">{weatherData.humidity}%</div>
                <div className="text-xs text-muted-foreground">Humidity</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-green-500" />
              <div>
                <div className="font-medium">{weatherData.windSpeed} km/h</div>
                <div className="text-xs text-muted-foreground">Wind Speed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pollutant Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Individual Pollutants</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <PollutantCard
            name="PM2.5"
            value={aqiData.pollutants.pm25}
            unit="μg/m³"
            safeLimit={25}
            trend="stable"
          />
          <PollutantCard
            name="PM10"
            value={aqiData.pollutants.pm10}
            unit="μg/m³"
            safeLimit={50}
            trend="stable"
          />
          <PollutantCard
            name="CO"
            value={aqiData.pollutants.co}
            unit="mg/m³"
            safeLimit={2.0}
            trend="stable"
          />
          <PollutantCard
            name="O₃"
            value={aqiData.pollutants.o3}
            unit="μg/m³"
            safeLimit={100}
            trend="stable"
          />
          <PollutantCard
            name="NO₂"
            value={aqiData.pollutants.no2}
            unit="μg/m³"
            safeLimit={40}
            trend="stable"
          />
          <PollutantCard
            name="SO₂"
            value={aqiData.pollutants.so2}
            unit="μg/m³"
            safeLimit={20}
            trend="stable"
          />
        </div>
      </div>
    </div>
  );
}
