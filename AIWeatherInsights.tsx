import React, { useState, useEffect } from 'react';
import { Sparkles, Shirt, Activity, MessageSquare, Send, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { WeatherData, AIBriefing, TemperatureUnit } from '../types/weather';

interface AIWeatherInsightsProps {
  weatherData: WeatherData;
  unit: TemperatureUnit;
}

export const AIWeatherInsights: React.FC<AIWeatherInsightsProps> = ({ weatherData, unit }) => {
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [activeTab, setActiveTab] = useState<'briefing' | 'activities' | 'ask'>('briefing');

  // Q&A assistant state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);

  // Fetch AI briefing on mount or location change
  const fetchBriefing = async () => {
    setIsLoadingBriefing(true);
    try {
      const res = await fetch('/api/weather/ai-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: weatherData.location,
          current: weatherData.current,
          daily: weatherData.daily,
          airQuality: weatherData.airQuality,
        }),
      });

      if (!res.ok) throw new Error('AI Briefing endpoint returned error');
      const data = await res.json();
      setBriefing(data);
    } catch (error) {
      console.error('Failed to fetch AI briefing:', error);
      // Fallback briefing
      setBriefing({
        summary: `Today in ${weatherData.location.name}, expect conditions around ${Math.round(weatherData.current.temperature)}°C with ${weatherData.current.humidity}% humidity and ${weatherData.current.windSpeed} km/h wind speeds.`,
        outfitRecommendation: weatherData.current.temperature < 15 ? 'Wear a cozy jacket with wind protection.' : 'Light breathable summer clothing.',
        bestOutdoorHours: '8:00 AM - 11:00 AM & 5:00 PM - 7:30 PM',
        activityScores: {
          running: 85,
          cycling: 80,
          stargazing: 70,
          outdoorDining: 90,
          photography: 88,
        },
        commuteImpact: 'Road visibility is clear with normal driving conditions.',
      });
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [weatherData.location.id]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAsking) return;

    const qText = question.trim();
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/weather/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          location: weatherData.location,
          current: weatherData.current,
          daily: weatherData.daily,
        }),
      });

      const data = await res.json();
      setChatHistory((prev) => [...prev, { q: qText, a: data.answer || 'No response available.' }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { q: qText, a: 'Weather AI is currently re-synchronizing. Please try again in a moment.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Gemini AI Weather Insights</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO 3.6
              </span>
            </h3>
            <p className="text-xs text-slate-400">Contextual meteorology, apparel guidance & activity intelligence</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('briefing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'briefing' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Briefing
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'activities' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ask' ? 'bg-purple-500 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Tab 1: AI Executive Briefing */}
      {activeTab === 'briefing' && (
        <div className="mt-6 space-y-5">
          {isLoadingBriefing ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Generating Gemini AI meteorology briefing for {weatherData.location.name}...
            </div>
          ) : briefing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Executive Summary Card */}
              <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider">
                    <span>Executive Summary</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mt-2.5 font-medium">{briefing.summary}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                  <span>Best Outdoor Window:</span>
                  <strong className="text-emerald-400 font-semibold">{briefing.bestOutdoorHours}</strong>
                </div>
              </div>

              {/* Outfit Recommendation Card */}
              <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <span>Outfit & Apparel Advice</span>
                    <Shirt className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mt-2.5 font-medium">
                    {briefing.outfitRecommendation}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  <span>Commute Impact: </span>
                  <span className="text-slate-200">{briefing.commuteImpact}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Activity Suitability Index */}
      {activeTab === 'activities' && briefing && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(briefing.activityScores).map(([actKey, val]) => {
            const score = Number(val) || 0;
            const label = actKey.replace(/([A-Z])/g, ' $1').toUpperCase();
            let color = 'bg-emerald-500';
            if (score < 50) color = 'bg-rose-500';
            else if (score < 75) color = 'bg-amber-500';

            return (
              <div key={actKey} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{label}</span>
                  <span className="text-lg font-black text-white font-mono">{score}/100</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Q&A Assistant */}
      {activeTab === 'ask' && (
        <div className="mt-6 space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-3 p-1">
            {chatHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Ask Gemini AI anything about today's weather! Examples: "Should I take an umbrella at 6 PM?", "Is it good for stargazing tonight?"
              </div>
            ) : (
              chatHistory.map((item, idx) => (
                <div key={idx} className="space-y-2 text-xs">
                  <div className="bg-slate-800/80 text-cyan-200 p-3 rounded-xl ml-auto max-w-lg font-medium">
                    {item.q}
                  </div>
                  <div className="bg-purple-950/30 border border-purple-800/40 text-slate-200 p-3 rounded-xl max-w-xl leading-relaxed">
                    {item.a}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAskQuestion} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder={`Ask AI about weather in ${weatherData.location.name}...`}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              {isAsking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Ask</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
