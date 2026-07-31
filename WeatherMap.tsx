import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Play, Pause, Maximize2, MapPin, Radio, Compass, Plus, Minus, Target, ZoomIn, ZoomOut } from 'lucide-react';
import { CityLocation, CurrentWeather, TemperatureUnit } from '../types/weather';
import { formatTemp } from '../utils/weatherUtils';

interface WeatherMapProps {
  location: CityLocation;
  current: CurrentWeather;
  unit: TemperatureUnit;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({ location, current, unit }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<'precipitation' | 'clouds' | 'wind' | 'temp' | 'satellite_ir'>('precipitation');
  const [tileStyle, setTileStyle] = useState<'satellite' | 'dark' | 'standard'>('satellite');
  const [currentZoom, setCurrentZoom] = useState<number>(7);

  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  // Fix Leaflet marker default icon issue
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Base tile style change handler
  const updateBaseMap = (map: L.Map, style: 'satellite' | 'dark' | 'standard') => {
    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let attribution = '&copy; Esri &mdash; Earthstar Geographics';
    let maxNativeZoom = 18;

    if (style === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap & CartoDB';
      maxNativeZoom = 19;
    } else if (style === 'standard') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxNativeZoom = 19;
    }

    const newBase = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      maxNativeZoom,
    }).addTo(map);
    baseLayerRef.current = newBase;

    // If satellite view, add transparent boundary and city label layer on top for clarity
    if (style === 'satellite') {
      const labelUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
      const newLabels = L.tileLayer(labelUrl, {
        opacity: 0.85,
        maxZoom: 19,
        maxNativeZoom: 18,
      }).addTo(map);
      labelsLayerRef.current = newLabels;
    }
  };

  // ResizeObserver to automatically call invalidateSize when container resizes or tab opens
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize or update map view
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.latitude, location.longitude],
        zoom: 11,
        minZoom: 2,
        maxZoom: 19,
        zoomControl: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
      });

      // Track zoom level changes
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });

      // Add selected base tile layer
      updateBaseMap(map, tileStyle);

      // Add RainViewer / OpenWeather radar overlay with proper tile stretching
      const radarUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2';
      const radarTile = L.tileLayer(radarUrl, {
        opacity: 0.65,
        maxZoom: 19,
        maxNativeZoom: 18,
      }).addTo(map);
      radarLayerRef.current = radarTile;

      // Custom marker
      const marker = L.marker([location.latitude, location.longitude])
        .addTo(map)
        .bindPopup(
          `<div style="color:#0f172a; font-family:sans-serif; text-align:center;">
            <strong>${location.name}</strong><br/>
            <span style="font-size:16px; font-weight:bold; color:#0284c7;">${formatTemp(current.temperature, unit)}</span>
          </div>`
        )
        .openPopup();

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Ensure proper sizing after rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } else {
      // Update center & marker with large close-up zoom level 11
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], Math.max(11, mapInstanceRef.current.getZoom()), {
        duration: 1.2,
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
        markerRef.current.setPopupContent(
          `<div style="color:#0f172a; font-family:sans-serif; text-align:center;">
            <strong>${location.name}</strong><br/>
            <span style="font-size:16px; font-weight:bold; color:#0284c7;">${formatTemp(current.temperature, unit)}</span>
          </div>`
        );
      }
    }
  }, [location, current, unit]);

  // Handle tile style switch
  const handleTileStyleChange = (style: 'satellite' | 'dark' | 'standard') => {
    setTileStyle(style);
    if (mapInstanceRef.current) {
      updateBaseMap(mapInstanceRef.current, style);
    }
  };

  // Update overlay layer based on selected weather layer
  const handleLayerChange = (layerType: 'precipitation' | 'clouds' | 'wind' | 'temp' | 'satellite_ir') => {
    setActiveLayer(layerType);
    if (!mapInstanceRef.current) return;

    if (radarLayerRef.current) {
      mapInstanceRef.current.removeLayer(radarLayerRef.current);
    }

    let urlType = 'precipitation_new';
    let opacity = 0.65;
    if (layerType === 'clouds') urlType = 'clouds_new';
    else if (layerType === 'wind') urlType = 'wind_new';
    else if (layerType === 'temp') urlType = 'temp_new';
    else if (layerType === 'satellite_ir') {
      urlType = 'clouds_new';
      opacity = 0.85;
    }

    const radarUrl = `https://tile.openweathermap.org/map/${urlType}/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2`;
    const newRadar = L.tileLayer(radarUrl, {
      opacity,
      maxZoom: 19,
      maxNativeZoom: 18,
    }).addTo(mapInstanceRef.current);
    radarLayerRef.current = newRadar;
  };

  // Manual zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], 12, { duration: 1.2 });
    }
  };

  const handleSetZoomLevel = (zoomLevel: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoomLevel);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xl flex flex-col space-y-4">
      {/* Header & Map Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>Interactive Weather Radar & Satellite Map</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Orbital HD
            </span>
          </h3>
          <p className="text-xs text-slate-400">High-resolution Earth observation satellite imagery & meteorological overlays</p>
        </div>

        {/* Weather Overlays Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => handleLayerChange('precipitation')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'precipitation' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Precipitation
          </button>
          <button
            onClick={() => handleLayerChange('clouds')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'clouds' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cloud Cover
          </button>
          <button
            onClick={() => handleLayerChange('satellite_ir')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'satellite_ir' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            IR Satellite
          </button>
          <button
            onClick={() => handleLayerChange('wind')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'wind' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wind Vector
          </button>
          <button
            onClick={() => handleLayerChange('temp')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeLayer === 'temp' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Temperature
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Zoom Control Bar (Top Left Overlay) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 transition-all font-bold shadow"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 transition-all font-bold shadow"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="my-0.5 border-t border-slate-800" />
          <button
            onClick={handleRecenter}
            title={`Recenter map on ${location.name}`}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 transition-all font-bold shadow"
          >
            <Target className="w-4 h-4" />
          </button>

          {/* Quick Zoom Preset Buttons */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[10px] font-mono">
            <span className="text-[9px] text-slate-500 text-center font-sans uppercase">Scale</span>
            <button
              onClick={() => handleSetZoomLevel(13)}
              className={`px-2 py-1 rounded-lg text-center transition-colors ${
                currentZoom === 13 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              13x Close
            </button>
            <button
              onClick={() => handleSetZoomLevel(11)}
              className={`px-2 py-1 rounded-lg text-center transition-colors ${
                currentZoom === 11 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              11x City
            </button>
            <button
              onClick={() => handleSetZoomLevel(8)}
              className={`px-2 py-1 rounded-lg text-center transition-colors ${
                currentZoom === 8 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              8x Region
            </button>
            <button
              onClick={() => handleSetZoomLevel(5)}
              className={`px-2 py-1 rounded-lg text-center transition-colors ${
                currentZoom === 5 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              5x World
            </button>
          </div>
        </div>

        {/* Base Map Style Switcher (Top Right Overlay) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl text-xs shadow-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-mono px-2 hidden sm:inline">Basemap:</span>
          <button
            onClick={() => handleTileStyleChange('satellite')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              tileStyle === 'satellite' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🛰️ Satellite
          </button>
          <button
            onClick={() => handleTileStyleChange('dark')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              tileStyle === 'dark' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌙 Dark
          </button>
          <button
            onClick={() => handleTileStyleChange('standard')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              tileStyle === 'standard' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ Street
          </button>
        </div>

        {/* Legend & Zoom Level Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl text-xs space-y-1.5 shadow-2xl">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Active Layer: {activeLayer.replace('_', ' ').toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>Map Mode: <strong className="text-slate-200 capitalize">{tileStyle} View</strong></span>
            <span>•</span>
            <span className="font-mono text-cyan-400 font-bold">Zoom: Level {currentZoom}</span>
          </div>
          {activeLayer === 'precipitation' && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              <span className="w-3 h-3 rounded bg-blue-400/40" /> Light
              <span className="w-3 h-3 rounded bg-blue-600/70 ml-2" /> Moderate
              <span className="w-3 h-3 rounded bg-purple-600/90 ml-2" /> Heavy
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
