import { useState } from "react";
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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

const hourlyPredictions = [
  { time: '00:00', actual: 125, predicted: 128, confidence: 92 },
  { time: '03:00', actual: 118, predicted: 115, confidence: 90 },
  { time: '06:00', actual: 132, predicted: 135, confidence: 88 },
  { time: '09:00', actual: 145, predicted: 148, confidence: 85 },
  { time: '12:00', actual: 158, predicted: 155, confidence: 87 },
  { time: '15:00', actual: 162, predicted: 165, confidence: 84 },
  { time: '18:00', actual: 155, predicted: 152, confidence: 86 },
  { time: '21:00', actual: 138, predicted: 142, confidence: 89 },
];

const weeklyForecast = [
  { day: 'Mon', min: 110, max: 165, avg: 138, predicted: 142 },
  { day: 'Tue', min: 115, max: 170, avg: 145, predicted: 148 },
  { day: 'Wed', min: 105, max: 155, avg: 132, predicted: 135 },
  { day: 'Thu', min: 98, max: 145, avg: 125, predicted: 128 },
  { day: 'Fri', min: 108, max: 158, avg: 135, predicted: 138 },
  { day: 'Sat', min: 95, max: 140, avg: 118, predicted: 122 },
  { day: 'Sun', min: 92, max: 138, avg: 115, predicted: 118 },
];

const pollutantPredictions = [
  { name: 'PM2.5', current: 35.2, predicted: 38.5, change: 9.4, unit: 'μg/m³' },
  { name: 'PM10', current: 68.5, predicted: 72.1, change: 5.3, unit: 'μg/m³' },
  { name: 'CO', current: 1.2, predicted: 1.4, change: 16.7, unit: 'mg/m³' },
  { name: 'O₃', current: 85.3, predicted: 78.2, change: -8.3, unit: 'μg/m³' },
  { name: 'NO₂', current: 42.1, predicted: 45.8, change: 8.8, unit: 'μg/m³' },
  { name: 'SO₂', current: 15.6, predicted: 16.2, change: 3.8, unit: 'μg/m³' },
];

const modelPerformance = [
  { metric: 'Accuracy', value: 87.5, status: 'good' },
  { metric: 'Precision', value: 85.2, status: 'good' },
  { metric: 'Recall', value: 89.1, status: 'excellent' },
  { metric: 'F1 Score', value: 87.1, status: 'good' },
  { metric: 'RMSE', value: 12.3, status: 'good' },
  { metric: 'MAE', value: 8.7, status: 'excellent' },
];

export default function MLPredictions() {
  const [location, setLocation] = useState("Bengaluru Central");
  const [timeframe, setTimeframe] = useState("24h");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

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
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current AQI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div>
            <p className="text-xs text-muted-foreground">Moderate quality</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted AQI</CardTitle>
            <Brain className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-chart-4">+13.6% in 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <CheckCircle className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">High accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Medium</div>
            <p className="text-xs text-muted-foreground">Sensitive groups</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hourly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Forecast</TabsTrigger>
          <TabsTrigger value="pollutants">Pollutant Predictions</TabsTrigger>
          <TabsTrigger value="model">Model Performance</TabsTrigger>
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
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#colorActual)"
                    name="Actual AQI"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--chart-3))"
                    fillOpacity={1}
                    fill="url(#colorPredicted)"
                    name="Predicted AQI"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Model Type</span>
                  <span className="text-sm font-medium">Random Forest + LSTM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Training Data</span>
                  <span className="text-sm font-medium">2+ years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Features</span>
                  <span className="text-sm font-medium">42 parameters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="text-sm font-medium">v2.3.1</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modelPerformance.map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{metric.metric}</span>
                        <span className="font-medium">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.status === 'excellent' ? 'bg-chart-1' : 'bg-chart-2'
                          }`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
      </Tabs>
    </div>
  );
}
