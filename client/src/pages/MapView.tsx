import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, RefreshCw } from "lucide-react";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface AQIData {
  name: string;     // city/town name, used as id and display
  lat: number;
  lon: number;
  aqi: number;
}

export default function MapView() {
  const [locations, setLocations] = useState<AQIData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState("aqi");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "bg-chart-1";
    if (aqi <= 100) return "bg-chart-2";
    if (aqi <= 150) return "bg-chart-3";
    if (aqi <= 200) return "bg-chart-4";
    if (aqi <= 300) return "bg-chart-5";
    return "bg-red-600";
  };

  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  // Fetch all city AQI values from the backend
  const fetchAQILocations = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/cities/supported");
      if (!res.ok) throw new Error("Could not fetch cities.");
      const { cities } = await res.json();
      const aqiPromises = cities.map(async (city: { name: string, lat: number, lon: number }) => {
        const response = await fetch(`/api/aqi/${encodeURIComponent(city.name)}`);
        if (!response.ok) return null;
        const aqiData = await response.json();
        return {
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          aqi: aqiData.currentAQI ?? 0,
        } as AQIData;
      });
      const allLocations = (await Promise.all(aqiPromises)).filter(Boolean) as AQIData[];
      setLocations(allLocations);
    } catch (e) {
      setLocations([]);
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAQILocations();
    // eslint-disable-next-line
  }, []);

  const handleRefresh = async () => {
    await fetchAQILocations();
  };

  const selectedData = locations.find((loc) => loc.name === selectedLocation) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Map View</h1>
          <p className="text-muted-foreground">
            Real-time air quality monitoring across Bengaluru
          </p>
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
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
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
                  <MapPin className="h-5 w-5" />
                  Bengaluru Air Quality Map
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "500px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {locations.map((loc) => (
                  <Marker
                    key={loc.name}
                    position={[loc.lat, loc.lon]}
                    eventHandlers={{
                      click: () => setSelectedLocation(loc.name)
                    }}
                  >
                    {selectedLocation === loc.name && (
                      <Popup>
                        <div>
                          <strong>{loc.name}</strong>
                          <br />
                          AQI: {loc.aqi} ({getAQICategory(loc.aqi)})
                        </div>
                      </Popup>
                    )}
                  </Marker>
                ))}
              </MapContainer>
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
                    <span className="text-sm text-muted-foreground">
                      Current AQI
                    </span>
                    <span className="text-2xl font-bold">
                      {selectedData.aqi}
                    </span>
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
                      <p className="font-mono">
                        {selectedData.lat.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Longitude</p>
                      <p className="font-mono">
                        {selectedData.lon.toFixed(4)}
                      </p>
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
                  <p className="text-muted-foreground">
                    Click on a location marker
                  </p>
                  <p className="text-sm text-muted-foreground">
                    to view detailed information
                  </p>
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
                    key={location.name}
                    onClick={() => setSelectedLocation(location.name)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      selectedLocation === location.name
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm font-medium">{location.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {location.aqi}
                      </span>
                      <div
                        className={`w-3 h-3 rounded-full ${getAQIColor(
                          location.aqi
                        )}`}
                      />
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
