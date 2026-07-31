import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, ArrowRight, RefreshCw, Sun, CloudRain } from 'lucide-react';
import { CityLocation, TemperatureUnit, CurrentWeather } from '../types/weather';
import { fetchWeatherData } from '../services/openMeteo';
import { formatTemp, getWeatherCodeInfo } from '../utils/weatherUtils';

interface MultiCityGridProps {
  savedCities: CityLocation[];
  onSelectCity: (city: CityLocation) => void;
  onRemoveCity: (city: CityLocation) => void;
  unit: TemperatureUnit;
}

interface CityWeatherCache {
  [cityId: string]: {
    temp: number;
    code: number;
    humidity: number;
    wind: number;
    isDay: boolean;
  };
}

export const MultiCityGrid: React.FC<MultiCityGridProps> = ({
  savedCities,
  onSelectCity,
  onRemoveCity,
  unit,
}) => {
  const [cache, setCache] = useState<CityWeatherCache>({});
  const [loading, setLoading] = useState(false);

  // Batch load current temps for saved cities
  useEffect(() => {
    let isMounted = true;
    const loadCities = async () => {
      setLoading(true);
      const newCache: CityWeatherCache = {};

      for (const city of savedCities) {
        try {
          const data = await fetchWeatherData(city);
          newCache[city.id] = {
            temp: data.current.temperature,
            code: data.current.weatherCode,
            humidity: data.current.humidity,
            wind: data.current.windSpeed,
            isDay: data.current.isDay,
          };
        } catch {
          // fallback mock values
          newCache[city.id] = { temp: 18, code: 0, humidity: 60, wind: 12, isDay: true };
        }
      }

      if (isMounted) {
        setCache(newCache);
        setLoading(false);
      }
    };

    loadCities();
    return () => {
      isMounted = false;
    };
  }, [savedCities]);

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Multi-City Weather Command Grid</h3>
        </div>
        <span className="text-xs text-slate-400 font-medium">{savedCities.length} Locations Pinned</span>
      </div>

      {loading && Object.keys(cache).length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          Syncing multi-city weather telemetry...
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedCities.map((city) => {
            const w = cache[city.id];
            const codeInfo = w ? getWeatherCodeInfo(w.code, w.isDay) : null;

            return (
              <div
                key={city.id}
                className="group relative rounded-2xl bg-slate-950/70 border border-slate-800/90 p-5 hover:border-cyan-500/50 hover:bg-slate-950 transition-all duration-300 shadow-lg flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {city.name}
                    </h4>
                    <p className="text-xs text-slate-400">{city.country}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCity(city);
                    }}
                    title="Remove city"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Weather details */}
                {w && (
                  <div className="my-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-3xl font-black text-white">{formatTemp(w.temp, unit)}</div>
                      <div className="text-xs text-slate-300 font-medium mt-1">{codeInfo?.description}</div>
                    </div>
                    <div className="text-right text-xs text-slate-400 space-y-1">
                      <div>Humidity: <strong className="text-slate-200">{w.humidity}%</strong></div>
                      <div>Wind: <strong className="text-slate-200">{Math.round(w.wind)} km/h</strong></div>
                    </div>
                  </div>
                )}

                {/* Switch button */}
                <button
                  onClick={() => onSelectCity(city)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 group-hover:bg-cyan-500 group-hover:text-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Focus Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
