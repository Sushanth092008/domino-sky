'use client';

import React, { useState, useMemo } from 'react';
import { Airport, SimulatedFlight, DisruptionInput } from '../../types/aviation';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  projectLatLng,
  calculateArcCurve,
  getArcPositionAt,
} from './IndiaGeoProjection';
import { IndiaSvgCoastline } from './IndiaSvgCoastline';
import { timeToMinutes } from '../../engine/time-utils';
import { Plane, AlertTriangle, ShieldCheck, ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';

interface NetworkMapProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  disruption: DisruptionInput | null;
  simulationTime: string; // 'HH:mm'
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
  selectedAirportIata: string | null;
  onSelectAirport: (iata: string | null) => void;
  highlightTail: string | null;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({
  airports,
  flights,
  disruption,
  simulationTime,
  selectedFlightNumber,
  onSelectFlight,
  selectedAirportIata,
  onSelectAirport,
  highlightTail,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [filterMode, setFilterMode] = useState<'ALL' | 'DISRUPTED_ONLY' | 'AIRBORNE_ONLY'>('ALL');
  const [hoveredFlight, setHoveredFlight] = useState<SimulatedFlight | null>(null);

  // Map airports by IATA for instant lookup
  const airportMap = useMemo(() => new Map(airports.map(a => [a.iata, a])), [airports]);

  const currentSimMinutes = timeToMinutes(simulationTime);

  // Identify downstream rotation chain if a flight or tail is highlighted
  const activeTail = useMemo(() => {
    if (highlightTail) return highlightTail;
    if (selectedFlightNumber) {
      const f = flights.find(x => x.flightNumber === selectedFlightNumber);
      return f ? f.aircraftTail : null;
    }
    if (hoveredFlight) {
      return hoveredFlight.aircraftTail;
    }
    return null;
  }, [highlightTail, selectedFlightNumber, hoveredFlight, flights]);

  // Flights belonging to the active rotation
  const activeRotationFlights = useMemo(() => {
    if (!activeTail) return [];
    return flights
      .filter(f => f.aircraftTail === activeTail)
      .sort((a, b) => a.rotationSequence - b.rotationSequence);
  }, [activeTail, flights]);

  // Filter flights based on mode
  const visibleFlights = useMemo(() => {
    return flights.filter(f => {
      if (filterMode === 'DISRUPTED_ONLY') {
        return f.status === 'DELAYED' || f.status === 'CANCELLED';
      }
      if (filterMode === 'AIRBORNE_ONLY') {
        if (f.status === 'CANCELLED') return false;
        const dep = timeToMinutes(f.actualDeparture);
        const arr = timeToMinutes(f.actualArrival);
        return currentSimMinutes >= dep && currentSimMinutes <= arr;
      }
      return true;
    });
  }, [flights, filterMode, currentSimMinutes]);

  // Airport status aggregator (delay counts, active flights)
  const airportStats = useMemo(() => {
    const stats = new Map<string, { delayedDeps: number; totalDeps: number; isClosed: boolean }>();
    for (const a of airports) {
      const isClosed =
        disruption?.airport === a.iata &&
        currentSimMinutes >= timeToMinutes(disruption.startTime) &&
        currentSimMinutes < timeToMinutes(disruption.startTime) + disruption.durationMinutes;

      stats.set(a.iata, { delayedDeps: 0, totalDeps: 0, isClosed: !!isClosed });
    }

    for (const f of flights) {
      const s = stats.get(f.origin);
      if (s) {
        s.totalDeps++;
        if (f.departureDelayMinutes >= 15) {
          s.delayedDeps++;
        }
      }
    }
    return stats;
  }, [airports, flights, disruption, currentSimMinutes]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none border border-slate-800/80 rounded-xl shadow-2xl">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[10px]">
              Tactical India Radar Map
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[11px]">
            T: <span className="text-cyan-400 font-bold">{simulationTime}</span>
          </span>
          {disruption && (
            <span className="flex items-center gap-1 text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {disruption.airport} {disruption.type.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Right Map Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg">
          {/* Filter Chips */}
          <div className="flex items-center gap-1 mr-2 text-[10px]">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-1 rounded transition-colors ${
                filterMode === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (70)
            </button>
            <button
              onClick={() => setFilterMode('DISRUPTED_ONLY')}
              className={`px-2 py-1 rounded transition-colors ${
                filterMode === 'DISRUPTED_ONLY'
                  ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Disrupted
            </button>
            <button
              onClick={() => setFilterMode('AIRBORNE_ONLY')}
              className={`px-2 py-1 rounded transition-colors ${
                filterMode === 'AIRBORNE_ONLY'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Airborne
            </button>
          </div>

          {/* Zoom In / Out / Reset */}
          <button
            onClick={() => setZoomLevel(z => Math.min(2.0, z + 0.2))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.2))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Reset Map Fit"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          {/* Tactical Vector Coastline & Graticule */}
          <IndiaSvgCoastline />

          {/* FLIGHT ROUTE ARCS */}
          <g className="routes-layer">
            {visibleFlights.map(flight => {
              const orig = airportMap.get(flight.origin);
              const dest = airportMap.get(flight.destination);
              if (!orig || !dest) return null;

              const p1 = projectLatLng(orig.lat, orig.lng);
              const p2 = projectLatLng(dest.lat, dest.lng);
              const pathD = calculateArcCurve(p1, p2, 0.16);

              const isSelected = selectedFlightNumber === flight.flightNumber;
              const isRotationHighlighted = activeTail === flight.aircraftTail;
              const isDirectlyDisrupted = flight.isDirectlyDisrupted;

              // Color logic
              let strokeColor = 'rgba(6, 182, 212, 0.35)'; // Cyan on-time
              let strokeWidth = 1.2;
              let strokeDasharray = 'none';

              if (flight.status === 'CANCELLED') {
                strokeColor = 'rgba(239, 68, 68, 0.7)'; // Crimson cancelled
                strokeWidth = 1.8;
                strokeDasharray = '4 4';
              } else if (flight.status === 'DELAYED') {
                strokeColor = flight.departureDelayMinutes >= 60
                  ? 'rgba(239, 68, 68, 0.85)' // severe delay
                  : 'rgba(245, 158, 11, 0.75)'; // amber delay
                strokeWidth = 1.8;
              } else if (flight.originalAssignedTail !== flight.aircraftTail) {
                strokeColor = 'rgba(16, 185, 129, 0.85)'; // Emerald recovered
                strokeWidth = 2.0;
              }

              if (isRotationHighlighted) {
                strokeWidth = 3.0;
                strokeColor = flight.departureDelayMinutes > 0 ? '#f59e0b' : '#38bdf8';
              }

              if (isSelected) {
                strokeWidth = 3.5;
                strokeColor = '#ffffff';
              }

              return (
                <g
                  key={flight.flightNumber}
                  className="cursor-pointer group"
                  onClick={() => onSelectFlight(flight.flightNumber)}
                  onMouseEnter={() => setHoveredFlight(flight)}
                  onMouseLeave={() => setHoveredFlight(null)}
                >
                  {/* Invisible broad hitbox for easy clicking */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />

                  {/* Visual flight arc */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}
          </g>

          {/* ACTIVE AIRBORNE AIRCRAFT MARKERS */}
          <g className="aircraft-layer pointer-events-none">
            {flights.map(flight => {
              if (flight.status === 'CANCELLED') return null;

              const orig = airportMap.get(flight.origin);
              const dest = airportMap.get(flight.destination);
              if (!orig || !dest) return null;

              const depMins = timeToMinutes(flight.actualDeparture);
              const arrMins = timeToMinutes(flight.actualArrival);

              // Check if aircraft is currently in the air at simulationTime
              if (currentSimMinutes < depMins || currentSimMinutes > arrMins) {
                return null;
              }

              const progress = (currentSimMinutes - depMins) / Math.max(1, arrMins - depMins);
              const p1 = projectLatLng(orig.lat, orig.lng);
              const p2 = projectLatLng(dest.lat, dest.lng);
              const planePos = getArcPositionAt(p1, p2, progress, 0.16);

              const isDelayed = flight.departureDelayMinutes >= 15;
              const planeFill = isDelayed ? '#f59e0b' : '#38bdf8';

              return (
                <g
                  key={`plane-${flight.flightNumber}`}
                  transform={`translate(${planePos.x}, ${planePos.y}) rotate(${planePos.angle})`}
                  className="transition-transform duration-500 ease-linear"
                >
                  {/* Jet Silhouette Icon */}
                  <path
                    d="M 0 -7 L 2 -1 L 8 2 L 8 4 L 2 3 L 1 7 L 3 9 L 3 10 L 0 9 L -3 10 L -3 9 L -1 7 L -2 3 L -8 4 L -8 2 L -2 -1 Z"
                    fill={planeFill}
                    stroke="#020617"
                    strokeWidth="0.8"
                  />
                  {/* Pulsing beacon dot */}
                  <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                </g>
              );
            })}
          </g>

          {/* AIRPORT NODES */}
          <g className="airports-layer">
            {airports.map(airport => {
              const pt = projectLatLng(airport.lat, airport.lng);
              const stats = airportStats.get(airport.iata);
              const isClosed = stats?.isClosed;
              const isSelected = selectedAirportIata === airport.iata;
              const hasDelays = (stats?.delayedDeps || 0) > 0;

              return (
                <g
                  key={airport.iata}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectAirport(isSelected ? null : airport.iata)}
                >
                  {/* Pulsing Red Radar Ring when Airport is CLOSED */}
                  {isClosed && (
                    <>
                      <circle cx="0" cy="0" r="28" fill="rgba(239, 68, 68, 0.15)">
                        <animate attributeName="r" values="10;34;10" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        cx="0"
                        cy="0"
                        r="20"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}

                  {/* Hub Outer Accent Ring */}
                  {airport.isHub && (
                    <circle
                      cx="0"
                      cy="0"
                      r="10"
                      fill="none"
                      stroke={isClosed ? '#ef4444' : hasDelays ? '#f59e0b' : 'rgba(56, 189, 248, 0.4)'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Base Core Node */}
                  <circle
                    cx="0"
                    cy="0"
                    r={airport.isHub ? 5.5 : 4}
                    fill={isClosed ? '#ef4444' : isSelected ? '#ffffff' : hasDelays ? '#f59e0b' : '#0ea5e9'}
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="transition-colors duration-200 group-hover:scale-125"
                  />

                  {/* Airport IATA Label */}
                  <text
                    x="0"
                    y={airport.isHub ? -13 : -9}
                    textAnchor="middle"
                    fill={isClosed ? '#f87171' : isSelected ? '#ffffff' : hasDelays ? '#fbbf24' : '#94a3b8'}
                    fontSize="9.5"
                    fontWeight={airport.isHub ? '700' : '500'}
                    fontFamily="monospace"
                    className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  >
                    {airport.iata}
                  </text>

                  {/* Delay count badge indicator if > 0 */}
                  {(stats?.delayedDeps || 0) > 0 && !isClosed && (
                    <g transform="translate(8, -8)">
                      <circle cx="0" cy="0" r="4.5" fill="#f59e0b" stroke="#020617" strokeWidth="1" />
                      <text
                        x="0"
                        y="2.5"
                        textAnchor="middle"
                        fill="#020617"
                        fontSize="6"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {stats?.delayedDeps}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Flight Hover Tooltip */}
        {hoveredFlight && (
          <div className="absolute bottom-5 left-5 pointer-events-none z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-2xl min-w-[240px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-cyan-400" />
                {hoveredFlight.flightNumber}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  hoveredFlight.status === 'CANCELLED'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : hoveredFlight.status === 'DELAYED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {hoveredFlight.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px]">ROUTE</span>
                <span className="text-slate-200 font-bold">
                  {hoveredFlight.origin} → {hoveredFlight.destination}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">TAIL</span>
                <span className="text-cyan-300">{hoveredFlight.aircraftTail}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">DEP (SCH / ACT)</span>
                <span className="text-slate-300">
                  {hoveredFlight.scheduledDeparture} /{' '}
                  <span
                    className={
                      hoveredFlight.departureDelayMinutes > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'
                    }
                  >
                    {hoveredFlight.actualDeparture}
                  </span>
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">DELAY</span>
                <span
                  className={
                    hoveredFlight.departureDelayMinutes > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'
                  }
                >
                  +{hoveredFlight.departureDelayMinutes}m
                </span>
              </div>
            </div>

            {hoveredFlight.delayCauses.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-amber-300/90 leading-tight">
                ⚠️ {hoveredFlight.delayCauses[0].title}
              </div>
            )}
          </div>
        )}

        {/* Bottom Right Map Legend */}
        <div className="absolute bottom-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[10px] shadow-lg flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded"></span>
            <span>On-Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded"></span>
            <span>Delayed (≥15m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-red-400 border-t border-dashed border-red-400"></span>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400 rounded"></span>
            <span>Recovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-red-500 bg-red-500/30 animate-pulse"></span>
            <span>Closed Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
