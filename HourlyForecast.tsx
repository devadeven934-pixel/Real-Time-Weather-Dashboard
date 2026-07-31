import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { Thermometer, CloudRain, Wind, Sun, Cloud, Snowflake, CloudLightning } from 'lucide-react';
import { HourlyForecastItem, TemperatureUnit } from '../types/weather';
import { getWeatherCodeInfo, formatTemp, formatWindSpeed } from '../utils/weatherUtils';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  unit: TemperatureUnit;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, unit }) => {
  const [metric, setMetric] = useState<'temp' | 'rain' | 'wind'>('temp');

  // Format data for chart
  const chartData = hourly.slice(0, 24).map((item) => {
    const timeLabel = new Date(item.time).toLocaleTimeString([], { hour: 'numeric' });
    const tempVal = unit === 'F' ? Math.round((item.temperature * 9) / 5 + 32) : Math.round(item.temperature);
    const windVal = unit === 'F' ? Math.round(item.windSpeed * 0.621371) : Math.round(item.windSpeed);

    return {
      time: timeLabel,
      rawTime: item.time,
      Temperature: tempVal,
      Precipitation: item.precipitationProbability,
      Wind: windVal,
      code: item.weatherCode,
      isDay: item.isDay,
    };
  });

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>24-Hour Interactive Timeline</span>
            <span className="text-xs font-normal text-slate-400">Hourly weather trajectory</span>
          </h3>
        </div>

        {/* Chart metric toggle */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMetric('temp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              metric === 'temp' ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temperature (°{unit})
          </button>
          <button
            onClick={() => setMetric('rain')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              metric === 'rain' ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rain Chance (%)
          </button>
          <button
            onClick={() => setMetric('wind')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              metric === 'wind' ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wind Speed
          </button>
        </div>
      </div>

      {/* Recharts Area Chart View */}
      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="windGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                      <div className="font-semibold text-slate-200">{data.time}</div>
                      <div className="text-cyan-400 font-bold mt-1">
                        Temp: {data.Temperature}°{unit}
                      </div>
                      <div className="text-blue-400 mt-0.5">Rain Chance: {data.Precipitation}%</div>
                      <div className="text-purple-400 mt-0.5">Wind: {data.Wind} {unit === 'F' ? 'mph' : 'km/h'}</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {metric === 'temp' && (
              <Area type="monotone" dataKey="Temperature" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#tempGradient)" />
            )}
            {metric === 'rain' && (
              <Bar dataKey="Precipitation" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
            )}
            {metric === 'wind' && (
              <Area type="monotone" dataKey="Wind" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#windGradient)" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scrollable Hourly Cards Timeline */}
      <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        {hourly.slice(0, 24).map((item, idx) => {
          const timeStr = new Date(item.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          const code = getWeatherCodeInfo(item.weatherCode, item.isDay);

          return (
            <div
              key={idx}
              className={`flex-shrink-0 w-24 p-3 rounded-2xl border text-center transition-all ${
                idx === 0
                  ? 'bg-gradient-to-b from-cyan-500/20 to-slate-900 border-cyan-500/40 text-white shadow-lg'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="text-xs font-semibold text-slate-400">{idx === 0 ? 'Now' : timeStr}</div>
              <div className="my-2.5 flex justify-center text-amber-400">
                <Sun className="w-6 h-6" />
              </div>
              <div className="text-base font-bold text-white">{formatTemp(item.temperature, unit)}</div>
              <div className="text-[11px] text-blue-400 font-medium mt-1 flex items-center justify-center gap-1">
                <CloudRain className="w-3 h-3" />
                <span>{item.precipitationProbability}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
