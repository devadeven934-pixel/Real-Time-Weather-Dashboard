import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Compass,
  Thermometer,
  CloudIcon,
  ShieldAlert,
} from 'lucide-react';
import { CurrentWeather, CityLocation, TemperatureUnit, DailyForecastItem } from '../types/weather';
import { getWeatherCodeInfo, formatTemp, formatWindSpeed, formatPressure, getWindDirectionText, getUVInfo } from '../utils/weatherUtils';
import { SunMoonArc } from './SunMoonArc';

interface CurrentWeatherCardProps {
  current: CurrentWeather;
  location: CityLocation;
  unit: TemperatureUnit;
  todayForecast?: DailyForecastItem;
  lastUpdated: string;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  current,
  location,
  unit,
  todayForecast,
  lastUpdated,
}) => {
  const codeInfo = getWeatherCodeInfo(current.weatherCode, current.isDay);
  const uvInfo = getUVInfo(current.uvIndex);

  // Render weather icon based on name
  const renderWeatherIcon = () => {
    const iconProps = { className: 'w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-amber-400' };
    switch (codeInfo.iconName) {
      case 'Sun':
        return <Sun {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-amber-400 animate-spin-slow" />;
      case 'CloudSun':
        return <CloudSun {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-amber-300" />;
      case 'Cloud':
        return <Cloud {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-slate-300" />;
      case 'CloudFog':
        return <CloudFog {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-slate-400" />;
      case 'CloudDrizzle':
        return <CloudDrizzle {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-cyan-300" />;
      case 'CloudRain':
        return <CloudRain {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-blue-400" />;
      case 'CloudSnow':
      case 'Snowflake':
        return <Snowflake {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-sky-200" />;
      case 'CloudLightning':
        return <CloudLightning {...iconProps} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md text-purple-400 animate-pulse" />;
      default:
        return <Sun {...iconProps} />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
      {/* Subtle background glow effect */}
      <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${codeInfo.bgClass} pointer-events-none`} />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left main temp hero (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {/* Header Location & Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{location.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {location.country}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {location.admin1 ? `${location.admin1} • ` : ''}
                Coords: {location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E • Updated {lastUpdated}
              </p>
            </div>

            {/* Condition badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-sm">
              <span className="text-xs font-medium text-slate-200">{codeInfo.description}</span>
            </div>
          </div>

          {/* Large Temperature Display */}
          <div className="flex items-center gap-6 sm:gap-10 py-2">
            <div>{renderWeatherIcon()}</div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-7xl font-black tracking-tight text-white">
                  {formatTemp(current.temperature, unit)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 mt-1">
                <span>
                  Feels like <strong className="text-white font-semibold">{formatTemp(current.apparentTemperature, unit)}</strong>
                </span>
                {todayForecast && (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-rose-400 font-semibold">H: {formatTemp(todayForecast.tempMax, unit)}</span>
                    <span className="text-cyan-400 font-semibold">L: {formatTemp(todayForecast.tempMin, unit)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Telemetry Grid (4 key badges) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {/* Wind */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Wind</span>
                <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-white">{formatWindSpeed(current.windSpeed, unit)}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Compass
                    className="w-3 h-3 text-cyan-400 transition-transform duration-500"
                    style={{ transform: `rotate(${current.windDirection}deg)` }}
                  />
                  <span>{getWindDirectionText(current.windDirection)}</span>
                  <span>• Gusts {formatWindSpeed(current.windGusts, unit)}</span>
                </div>
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Humidity</span>
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-white">{current.humidity}%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dew point {formatTemp(current.dewPoint, unit)}</div>
              </div>
            </div>

            {/* Pressure */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Pressure</span>
                <Gauge className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold text-white">{formatPressure(current.pressure, unit)}</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">Atmospheric Stable</div>
              </div>
            </div>

            {/* UV Index */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>UV Index</span>
                <Sun className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-white">{current.uvIndex}</span>
                  <span className={`text-xs font-semibold ${uvInfo.color}`}>{uvInfo.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{uvInfo.advice}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Sun/Moon Cycle & Additional Details (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <SunMoonArc
            sunrise={todayForecast?.sunrise || ''}
            sunset={todayForecast?.sunset || ''}
            isDay={current.isDay}
          />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CloudIcon className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[11px]">Cloud Coverage</span>
                <span className="font-semibold text-white">{current.cloudCover}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Eye className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block text-[11px]">Visibility</span>
                <span className="font-semibold text-white">{(current.visibility / 1000).toFixed(1)} km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
