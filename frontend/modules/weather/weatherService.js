/**
 * Weather & Disaster Intelligence Service
 * Handles API integration with OpenWeather and IMD data sources
 */

const WEATHER_CONFIG = {
  openWeatherKey: localStorage.getItem('openWeatherKey') || '',
  imdEnabled: true,
  updateInterval: 600000, // 10 minutes
  forecastDays: 7,
  historicalDays: 30,
};

class WeatherService {
  constructor() {
    this.currentWeather = {};
    this.forecasts = [];
    this.disasters = [];
    this.historicalData = [];
    this.cyclones = [];
    this.updateTimer = null;
  }

  async fetchCurrentWeather(lat, lon) {
    if (!WEATHER_CONFIG.openWeatherKey) {
      return this._getDemoWeather(lat, lon);
    }
    
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_CONFIG.openWeatherKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather API failed');
      return await response.json();
    } catch (error) {
      console.warn('Weather fetch failed, using demo data:', error);
      return this._getDemoWeather(lat, lon);
    }
  }

  async fetchForecast(lat, lon) {
    if (!WEATHER_CONFIG.openWeatherKey) {
      return this._getDemoForecast(lat, lon);
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_CONFIG.openWeatherKey}&units=metric&cnt=56`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Forecast API failed');
      return await response.json();
    } catch (error) {
      console.warn('Forecast fetch failed, using demo data:', error);
      return this._getDemoForecast(lat, lon);
    }
  }

  async searchLocation(query) {
    if (!WEATHER_CONFIG.openWeatherKey) {
      return this._getDemoLocations(query);
    }

    try {
      const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${WEATHER_CONFIG.openWeatherKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Geocoding failed');
      return await response.json();
    } catch (error) {
      console.warn('Location search failed:', error);
      return this._getDemoLocations(query);
    }
  }

  // Demo data generators for testing without API key
  _getDemoWeather(lat, lon) {
    const temp = 25 + Math.random() * 10;
    const windSpeed = 5 + Math.random() * 15;
    return {
      coord: { lat, lon },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      main: {
        temp: temp,
        feels_like: temp - 2,
        temp_min: temp - 3,
        temp_max: temp + 3,
        pressure: 1013,
        humidity: 65 + Math.random() * 20,
      },
      wind: {
        speed: windSpeed,
        deg: Math.random() * 360,
      },
      clouds: { all: Math.random() * 50 },
      rain: Math.random() > 0.7 ? { '1h': Math.random() * 10 } : undefined,
      dt: Date.now() / 1000,
      name: 'Demo Location',
    };
  }

  _getDemoForecast(lat, lon) {
    const list = [];
    for (let i = 0; i < 40; i++) {
      const temp = 20 + Math.random() * 15;
      list.push({
        dt: Date.now() / 1000 + i * 10800,
        main: {
          temp: temp,
          temp_min: temp - 2,
          temp_max: temp + 2,
          humidity: 60 + Math.random() * 30,
        },
        weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }],
        wind: { speed: 5 + Math.random() * 10, deg: Math.random() * 360 },
        pop: Math.random() * 0.5,
      });
    }
    return { list };
  }

  _getDemoLocations(query) {
    const coastal = [
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'IN' },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'IN' },
      { name: 'Kochi', lat: 9.9312, lon: 76.2673, country: 'IN' },
      { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185, country: 'IN' },
      { name: 'Goa', lat: 15.2993, lon: 74.1240, country: 'IN' },
    ];
    return coastal.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  }

  // Cyclone and disaster data
  getCycloneData() {
    // Demo cyclone data for Indian Ocean region
    return [
      {
        id: 'CYC_2026_01',
        name: 'Cyclone Amphan',
        category: 'Severe Cyclonic Storm',
        lat: 15.5,
        lon: 85.0,
        windSpeed: 120,
        pressure: 950,
        path: [
          [12.0, 82.0], [13.5, 83.5], [15.0, 85.0], [16.5, 86.5], [18.0, 88.0]
        ],
        forecast: [
          [19.0, 89.0], [20.0, 89.5], [21.0, 90.0]
        ],
        status: 'active',
        warning: 'Severe cyclonic storm expected to make landfall near Odisha coast in 48 hours',
        affectedRegions: ['Odisha', 'West Bengal', 'Andhra Pradesh'],
        timestamp: new Date().toISOString(),
      }
    ];
  }

  getDisasterHistory() {
    return [
      {
        id: 'DIS_001',
        name: 'Cyclone Amphan',
        type: 'Cyclone',
        date: '2020-05-20',
        location: 'West Bengal, Odisha',
        severity: 'Extremely Severe',
        impact: 'Category 5 equivalent, 128 deaths, $13.8 billion damage',
        lat: 21.5,
        lon: 88.5,
      },
      {
        id: 'DIS_002',
        name: 'Cyclone Fani',
        type: 'Cyclone',
        date: '2019-05-03',
        location: 'Odisha',
        severity: 'Extremely Severe',
        impact: 'Category 4 equivalent, 89 deaths, $8.1 billion damage',
        lat: 19.8,
        lon: 85.8,
      },
      {
        id: 'DIS_003',
        name: 'Kerala Floods',
        type: 'Flood',
        date: '2018-08-15',
        location: 'Kerala',
        severity: 'Severe',
        impact: 'Worst floods in century, 483 deaths, $3.8 billion damage',
        lat: 10.5,
        lon: 76.2,
      },
      {
        id: 'DIS_004',
        name: 'Cyclone Vardah',
        type: 'Cyclone',
        date: '2016-12-12',
        location: 'Tamil Nadu',
        severity: 'Very Severe',
        impact: 'Category 2 equivalent, 18 deaths, $1.8 billion damage',
        lat: 13.0,
        lon: 80.2,
      },
      {
        id: 'DIS_005',
        name: 'Cyclone Hudhud',
        type: 'Cyclone',
        date: '2014-10-12',
        location: 'Andhra Pradesh',
        severity: 'Very Severe',
        impact: 'Category 4 equivalent, 124 deaths, $11 billion damage',
        lat: 17.7,
        lon: 83.3,
      },
    ];
  }

  getSafetyPrecautions(riskLevel, weatherType) {
    const precautions = {
      cyclone: {
        high: [
          '⚠️ Avoid sailing for next 48-72 hours',
          '🔒 Secure all fishing equipment and boats',
          '📡 Monitor coast guard advisories continuously',
          '🏠 Move to designated cyclone shelters',
          '📦 Stock emergency supplies (food, water, medicine)',
          '🔋 Charge all communication devices',
          '👥 Stay in groups, avoid isolated areas',
        ],
        medium: [
          '⚠️ Limit sailing to essential operations only',
          '🔒 Secure loose equipment on vessels',
          '📡 Maintain radio contact with coast guard',
          '🌊 Avoid deep sea fishing',
          '⚓ Return to harbor before sunset',
        ],
        low: [
          '📡 Monitor weather updates regularly',
          '🔒 Check vessel equipment before departure',
          '📱 Keep emergency contacts handy',
        ],
      },
      storm: {
        high: [
          '⚠️ Do not venture into sea',
          '⚓ Secure vessels with additional moorings',
          '📡 Maintain emergency communication',
          '🏠 Stay indoors in safe locations',
        ],
        medium: [
          '⚠️ Avoid fishing in affected areas',
          '🌊 Stay close to shore',
          '📡 Monitor weather continuously',
        ],
        low: [
          '📡 Check weather before departure',
          '🔒 Ensure safety equipment is functional',
        ],
      },
      rain: {
        high: [
          '⚠️ Risk of flooding in coastal areas',
          '🏠 Move to higher ground if necessary',
          '🚫 Avoid low-lying areas',
          '📡 Follow local authority instructions',
        ],
        medium: [
          '⚠️ Be cautious of rough seas',
          '🌊 Limit fishing activities',
        ],
        low: [
          '☔ Carry rain protection gear',
          '📡 Monitor weather updates',
        ],
      },
    };

    return precautions[weatherType]?.[riskLevel] || precautions.storm.low;
  }

  calculateRiskLevel(weather, cyclones) {
    let risk = 'low';
    
    // Check cyclone proximity
    if (cyclones && cyclones.length > 0) {
      risk = 'critical';
    }
    
    // Check wind speed
    if (weather.wind?.speed > 40) {
      risk = 'critical';
    } else if (weather.wind?.speed > 25) {
      risk = 'high';
    } else if (weather.wind?.speed > 15) {
      risk = 'medium';
    }
    
    // Check rainfall
    if (weather.rain?.['1h'] > 50) {
      risk = risk === 'critical' ? 'critical' : 'high';
    } else if (weather.rain?.['1h'] > 20) {
      risk = risk === 'low' ? 'medium' : risk;
    }
    
    return risk;
  }

  startAutoUpdate(callback) {
    this.stopAutoUpdate();
    this.updateTimer = setInterval(() => {
      if (callback) callback();
    }, WEATHER_CONFIG.updateInterval);
  }

  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

// Export singleton instance
const weatherService = new WeatherService();
