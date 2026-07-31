import React, { useState, useEffect } from 'react';
import { Radio, Activity, Play, Pause, Zap, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { TelemetryTick, CurrentWeather } from '../types/weather';

interface LiveTelemetryStreamProps {
  cityName: string;
  current: CurrentWeather;
}

export const LiveTelemetryStream: React.FC<LiveTelemetryStreamProps> = ({ cityName, current }) => {
  const [ticks, setTicks] = useState<TelemetryTick[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize ticks
  useEffect(() => {
    const stationCode = `STN-${cityName.substring(0, 3).toUpperCase()}-9`;
    const now = new Date();

    const initial: TelemetryTick[] = [
      {
        id: '1',
        timestamp: new Date(now.getTime() - 2000).toLocaleTimeString(),
        parameter: 'Wind Speed',
        value: `${Math.round(current.windSpeed)} km/h`,
        delta: '+0.4 km/h',
        status: 'normal',
        stationId: stationCode,
      },
      {
        id: '2',
        timestamp: new Date(now.getTime() - 4000).toLocaleTimeString(),
        parameter: 'Barometric Pressure',
        value: `${current.pressure} hPa`,
        delta: '-0.12 hPa',
        status: 'normal',
        stationId: stationCode,
      },
      {
        id: '3',
        timestamp: new Date(now.getTime() - 6000).toLocaleTimeString(),
        parameter: 'Temperature',
        value: `${current.temperature.toFixed(1)} °C`,
        delta: '+0.05 °C',
        status: 'normal',
        stationId: stationCode,
      },
      {
        id: '4',
        timestamp: new Date(now.getTime() - 8000).toLocaleTimeString(),
        parameter: 'Solar Flux',
        value: `${Math.round(current.uvIndex * 85 + 120)} W/m²`,
        delta: '+2 W/m²',
        status: 'normal',
        stationId: stationCode,
      },
    ];

    setTicks(initial);
  }, [cityName, current]);

  // Sub-second telemetry generator
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const stationCode = `STN-${cityName.substring(0, 3).toUpperCase()}-9`;
      const now = new Date().toLocaleTimeString();

      const params = ['Wind Speed', 'Barometric Pressure', 'Temperature', 'Solar Flux', 'Humidity'] as const;
      const param = params[Math.floor(Math.random() * params.length)];

      let val = '';
      let delta = '';
      let status: 'normal' | 'shift' | 'spike' = 'normal';

      if (param === 'Wind Speed') {
        const gust = Math.random() > 0.8;
        const speed = current.windSpeed + (Math.random() * 8 - 4);
        val = `${Math.max(0, speed).toFixed(1)} km/h`;
        delta = `${(Math.random() * 2 - 1).toFixed(1)} km/h`;
        status = gust ? 'spike' : 'normal';
      } else if (param === 'Barometric Pressure') {
        const p = current.pressure + (Math.random() * 0.4 - 0.2);
        val = `${p.toFixed(2)} hPa`;
        delta = `${(Math.random() * 0.2 - 0.1).toFixed(2)} hPa`;
      } else if (param === 'Temperature') {
        const t = current.temperature + (Math.random() * 0.2 - 0.1);
        val = `${t.toFixed(2)} °C`;
        delta = `${(Math.random() * 0.1 - 0.05).toFixed(2)} °C`;
      } else if (param === 'Solar Flux') {
        const flux = Math.round(current.uvIndex * 85 + (Math.random() * 30 - 15));
        val = `${flux} W/m²`;
        delta = `${(Math.random() * 6 - 3).toFixed(1)} W/m²`;
      } else {
        const h = current.humidity + (Math.random() * 1.5 - 0.75);
        val = `${Math.min(100, Math.max(0, h)).toFixed(1)} %`;
        delta = `${(Math.random() * 0.4 - 0.2).toFixed(1)} %`;
      }

      const newTick: TelemetryTick = {
        id: Date.now().toString(),
        timestamp: now,
        parameter: param,
        value: val,
        delta,
        status,
        stationId: stationCode,
      };

      setTicks((prev) => [newTick, ...prev.slice(0, 6)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, cityName, current]);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Station Telemetry Feed</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                LIVE 1000ms
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real-time sensor micro-ticks from local weather station</p>
          </div>
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            isPaused
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5 text-slate-400" />}
          <span>{isPaused ? 'Resume Feed' : 'Pause Stream'}</span>
        </button>
      </div>

      {/* Stream Ticker Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ticks.map((tick) => {
          const isSpike = tick.status === 'spike';
          const isPositive = tick.delta.startsWith('+');

          return (
            <div
              key={tick.id}
              className={`p-3 rounded-xl border transition-all duration-500 ${
                isSpike
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">{tick.parameter}</span>
                <span>{tick.timestamp}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-lg font-bold text-white font-mono">{tick.value}</span>
                <span
                  className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {tick.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
