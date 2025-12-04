import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  time: string;
  aqi: number;
  predicted?: number;
}

interface AQIChartProps {
  data?: DataPoint[];
  title?: string;
  showPrediction?: boolean;
  location?: string;
}

export default function AQIChart({ data: initialData, title = "AQI Trends", showPrediction = false, location = "Bengaluru" }: AQIChartProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [data, setData] = useState<DataPoint[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetchTrendData();
    }
  }, [timeRange, location]);

  const fetchTrendData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/aqi/${encodeURIComponent(location)}/trend?timeframe=${timeRange}`);
      if (response.ok) {
        const trendData = await response.json();
        setData(trendData);
      }
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aqi-chart-data-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chart data:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="hover-elevate backdrop-blur-sm bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-white/20" data-testid="card-aqi-chart">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">{title}</CardTitle>
          </motion.div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex gap-1">
              {(['24h', '7d', '30d'] as const).map((range, idx) => (
                <motion.div key={range} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    data-testid={`button-time-range-${range}`}
                    className={timeRange === range ? "bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg" : ""}
                  >
                    {range}
                  </Button>
                </motion.div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                data-testid="button-export"
                disabled={isLoading}
                className="hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="h-80 rounded-lg bg-white/30 p-4 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {isLoading && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <Loader2 className="h-8 w-8 text-blue-600" />
                </motion.div>
              </motion.div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              {showPrediction ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#94a3b8" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAqi)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#colorPredicted)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data}>
                  <defs>
                    <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" stroke="#94a3b8" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aqi"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </motion.div>
          
          <motion.div
            className="flex justify-center mt-6 gap-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100/50 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-3 h-3 bg-blue-600 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-gray-700 font-medium">Historical AQI</span>
            </motion.div>
            {showPrediction && (
              <motion.div
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-100/50 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="w-3 h-3 bg-cyan-600 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
                <span className="text-gray-700 font-medium">Predicted AQI</span>
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}