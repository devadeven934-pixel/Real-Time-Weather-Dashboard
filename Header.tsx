import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, RefreshCw, Thermometer, Radio, Check, Globe, Sparkles, Navigation } from 'lucide-react';
import { CityLocation, TemperatureUnit } from '../types/weather';
import { searchCities } from '../services/openMeteo';

interface HeaderProps {
  currentCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  savedCities: CityLocation[];
  onToggleSaveCity: (city: CityLocation) => void;
  unit: TemperatureUnit;
  onToggleUnit: () => void;
  autoRefreshInterval: number; // in seconds (0 = off, 10, 30, 60)
  onChangeAutoRefresh: (seconds: number) => void;
  onRefreshNow: () => void;
  isRefreshing: boolean;
  onUseGeolocation: () => void;
  activeTab: 'dashboard' | 'map' | 'multicity' | 'ai';
  onChangeTab: (tab: 'dashboard' | 'map' | 'multicity' | 'ai') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCity,
  onSelectCity,
  savedCities,
  onToggleSaveCity,
  unit,
  onToggleUnit,
  autoRefreshInterval,
  onChangeAutoRefresh,
  onRefreshNow,
  isRefreshing,
  onUseGeolocation,
  activeTab,
  onChangeTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchCities(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setShowDropdown(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrentSaved = savedCities.some((c) => c.id === currentCity.id || (c.name === currentCity.name && c.country === currentCity.country));

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Live Status */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChangeTab('dashboard')}>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
                <Radio className="w-5 h-5 text-white animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  AETHER <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">REAL-TIME</span>
                </h1>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Live Telemetry Engine</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-500"></span>
                  <span className="text-emerald-400 font-medium">99.9% Station Sync</span>
                </p>
              </div>
            </div>

            {/* Mobile quick controls */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onToggleUnit}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                °{unit}
              </button>
              <button
                onClick={onRefreshNow}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div ref={searchRef} className="relative w-full md:max-w-md">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search city, region, or global coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                className="w-full pl-10 pr-20 py-2 text-sm bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
              <button
                onClick={onUseGeolocation}
                title="Use current geolocation"
                className="absolute right-2.5 px-2 py-1 flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 rounded-lg border border-cyan-800/50 transition-all"
              >
                <Navigation className="w-3 h-3" />
                <span className="hidden sm:inline">GPS</span>
              </button>
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-slate-800/60">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    Searching global meteorological locations...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        onSelectCity(city);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-800/90 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-sm font-medium text-slate-100">{city.name}</div>
                          <div className="text-xs text-slate-400">
                            {city.admin1 ? `${city.admin1}, ` : ''}
                            {city.country}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                        {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No matching locations found</div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Control Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Unit switch */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-xl border border-slate-700/80">
              <button
                onClick={() => unit !== 'C' && onToggleUnit()}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  unit === 'C' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => unit !== 'F' && onToggleUnit()}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  unit === 'F' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>

            {/* Auto Refresh selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/80 text-xs">
              <span className="text-slate-400">Live:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-slate-900 text-slate-200">Off</option>
                <option value={10} className="bg-slate-900 text-slate-200">10s</option>
                <option value={30} className="bg-slate-900 text-slate-200">30s</option>
                <option value={60} className="bg-slate-900 text-slate-200">60s</option>
              </select>
            </div>

            {/* Manual Refresh button */}
            <button
              onClick={onRefreshNow}
              disabled={isRefreshing}
              title="Sync latest weather data"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Quick Cities Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Main Navigation */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Telemetry
            </button>
            <button
              onClick={() => onChangeTab('map')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'map' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite & Radar Map
            </button>
            <button
              onClick={() => onChangeTab('multicity')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'multicity' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-City Grid
            </button>
            <button
              onClick={() => onChangeTab('ai')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Weather Insights</span>
            </button>
          </div>

          {/* Quick Favorite Cities */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
            <span className="text-slate-500 text-[11px] uppercase font-semibold tracking-wider">Quick Switch:</span>
            {savedCities.map((city) => {
              const isActive = city.id === currentCity.id || city.name === currentCity.name;
              return (
                <button
                  key={city.id}
                  onClick={() => onSelectCity(city)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  {city.name}
                </button>
              );
            })}
            <button
              onClick={() => onToggleSaveCity(currentCity)}
              title={isCurrentSaved ? 'Remove from quick bar' : 'Pin current city'}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                isCurrentSaved ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
              }`}
            >
              {isCurrentSaved ? '★ Pinned' : '+ Pin'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
