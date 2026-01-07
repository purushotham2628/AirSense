// ARIMA(p, d) implementation (AR via OLS on differenced series)
// This implementation focuses on correct differencing (integration) and
// fitting an AR(p) model using ordinary least squares. It returns
// forecasts along with simple confidence intervals derived from residuals.

interface ARModel {
  coefficients: number[]; // includes intercept as first element
  residuals: number[];
  residualStd: number;
}

function difference(series: number[], d: number): { diffed: number[]; lastValues: number[] } {
  const lastValues: number[] = [];
  let current = [...series];
  for (let i = 0; i < d; i++) {
    if (current.length === 0) break;
    lastValues.push(current[current.length - 1]);
    const next: number[] = [];
    for (let j = 1; j < current.length; j++) {
      next.push(current[j] - current[j - 1]);
    }
    current = next;
  }
  return { diffed: current, lastValues };
}

function invertDifferences(forecastDiffs: number[], lastValues: number[], d: number): number[] {
  // Reconstruct forecasts back to original scale by cumulatively summing
  let current = [...forecastDiffs];
  for (let i = d - 1; i >= 0; i--) {
    const base = lastValues[i] ?? 0;
    const restored: number[] = [];
    let cumulative = base;
    for (let v of current) {
      cumulative = cumulative + v;
      restored.push(cumulative);
    }
    current = restored;
  }
  return current;
}

function fitAR_OLS(series: number[], p: number): ARModel {
  const n = series.length;
  if (n <= p) {
    return { coefficients: [series.reduce((a, b) => a + b, 0) / Math.max(1, n)], residuals: [], residualStd: 0 };
  }

  // Build design matrix X and target y
  const rows = n - p;
  const X: number[][] = Array(rows).fill(0).map(() => Array(p + 1).fill(1)); // first col for intercept
  const y: number[] = Array(rows).fill(0);

  for (let i = p; i < n; i++) {
    const rowIdx = i - p;
    y[rowIdx] = series[i];
    X[rowIdx][0] = 1; // intercept
    for (let j = 0; j < p; j++) {
      X[rowIdx][j + 1] = series[i - j - 1];
    }
  }

  // Compute (X^T X) and (X^T y)
  const XtX: number[][] = Array(p + 1).fill(0).map(() => Array(p + 1).fill(0));
  const Xty: number[] = Array(p + 1).fill(0);

  for (let i = 0; i < rows; i++) {
    for (let a = 0; a < p + 1; a++) {
      Xty[a] += X[i][a] * y[i];
      for (let b = 0; b < p + 1; b++) {
        XtX[a][b] += X[i][a] * X[i][b];
      }
    }
  }

  // Solve XtX * beta = Xty using Gaussian elimination (small p so fine)
  const m = p + 1;
  const A: number[][] = Array(m).fill(0).map(() => Array(m + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) A[i][j] = XtX[i][j];
    A[i][m] = Xty[i];
  }

  // Gaussian elimination
  for (let i = 0; i < m; i++) {
    // pivot
    let maxRow = i;
    for (let k = i + 1; k < m; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    if (maxRow !== i) {
      const tmp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tmp;
    }
    const diag = A[i][i] || 1e-12;
    for (let k = i; k < m + 1; k++) A[i][k] /= diag;
    for (let r = 0; r < m; r++) {
      if (r === i) continue;
      const factor = A[r][i];
      for (let c = i; c < m + 1; c++) A[r][c] -= factor * A[i][c];
    }
  }

  const beta: number[] = Array(m).fill(0);
  for (let i = 0; i < m; i++) beta[i] = A[i][m];

  // compute residuals
  const residuals: number[] = [];
  for (let i = 0; i < rows; i++) {
    let pred = 0;
    for (let j = 0; j < m; j++) pred += X[i][j] * beta[j];
    residuals.push(y[i] - pred);
  }

  const resMean = residuals.length ? residuals.reduce((a, b) => a + b, 0) / residuals.length : 0;
  const resVar = residuals.length ? residuals.reduce((a, b) => a + Math.pow(b - resMean, 2), 0) / residuals.length : 0;
  const resStd = Math.sqrt(resVar);

  return { coefficients: beta, residuals, residualStd: resStd };
}

export function arimaForecast(series: number[], steps: number, p: number = 3, d: number = 1, exog?: number[][], exogFuture?: number[][], seasonalPeriod?: number): { forecast: number[]; lower: number[]; upper: number[]; confidence: number } {
  if (!series || series.length === 0) {
    return { forecast: Array(steps).fill(0), lower: Array(steps).fill(0), upper: Array(steps).fill(0), confidence: 0 };
  }

  // Work on chronological data (oldest first)
  const dataChron = [...series].reverse();

  // Differencing
  const { diffed, lastValues } = difference(dataChron, d);

  // Align exogenous variables to chronological order if provided
  let exogChron: number[][] | undefined = undefined;
  let exogFutureChron: number[][] | undefined = undefined;
  if (exog && exog.length) {
    exogChron = [...exog].reverse();
  }
  if (exogFuture && exogFuture.length) {
    exogFutureChron = [...exogFuture]; // expected in forward order for forecasting
  }

  // If after differencing we have too few points, fallback to naive forecast
  if (diffed.length < Math.max(3, p + 1)) {
    const last = dataChron[dataChron.length - 1] ?? 0;
    const forecast = Array(steps).fill(Math.round(Math.max(0, last)));
    return { forecast, lower: forecast.map(v => Math.max(0, v - 1)), upper: forecast.map(v => v + 1), confidence: 60 };
  }

  const model = fitAR_OLS(diffed, p, exogChron);

  // Forecast in differenced space
  const forecastsDiff: number[] = [];
  const n = diffed.length;
  // Initialize history for forecasting from most recent p values
  const history: number[] = diffed.slice(Math.max(0, n - p), n);
  const exogHistory: number[][] = exogChron && exogChron.length >= n ? exogChron.slice(Math.max(0, n - p), n) : [];

  for (let h = 0; h < steps; h++) {
    // build feature vector [1, y_{t-1}, y_{t-2}, ... , exog...]
    const features: number[] = [1];
    for (let j = 0; j < p; j++) {
      features.push(history[history.length - 1 - j] ?? 0);
    }

    // append exogenous inputs for this step if model expects them
    if (exogChron && model.coefficients.length > p + 1) {
      const exogIdx = exogHistory.length - 1 + h;
      let exogVals: number[] = [];
      if (exogFutureChron && exogFutureChron[h]) {
        exogVals = exogFutureChron[h];
      } else if (exogHistory[exogHistory.length - 1 + h]) {
        exogVals = exogHistory[exogIdx] || [];
      } else {
        // fallback zeros
        exogVals = Array(model.coefficients.length - (p + 1)).fill(0);
      }
      for (let v of exogVals) features.push(v ?? 0);
    }

    // compute prediction
    let pred = 0;
    for (let k = 0; k < model.coefficients.length; k++) pred += model.coefficients[k] * (features[k] ?? 0);
    forecastsDiff.push(pred);
    history.push(pred);
  }

  // Convert forecasts back to original scale
  let forecasts = invertDifferences(forecastsDiff, lastValues, d).map(v => Math.round(Math.max(0, v)));

  // Seasonal adjustment (simple additive seasonal component)
  if (seasonalPeriod && seasonalPeriod > 1 && dataChron.length >= seasonalPeriod) {
    const seasonalMeans: number[] = Array(seasonalPeriod).fill(0);
    const counts: number[] = Array(seasonalPeriod).fill(0);
    for (let i = 0; i < dataChron.length; i++) {
      const idx = i % seasonalPeriod;
      seasonalMeans[idx] += dataChron[i];
      counts[idx]++;
    }
    for (let i = 0; i < seasonalPeriod; i++) seasonalMeans[i] = counts[i] ? seasonalMeans[i] / counts[i] : 0;

    const overallMean = dataChron.reduce((a, b) => a + b, 0) / dataChron.length;
    const lastPhase = dataChron.length % seasonalPeriod;
    for (let h = 0; h < forecasts.length; h++) {
      const phase = (lastPhase + h + 1) % seasonalPeriod;
      const seasonalAdjustment = (seasonalMeans[phase] - overallMean) * 0.6; // dampened
      forecasts[h] = Math.max(0, Math.round(forecasts[h] + seasonalAdjustment));
    }
  }

  // Confidence intervals using residual std (approximate)
  const lowers: number[] = [];
  const uppers: number[] = [];
  for (let h = 0; h < steps; h++) {
    const stepStd = model.residualStd * Math.sqrt(1 + (h + 1) * 0.05);
    const z = 1.96; // ~95% CI
    const center = forecasts[h];
    const lo = Math.round(Math.max(0, center - z * stepStd));
    const hi = Math.round(center + z * stepStd);
    lowers.push(lo);
    uppers.push(hi);
  }

  // Confidence score derived inversely from residual std and series variance
  const seriesMean = dataChron.reduce((a, b) => a + b, 0) / dataChron.length;
  const seriesVar = dataChron.reduce((a, b) => a + Math.pow(b - seriesMean, 2), 0) / Math.max(1, dataChron.length);
  let confidence = 80 - Math.round(model.residualStd * 5 + (seriesVar > 0 ? Math.min(20, Math.sqrt(seriesVar)) : 0));
  confidence = Math.max(20, Math.min(95, confidence));

  return { forecast: forecasts, lower: lowers, upper: uppers, confidence };
}
