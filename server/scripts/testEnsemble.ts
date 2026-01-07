import { ensembleForecast } from '../services/ensemblePredictor';
import { arimaForecast } from '../services/arimaPredictor';

function sampleSeries(length: number) {
  const base = 60;
  const arr: number[] = [];
  for (let i = 0; i < length; i++) {
    const seasonal = Math.sin(i / 24 * Math.PI * 2) * 10;
    const trend = i * 0.01;
    const noise = (Math.random() - 0.5) * 6;
    arr.push(Math.max(0, Math.round(base + seasonal + trend + noise)));
  }
  return arr.reverse();
}

async function run() {
  const series = sampleSeries(120);
  console.log('Last 8 points (most recent first):', series.slice(0,8));

  const steps = 24;
  const ensemble = ensembleForecast(series, steps);
  const arima = arimaForecast(series, steps, 3, 1);

  console.log('\nEnsemble forecasts:');
  ensemble.forecast.forEach((f, i) => {
    console.log(`${i+1}: ${f} [${ensemble.lower[i]} - ${ensemble.upper[i]}]`);
  });

  console.log('\nARIMA forecasts:');
  arima.forecast.forEach((f, i) => {
    console.log(`${i+1}: ${f} [${arima.lower[i]} - ${arima.upper[i]}]`);
  });

  console.log('\nEnsemble confidence:', ensemble.confidence);
}

run().catch(err => { console.error(err); process.exit(1); });
