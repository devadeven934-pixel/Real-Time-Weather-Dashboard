import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, CloudRain, Sun, Wind, Droplets } from 'lucide-react';
import { DailyForecastItem, TemperatureUnit } from '../types/weather';
import { getWeatherCodeInfo, formatTemp, formatWindSpeed } from '../utils/weatherUtils';

interface SevenDayForecastProps {
  daily: DailyForecastItem[];
  unit: TemperatureUnit;
}

export const SevenDayForecast: React.FC<SevenDayForecastProps> = ({ daily, unit }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!daily || daily.length === 0) return null;

  // Calculate overall min/max across all 7 days to size the temperature spectrum bar
  const allMin = Math.min(...daily.map((d) => d.tempMin));
  const allMax = Math.max(...daily.map((d) => d.tempMax));
  const totalRange = allMax - allMin || 1;

  const formatDate = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span>7-Day Extended Weather Outlook</span>
        </h3>
        <span className="text-xs text-slate-400 font-medium">Daily Range Spectrum</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {daily.slice(0, 7).map((item, idx) => {
          const codeInfo = getWeatherCodeInfo(item.weatherCode, true);
          const isExpanded = expandedIndex === idx;

          // Calculate percent positions for low and high temp bar
          const leftPercent = ((item.tempMin - allMin) / totalRange) * 100;
          const widthPercent = Math.max(8, ((item.tempMax - item.tempMin) / totalRange) * 100);

          return (
            <div
              key={item.date}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded ? 'bg-slate-950/90 border-cyan-500/40 shadow-lg' : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/60'
              }`}
            >
              {/* Row Header */}
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer"
              >
                {/* Date & Weather Icon */}
                <div className="flex items-center gap-3 w-full sm:w-48">
                  <div className="text-sm font-bold text-slate-100 min-w-[90px]">{formatDate(item.date, idx)}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-amber-400 font-medium">{codeInfo.description}</span>
                  </div>
                </div>

                {/* Rain Chance % */}
                <div className="flex items-center gap-1 text-xs text-blue-400 font-medium w-20">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>{item.precipitationProbabilityMax}%</span>
                </div>

                {/* Temp spectrum bar */}
                <div className="flex items-center gap-3 w-full sm:w-64">
                  <span className="text-xs font-semibold text-slate-400 w-10 text-right">{formatTemp(item.tempMin, unit)}</span>
                  <div className="relative flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500"
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-10">{formatTemp(item.tempMax, unit)}</span>
                </div>

                {/* Expand Chevron */}
                <button className="text-slate-500 hover:text-slate-300">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Collapsible Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-900/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block">Sunrise / Sunset</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {item.sunrise ? new Date(item.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:15 AM'} /{' '}
                      {item.sunset ? new Date(item.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '07:45 PM'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block">Max UV Index</span>
                    <span className="font-semibold text-amber-400 mt-0.5 block">{item.uvIndexMax} of 12</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block">Peak Wind Speed</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">{formatWindSpeed(item.windSpeedMax, unit)}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block">Total Rainfall</span>
                    <span className="font-semibold text-blue-400 mt-0.5 block">{item.precipitationSum.toFixed(1)} mm</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
