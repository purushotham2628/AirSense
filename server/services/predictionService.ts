import { storage } from '../storage';
import { arimaForecast } from './arimaPredictor';
import { ensembleForecast } from './ensemblePredictor';
import { openWeatherService } from './openWeatherService';

// AR-based prediction using ARIMA-style auto-regressive model for improved accuracy

export class PredictionService {
  // Predict hourly AQI for the next `hours` based on stored readings using ARIMA model
  async predictAQIHourly(location: string, hours: number = 24) {
    const recent = await storage.getAQIReadings(location, 72); // get up to 72 recent hourly readings

    // If not enough historical readings, try to fetch the current reading from OpenWeather
    let series: number[] = [];
    if (recent && recent.length > 0) {
      series = recent.map(r => r.aqi);
    } else {
      try {
        const live = await openWeatherService.getAQIData(location);
        if (live && live.aqi !== undefined) {
          // single point series
          series = [live.aqi];
        }
      } catch (err) {
        console.error('No historical readings and failed to fetch live AQI:', err);
        return [];
      }
    }

    // Use ensemble predictor for more robust forecasts
    const { forecast, lower, upper, confidence } = ensembleForecast(series, Math.min(hours, 72));

    // Build response array with time, predicted value, and confidence
    const now = new Date();
    const results = forecast.map((pred: number, i: number) => {
      const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
      return {
        time: time.toISOString(),
        predicted: Math.round(pred),
        lower: lower && lower[i] !== undefined ? Math.round(lower[i]) : Math.max(0, Math.round(pred - 2)),
        upper: upper && upper[i] !== undefined ? Math.round(upper[i]) : Math.round(pred + 2),
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
    let temps: number[] = [];
    if (recent && recent.length > 0) {
      temps = recent.map(r => (r.temperature !== null && r.temperature !== undefined) ? r.temperature : r.aqi / 10 + 15);
    } else {
      try {
        const live = await openWeatherService.getWeatherData(location);
        if (live && live.temperature !== undefined) temps = [live.temperature];
      } catch (err) {
        console.error('No historical temps and failed to fetch live weather:', err);
        return [];
      }
    }

    const { forecast, lower, upper, confidence } = arimaForecast(temps, Math.min(hours, 72), 3, 1);

    const now = new Date();
    const results = forecast.map((pred: number, i: number) => {
      const time = new Date(now.getTime() + (i + 1) * 60 * 60 * 1000);
      return {
        time: time.toISOString(),
        predicted: Math.round(pred * 10) / 10,
        lower: lower && lower[i] !== undefined ? Math.round(lower[i] * 10) / 10 : Math.max(0, Math.round((pred - 0.5) * 10) / 10),
        upper: upper && upper[i] !== undefined ? Math.round(upper[i] * 10) / 10 : Math.round((pred + 0.5) * 10) / 10,
        confidence
      };
    });

    return results;
  }
}

// Helper: map AQI to health category and advice
function aqiCategory(aqi: number) {
  if (aqi <= 50) return { category: 'Good', level: 0, advice: 'Air quality is satisfactory.' };
  if (aqi <= 100) return { category: 'Moderate', level: 1, advice: 'Acceptable for most; sensitive groups should take care.' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive Groups', level: 2, advice: 'People with respiratory issues should reduce prolonged exertion.' };
  if (aqi <= 200) return { category: 'Unhealthy', level: 3, advice: 'General public may experience health effects; reduce outdoor activities.' };
  if (aqi <= 300) return { category: 'Very Unhealthy', level: 4, advice: 'Health alert: everyone may experience more serious effects.' };
  return { category: 'Hazardous', level: 5, advice: 'Emergency conditions — avoid all outdoor exertion.' };
}

// Advanced health prediction using AQI forecast and pollutant context
export interface HealthPrediction {
  time: string;
  aqi: number;
  category: string;
  advice: string;
  riskScore: number; // 0-100
  hospitalizationProbability: number; // 0-100
}

export async function predictHealthAdvisory(location: string, hours: number = 24): Promise<HealthPrediction[]> {
  // Use AQI hourly predictions
  const hourly = await (new PredictionService()).predictAQIHourly(location, hours);
  if (!hourly || hourly.length === 0) return [];

  // Try to obtain last known pollutant composition for weighting (prefer stored reading)
  const recent = await storage.getAQIReadings(location, 24);
  const last = (recent && recent.length > 0) ? recent[0] : null;

  const results: HealthPrediction[] = hourly.map((h: any) => {
    const aqi = h.predicted;
    const cat = aqiCategory(aqi);

    // Risk score combines AQI level and pollutant-weighted modifier
    let pollutantFactor = 0;
    if (last) {
      // Simple weight: PM2.5 dominates health risk
      pollutantFactor = Math.min(40, Math.round((last.pm25 || 0) * 0.6 + (last.pm10 || 0) * 0.25));
    }

    // Confidence reduces uncertainty: higher confidence reduces hospitalization probability
    const confidence = h.confidence ?? 60;

    const baseRisk = Math.min(100, Math.round((aqi / 500) * 100 + cat.level * 8));
    const riskScore = Math.min(100, baseRisk + pollutantFactor * 0.5 - Math.round(confidence * 0.2));

    // Estimate hospitalization probability (very rough): influenced by riskScore
    const hospitalizationProbability = Math.max(1, Math.min(80, Math.round(riskScore * 0.45)));

    return {
      time: h.time,
      aqi,
      category: cat.category,
      advice: cat.advice,
      riskScore: Math.round(riskScore),
      hospitalizationProbability: Math.round(hospitalizationProbability)
    };
  });

  return results;
}

export const predictionService = new PredictionService();
