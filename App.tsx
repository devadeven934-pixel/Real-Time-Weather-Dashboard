import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { LiveTelemetryStream } from './components/LiveTelemetryStream';
import { HourlyForecast } from './components/HourlyForecast';
import { SevenDayForecast } from './components/SevenDayForecast';
import { AirQualityCard } from './components/AirQualityCard';
import { WeatherMap } from './components/WeatherMap';
import { MultiCityGrid } from './components/MultiCityGrid';
import { AIWeatherInsights } from './components/AIWeatherInsights';
import { WeatherAlertsBanner } from './components/WeatherAlertsBanner';

import { CityLocation, TemperatureUnit, WeatherData } from './types/weather';
import { DEFAULT_CITIES, fetchWeatherData } from './services/openMeteo';
import { RefreshCw, Radio, Sparkles } from 'lucide-react';

export default function App() {
  const [currentCity, setCurrentCity] = useState<CityLocation>(DEFAULT_CITIES[0]);
  const [savedCities, setSavedCities] = useState<CityLocation[]>(() => {
    try {
      const saved = localStorage.getItem('aether_saved_cities');
      return saved ? JSON.parse(saved) : DEFAULT_CITIES;
    } catch {
      return DEFAULT_CITIES;
    }
  });

  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    return (localStorage.getItem('aether_temp_unit') as TemperatureUnit) || 'C';
  });

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'multicity' | 'ai'>('dashboard');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // seconds
  const [countdown, setCountdown] = useState<number>(10);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('aether_saved_cities', JSON.stringify(savedCities));
  }, [savedCities]);

  useEffect(() => {
    localStorage.setItem('aether_temp_unit', unit);
  }, [unit]);

  // Load weather data
  const loadWeather = useCallback(async (city: CityLocation, isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const data = await fetchWeatherData(city);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Failed to load weather:', err);
      setErrorMessage('Unable to retrieve weather data. Re-establishing meteorological connection...');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch when city changes
  useEffect(() => {
    loadWeather(currentCity);
    setCountdown(autoRefreshInterval);
  }, [currentCity, loadWeather]);

  // Live Auto-Refresh Timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadWeather(currentCity, true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, currentCity, loadWeather]);

  // Toggle unit
  const handleToggleUnit = () => {
    setUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  };

  // Save or unpin city
  const handleToggleSaveCity = (city: CityLocation) => {
    setSavedCities((prev) => {
      const exists = prev.some((c) => c.id === city.id || c.name === city.name);
      if (exists) return prev.filter((c) => c.id !== city.id && c.name !== city.name);
      return [...prev, city];
    });
  };

  // Browser Geolocation
  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const geoCity: CityLocation = {
          id: `geo-${Date.now()}`,
          name: 'Your Current Location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          country: 'Local Coordinates',
        };
        setCurrentCity(geoCity);
      },
      (error) => {
        setIsLoading(false);
        alert('Could not retrieve your location. Please select a city manually.');
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        currentCity={currentCity}
        onSelectCity={setCurrentCity}
        savedCities={savedCities}
        onToggleSaveCity={handleToggleSaveCity}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={(sec) => {
          setAutoRefreshInterval(sec);
          setCountdown(sec);
        }}
        onRefreshNow={() => {
          loadWeather(currentCity, true);
          setCountdown(autoRefreshInterval);
        }}
        isRefreshing={isRefreshing}
        onUseGeolocation={handleUseGeolocation}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Loading state */}
        {isLoading && !weatherData ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Establishing Station Telemetry</h3>
              <p className="text-xs text-slate-400 mt-1">Downloading atmospheric metrics for {currentCity.name}...</p>
            </div>
          </div>
        ) : errorMessage && !weatherData ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <p className="text-rose-400 text-sm font-medium">{errorMessage}</p>
            <button
              onClick={() => loadWeather(currentCity)}
              className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : weatherData ? (
          <>
            {/* Severe Weather Alerts Banner */}
            <WeatherAlertsBanner alerts={weatherData.alerts} />

            {/* TAB 1: Live Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Hero Current Weather */}
                <CurrentWeatherCard
                  current={weatherData.current}
                  location={weatherData.location}
                  unit={unit}
                  todayForecast={weatherData.daily[0]}
                  lastUpdated={weatherData.lastUpdated}
                />

                {/* Real-time station telemetry stream */}
                <LiveTelemetryStream cityName={weatherData.location.name} current={weatherData.current} />

                {/* 24-hour hourly forecast timeline */}
                <HourlyForecast hourly={weatherData.hourly} unit={unit} />

                {/* Grid 2 cols: 7-Day & Air Quality */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7">
                    <SevenDayForecast daily={weatherData.daily} unit={unit} />
                  </div>
                  <div className="lg:col-span-5">
                    <AirQualityCard airQuality={weatherData.airQuality} />
                  </div>
                </div>

                {/* Gemini AI Summary Banner */}
                <AIWeatherInsights weatherData={weatherData} unit={unit} />
              </div>
            )}

            {/* TAB 2: Interactive Radar Map */}
            {activeTab === 'map' && (
              <WeatherMap location={weatherData.location} current={weatherData.current} unit={unit} />
            )}

            {/* TAB 3: Multi-City Grid */}
            {activeTab === 'multicity' && (
              <MultiCityGrid
                savedCities={savedCities}
                onSelectCity={(city) => {
                  setCurrentCity(city);
                  setActiveTab('dashboard');
                }}
                onRemoveCity={(city) => handleToggleSaveCity(city)}
                unit={unit}
              />
            )}

            {/* TAB 4: AI Insights Dedicated View */}
            {activeTab === 'ai' && <AIWeatherInsights weatherData={weatherData} unit={unit} />}
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© AETHER Real-Time Weather Dashboard • Global Meteorological Telemetry</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Open-Meteo API</span>
            <span>•</span>
            <span>Gemini AI Engine</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Live Sync Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
