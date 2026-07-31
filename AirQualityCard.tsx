import React from 'react';
import { Wind, ShieldCheck, Heart, AlertCircle, Info } from 'lucide-react';
import { AirQualityData } from '../types/weather';

interface AirQualityCardProps {
  airQuality: AirQualityData;
}

export const AirQualityCard: React.FC<AirQualityCardProps> = ({ airQuality }) => {
  // Gauge progress percentage (capped at 300)
  const percent = Math.min(100, Math.max(5, (airQuality.aqi / 300) * 100));

  const pollutants = [
    { name: 'PM 2.5', value: `${airQuality.pm2_5.toFixed(1)} µg/m³`, desc: 'Fine particulate matter' },
    { name: 'PM 10', value: `${airQuality.pm10.toFixed(1)} µg/m³`, desc: 'Coarse particulate matter' },
    { name: 'Ozone (O₃)', value: `${airQuality.o3.toFixed(1)} µg/m³`, desc: 'Ground-level ozone' },
    { name: 'Nitrogen Dioxide (NO₂)', value: `${airQuality.no2.toFixed(1)} µg/m³`, desc: 'Traffic & combustion' },
    { name: 'Sulphur Dioxide (SO₂)', value: `${airQuality.so2.toFixed(1)} µg/m³`, desc: 'Industrial emissions' },
    { name: 'Carbon Monoxide (CO)', value: `${airQuality.co.toFixed(0)} µg/m³`, desc: 'Incomplete combustion' },
  ];

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Air Quality & Respiratory Index</h3>
        </div>
        <span className="text-xs text-slate-400">US AQI Standard</span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Main AQI Score Gauge (5 cols) */}
        <div className="md:col-span-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center text-center">
          <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">Air Quality Index</div>
          <div className="text-5xl font-black text-white mt-2 font-mono">{airQuality.aqi}</div>
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${airQuality.statusColor} bg-slate-900`}>
            {airQuality.statusLabel}
          </div>

          {/* Progress bar */}
          <div className="w-full mt-5">
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
              <span>0 (Good)</span>
              <span>100 (Mod)</span>
              <span>200 (Unhealthy)</span>
              <span>300+</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-300 leading-relaxed bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>{airQuality.healthAdvice}</span>
          </div>
        </div>

        {/* Pollutant Breakdown Matrix (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {pollutants.map((p) => (
            <div key={p.name} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-400">{p.name}</div>
              <div className="text-base font-bold text-white mt-1 font-mono">{p.value}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
