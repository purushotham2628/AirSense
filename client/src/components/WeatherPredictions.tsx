import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Droplets, Wind, Thermometer, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface WeatherPrediction {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  precipitationChance: number;
}

interface WeatherTrend {
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherPredictionsProps {
  location: string;
}

export default function WeatherPredictions({ location }: WeatherPredictionsProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d'>('24h');
  const [predictions, setPredictions] = useState<WeatherPrediction[]>([]);
  const [trends, setTrends] = useState<WeatherTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWeatherData();
  }, [location, timeframe]);

  const fetchWeatherData = async () => {
    setIsLoading(true);
    try {
      const [predictionsRes, trendsRes] = await Promise.all([
        fetch(`/api/weather/predictions/${encodeURIComponent(location)}?timeframe=${timeframe}`),
        fetch(`/api/weather/trend?location=${encodeURIComponent(location)}&timeframe=${timeframe}`)
      ]);

      if (predictionsRes.ok) {
        const predictionsData = await predictionsRes.json();
        setPredictions(predictionsData);
      }

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData);
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Weather Predictions & Trends
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant={timeframe === '24h' ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe('24h')}
            >
              24h
            </Button>
            <Button
              variant={timeframe === '7d' ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe('7d')}
            >
              7d
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="predictions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictions}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--card-border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--chart-1))"
                    fill="url(#tempGradient)"
                    strokeWidth={2}
                    name="Temperature (°C)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {predictions.slice(0, 4).map((pred, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{pred.time}</div>
                  <div className="flex items-center justify-between">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="text-lg font-bold">{pred.temperature}°C</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{pred.condition}</div>
                  <div className="flex items-center gap-1 text-xs">
                    <Droplets className="h-3 w-3 text-blue-500" />
                    <span>{pred.precipitationChance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--card-border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Temp (°C)"
                    dot={{ r: 3 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="humidity"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Humidity (%)"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border rounded-lg p-3">
                <Thermometer className="h-5 w-5 mx-auto mb-2 text-red-500" />
                <div className="text-sm text-muted-foreground">Avg Temp</div>
                <div className="text-lg font-bold">
                  {trends.length > 0
                    ? Math.round(trends.reduce((sum, t) => sum + t.temperature, 0) / trends.length)
                    : 0}°C
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <Droplets className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <div className="text-sm text-muted-foreground">Avg Humidity</div>
                <div className="text-lg font-bold">
                  {trends.length > 0
                    ? Math.round(trends.reduce((sum, t) => sum + t.humidity, 0) / trends.length)
                    : 0}%
                </div>
              </div>
              <div className="border rounded-lg p-3">
                <Wind className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-sm text-muted-foreground">Avg Wind</div>
                <div className="text-lg font-bold">
                  {trends.length > 0
                    ? Math.round(trends.reduce((sum, t) => sum + t.windSpeed, 0) / trends.length)
                    : 0} km/h
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
