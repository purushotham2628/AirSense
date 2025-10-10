import { openWeatherService } from './openWeatherService';
import { storage } from '../storage';
import cron from 'node-cron';

export class DataCollectorService {
  private isRunning: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private cronJob: cron.ScheduledTask | null = null;

  private defaultCities = ['bengaluru', 'delhi', 'mumbai', 'chennai', 'hyderabad'];

  start() {
    if (this.isRunning) {
      console.log('⚠️  Data collector already running');
      return;
    }

    console.log('🚀 Starting automated data collection service...');

    this.cronJob = cron.schedule('*/15 * * * *', async () => {
      await this.collectData();
    });

    this.collectData();

    this.isRunning = true;
    console.log('✓ Data collection service started (runs every 15 minutes)');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.isRunning = false;
    console.log('✓ Data collection service stopped');
  }

  private async collectData() {
    console.log('📊 Collecting air quality data...');

    for (const city of this.defaultCities) {
      try {
        const data = await openWeatherService.getAQIData(city);

        await storage.createAQIReading({
          location: data.location,
          aqi: data.aqi,
          pm25: data.pm25,
          pm10: data.pm10,
          co: data.co,
          o3: data.o3,
          no2: data.no2,
          so2: data.so2,
          temperature: data.temperature ?? null,
          humidity: data.humidity ?? null,
          windSpeed: data.windSpeed ?? null,
          source: data.source
        });

        console.log(`✓ Collected data for ${data.location} (AQI: ${data.aqi})`);
      } catch (error) {
        console.error(`❌ Failed to collect data for ${city}:`, error);
      }
    }

    console.log('✓ Data collection cycle completed');
  }

  async collectForCity(cityName: string): Promise<void> {
    try {
      const data = await openWeatherService.getAQIData(cityName);

      await storage.createAQIReading({
        location: data.location,
        aqi: data.aqi,
        pm25: data.pm25,
        pm10: data.pm10,
        co: data.co,
        o3: data.o3,
        no2: data.no2,
        so2: data.so2,
        temperature: data.temperature ?? null,
        humidity: data.humidity ?? null,
        windSpeed: data.windSpeed ?? null,
        source: data.source
      });

      console.log(`✓ Manual data collection for ${data.location} completed`);
    } catch (error) {
      console.error(`❌ Failed to collect data for ${cityName}:`, error);
      throw error;
    }
  }
}

export const dataCollector = new DataCollectorService();
