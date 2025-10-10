import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Layers, ZoomIn, ZoomOut, RefreshCw, Map as MapIcon } from "lucide-react";

const locations = [
  { id: 1, name: 'Bengaluru Central', lat: 12.9716, lng: 77.5946, aqi: 125, status: 'moderate' },
  { id: 2, name: 'Whitefield', lat: 12.9698, lng: 77.7500, aqi: 168, status: 'unhealthy' },
  { id: 3, name: 'Electronic City', lat: 12.8456, lng: 77.6603, aqi: 95, status: 'moderate' },
  { id: 4, name: 'Koramangala', lat: 12.9352, lng: 77.6245, aqi: 142, status: 'unhealthy-sensitive' },
  { id: 5, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, aqi: 88, status: 'moderate' },
  { id: 6, name: 'Jayanagar', lat: 12.9250, lng: 77.5838, aqi: 110, status: 'moderate' },
  { id: 7, name: 'Marathahalli', lat: 12.9591, lng: 77.7010, aqi: 155, status: 'unhealthy' },
  { id: 8, name: 'HSR Layout', lat: 12.9116, lng: 77.6473, aqi: 78, status: 'moderate' },
];

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return 'bg-chart-1';
  if (aqi <= 100) return 'bg-chart-2';
  if (aqi <= 150) return 'bg-chart-3';
  if (aqi <= 200) return 'bg-chart-4';
  if (aqi <= 300) return 'bg-chart-5';
  return 'bg-red-600';
};

const getAQICategory = (aqi: number) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

export default function MapView() {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [mapLayer, setMapLayer] = useState('aqi');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const selectedData = locations.find(loc => loc.id === selectedLocation);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Map View</h1>
          <p className="text-muted-foreground">Real-time air quality monitoring across Bengaluru</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={mapLayer} onValueChange={setMapLayer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aqi">AQI Heatmap</SelectItem>
              <SelectItem value="pm25">PM2.5 Levels</SelectItem>
              <SelectItem value="pm10">PM10 Levels</SelectItem>
              <SelectItem value="wind">Wind Patterns</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  Bengaluru Air Quality Map
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative w-full h-[500px] bg-muted/30 rounded-b-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 800 600" className="w-full h-full">
                    <rect width="800" height="600" fill="hsl(var(--muted))" opacity="0.3" />

                    <text x="400" y="50" textAnchor="middle" className="fill-muted-foreground text-xs">
                      Bengaluru Metropolitan Area
                    </text>

                    {locations.map((location) => {
                      const x = 200 + (location.lng - 77.5) * 800;
                      const y = 450 - (location.lat - 12.8) * 2400;
                      const isSelected = selectedLocation === location.id;

                      return (
                        <g
                          key={location.id}
                          transform={`translate(${x}, ${y})`}
                          onClick={() => setSelectedLocation(location.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle
                            r={isSelected ? "35" : "25"}
                            className={`${getAQIColor(location.aqi)} transition-all`}
                            opacity="0.6"
                          />
                          <circle
                            r={isSelected ? "20" : "15"}
                            className={getAQIColor(location.aqi)}
                          />
                          <text
                            y="5"
                            textAnchor="middle"
                            className="fill-white font-bold text-sm"
                          >
                            {location.aqi}
                          </text>
                          {isSelected && (
                            <text
                              y="45"
                              textAnchor="middle"
                              className="fill-foreground font-medium text-xs"
                            >
                              {location.name}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    <g transform="translate(650, 500)">
                      <text className="fill-muted-foreground text-xs font-semibold" y="-10">AQI Legend</text>
                      {[
                        { color: 'bg-chart-1', label: '0-50', fill: 'hsl(var(--chart-1))' },
                        { color: 'bg-chart-2', label: '51-100', fill: 'hsl(var(--chart-2))' },
                        { color: 'bg-chart-3', label: '101-150', fill: 'hsl(var(--chart-3))' },
                        { color: 'bg-chart-4', label: '151-200', fill: 'hsl(var(--chart-4))' },
                        { color: 'bg-chart-5', label: '201-300', fill: 'hsl(var(--chart-5))' },
                      ].map((item, i) => (
                        <g key={i} transform={`translate(0, ${i * 20})`}>
                          <circle r="6" fill={item.fill} />
                          <text x="15" y="4" className="fill-muted-foreground text-xs">{item.label}</text>
                        </g>
                      ))}
                    </g>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {selectedData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current AQI</span>
                    <span className="text-2xl font-bold">{selectedData.aqi}</span>
                  </div>
                  <Badge className={getAQIColor(selectedData.aqi)}>
                    {getAQICategory(selectedData.aqi)}
                  </Badge>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium text-sm">Location Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Latitude</p>
                      <p className="font-mono">{selectedData.lat.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Longitude</p>
                      <p className="font-mono">{selectedData.lng.toFixed(4)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {selectedData.aqi > 150 ? (
                      <>
                        <li>• Avoid outdoor activities</li>
                        <li>• Wear N95 mask if going out</li>
                        <li>• Keep windows closed</li>
                        <li>• Use air purifiers indoors</li>
                      </>
                    ) : selectedData.aqi > 100 ? (
                      <>
                        <li>• Limit outdoor activities</li>
                        <li>• Sensitive groups use caution</li>
                        <li>• Consider wearing mask</li>
                      </>
                    ) : (
                      <>
                        <li>• Safe for outdoor activities</li>
                        <li>• Good air quality</li>
                        <li>• No special precautions needed</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Click on a location marker</p>
                  <p className="text-sm text-muted-foreground">to view detailed information</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">All Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      selectedLocation === location.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{location.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{location.aqi}</span>
                      <div className={`w-3 h-3 rounded-full ${getAQIColor(location.aqi)}`} />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
