'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Map as MapLibreMap, Marker as MapLibreMarker, GeoJSONSource, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Fix Next.js/Turbopack worker bundling: configure standalone worker URL
if (typeof window !== 'undefined') {
  setWorkerUrl('https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl-worker.mjs');
}
import { Airport, SimulatedFlight, DisruptionInput } from '@/types/aviation';
import { interpolateGreatCircle, calculateBearing, generateArcLineString } from '@/engine/geo-utils';
import { timeToMinutes } from '@/engine/time-utils';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Plane,
  CloudLightning,
  Eye,
  Crosshair,
} from 'lucide-react';

export interface FlightradarGeoMapProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  disruption: DisruptionInput | null;
  simulationTime: string; // 'HH:mm'
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
  selectedAirportIata: string | null;
  onSelectAirport: (iata: string | null) => void;
  filterMode?: 'ALL' | 'AIRBORNE' | 'DELAYED' | 'CANCELLED' | 'RECOVERED';
  showAllRoutes?: boolean;
}

// Center of Indian Subcontinent for optimal aviation view
const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
const DEFAULT_ZOOM = 4.2;

export const FlightradarGeoMap: React.FC<FlightradarGeoMapProps> = ({
  airports,
  flights,
  disruption,
  simulationTime,
  selectedFlightNumber,
  onSelectFlight,
  selectedAirportIata,
  onSelectAirport,
  filterMode = 'ALL',
  showAllRoutes = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Layer toggle states
  const [routeDisplayMode, setRouteDisplayMode] = useState<'ALL' | 'ACTIVE_ONLY' | 'SELECTED_ONLY'>('ALL');
  const [showAirportLabels, setShowAirportLabels] = useState<boolean>(true);
  const [cursorCoordinates, setCursorCoordinates] = useState<[number, number]>(INDIA_CENTER);
  const [hoveredFlight, setHoveredFlight] = useState<SimulatedFlight | null>(null);

  // Markers refs to allow incremental updates without re-instantiating the whole map
  const aircraftMarkersRef = useRef<Map<string, { marker: MapLibreMarker; el: HTMLDivElement }>>(new Map());
  const airportMarkersRef = useRef<Map<string, { marker: MapLibreMarker; el: HTMLDivElement }>>(new Map());

  // Airport lookup dictionary
  const airportLookup = useMemo(() => {
    const map = new Map<string, Airport>();
    for (const a of airports) {
      map.set(a.iata, a);
    }
    return map;
  }, [airports]);

  // Current simulation minutes
  const currentSimMinutes = timeToMinutes(simulationTime);

  // Disruption active window check
  const isDisruptionActiveAtAirport = useCallback(
    (iata: string): boolean => {
      if (!disruption || disruption.airport !== iata) return false;
      const start = timeToMinutes(disruption.startTime);
      const end = start + disruption.durationMinutes;
      return currentSimMinutes >= start && currentSimMinutes < end;
    },
    [disruption, currentSimMinutes]
  );

  const callbacksRef = useRef({ onSelectFlight, onSelectAirport });
  useEffect(() => {
    callbacksRef.current = { onSelectFlight, onSelectAirport };
  }, [onSelectFlight, onSelectAirport]);

  // 1. Initialize MapLibre GL Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // OpenFreeMap Dark MapLibre-compatible style (no API key required)
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: INDIA_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 3.0,
      maxZoom: 14,
      attributionControl: { compact: true },
    });

    map.on('error', e => {
      console.warn('MapLibre event:', e.error?.message || e);
    });

    map.on('load', () => {
      setMapLoaded(true);
      map.resize();

      // Route Sources and Layers
      map.addSource('network-routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Background route lines (All scheduled routes)
      map.addLayer({
        id: 'network-routes-base',
        type: 'line',
        source: 'network-routes',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            '#00F0FF',
            ['boolean', ['get', 'isCancelled'], false],
            '#EF4444',
            ['boolean', ['get', 'isRecovered'], false],
            '#10B981',
            ['>', ['get', 'delayMinutes'], 0],
            '#F59E0B',
            '#334155', // Nominal slate
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            3.5,
            ['boolean', ['get', 'isAirborne'], false],
            2.0,
            1.2,
          ],
          'line-opacity': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            1.0,
            ['boolean', ['get', 'isAirborne'], false],
            0.75,
            0.3,
          ],
          'line-dasharray': [
            'case',
            ['boolean', ['get', 'isCancelled'], false],
            ['literal', [2, 2]],
            ['literal', [1]],
          ],
        },
      });

      // Glow layer for selected flight route
      map.addLayer(
        {
          id: 'selected-route-glow',
          type: 'line',
          source: 'network-routes',
          filter: ['==', ['get', 'isSelected'], true],
          paint: {
            'line-color': '#00F0FF',
            'line-width': 10,
            'line-opacity': 0.35,
            'line-blur': 4,
          },
        },
        'network-routes-base'
      );
    });

    // Map mouse move updates cursor coordinate telemetry
    map.on('mousemove', e => {
      setCursorCoordinates([
        parseFloat(e.lngLat.lng.toFixed(4)),
        parseFloat(e.lngLat.lat.toFixed(4)),
      ]);
    });

    // Click on empty map deselects
    map.on('click', e => {
      // If click was on a marker, it will be handled by marker event
      const target = e.originalEvent.target as HTMLElement;
      if (!target.closest('.flightradar-marker') && !target.closest('.airport-marker')) {
        callbacksRef.current.onSelectFlight(null);
        callbacksRef.current.onSelectAirport(null);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Resize observer for responsive layout changes when drawers open/close
  useEffect(() => {
    if (!mapRef.current || !mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Update Great-Circle Flight Routes GeoJSON
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('network-routes') as GeoJSONSource;
    if (!source) return;

    const features: GeoJSON.Feature[] = [];

    flights.forEach(flight => {
      const orig = airportLookup.get(flight.origin);
      const dest = airportLookup.get(flight.destination);
      if (!orig || !dest) return;

      const isSelected = flight.flightNumber === selectedFlightNumber;
      const depMins = timeToMinutes(flight.actualDeparture);
      const arrMins = timeToMinutes(flight.actualArrival);
      const isAirborne =
        currentSimMinutes >= depMins && currentSimMinutes < arrMins && flight.status !== 'CANCELLED';

      const delayMins = Math.max(flight.departureDelayMinutes, flight.arrivalDelayMinutes);

      // Visibility filters
      if (routeDisplayMode === 'SELECTED_ONLY' && !isSelected) return;
      if (routeDisplayMode === 'ACTIVE_ONLY' && !isAirborne && !isSelected) return;
      if (!showAllRoutes && !isAirborne && !isSelected) return;

      if (filterMode === 'AIRBORNE' && !isAirborne) return;
      if (filterMode === 'DELAYED' && delayMins <= 0) return;
      if (filterMode === 'CANCELLED' && flight.status !== 'CANCELLED') return;
      if (filterMode === 'RECOVERED' && flight.status !== 'RECOVERED') return;

      const coordinates = generateArcLineString(orig.lat, orig.lng, dest.lat, dest.lng, 30);

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          flightNumber: flight.flightNumber,
          origin: flight.origin,
          destination: flight.destination,
          delayMinutes: delayMins,
          isSelected,
          isAirborne,
          isCancelled: flight.status === 'CANCELLED',
          isRecovered: flight.status === 'RECOVERED',
        },
      });
    });

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [
    mapLoaded,
    flights,
    airportLookup,
    selectedFlightNumber,
    currentSimMinutes,
    routeDisplayMode,
    showAllRoutes,
    filterMode,
  ]);

  // 4. Update Airport Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const currentAirportMarkers = airportMarkersRef.current;

    airports.forEach(airport => {
      const isDisrupted = isDisruptionActiveAtAirport(airport.iata);
      const isSelected = airport.iata === selectedAirportIata;

      let markerRecord = currentAirportMarkers.get(airport.iata);

      if (!markerRecord) {
        const el = document.createElement('div');
        el.className = 'airport-marker cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#00F0FF] rounded-full';
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `Airport ${airport.iata}, ${airport.city}`);
        
        el.addEventListener('click', e => {
          e.stopPropagation();
          onSelectAirport(airport.iata);
          onSelectFlight(null);
        });

        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelectAirport(airport.iata);
            onSelectFlight(null);
          }
        });

        const marker = new MapLibreMarker({ element: el, anchor: 'center' })
          .setLngLat([airport.lng, airport.lat])
          .addTo(map);

        markerRecord = { marker, el };
        currentAirportMarkers.set(airport.iata, markerRecord);
      }

      // Update marker DOM content
      const { el } = markerRecord;
      el.innerHTML = `
        <div class="relative group flex items-center justify-center">
          ${
            isDisrupted
              ? `<div class="absolute -inset-3 rounded-full bg-red-500/20 border border-red-500 animate-ping"></div>
                 <div class="absolute -inset-2 rounded-full bg-red-500/30 animate-pulse"></div>`
              : ''
          }
          <div class="w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 ${
            isSelected
              ? 'bg-[#00F0FF] border-white text-slate-950 font-black shadow-[0_0_15px_#00F0FF] scale-125 z-30'
              : isDisrupted
              ? 'bg-red-600 border-red-400 text-white font-black shadow-[0_0_12px_#EF4444] z-20'
              : 'bg-[#0F172A] border-slate-600 text-slate-300 font-bold hover:border-[#00F0FF] hover:text-[#00F0FF] z-10'
          }">
            <span class="text-[10px] tracking-tighter leading-none">${airport.iata}</span>
          </div>

          ${
            showAirportLabels
              ? `<div class="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-[#070B14]/90 border border-slate-700/60 text-[9px] font-mono text-slate-300 pointer-events-none transition-opacity ${
                  isSelected ? 'border-[#00F0FF] text-[#00F0FF] font-semibold' : ''
                }">
                  ${airport.city}
                </div>`
              : ''
          }
        </div>
      `;
    });
  }, [
    mapLoaded,
    airports,
    selectedAirportIata,
    isDisruptionActiveAtAirport,
    showAirportLabels,
    onSelectAirport,
    onSelectFlight,
  ]);

  // 5. Update Dynamic Airborne Aircraft Markers (Smooth interpolation & bearing rotation)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const currentAircraftMarkers = aircraftMarkersRef.current;

    // Track active flight numbers to prune landed/future ones
    const activeFlightIds = new Set<string>();

    flights.forEach(flight => {
      if (flight.status === 'CANCELLED') return;

      const depMins = timeToMinutes(flight.actualDeparture);
      const arrMins = timeToMinutes(flight.actualArrival);

      // Check if airborne at current simulation time
      const isAirborne = currentSimMinutes >= depMins && currentSimMinutes < arrMins;
      if (!isAirborne) return;

      const delayMins = Math.max(flight.departureDelayMinutes, flight.arrivalDelayMinutes);

      // Filter modes
      if (filterMode === 'DELAYED' && delayMins <= 0) return;
      if (filterMode === 'RECOVERED' && flight.status !== 'RECOVERED') return;

      activeFlightIds.add(flight.flightNumber);

      const orig = airportLookup.get(flight.origin);
      const dest = airportLookup.get(flight.destination);
      if (!orig || !dest) return;

      // Progress fraction [0..1]
      const duration = Math.max(1, arrMins - depMins);
      const progress = Math.max(0, Math.min(1, (currentSimMinutes - depMins) / duration));

      // Spherical great-circle position
      const pos = interpolateGreatCircle(orig.lat, orig.lng, dest.lat, dest.lng, progress);

      // Spherical heading towards target (look ahead slightly)
      const nextPos = interpolateGreatCircle(orig.lat, orig.lng, dest.lat, dest.lng, Math.min(1, progress + 0.05));
      const heading = calculateBearing(pos.lat, pos.lng, nextPos.lat, nextPos.lng);

      const isSelected = flight.flightNumber === selectedFlightNumber;
      const isDelayed = delayMins > 0;
      const isRecovered = flight.status === 'RECOVERED';

      // Flightradar24 Colors
      let planeColor = '#FFD700'; // Iconic Flightradar yellow
      let badgeBg = 'bg-[#1E293B] border-slate-600 text-yellow-400';
      if (isSelected) {
        planeColor = '#00F0FF'; // Electric cyan
        badgeBg = 'bg-[#00F0FF] border-white text-slate-950 font-bold';
      } else if (isDelayed) {
        planeColor = '#F59E0B'; // Amber
        badgeBg = 'bg-amber-950/80 border-amber-500/80 text-amber-400';
      } else if (isRecovered) {
        planeColor = '#10B981'; // Green
        badgeBg = 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400';
      }

      let markerRecord = currentAircraftMarkers.get(flight.flightNumber);

      if (!markerRecord) {
        const el = document.createElement('div');
        el.className = 'flightradar-marker cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#00F0FF] rounded-lg';
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `Flight ${flight.flightNumber}, ${flight.origin} to ${flight.destination}`);

        el.addEventListener('click', e => {
          e.stopPropagation();
          onSelectFlight(flight.flightNumber);
          onSelectAirport(null);
        });

        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelectFlight(flight.flightNumber);
            onSelectAirport(null);
          }
        });

        el.addEventListener('mouseenter', () => setHoveredFlight(flight));
        el.addEventListener('mouseleave', () => setHoveredFlight(null));

        const marker = new MapLibreMarker({ element: el, anchor: 'center' })
          .setLngLat([pos.lng, pos.lat])
          .addTo(map);

        markerRecord = { marker, el };
        currentAircraftMarkers.set(flight.flightNumber, markerRecord);
      } else {
        // Update marker position
        markerRecord.marker.setLngLat([pos.lng, pos.lat]);
      }

      // Update inner HTML of aircraft marker with rotatable SVG jet
      const { el } = markerRecord;
      el.style.zIndex = isSelected ? '50' : '30';
      el.innerHTML = `
        <div class="relative flex flex-col items-center group">
          <!-- Aircraft Jet Silhouette (Rotated according to heading) -->
          <div class="transition-transform duration-300 ease-out drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" style="transform: rotate(${heading}deg);">
            <svg viewBox="0 0 24 24" class="w-6 h-6" style="fill: ${planeColor};">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </div>

          <!-- Callsign Tag -->
          <div class="mt-0.5 px-1.5 py-0.2 rounded border text-[9px] font-mono leading-tight whitespace-nowrap shadow-md ${badgeBg}">
            ${flight.flightNumber}
            ${isDelayed ? `<span class="ml-1 text-[8px] font-semibold text-amber-300">+${delayMins}m</span>` : ''}
          </div>
        </div>
      `;
    });

    // Prune markers for flights no longer airborne
    for (const [flightNum, record] of currentAircraftMarkers.entries()) {
      if (!activeFlightIds.has(flightNum)) {
        record.marker.remove();
        currentAircraftMarkers.delete(flightNum);
      }
    }
  }, [
    mapLoaded,
    flights,
    airportLookup,
    currentSimMinutes,
    selectedFlightNumber,
    filterMode,
    onSelectFlight,
    onSelectAirport,
  ]);

  // 6. Camera follows selected flight or airport smoothly
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (selectedFlightNumber) {
      const flight = flights.find(f => f.flightNumber === selectedFlightNumber);
      if (flight) {
        const orig = airportLookup.get(flight.origin);
        const dest = airportLookup.get(flight.destination);
        if (orig && dest) {
          const depMins = timeToMinutes(flight.actualDeparture);
          const arrMins = timeToMinutes(flight.actualArrival);
          const duration = Math.max(1, arrMins - depMins);
          const progress = Math.max(0, Math.min(1, (currentSimMinutes - depMins) / duration));
          const currentPos = interpolateGreatCircle(orig.lat, orig.lng, dest.lat, dest.lng, progress);

          map.easeTo({
            center: [currentPos.lng, currentPos.lat],
            zoom: Math.max(5.5, map.getZoom()),
            duration: 1000,
          });
        }
      }
    } else if (selectedAirportIata) {
      const airport = airportLookup.get(selectedAirportIata);
      if (airport) {
        map.easeTo({
          center: [airport.lng, airport.lat],
          zoom: Math.max(6.5, map.getZoom()),
          duration: 900,
        });
      }
    }
  }, [selectedFlightNumber, selectedAirportIata, mapLoaded, flights, airportLookup, currentSimMinutes]);

  // Controls Handlers
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleResetView = () => {
    mapRef.current?.flyTo({
      center: INDIA_CENTER,
      zoom: DEFAULT_ZOOM,
      bearing: 0,
      pitch: 0,
      duration: 1200,
    });
  };

  const airborneCount = useMemo(() => {
    return flights.filter(f => {
      if (f.status === 'CANCELLED') return false;
      const dep = timeToMinutes(f.actualDeparture);
      const arr = timeToMinutes(f.actualArrival);
      return currentSimMinutes >= dep && currentSimMinutes < arr;
    }).length;
  }, [flights, currentSimMinutes]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070B14]">
      {/* MAP CANVAS CONTAINER */}
      <div
        ref={mapContainerRef}
        role="application"
        aria-label="Interactive Indian airspace and flight route radar"
        className="w-full h-full absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* FLOATING TOP-RIGHT RADAR CONTROLS (FLIGHTRADAR24 STYLE) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto" role="group" aria-label="Map Navigation Controls">
        {/* Zoom & View Controls Card */}
        <div className="flex flex-col bg-[#0F172A]/90 backdrop-blur-md border border-slate-700/70 rounded-lg shadow-2xl p-1 gap-1">
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in on map"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded transition"
            title="Zoom In"
          >
            <ZoomIn aria-hidden="true" className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out on map"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded transition"
            title="Zoom Out"
          >
            <ZoomOut aria-hidden="true" className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-700/60 my-0.5" />
          <button
            onClick={handleResetView}
            aria-label="Reset camera and center on India"
            className="p-2 text-slate-300 hover:text-[#00F0FF] hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded transition"
            title="Center Network (India)"
          >
            <RotateCcw aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Route Filter Dropdown / Mode Toggle */}
        <div className="flex items-center bg-[#0F172A]/90 backdrop-blur-md border border-slate-700/70 rounded-lg shadow-2xl px-2 py-1 gap-1.5 text-[11px] font-mono">
          <Layers aria-hidden="true" className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="text-slate-400">ROUTES:</span>
          <button
            onClick={() => {
              setRouteDisplayMode(prev =>
                prev === 'ALL' ? 'ACTIVE_ONLY' : prev === 'ACTIVE_ONLY' ? 'SELECTED_ONLY' : 'ALL'
              );
            }}
            aria-label={`Toggle flight routes display. Currently showing ${
              routeDisplayMode === 'ALL' ? 'all 70 routes' : routeDisplayMode === 'ACTIVE_ONLY' ? 'active airborne routes' : 'selected route only'
            }`}
            className="px-2 py-0.5 rounded bg-slate-800 text-[#00F0FF] hover:bg-slate-700 focus-visible:ring-1 focus-visible:ring-[#00F0FF] focus-visible:outline-none font-semibold transition"
          >
            {routeDisplayMode === 'ALL' ? 'ALL 70' : routeDisplayMode === 'ACTIVE_ONLY' ? 'AIRBORNE' : 'SELECTED'}
          </button>
        </div>

        {/* Airport Labels Toggle */}
        <button
          onClick={() => setShowAirportLabels(prev => !prev)}
          aria-label={`Toggle airport city labels. Currently ${showAirportLabels ? 'enabled' : 'disabled'}`}
          aria-pressed={showAirportLabels}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono shadow-xl backdrop-blur-md focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none transition ${
            showAirportLabels
              ? 'bg-[#0F172A]/90 border-slate-700 text-slate-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
          title="Toggle Airport City Labels"
        >
          <Eye aria-hidden="true" className="w-3.5 h-3.5" />
          <span>LABELS: {showAirportLabels ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* FLOATING BOTTOM-LEFT TELEMETRY HUD (FLIGHTRADAR24 STYLE) */}
      <div className="absolute bottom-16 left-20 z-10 pointer-events-none hidden md:flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#070B14]/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400">
          <Crosshair className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>
            {cursorCoordinates[1].toFixed(2)}°N, {cursorCoordinates[0].toFixed(2)}°E
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[#00F0FF] font-semibold">{airborneCount} AIRBORNE</span>
          <span className="text-slate-600">|</span>
          <span>70 FLIGHTS</span>
        </div>

        {/* Active Disruption Banner */}
        {disruption && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-950/80 backdrop-blur-md border border-red-500/60 text-[11px] font-mono text-red-200">
            <CloudLightning className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="font-bold text-red-400">{disruption.airport} CLOSURE:</span>
            <span>
              {disruption.startTime} (+{disruption.durationMinutes}m)
            </span>
          </div>
        )}
      </div>

      {/* HOVER FLIGHT HUD TOOLTIP (FLIGHTRADAR24 STYLE) */}
      {hoveredFlight && (
        <div className="absolute top-16 left-20 z-40 pointer-events-none bg-[#0F172A]/95 backdrop-blur-md border border-[#00F0FF]/40 rounded-lg p-3 shadow-2xl min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span className="font-bold font-mono text-sm text-white">{hoveredFlight.flightNumber}</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {hoveredFlight.aircraftTail}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px]">ROUTE</span>
              <p className="text-white font-bold">
                {hoveredFlight.origin} ➔ {hoveredFlight.destination}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">SCHEDULE</span>
              <p className="text-slate-300">
                {hoveredFlight.scheduledDeparture} - {hoveredFlight.scheduledArrival}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">STATUS</span>
              <p
                className={`font-bold ${
                  hoveredFlight.status === 'CANCELLED'
                    ? 'text-red-400'
                    : Math.max(hoveredFlight.departureDelayMinutes, hoveredFlight.arrivalDelayMinutes) > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {hoveredFlight.status === 'CANCELLED'
                  ? 'CANCELLED'
                  : Math.max(hoveredFlight.departureDelayMinutes, hoveredFlight.arrivalDelayMinutes) > 0
                  ? `DELAY +${Math.max(hoveredFlight.departureDelayMinutes, hoveredFlight.arrivalDelayMinutes)}m`
                  : 'ON TIME'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">PAX LOAD</span>
              <p className="text-slate-300 font-bold">{hoveredFlight.passengerCount} / 180</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
