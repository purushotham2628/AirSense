import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplets, Wind, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface WeatherCardProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  visibility: number;
  location: string;
  condition: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
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

export default function WeatherCard({ temperature, humidity, windSpeed, visibility, location, condition }: WeatherCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, translateY: -4 }}
    >
      <Card className="hover-elevate backdrop-blur-sm bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-white/20" data-testid="card-weather">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">{location} Weather</CardTitle>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Thermometer className="h-5 w-5 text-blue-600" />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              <motion.div
                className="text-3xl font-bold font-mono bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text"
                data-testid="text-temperature"
                whileHover={{ scale: 1.1 }}
              >
                {temperature}°C
              </motion.div>
              <motion.div
                className="text-sm text-gray-600 font-medium"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {condition}
              </motion.div>
            </motion.div>
            
            <motion.div
              className="grid grid-cols-3 gap-4 text-sm"
              variants={containerVariants}
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity }}>
                  <Droplets className="h-4 w-4 text-blue-500" />
                </motion.div>
                <div>
                  <motion.div
                    className="font-bold text-blue-600"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {humidity}%
                  </motion.div>
                  <div className="text-xs text-gray-600">Humidity</div>
                </div>
              </motion.div>
              
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
              >
                <motion.div animate={{ x: [0, 4, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Wind className="h-4 w-4 text-green-500" />
                </motion.div>
                <div>
                  <motion.div
                    className="font-bold text-green-600"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  >
                    {windSpeed} km/h
                  </motion.div>
                  <div className="text-xs text-gray-600">Wind</div>
                </div>
              </motion.div>
              
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
              >
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                  <Eye className="h-4 w-4 text-purple-500" />
                </motion.div>
                <div>
                  <motion.div
                    className="font-bold text-purple-600"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  >
                    {visibility} km
                  </motion.div>
                  <div className="text-xs text-gray-600">Visibility</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}