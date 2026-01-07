import { arimaForecast } from './arimaPredictor';

function persistenceForecast(series: number[], steps: number) {
  const last = series[0] ?? 0;
  return Array(steps).fill(Math.round(last));
}

function simpleExpSmoothing(series: number[], steps: number, alpha = 0.3) {
  if (!series || series.length === 0) return Array(steps).fill(0);
  // series provided most-recent-first; reverse to chronological
  const data = [...series].reverse();
  let s = data[0];
  for (let i = 1; i < data.length; i++) s = alpha * data[i] + (1 - alpha) * s;
  // Forecast constant at last smoothed value
  return Array(steps).fill(Math.round(s));
}

export function ensembleForecast(series: number[], steps: number) : { forecast: number[]; lower: number[]; upper: number[]; confidence: number } {
  if (!series || series.length === 0) {
    return { forecast: Array(steps).fill(0), lower: Array(steps).fill(0), upper: Array(steps).fill(0), confidence: 0 };
  }

  // ARIMA component
  const arima = arimaForecast(series, steps, 3, 1);

  // ETS-like component
  const ets = simpleExpSmoothing(series, steps, 0.25);

  // Persistence baseline
  const persist = persistenceForecast(series, steps);

  const forecasts: number[] = [];
  const lowers: number[] = [];
  const uppers: number[] = [];

  // Assign model confidences
  const arimaConf = arima.confidence || 60;
  const etsConf = 60;
  const persistConf = 40;

  const total = arimaConf + etsConf + persistConf;

  for (let i = 0; i < steps; i++) {
    const a = arima.forecast[i] ?? arima.forecast[arima.forecast.length - 1] ?? series[0];
    const e = ets[i] ?? series[series.length - 1];
    const p = persist[i] ?? series[0];

    const combined = (a * arimaConf + e * etsConf + p * persistConf) / total;
    const rounded = Math.round(Math.max(0, combined));

    // uncertainty: combine arima intervals if available
    const arLo = arima.lower && arima.lower[i] !== undefined ? arima.lower[i] : Math.max(0, rounded - 3);
    const arHi = arima.upper && arima.upper[i] !== undefined ? arima.upper[i] : rounded + 3;

    // widen interval slightly for ensemble
    const lo = Math.max(0, Math.round((arLo + rounded) / 2 - 2));
    const hi = Math.round((arHi + rounded) / 2 + 2);

    forecasts.push(rounded);
    lowers.push(lo);
    uppers.push(hi);
  }

  // Ensemble confidence reflects agreement and arima confidence
  // Lower if models disagree (std dev of predictions)
  const perStepStd: number[] = [];
  for (let i = 0; i < steps; i++) {
    const vals = [ (arima.forecast[i] ?? arima.forecast[arima.forecast.length - 1] ?? series[0]), (ets[i] ?? series[series.length - 1]), (persist[i] ?? series[0]) ];
    const mean = vals.reduce((a,b) => a+b,0)/vals.length;
    const variance = vals.reduce((a,b) => a + Math.pow(b-mean,2), 0)/vals.length;
    perStepStd.push(Math.sqrt(variance));
  }

  const avgStd = perStepStd.reduce((a,b)=>a+b,0)/perStepStd.length;
  let confidence = Math.max(20, Math.min(95, Math.round((arimaConf * 0.6 + (100 - avgStd) * 0.4))));

  return { forecast: forecasts, lower: lowers, upper: uppers, confidence };
}
