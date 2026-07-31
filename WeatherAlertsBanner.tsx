import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { WeatherAlert } from '../types/weather';

interface WeatherAlertsBannerProps {
  alerts: WeatherAlert[];
}

export const WeatherAlertsBanner: React.FC<WeatherAlertsBannerProps> = ({ alerts }) => {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isExpanded = expandedAlertId === alert.id;
        const isDanger = alert.severity === 'danger';
        const isWarning = alert.severity === 'warning';

        const bgClass = isDanger
          ? 'bg-rose-950/70 border-rose-600/60 text-rose-100'
          : isWarning
          ? 'bg-amber-950/70 border-amber-600/60 text-amber-100'
          : 'bg-blue-950/70 border-blue-600/60 text-blue-100';

        return (
          <div
            key={alert.id}
            className={`rounded-2xl border p-4 backdrop-blur-md transition-all shadow-xl ${bgClass}`}
          >
            <div
              onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
              className="flex items-start justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-black/30 flex-shrink-0 mt-0.5">
                  <AlertTriangle className={`w-5 h-5 ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-blue-400'} animate-bounce`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold tracking-tight">{alert.title}</h4>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40 font-semibold">
                      {alert.category}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">{alert.description}</p>
                </div>
              </div>

              <button className="p-1 rounded-lg hover:bg-black/20 text-current transition-colors">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isExpanded && alert.safetyTips && alert.safetyTips.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-xs">
                <div className="font-semibold uppercase text-[10px] tracking-wider opacity-80">Safety Recommendations:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {alert.safetyTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-black/20 p-2 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
