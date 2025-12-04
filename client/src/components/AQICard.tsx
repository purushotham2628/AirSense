import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AQICardProps {
  aqi: number;
  location: string;
  lastUpdated: string;
  trend?: "up" | "down" | "stable";
}

function getAQICategory(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "bg-emerald-500", icon: CheckCircle, bgGradient: "from-emerald-50 to-emerald-100" };
  if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-500", icon: Wind, bgGradient: "from-yellow-50 to-yellow-100" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive", color: "bg-orange-500", icon: AlertTriangle, bgGradient: "from-orange-50 to-orange-100" };
  if (aqi <= 200) return { label: "Unhealthy", color: "bg-red-500", icon: AlertTriangle, bgGradient: "from-red-50 to-red-100" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "bg-purple-600", icon: XCircle, bgGradient: "from-purple-50 to-purple-100" };
  return { label: "Hazardous", color: "bg-red-900", icon: XCircle, bgGradient: "from-red-100 to-red-200" };
}

export default function AQICard({ aqi, location, lastUpdated, trend }: AQICardProps) {
  const category = getAQICategory(aqi);
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, translateY: -4 }}
    >
      <Card className={`hover-elevate backdrop-blur-sm bg-gradient-to-br ${category.bgGradient} border-2 border-white/20`} data-testid="card-aqi">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">{location} AQI</CardTitle>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Icon className={`h-5 w-5 ${category.color.replace('bg-', 'text-')}`} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className={`text-4xl font-bold font-mono bg-gradient-to-r ${category.color} via-transparent text-transparent bg-clip-text`}
                data-testid="text-aqi-value"
              >
                {aqi}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Badge className={`text-xs font-semibold ${category.color} text-white shadow-lg`} data-testid="badge-aqi-category">
                  {category.label}
                </Badge>
              </motion.div>
            </div>
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  "text-xs px-3 py-2 rounded-full font-bold text-lg",
                  trend === "up" ? "text-red-500 bg-red-100" : 
                  trend === "down" ? "text-green-500 bg-green-100" : 
                  "text-gray-500 bg-gray-100"
                )}
              >
                {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
              </motion.div>
            )}
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-600 mt-3 font-medium" data-testid="text-last-updated"
          >
            Updated {lastUpdated}
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}