import { storage } from '../storage';

// Simple Holt's linear exponential smoothing (double exponential) implementation
// to forecast short-term time series like AQI and temperature.
// This implementation is lightweight (no external deps) and tuned for small datasets.

function holtLinearForecast(series: number[], horizon: number, alpha = 0.6, beta = 0.2) {
  // series: most recent first (descending). We'll reverse for chronological processing.
  if (!series || series.length === 0) return { forecast: Array(horizon).fill(null), residualStd: 0 };

  const seq = [...series].reverse();

  // Initialize level and trend
  let level = seq[0];
  let trend = seq.length > 1 ? seq[1] - seq[0] : 0;

  const fitted: number[] = [];

  for (let t = 0; t < seq.length; t++) {
    const value = seq[t];
    if (t === 0) {
      level = value;
      trend = seq.length > 1 ? seq[1] - seq[0] : 0;
      fitted.push(level + trend);
      continue;
    }

    const prevLevel = level;
    level = alpha * value + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level + trend);
  }

  // Generate forecasts
  const forecasts: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    forecasts.push(Math.round(level + trend * h));
  }

  // Estimate residual standard deviation from last part of series
  const residuals: number[] = [];
  for (let i = 0; i < fitted.length; i++) {
    residuals.push(seq[i] - fitted[i]);
  }
  const meanRes = residuals.reduce((a, b) => a + b, 0) / Math.max(1, residuals.length);
  const variance = residuals.reduce((a, b) => a + Math.pow(b - meanRes, 2), 0) / Math.max(1, residuals.length);
  const residualStd = Math.sqrt(variance);

  return { forecast: forecasts, residualStd };
}

export class PredictionService {
  // Predict hourly AQI for the next `hours` based on stored readings
  async predictAQIHourly(location: string, hours: number = 24) {
    const recent = await storage.getAQIReadings(location, 48); // get up to 48 recent hourly readings
    if (!recent || recent.length === 0) return [];

    // Extract AQI values (most recent first)
    const series = recent.map(r => r.aqi);

    // Use Holt's linear smoothing
    const { forecast, residualStd } = holtLinearForecast(series, Math.min(hours, 72));

    // Build response array with time, predicted value, and confidence
    const now = new Date();
    const results = forecast.map((pred, i) => {
      const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
      // Confidence inversely related to residual std (clamped)
      const confidence = Math.max(30, Math.min(95, Math.round(90 - residualStd * 3)));
      return {
        time: time.toISOString(),
        predicted: pred,
        confidence
      };
    });

    return results;
  }

  // Predict daily AQI for next `days` (simple aggregation of hourly forecasts)
  async predictAQIWeekly(location: string, days: number = 7) {
    const hourly = await this.predictAQIHourly(location, days * 24);
    if (!hourly || hourly.length === 0) return [];

    const daily: { day: string; min: number; avg: number; max: number; predicted: number }[] = [];

    for (let d = 0; d < days; d++) {
      const slice = hourly.slice(d * 24, (d + 1) * 24).map(h => h.predicted);
      if (slice.length === 0) continue;
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const avg = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
      const predicted = Math.round(avg);
      daily.push({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(new Date().getDay() + d) % 7], min, avg, max, predicted });
    }

    return daily;
  }

  // Predict temperature (C) hourly
  async predictTemperatureHourly(location: string, hours: number = 24) {
    const recent = await storage.getAQIReadings(location, 72);
    if (!recent || recent.length === 0) return [];
    // Use temperature field when available, fall back to aqi-derived proxy
    const temps = recent.map(r => (r.temperature !== null && r.temperature !== undefined) ? r.temperature : r.aqi / 10 + 15);

    const { forecast, residualStd } = holtLinearForecast(temps, Math.min(hours, 72));

    const now = new Date();
    const results = forecast.map((pred, i) => {
      const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
      const confidence = Math.max(30, Math.min(95, Math.round(90 - residualStd * 2)));
      return {
        time: time.toISOString(),
        predicted: pred,
        confidence
      };
    });

    return results;
  }
}

export const predictionService = new PredictionService();
