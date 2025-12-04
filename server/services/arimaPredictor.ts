// ARIMA-like auto-regressive prediction model for time series forecasting
// Uses a simplified AR(p) model with differencing and mean reversion

interface ARModel {
  coefficients: number[];
  intercept: number;
  residuals: number[];
  residualStd: number;
  mean: number;
}

function fitARModel(series: number[], p: number = 3): ARModel {
  // Reverse so chronological (oldest first)
  const data = [...series].reverse();
  
  if (data.length < p + 2) {
    // Fallback for small datasets
    return {
      coefficients: Array(p).fill(0),
      intercept: data[data.length - 1] || 0,
      residuals: [],
      residualStd: 0,
      mean: data.reduce((a, b) => a + b, 0) / Math.max(1, data.length)
    };
  }

  // Compute mean
  const mean = data.reduce((a, b) => a + b, 0) / data.length;

  // Center the data
  const centered = data.map(x => x - mean);

  // Fit AR coefficients using Yule-Walker equations (simplified)
  const coefficients = Array(p).fill(0);
  const acf: number[] = [];
  
  // Compute autocorrelations
  for (let lag = 0; lag <= p; lag++) {
    let sum = 0;
    let count = 0;
    for (let i = lag; i < centered.length; i++) {
      sum += centered[i] * centered[i - lag];
      count++;
    }
    acf.push(count > 0 ? sum / count : 0);
  }

  // Simplified AR fitting: use ratio of acf for each coefficient
  for (let i = 0; i < p; i++) {
    if (acf[0] !== 0) {
      coefficients[i] = (acf[i + 1] / acf[0]) * 0.5 + (i === 0 ? 0.3 : 0); // dampening factor
    }
  }

  // Compute residuals and std
  const residuals: number[] = [];
  for (let t = p; t < centered.length; t++) {
    let pred = 0;
    for (let j = 0; j < p; j++) {
      pred += coefficients[j] * centered[t - j - 1];
    }
    residuals.push(centered[t] - pred);
  }

  const residualMean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const residualVar = residuals.reduce((a, b) => a + Math.pow(b - residualMean, 2), 0) / residuals.length;
  const residualStd = Math.sqrt(residualVar);

  return {
    coefficients,
    intercept: mean,
    residuals,
    residualStd,
    mean
  };
}

export function arimaForecast(series: number[], steps: number, p: number = 3): { forecast: number[]; confidence: number } {
  if (!series || series.length === 0) {
    return { forecast: Array(steps).fill(0), confidence: 0 };
  }

  const model = fitARModel(series, p);
  const data = [...series].reverse(); // chronological
  const forecasts: number[] = [];
  let workingData = [...data];

  for (let h = 0; h < steps; h++) {
    let pred = model.intercept;
    for (let j = 0; j < p && j < workingData.length; j++) {
      pred += model.coefficients[j] * (workingData[workingData.length - j - 1] - model.mean);
    }
    
    // Add mean-reversion: pull back towards historical mean
    pred = pred * 0.7 + model.mean * 0.3;
    
    forecasts.push(Math.round(pred));
    workingData.push(pred);
  }

  // Confidence inversely proportional to residual std
  const confidence = Math.max(40, Math.min(90, Math.round(85 - model.residualStd * 2)));

  return { forecast: forecasts, confidence };
}
