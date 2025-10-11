import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Brain,
  TrendingUp,
  Calendar,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

export default function MLPredictions() {
  const [location, setLocation] = useState("Bengaluru Central");
  const [timeframe, setTimeframe] = useState("24h");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hourlyPredictions, setHourlyPredictions] = useState<any[]>([]);
  const [weeklyForecast, setWeeklyForecast] = useState<any[]>([]);
  const [pollutantPredictions, setPollutantPredictions] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [weatherTrend, setWeatherTrend] = useState<any[]>([]);

  const fetchMLData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace these URLs with your actual API endpoints
      const [
        hourlyRes,
        weeklyRes,
        pollutantRes,
        performanceRes,
        weatherTrendRes,
      ] = await Promise.all([
        fetch(`/api/ml/hourly?location=${encodeURIComponent(location)}&timeframe=${timeframe}`),
        fetch(`/api/ml/weekly?location=${encodeURIComponent(location)}`),
        fetch(`/api/ml/pollutants?location=${encodeURIComponent(location)}`),
        fetch(`/api/ml/performance`),
        fetch(`/api/weather/trend?location=${encodeURIComponent(location)}&timeframe=${timeframe}`)
      ]);

      if (!hourlyRes.ok || !weeklyRes.ok || !pollutantRes.ok || !performanceRes.ok || !weatherTrendRes.ok) {
        throw new Error("Failed to fetch some ML data");
      }

      const hourlyData = await hourlyRes.json();
      const weeklyData = await weeklyRes.json();
      const pollutantData = await pollutantRes.json();
      const performanceData = await performanceRes.json();
      const weatherTrendData = await weatherTrendRes.json();

      setHourlyPredictions(hourlyData);
      setWeeklyForecast(weeklyData);
      setPollutantPredictions(pollutantData);
      setModelPerformance(performanceData);
      setWeatherTrend(weatherTrendData);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMLData();
    // eslint-disable-next-line
  }, [location, timeframe]);

  const handleRefresh = () => {
    fetchMLData();
  };

  if (isLoading) return <div>Loading ML predictions...</div>;

  if (error)
    return (
      <div>
        <p>Error loading ML predictions: {error}</p>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Predictions & Forecasting</h1>
          <p className="text-muted-foreground">AI-powered air quality predictions using machine learning</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bengaluru Central">Bengaluru Central</SelectItem>
              <SelectItem value="Whitefield">Whitefield</SelectItem>
              <SelectItem value="Electronic City">Electronic City</SelectItem>
              <SelectItem value="Koramangala">Koramangala</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hourly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Forecast</TabsTrigger>
          <TabsTrigger value="pollutants">Pollutant Predictions</TabsTrigger>
          <TabsTrigger value="model">Model Performance</TabsTrigger>
          <TabsTrigger value="weatherTrend">Weather Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                24-Hour AQI Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={hourlyPredictions}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="actual" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorActual)" name="Actual AQI" />
                  <Area type="monotone" dataKey="predicted" stroke="hsl(var(--chart-3))" fillOpacity={1} fill="url(#colorPredicted)" name="Predicted AQI" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Confidence Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyPredictions}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Bar dataKey="confidence" fill="hsl(var(--chart-2))" name="Confidence %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                7-Day AQI Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={weeklyForecast}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="min" fill="hsl(var(--chart-1))" name="Min AQI" />
                  <Bar dataKey="avg" fill="hsl(var(--chart-2))" name="Avg AQI" />
                  <Bar dataKey="max" fill="hsl(var(--chart-4))" name="Max AQI" />
                  <Bar dataKey="predicted" fill="hsl(var(--chart-3))" name="ML Prediction" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Weekly cards excerpt */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weeklyForecast.map((day, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-center">{day.day}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-1">
                  <div className="text-2xl font-bold">{day.predicted}</div>
                  <Badge variant="secondary" className="text-xs">
                    {day.min} - {day.max}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pollutants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Pollutant Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pollutantPredictions.map((pollutant, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-4 items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{pollutant.name}</p>
                      <p className="text-xs text-muted-foreground">{pollutant.unit}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="font-bold">{pollutant.current}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Predicted</p>
                      <p className="font-bold">{pollutant.predicted}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Change</p>
                      <Badge variant={pollutant.change > 0 ? 'destructive' : 'default'}>
                        {pollutant.change > 0 ? '+' : ''}{pollutant.change}%
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${pollutant.change > 10 ? 'bg-chart-4' : pollutant.change > 0 ? 'bg-chart-2' : 'bg-chart-1'}`}
                          style={{ width: `${Math.abs(pollutant.change) * 5}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Model Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Static or dynamic model info */}
                <p>Random Forest + LSTM, trained on 2+ years of data, 42 features.</p>
                <p>Last Updated: 2 hours ago, Version: v2.3.1</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {modelPerformance.map((metric, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{metric.metric}</span>
                      <span className="font-medium">{metric.value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${metric.status === 'excellent' ? 'bg-chart-1' : 'bg-chart-2'}`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Model Training & Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Detailed training metrics and validation results</p>
                <p className="text-sm">View model convergence, loss curves, and cross-validation scores</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weatherTrend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weather Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weatherTrend}>
                  <defs>
                    <linearGradient id="weatherTrendColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <Tooltip />
                  <Area type="monotone" dataKey="temperature" stroke="hsl(var(--chart-4))" fillOpacity={1} fill="url(#weatherTrendColor)" name="Temperature (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
