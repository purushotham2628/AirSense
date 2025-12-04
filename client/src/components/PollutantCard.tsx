import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PollutantCardProps {
  name: string;
  value: number;
  unit: string;
  safeLimit: number;
  trend?: "up" | "down" | "stable";
}

function getPollutantStatus(value: number, safeLimit: number) {
  const ratio = value / safeLimit;
  if (ratio <= 0.5) return { color: "bg-emerald-500", bgGradient: "from-emerald-50 to-emerald-100", level: "Good" };
  if (ratio <= 1) return { color: "bg-yellow-500", bgGradient: "from-yellow-50 to-yellow-100", level: "Moderate" };
  if (ratio <= 1.5) return { color: "bg-orange-500", bgGradient: "from-orange-50 to-orange-100", level: "Poor" };
  return { color: "bg-red-600", bgGradient: "from-red-50 to-red-100", level: "Severe" };
}

export default function PollutantCard({ name, value, unit, safeLimit, trend }: PollutantCardProps) {
  const status = getPollutantStatus(value, safeLimit);
  const percentage = Math.min((value / safeLimit) * 100, 100);
  
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02, translateY: -4 }}
    >
      <Card className={`hover-elevate backdrop-blur-sm bg-gradient-to-br ${status.bgGradient} border-2 border-white/20`} data-testid={`card-pollutant-${name.toLowerCase()}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">{name}</CardTitle>
          <motion.div
            animate={{
              y: trend === "up" ? [0, -4, 0] : trend === "down" ? [0, 4, 0] : [0, 0, 0],
              rotate: trend === "up" ? 0 : trend === "down" ? 0 : 0,
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <TrendIcon className={cn(
              "h-5 w-5",
              trend === "up" ? "text-red-500" : 
              trend === "down" ? "text-green-500" : 
              "text-gray-400"
            )} />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <motion.div
                className="text-3xl font-bold font-mono bg-gradient-to-r from-gray-700 to-gray-900 text-transparent bg-clip-text"
                data-testid="text-pollutant-value"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {value}
              </motion.div>
              <motion.div
                className="text-sm font-medium text-gray-600"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {unit}
              </motion.div>
            </div>
            
            <motion.div
              className="space-y-2"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="flex justify-between text-xs"
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <motion.span
                  className={cn("px-3 py-1 rounded-full text-white font-bold text-xs shadow-lg", status.color)}
                  whileHover={{ scale: 1.1 }}
                >
                  {status.level}
                </motion.span>
                <span className="text-gray-600 font-medium">
                  Safe: {safeLimit} {unit}
                </span>
              </motion.div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{ originX: 0 }}
              >
                <Progress 
                  value={percentage} 
                  className="h-3 rounded-full overflow-hidden" 
                  data-testid="progress-pollutant-level"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}