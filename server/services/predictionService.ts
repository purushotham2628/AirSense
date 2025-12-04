import { storage } from '../storage';
import { arimaForecast } from './arimaPredictor';

// AR-based prediction using ARIMA-style auto-regressive model for improved accuracy

export class PredictionService {
  // Predict hourly AQI for the next `hours` based on stored readings using ARIMA model
  async predictAQIHourly(location: string, hours: number = 24) {
    const recent = await storage.getAQIReadings(location, 48); // get up to 48 recent hourly readings
    if (!recent || recent.length === 0) return [];

    // Extract AQI values (most recent first)
    const series = recent.map(r => r.aqi);

    // Use ARIMA-style AR model
    const { forecast, confidence } = arimaForecast(series, Math.min(hours, 72), 3);

    // Build response array with time, predicted value, and confidence
    const now = new Date();
    const results = forecast.map((pred: number, i: number) => {
      const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
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
      const slice = hourly.slice(d * 24, (d + 1) * 24).map((h: any) => h.predicted);
      if (slice.length === 0) continue;
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const avg = Math.round(slice.reduce((a: number, b: number) => a + b, 0) / slice.length);
      const predicted = Math.round(avg);
      daily.push({ day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(new Date().getDay() + d) % 7], min, avg, max, predicted });
    }

    return daily;
  }

  // Predict temperature (C) hourly using ARIMA
  async predictTemperatureHourly(location: string, hours: number = 24) {
    const recent = await storage.getAQIReadings(location, 72);
    if (!recent || recent.length === 0) return [];
    // Use temperature field when available, fall back to aqi-derived proxy
    const temps = recent.map(r => (r.temperature !== null && r.temperature !== undefined) ? r.temperature : r.aqi / 10 + 15);

    const { forecast, confidence } = arimaForecast(temps, Math.min(hours, 72), 3);

    const now = new Date();
    const results = forecast.map((pred: number, i: number) => {
      const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
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
