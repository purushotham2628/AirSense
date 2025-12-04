import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Heart, Leaf, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HealthAdvisoryProps {
  aqi: number;
  location: string;
}

function getHealthRecommendations(aqi: number) {
  if (aqi <= 50) {
    return {
      level: "Good",
      color: "bg-emerald-500",
      bgGradient: "from-emerald-50 to-emerald-100",
      icon: Leaf,
      recommendations: [
        "Perfect air quality for outdoor activities",
        "Safe for all groups including sensitive individuals",
        "Ideal time for exercise and recreation"
      ],
      sensitiveGroups: "No precautions needed"
    };
  }
  
  if (aqi <= 100) {
    return {
      level: "Moderate",
      color: "bg-yellow-500",
      bgGradient: "from-yellow-50 to-yellow-100",
      icon: Shield,
      recommendations: [
        "Generally safe for outdoor activities",
        "Sensitive individuals may experience minor symptoms",
        "Consider reducing prolonged outdoor exertion"
      ],
      sensitiveGroups: "Children and elderly should limit extended outdoor activities"
    };
  }
  
  if (aqi <= 150) {
    return {
      level: "Unhealthy for Sensitive Groups",
      color: "bg-orange-500",
      bgGradient: "from-orange-50 to-orange-100",
      icon: Users,
      recommendations: [
        "Sensitive groups should limit outdoor activities",
        "Wear N95 masks when going outside",
        "Keep windows closed, use air purifiers"
      ],
      sensitiveGroups: "Children, elderly, and people with heart/lung conditions should avoid outdoor exertion"
    };
  }
  
  if (aqi <= 200) {
    return {
      level: "Unhealthy",
      color: "bg-red-600",
      bgGradient: "from-red-50 to-red-100",
      icon: Heart,
      recommendations: [
        "Everyone should limit outdoor activities",
        "Wear N95 or better masks outside",
        "Use air purifiers indoors, avoid opening windows"
      ],
      sensitiveGroups: "Everyone should avoid prolonged outdoor exertion"
    };
  }
  
  return {
    level: "Hazardous",
    color: "bg-red-900",
    bgGradient: "from-red-100 to-red-200",
    icon: AlertTriangle,
    recommendations: [
      "Avoid all outdoor activities",
      "Stay indoors with air purifiers running",
      "Wear N95 masks even for brief outdoor exposure",
      "Consider relocating temporarily if possible"
    ],
    sensitiveGroups: "Everyone should avoid outdoor activities entirely"
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function HealthAdvisory({ aqi, location }: HealthAdvisoryProps) {
  const advisory = getHealthRecommendations(aqi);
  const Icon = advisory.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, translateY: -4 }}
    >
      <Card className={`hover-elevate backdrop-blur-sm bg-gradient-to-br ${advisory.bgGradient} border-2 border-white/20`} data-testid="card-health-advisory">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <CardTitle className="text-lg font-bold text-gray-800">Health Advisory</CardTitle>
          </motion.div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Icon className={`h-5 w-5 ${advisory.color.replace('bg-', 'text-')}`} />
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-1">
              <motion.div
                className="text-sm text-gray-600 font-medium"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {location} Air Quality
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
              >
                <Badge className={cn("text-sm font-bold text-white shadow-lg", advisory.color)} data-testid="badge-advisory-level">
                  {advisory.level}
                </Badge>
              </motion.div>
            </div>
            <motion.div
              className="text-3xl font-bold font-mono bg-gradient-to-r from-gray-700 to-gray-900 text-transparent bg-clip-text"
              whileHover={{ scale: 1.1 }}
            >
              {aqi} AQI
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Alert className="border-2 border-orange-300 bg-orange-50/50 backdrop-blur-sm shadow-lg">
              <motion.div animate={{ rotate: [0, 15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </motion.div>
              <AlertDescription className="text-sm text-orange-900 font-medium">
                <strong>Sensitive Groups:</strong> {advisory.sensitiveGroups}
              </AlertDescription>
            </Alert>
          </motion.div>

          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h4 className="font-bold text-sm text-gray-800">Recommendations:</h4>
            <ul className="space-y-2">
              {advisory.recommendations.map((rec, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3 text-sm"
                  variants={itemVariants}
                  whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.3)" }}
                  style={{ padding: "8px 12px", borderRadius: "8px", transition: "all 0.3s ease" }}
                >
                  <motion.div
                    className={`w-2 h-2 ${advisory.color} rounded-full mt-2 flex-shrink-0`}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ delay: index * 0.1, duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-gray-700 font-medium" data-testid={`text-recommendation-${index}`}>{rec}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}