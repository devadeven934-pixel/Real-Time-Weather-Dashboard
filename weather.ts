export type TemperatureUnit = 'C' | 'F';

export interface CityLocation {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
  elevation?: number;
}

export interface CurrentWeather {
  temperature: number; // in C
  apparentTemperature: number; // in C
  weatherCode: number;
  isDay: boolean;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts: number; // km/h
  humidity: number; // %
  pressure: number; // hPa
  uvIndex: number;
  visibility: number; // meters
  cloudCover: number; // %
  dewPoint: number; // in C
  time: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number; // mm
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
}

export interface AirQualityData {
  aqi: number; // European or US AQI
  pm2_5: number;
  pm10: number;
  no2: number;
  o3: number;
  so2: number;
  co: number;
  statusLabel: string;
  statusColor: string;
  healthAdvice: string;
}

export interface WeatherAlert {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  issuedTime: string;
  category: string;
  safetyTips: string[];
}

export interface TelemetryTick {
  id: string;
  timestamp: string;
  parameter: 'Temperature' | 'Wind Speed' | 'Barometric Pressure' | 'Solar Flux' | 'Humidity';
  value: string;
  delta: string;
  status: 'normal' | 'shift' | 'spike';
  stationId: string;
}

export interface AIBriefing {
  summary: string;
  outfitRecommendation: string;
  bestOutdoorHours: string;
  activityScores: {
    running: number; // 0 - 100
    cycling: number;
    stargazing: number;
    outdoorDining: number;
    photography: number;
  };
  commuteImpact: string;
  travelWarning?: string;
}

export interface WeatherData {
  location: CityLocation;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  airQuality: AirQualityData;
  alerts: WeatherAlert[];
  telemetryStream: TelemetryTick[];
  lastUpdated: string;
}
