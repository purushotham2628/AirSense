import { arimaForecast } from '../services/arimaPredictor';

// Simple test harness for arimaForecast
function sampleSeries(length: number) {
  const base = 50;
  const arr: number[] = [];
  for (let i = 0; i < length; i++) {
    // create a gentle upward trend with daily-like oscillation and noise
    const seasonal = Math.sin(i / 24 * Math.PI * 2) * 8;
    const trend = i * 0.02;
    const noise = (Math.random() - 0.5) * 4;
    arr.push(Math.max(0, Math.round(base + seasonal + trend + noise)));
  }
  // most recent first to match API expectation in codebase
  return arr.reverse();
}

async function run() {
  const series = sampleSeries(120); // 120 hourly points
  console.log('Sample (most recent first) last 10:', series.slice(0, 10));

  const steps = 24;
  const { forecast, lower, upper, confidence } = arimaForecast(series, steps, 3, 1);

  console.log('\nForecast (next ' + steps + ' steps):');
  for (let i = 0; i < steps; i++) {
    console.log(`${i + 1}: predicted=${forecast[i]}, lower=${lower[i]}, upper=${upper[i]}`);
  }
  console.log('\nConfidence:', confidence);
}

run().catch(err => {
  console.error('Error running ARIMA test:', err);
  process.exit(1);
});
