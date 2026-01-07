// OpenWeather API integration for real-time air quality and weather data
// Note: This uses a demo API key for development. Users should provide their own API key.

interface OpenWeatherAQIResponse {
  coord: { lon: number; lat: number };
  list: {
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }[];
}

interface OpenWeatherWeatherResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
  visibility: number;
  weather: {
    main: string;
    description: string;
  }[];
  dt: number;
}

interface CityCoordinates {
  name: string;
  lat: number;
  lon: number;
  state?: string;
}

// Indian cities with coordinates for AQI comparison
const INDIAN_CITIES: Record<string, CityCoordinates> = {
  'bengaluru': { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  'delhi': { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  'mumbai': { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  'kolkata': { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
  'chennai': { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  'hyderabad': { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana' },
  'pune': { name: 'Pune', lat: 18.5204, lon: 73.8567, state: 'Maharashtra' },
  'ahmedabad': { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, state: 'Gujarat' },
  'jaipur': { name: 'Jaipur', lat: 26.9124, lon: 75.7873, state: 'Rajasthan' },
  'lucknow': { name: 'Lucknow', lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' }
};

export class OpenWeatherService {
  // Read API key lazily to ensure dotenv has run before we access it
  private baseUrl = 'https://api.openweathermap.org';

  constructor() {
    // Intentionally minimal constructor. We read the API key at request time
    // to avoid issues with module initialization order.
  }

  private getApiKey(): string {
    return (process.env.OPENWEATHER_API_KEY || '').toString().trim();
  }

  async getAQIData(cityName: string): Promise<any> {
    const city = this.getCityCoordinates(cityName);
    if (!city) {
      throw new Error(`City '${cityName}' not found in supported cities`);
    }

    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'demo') {
      // Throw error instead of returning mock data
      throw new Error('OPENWEATHER_API_KEY is missing or invalid. Please configure it in .env file');
    }

    try {
      const url = `${this.baseUrl}/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }
      
      const data: OpenWeatherAQIResponse = await response.json();
      return this.transformAQIData(data, city);
    } catch (error) {
      console.error('OpenWeather AQI API Error:', error);
      // Throw error instead of falling back to mock data
      throw new Error(`Failed to fetch real AQI data from OpenWeather API: ${error}`);
    }
  }  async getWeatherData(cityName: string): Promise<any> {
    const city = this.getCityCoordinates(cityName);
    if (!city) {
      throw new Error(`City '${cityName}' not found`);
    }

    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'demo') {
      // Throw error instead of returning mock data
      throw new Error('OPENWEATHER_API_KEY is missing or invalid. Please configure it in .env file');
    }

    try {
      const url = `${this.baseUrl}/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }
      
      const data: OpenWeatherWeatherResponse = await response.json();
      return this.transformWeatherData(data, city);
    } catch (error) {
      console.error('OpenWeather Weather API Error:', error);
      // Throw error instead of falling back to mock data
      throw new Error(`Failed to fetch real weather data from OpenWeather API: ${error}`);
    }
  async getMultiCityAQI(cityNames: string[]): Promise<any[]> {
    const promises = cityNames.map(city => this.getAQIData(city));

    const results = await Promise.allSettled(promises);
    const successful: any[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        console.error(`Failed to get AQI for ${cityNames[index]}:`, result.reason);
      }
    });

    return successful;
  }

  private getCityCoordinates(cityName: string): CityCoordinates | null {
    // Normalize by removing non-letters and compare heuristically so inputs like
    // "Bengaluru Central" still resolve to "bengaluru".
    const normalizedName = cityName.toLowerCase().replace(/[^a-z]/g, '');

    // Exact match first
    if (INDIAN_CITIES[normalizedName]) return INDIAN_CITIES[normalizedName];

    // Fallback: try to find a key that is included in the normalized input
    for (const key of Object.keys(INDIAN_CITIES)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return INDIAN_CITIES[key];
      }
    }

    return null;
  }

  private transformAQIData(data: OpenWeatherAQIResponse, city: CityCoordinates) {
    const reading = data.list[0];
    const aqi = this.convertEuropeanAQIToIndian(reading.main.aqi);
    
    return {
      location: city.name,
      state: city.state,
      aqi: aqi,
      pm25: reading.components.pm2_5,
      pm10: reading.components.pm10,
      co: reading.components.co / 1000, // Convert µg/m³ to mg/m³
      o3: reading.components.o3,
      no2: reading.components.no2,
      so2: reading.components.so2,
      timestamp: new Date(reading.dt * 1000),
      source: 'openweather'
    };
  }

  private transformWeatherData(data: OpenWeatherWeatherResponse, city: CityCoordinates) {
    return {
      location: city.name,
      state: city.state,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 10, // Convert m to km
      condition: data.weather[0]?.description || 'Unknown',
      timestamp: new Date(data.dt * 1000)
    };
  }

  private convertEuropeanAQIToIndian(europeanAQI: number): number {
    // Convert European AQI (1-5) to US AQI scale (0-500) which is more internationally recognized
    const conversionMap: Record<number, number> = {
      1: 25,   // Good
      2: 75,   // Fair
      3: 125,  // Moderate
      4: 175,  // Poor
      5: 250   // Very Poor
    };
    return conversionMap[europeanAQI] || 100;
  }

  // Note: Mock data generators removed to ensure only real OpenWeather values are used.

  getSupportedCities(): CityCoordinates[] {
    return Object.values(INDIAN_CITIES);
  }
}

export const openWeatherService = new OpenWeatherService();