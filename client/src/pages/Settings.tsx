import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Palette, 
  Database, 
  Key,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppSettings {
  general: {
    defaultLocation: string;
    refreshInterval: number;
    units: 'metric' | 'imperial';
    language: string;
    timezone: string;
  };
  notifications: {
    enabled: boolean;
    aqiThreshold: number;
    emailAlerts: boolean;
    pushNotifications: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    showPredictions: boolean;
    chartType: 'line' | 'area' | 'bar';
    animationsEnabled: boolean;
  };
  api: {
    openWeatherKey: string;
    openAiKey: string;
    customEndpoint: string;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
    locationTracking: boolean;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>({
    general: {
      defaultLocation: 'Bengaluru Central',
      refreshInterval: 300, // 5 minutes
      units: 'metric',
      language: 'en',
      timezone: 'Asia/Kolkata'
    },
    notifications: {
      enabled: true,
      aqiThreshold: 150,
      emailAlerts: false,
      pushNotifications: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00'
      }
    },
    display: {
      theme: 'system',
      compactMode: false,
      showPredictions: true,
      chartType: 'line',
      animationsEnabled: true
    },
    api: {
      openWeatherKey: '',
      openAiKey: '',
      customEndpoint: ''
    },
    privacy: {
      dataCollection: true,
      analytics: false,
      crashReporting: true,
      locationTracking: false
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    openWeather: 'unknown',
    openAi: 'unknown'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    checkApiStatus();
  }, [settings.api.openWeatherKey, settings.api.openAiKey]);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));

      // Save API keys to backend if provided
      if (settings.api.openWeatherKey || settings.api.openAiKey) {
        await fetch('/api/settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            openWeatherKey: settings.api.openWeatherKey,
            openAiKey: settings.api.openAiKey
          })
        });
      }

      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });

      // Recheck API status after saving
      await checkApiStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testApiConnections = async () => {
    setApiStatus({ openWeather: 'unknown', openAi: 'unknown' });

    // Test OpenWeather API
    try {
      const response = await fetch('/api/aqi/bengaluru');
      setApiStatus(prev => ({
        ...prev,
        openWeather: response.ok ? 'connected' : 'error'
      }));
    } catch {
      setApiStatus(prev => ({ ...prev, openWeather: 'error' }));
    }

    // Test OpenAI API with a simple request
    if (settings.api.openAiKey && settings.api.openAiKey.trim()) {
      try {
        const response = await fetch('/api/test-openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: settings.api.openAiKey })
        });
        setApiStatus(prev => ({
          ...prev,
          openAi: response.ok ? 'connected' : 'error'
        }));
      } catch {
        setApiStatus(prev => ({ ...prev, openAi: 'error' }));
      }
    } else {
      setApiStatus(prev => ({ ...prev, openAi: 'not_configured' }));
    }
  };

  const checkApiStatus = async () => {
    // Check OpenWeather API status
    try {
      const response = await fetch('/api/aqi/bengaluru');
      setApiStatus(prev => ({
        ...prev,
        openWeather: response.ok ? 'connected' : 'error'
      }));
    } catch {
      setApiStatus(prev => ({ ...prev, openWeather: 'error' }));
    }

    // Check OpenAI API status
    setApiStatus(prev => ({
      ...prev,
      openAi: settings.api.openAiKey && settings.api.openAiKey.trim() ? 'connected' : 'not_configured'
    }));
  };

  const updateSettings = (section: keyof AppSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSettings = (section: keyof AppSettings, nestedKey: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...(prev[section] as any)[nestedKey],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    const defaultSettings: AppSettings = {
      general: {
        defaultLocation: 'Bengaluru Central',
        refreshInterval: 300,
        units: 'metric',
        language: 'en',
        timezone: 'Asia/Kolkata'
      },
      notifications: {
        enabled: true,
        aqiThreshold: 150,
        emailAlerts: false,
        pushNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      },
      display: {
        theme: 'system',
        compactMode: false,
        showPredictions: true,
        chartType: 'line',
        animationsEnabled: true
      },
      api: {
        openWeatherKey: '',
        openAiKey: '',
        customEndpoint: ''
      },
      privacy: {
        dataCollection: true,
        analytics: false,
        crashReporting: true,
        locationTracking: false
      }
    };
    
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-chart-1" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-chart-4" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      case 'not_configured': return 'Not Configured';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your air quality monitoring experience</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary">Unsaved changes</Badge>
          )}
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Display
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-location">Default Location</Label>
                  <Select
                    value={settings.general.defaultLocation}
                    onValueChange={(value) => updateSettings('general', 'defaultLocation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bengaluru Central">Bengaluru Central</SelectItem>
                      <SelectItem value="Whitefield">Whitefield</SelectItem>
                      <SelectItem value="Electronic City">Electronic City</SelectItem>
                      <SelectItem value="Koramangala">Koramangala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Refresh Interval</Label>
                  <Select
                    value={settings.general.refreshInterval.toString()}
                    onValueChange={(value) => updateSettings('general', 'refreshInterval', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="units">Units</Label>
                  <Select
                    value={settings.general.units}
                    onValueChange={(value: 'metric' | 'imperial') => updateSettings('general', 'units', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (°C, km/h)</SelectItem>
                      <SelectItem value="imperial">Imperial (°F, mph)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) => updateSettings('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <Switch
                  id="notifications-enabled"
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) => updateSettings('notifications', 'enabled', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aqi-threshold">AQI Alert Threshold</Label>
                <Input
                  id="aqi-threshold"
                  type="number"
                  value={settings.notifications.aqiThreshold}
                  onChange={(e) => updateSettings('notifications', 'aqiThreshold', parseInt(e.target.value) || 150)}
                  min="50"
                  max="300"
                  step="10"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <Switch
                    id="email-alerts"
                    checked={settings.notifications.emailAlerts}
                    onCheckedChange={(checked) => updateSettings('notifications', 'emailAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateSettings('notifications', 'pushNotifications', checked)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours">Quiet Hours</Label>
                  <Switch
                    id="quiet-hours"
                    checked={settings.notifications.quietHours.enabled}
                    onCheckedChange={(checked) => updateNestedSettings('notifications', 'quietHours', 'enabled', checked)}
                  />
                </div>

                {settings.notifications.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start">From</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={settings.notifications.quietHours.start}
                        onChange={(e) => updateNestedSettings('notifications', 'quietHours', 'start', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-end">To</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={settings.notifications.quietHours.end}
                        onChange={(e) => updateNestedSettings('notifications', 'quietHours', 'end', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Display & Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={settings.display.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => updateSettings('display', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select
                    value={settings.display.chartType}
                    onValueChange={(value: 'line' | 'area' | 'bar') => updateSettings('display', 'chartType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <Switch
                    id="compact-mode"
                    checked={settings.display.compactMode}
                    onCheckedChange={(checked) => updateSettings('display', 'compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-predictions">Show Predictions</Label>
                  <Switch
                    id="show-predictions"
                    checked={settings.display.showPredictions}
                    onCheckedChange={(checked) => updateSettings('display', 'showPredictions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="animations-enabled">Enable Animations</Label>
                  <Switch
                    id="animations-enabled"
                    checked={settings.display.animationsEnabled}
                    onCheckedChange={(checked) => updateSettings('display', 'animationsEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openweather-key">OpenWeather API Key</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(apiStatus.openWeather)}
                    <span className="text-sm text-muted-foreground">
                      {getStatusText(apiStatus.openWeather)}
                    </span>
                  </div>
                </div>
                <Input
                  id="openweather-key"
                  type="password"
                  value={settings.api.openWeatherKey}
                  onChange={(e) => updateSettings('api', 'openWeatherKey', e.target.value)}
                  placeholder="Enter your OpenWeather API key"
                />
                <p className="text-xs text-muted-foreground">
                  Get your free API key from{' '}
                  <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    openweathermap.org
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openai-key">OpenAI API Key (Optional)</Label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(apiStatus.openAi)}
                    <span className="text-sm text-muted-foreground">
                      {getStatusText(apiStatus.openAi)}
                    </span>
                  </div>
                </div>
                <Input
                  id="openai-key"
                  type="password"
                  value={settings.api.openAiKey}
                  onChange={(e) => updateSettings('api', 'openAiKey', e.target.value)}
                  placeholder="Enter your OpenAI API key"
                />
                <p className="text-xs text-muted-foreground">
                  Required for AI assistant features. Get your key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    platform.openai.com
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-endpoint">Custom API Endpoint (Advanced)</Label>
                <Input
                  id="custom-endpoint"
                  value={settings.api.customEndpoint}
                  onChange={(e) => updateSettings('api', 'customEndpoint', e.target.value)}
                  placeholder="https://api.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Use a custom API endpoint for air quality data
                </p>
              </div>

              <Button onClick={testApiConnections} variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Test API Connections
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-collection">Data Collection</Label>
                    <p className="text-xs text-muted-foreground">Allow collection of usage data to improve the service</p>
                  </div>
                  <Switch
                    id="data-collection"
                    checked={settings.privacy.dataCollection}
                    onCheckedChange={(checked) => updateSettings('privacy', 'dataCollection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics">Analytics</Label>
                    <p className="text-xs text-muted-foreground">Enable anonymous analytics to help improve features</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => updateSettings('privacy', 'analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="crash-reporting">Crash Reporting</Label>
                    <p className="text-xs text-muted-foreground">Send crash reports to help fix bugs</p>
                  </div>
                  <Switch
                    id="crash-reporting"
                    checked={settings.privacy.crashReporting}
                    onCheckedChange={(checked) => updateSettings('privacy', 'crashReporting', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="location-tracking">Location Tracking</Label>
                    <p className="text-xs text-muted-foreground">Use device location for automatic area detection</p>
                  </div>
                  <Switch
                    id="location-tracking"
                    checked={settings.privacy.locationTracking}
                    onCheckedChange={(checked) => updateSettings('privacy', 'locationTracking', checked)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Data Management</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    Export My Data
                  </Button>
                  <Button variant="outline" size="sm">
                    Clear Cache
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}