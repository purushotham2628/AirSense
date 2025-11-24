import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  BellOff, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  X,
  Settings,
  Mail,
  Smartphone,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationSettings {
  enabled: boolean;
  aqiThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    aqiThreshold: 150,
    emailNotifications: false,
    pushNotifications: true,
    soundEnabled: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00"
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load notifications and settings
    loadNotifications();
    loadSettings();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Try to fetch current AQI from the server and generate notifications dynamically
      // Default location for notifications (can be replaced with user preference later)
      const location = 'Bengaluru Central';

      // Use saved threshold if present (loadSettings may run later)
      const savedSettings = localStorage.getItem('notificationSettings');
      const threshold = savedSettings ? JSON.parse(savedSettings).aqiThreshold : settings.aqiThreshold;

      const resp = await fetch(`/api/aqi/${encodeURIComponent(location)}`);
      if (!resp.ok) throw new Error('AQI API failed');
      const json = await resp.json();

      const liveNotifications: Notification[] = [];

      if (json.currentAQI && json.currentAQI >= threshold) {
        liveNotifications.push({
          id: `aqi-${Date.now()}`,
          type: 'alert',
          title: 'High AQI Alert',
          message: `AQI levels in ${json.location} are ${json.currentAQI}. Avoid outdoor activities and wear masks when going outside.`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'high'
        });
      } else {
        liveNotifications.push({
          id: `aqi-ok-${Date.now()}`,
          type: 'info',
          title: 'Air Quality Normal',
          message: `Current AQI in ${json.location} is ${json.currentAQI}. Conditions are within the configured threshold.`,
          timestamp: new Date().toISOString(),
          read: true,
          priority: 'low'
        });
      }

      setNotifications(liveNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);

      // Fallback to original mock notifications so UX remains consistent
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'alert',
          title: 'High AQI Alert',
          message: 'AQI levels in Bengaluru Central have exceeded 150. Avoid outdoor activities and wear masks when going outside.',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          read: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'warning',
          title: 'PM2.5 Spike Detected',
          message: 'PM2.5 levels are rising rapidly in Electronic City area. Consider using air purifiers indoors.',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          read: false,
          priority: 'medium'
        }
      ];
      setNotifications(mockNotifications);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = () => {
    // Load from localStorage or API
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'info': return CheckCircle;
      case 'warning': return Clock;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'text-chart-4 bg-chart-4/10 border-chart-4/20';
    }
    switch (type) {
      case 'alert': return 'text-chart-4 bg-chart-4/10 border-chart-4/20';
      case 'info': return 'text-chart-1 bg-chart-1/10 border-chart-1/20';
      case 'warning': return 'text-chart-2 bg-chart-2/10 border-chart-2/20';
      default: return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage your air quality alerts and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors hover-elevate",
                          notification.read ? "bg-muted/30" : "bg-card",
                          getNotificationColor(notification.type, notification.priority)
                        )}
                      >
                        <div className="p-1.5 rounded-full bg-current/10">
                          <Icon className="h-3 w-3" />
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <h4 className={cn(
                              "text-sm font-medium",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 -mt-1"
                              onClick={() => dismissNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    saveSettings({ ...settings, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aqi-threshold">AQI Alert Threshold</Label>
                <Input
                  id="aqi-threshold"
                  type="number"
                  value={settings.aqiThreshold}
                  onChange={(e) => 
                    saveSettings({ ...settings, aqiThreshold: parseInt(e.target.value) || 150 })
                  }
                  min="50"
                  max="300"
                  step="10"
                />
                <p className="text-xs text-muted-foreground">
                  Get alerts when AQI exceeds this value
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push Notifications
                  </Label>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, pushNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-enabled" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Sound Alerts
                  </Label>
                  <Switch
                    id="sound-enabled"
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => 
                      saveSettings({ ...settings, soundEnabled: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-hours">Quiet Hours</Label>
                  <Switch
                    id="quiet-hours"
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(checked) => 
                      saveSettings({ 
                        ...settings, 
                        quietHours: { ...settings.quietHours, enabled: checked }
                      })
                    }
                  />
                </div>

                {settings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quiet-start" className="text-xs">From</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={settings.quietHours.start}
                        onChange={(e) => 
                          saveSettings({ 
                            ...settings, 
                            quietHours: { ...settings.quietHours, start: e.target.value }
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end" className="text-xs">To</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={settings.quietHours.end}
                        onChange={(e) => 
                          saveSettings({ 
                            ...settings, 
                            quietHours: { ...settings.quietHours, end: e.target.value }
                          })
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Notifications</span>
                <span className="font-medium">{notifications.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Unread</span>
                <span className="font-medium text-chart-4">{unreadCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>High Priority</span>
                <span className="font-medium">
                  {notifications.filter(n => n.priority === 'high').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}