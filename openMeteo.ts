import { CityLocation, WeatherData, CurrentWeather, HourlyForecastItem, DailyForecastItem, AirQualityData, TelemetryTick, WeatherAlert } from '../types/weather';
import { getAQIInfo } from '../utils/weatherUtils';

export const DEFAULT_CITIES: CityLocation[] = [
  { id: 1, name: 'New York', latitude: 40.7128, longitude: -74.006, country: 'United States', admin1: 'New York', timezone: 'America/New_York' },
  { id: 2, name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, country: 'Japan', admin1: 'Tokyo', timezone: 'Asia/Tokyo' },
  { id: 3, name: 'London', latitude: 51.5074, longitude: -0.1278, country: 'United Kingdom', admin1: 'England', timezone: 'Europe/London' },
  { id: 4, name: 'Paris', latitude: 48.8566, longitude: 2.3522, country: 'France', admin1: 'Île-de-France', timezone: 'Europe/Paris' },
  { id: 5, name: 'Sydney', latitude: -33.8688, longitude: 151.2093, country: 'Australia', admin1: 'New South Wales', timezone: 'Australia/Sydney' },
  { id: 6, name: 'San Francisco', latitude: 37.7749, longitude: -122.4194, country: 'United States', admin1: 'California', timezone: 'America/Los_Angeles' },
];

export async function searchCities(query: string): Promise<CityLocation[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to search locations');
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      id: item.id || `${item.latitude}-${item.longitude}`,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      admin1: item.admin1 || '',
      timezone: item.timezone || 'UTC',
      elevation: item.elevation,
    }));
  } catch (error) {
    console.error('City search error:', error);
    return [];
  }
}

export async function fetchWeatherData(location: CityLocation): Promise<WeatherData> {
  const { latitude: lat, longitude: lon } = location;

  // 1. Fetch main weather forecast
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

  // 2. Fetch air quality
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;

  const [weatherRes, aqRes] = await Promise.all([
    fetch(weatherUrl).catch(() => null),
    fetch(aqUrl).catch(() => null),
  ]);

  if (!weatherRes || !weatherRes.ok) {
    throw new Error('Failed to retrieve weather data for this location');
  }

  const wData = await weatherRes.json();
  const aqData = aqRes && aqRes.ok ? await aqRes.json() : null;

  // Parse Current
  const c = wData.current || {};
  const current: CurrentWeather = {
    temperature: c.temperature_2m ?? 20,
    apparentTemperature: c.apparent_temperature ?? c.temperature_2m ?? 20,
    weatherCode: c.weather_code ?? 0,
    isDay: c.is_day !== undefined ? Boolean(c.is_day) : true,
    windSpeed: c.wind_speed_10m ?? 12,
    windDirection: c.wind_direction_10m ?? 180,
    windGusts: c.wind_gusts_10m ?? (c.wind_speed_10m ? c.wind_speed_10m * 1.4 : 18),
    humidity: c.relative_humidity_2m ?? 65,
    pressure: c.surface_pressure ?? 1013,
    uvIndex: wData.hourly?.uv_index?.[0] ?? 4,
    visibility: 10000, // standard default
    cloudCover: c.cloud_cover ?? 20,
    dewPoint: wData.hourly?.dew_point_2m?.[0] ?? (c.temperature_2m ? c.temperature_2m - 4 : 15),
    time: c.time || new Date().toISOString(),
  };

  // Parse Hourly (first 24 hours)
  const hourly: HourlyForecastItem[] = [];
  if (wData.hourly && wData.hourly.time) {
    const times = wData.hourly.time;
    const count = Math.min(times.length, 24);
    for (let i = 0; i < count; i++) {
      hourly.push({
        time: times[i],
        temperature: wData.hourly.temperature_2m?.[i] ?? current.temperature,
        apparentTemperature: wData.hourly.apparent_temperature?.[i] ?? current.apparentTemperature,
        precipitationProbability: wData.hourly.precipitation_probability?.[i] ?? 0,
        precipitation: wData.hourly.precipitation?.[i] ?? 0,
        weatherCode: wData.hourly.weather_code?.[i] ?? 0,
        humidity: wData.hourly.relative_humidity_2m?.[i] ?? 60,
        windSpeed: wData.hourly.wind_speed_10m?.[i] ?? 10,
        windDirection: wData.hourly.wind_direction_10m?.[i] ?? 180,
        uvIndex: wData.hourly.uv_index?.[i] ?? 0,
        isDay: wData.hourly.is_day?.[i] === 1,
      });
    }
  }

  // Parse Daily (7 days)
  const daily: DailyForecastItem[] = [];
  if (wData.daily && wData.daily.time) {
    const dTimes = wData.daily.time;
    for (let i = 0; i < dTimes.length; i++) {
      daily.push({
        date: dTimes[i],
        weatherCode: wData.daily.weather_code?.[i] ?? 0,
        tempMax: wData.daily.temperature_2m_max?.[i] ?? 22,
        tempMin: wData.daily.temperature_2m_min?.[i] ?? 14,
        apparentTempMax: wData.daily.apparent_temperature_max?.[i] ?? 22,
        apparentTempMin: wData.daily.apparent_temperature_min?.[i] ?? 14,
        sunrise: wData.daily.sunrise?.[i] || '',
        sunset: wData.daily.sunset?.[i] || '',
        uvIndexMax: wData.daily.uv_index_max?.[i] ?? 5,
        precipitationSum: wData.daily.precipitation_sum?.[i] ?? 0,
        precipitationProbabilityMax: wData.daily.precipitation_probability_max?.[i] ?? 10,
        windSpeedMax: wData.daily.wind_speed_10m_max?.[i] ?? 18,
      });
    }
  }

  // Parse Air Quality
  const aqCur = aqData?.current || {};
  const rawAqi = aqCur.us_aqi || aqCur.european_aqi || 42;
  const aqInfo = getAQIInfo(rawAqi);

  const airQuality: AirQualityData = {
    aqi: rawAqi,
    pm2_5: aqCur.pm2_5 ?? 12.4,
    pm10: aqCur.pm10 ?? 24.1,
    no2: aqCur.nitrogen_dioxide ?? 18.5,
    o3: aqCur.ozone ?? 45.2,
    so2: aqCur.sulphur_dioxide ?? 4.1,
    co: aqCur.carbon_monoxide ?? 210,
    statusLabel: aqInfo.label,
    statusColor: aqInfo.color,
    healthAdvice: aqInfo.advice,
  };

  // Generate severe weather alerts if conditions warrant
  const alerts: WeatherAlert[] = generateAlerts(current, daily[0]);

  // Initial telemetry ticks
  const telemetryStream: TelemetryTick[] = generateTelemetryTicks(location.name, current);

  return {
    location,
    current,
    hourly,
    daily,
    airQuality,
    alerts,
    telemetryStream,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

function generateAlerts(current: CurrentWeather, today?: DailyForecastItem): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (current.windSpeed > 45 || current.windGusts > 60) {
    alerts.push({
      id: 'wind-advisory-1',
      severity: current.windGusts > 75 ? 'danger' : 'warning',
      title: 'High Wind Advisory',
      description: `Gusty winds up to ${Math.round(current.windGusts)} km/h detected in the area. Secure outdoor objects and exercise caution while driving.`,
      issuedTime: 'Just now',
      category: 'Wind',
      safetyTips: [
        'Drive cautiously, especially in high-profile vehicles',
        'Secure light outdoor items and patio furniture',
        'Watch for falling branches and power line disruptions',
      ],
    });
  }

  if (current.weatherCode >= 95) {
    alerts.push({
      id: 'thunderstorm-watch-1',
      severity: 'danger',
      title: 'Severe Thunderstorm Warning',
      description: 'Active convective atmospheric conditions detected with severe lightning risks and potential localized heavy downpours.',
      issuedTime: '5 mins ago',
      category: 'Thunderstorm',
      safetyTips: [
        'Seek indoor shelter immediately if thunder is heard',
        'Disconnect sensitive electrical appliances',
        'Stay clear of open fields and elevated metal objects',
      ],
    });
  } else if (current.weatherCode >= 63 && current.weatherCode <= 67) {
    alerts.push({
      id: 'rain-alert-1',
      severity: 'info',
      title: 'Heavy Rainfall Advisory',
      description: 'Persistent rainfall reported. Reduced road visibility and minor pooling possible in low-lying areas.',
      issuedTime: '12 mins ago',
      category: 'Precipitation',
      safetyTips: [
        'Maintain extra distance when driving in wet conditions',
        'Carry waterproof gear and umbrella',
      ],
    });
  }

  if (current.uvIndex >= 8) {
    alerts.push({
      id: 'uv-warning-1',
      severity: 'warning',
      title: 'Extreme UV Radiation Warning',
      description: `UV Index is at a high of ${current.uvIndex}. Unprotected exposure can cause skin damage in under 15 minutes.`,
      issuedTime: '30 mins ago',
      category: 'UV / Solar',
      safetyTips: [
        'Apply SPF 50+ broad spectrum sunscreen',
        'Wear UV-blocking sunglasses and wide-brim hat',
        'Minimize direct sun exposure between 11 AM and 4 PM',
      ],
    });
  }

  return alerts;
}

export function generateTelemetryTicks(cityName: string, current: CurrentWeather): TelemetryTick[] {
  const stationCode = `STN-${cityName.substring(0, 3).toUpperCase()}-9`;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return [
    {
      id: 't-1',
      timestamp: now,
      parameter: 'Wind Speed',
      value: `${Math.round(current.windSpeed * (1 + (Math.random() * 0.1 - 0.05)))} km/h`,
      delta: `${(Math.random() * 2 - 1).toFixed(1)} km/h`,
      status: 'normal',
      stationId: stationCode,
    },
    {
      id: 't-2',
      timestamp: now,
      parameter: 'Barometric Pressure',
      value: `${(current.pressure + (Math.random() * 0.4 - 0.2)).toFixed(1)} hPa`,
      delta: `${(Math.random() * 0.3 - 0.15).toFixed(2)} hPa`,
      status: 'normal',
      stationId: stationCode,
    },
    {
      id: 't-3',
      timestamp: now,
      parameter: 'Temperature',
      value: `${(current.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1)} °C`,
      delta: `${(Math.random() * 0.2 - 0.1).toFixed(1)} °C`,
      status: 'normal',
      stationId: stationCode,
    },
  ];
}
