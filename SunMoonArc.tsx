import React from 'react';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

interface SunMoonArcProps {
  sunrise: string; // ISO string or time string e.g. "06:12 AM"
  sunset: string;  // ISO string or time string e.g. "07:45 PM"
  isDay: boolean;
}

export const SunMoonArc: React.FC<SunMoonArcProps> = ({ sunrise, sunset, isDay }) => {
  // Format times nicely
  const formatTimeStr = (str: string) => {
    if (!str) return '--:--';
    if (str.includes('T')) {
      const d = new Date(str);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return str;
  };

  // Calculate position along arc based on current time vs sunrise and sunset
  const getProgress = () => {
    try {
      const now = new Date();
      let riseDate = new Date();
      let setDate = new Date();

      if (sunrise && sunrise.includes('T')) riseDate = new Date(sunrise);
      else riseDate.setHours(6, 0, 0, 0);

      if (sunset && sunset.includes('T')) setDate = new Date(sunset);
      else setDate.setHours(19, 30, 0, 0);

      const totalDayMs = setDate.getTime() - riseDate.getTime();
      const currentMs = now.getTime() - riseDate.getTime();

      if (totalDayMs <= 0) return 0.5;
      const ratio = currentMs / totalDayMs;
      return Math.max(0.05, Math.min(0.95, ratio));
    } catch {
      return 0.5;
    }
  };

  const progress = getProgress();
  // Map progress (0 to 1) to angle along semi-circle (180deg to 0deg)
  const angle = Math.PI - progress * Math.PI;
  const radius = 70;
  const cx = 100;
  const cy = 85;
  const x = cx + radius * Math.cos(angle);
  const y = cy - radius * Math.sin(angle);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-[240px] h-[100px]">
        {/* Semi-circle arc path */}
        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
          <path
            d="M 30 85 A 70 70 0 0 1 170 85"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 4"
            className="text-slate-300 dark:text-slate-700"
          />
          {/* Active daylight path */}
          <path
            d="M 30 85 A 70 70 0 0 1 170 85"
            fill="none"
            stroke="url(#sun-gradient)"
            strokeWidth="3"
            strokeDasharray="220"
            strokeDashoffset={220 * (1 - progress)}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="sun-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Base horizon line */}
          <line x1="15" y1="85" x2="185" y2="85" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-slate-800" />

          {/* Current Sun/Moon node */}
          <g transform={`translate(${x}, ${y})`} className="transition-all duration-700 ease-out">
            <circle r="14" className={isDay ? "fill-amber-400/30 animate-pulse" : "fill-indigo-400/30"} />
            <circle r="8" className={isDay ? "fill-amber-500 shadow-lg shadow-amber-500/50" : "fill-indigo-300 shadow-lg shadow-indigo-400/50"} />
          </g>
        </svg>

        {/* Sunrise and Sunset labels */}
        <div className="absolute bottom-0 left-0 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Sunrise className="w-3.5 h-3.5 text-amber-500" />
          <span>{formatTimeStr(sunrise)}</span>
        </div>
        <div className="absolute bottom-0 right-0 flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          <Sunset className="w-3.5 h-3.5 text-orange-500" />
          <span>{formatTimeStr(sunset)}</span>
        </div>
      </div>
      <div className="mt-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
        {isDay ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Solar Day Cycle</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lunar Night Phase</span>
          </>
        )}
      </div>
    </div>
  );
};
