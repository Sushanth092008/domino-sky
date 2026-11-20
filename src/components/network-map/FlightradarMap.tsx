'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import {
  Plane,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  CloudLightning,
  MapPin,
  Clock,
  Eye,
  Layers,
} from 'lucide-react';

interface FlightradarMapProps {
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

export const FlightradarMap: React.FC<FlightradarMapProps> = ({
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredFlight, setHoveredFlight] = useState<SimulatedFlight | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const airportMap = useMemo(() => new Map(airports.map(a => [a.iata, a])), [airports]);
  const currentSimMinutes = timeToMinutes(simulationTime);

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomLevel(prev => Math.min(3.5, Math.max(0.8, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Determine active airborne flights and their calculated positions
  const airborneFlightsWithPos = useMemo(() => {
    return flights
      .filter(flight => {
        if (flight.status === 'CANCELLED') return false;
        const depMins = timeToMinutes(flight.actualDeparture);
        const arrMins = timeToMinutes(flight.actualArrival);
        return currentSimMinutes >= depMins && currentSimMinutes < arrMins;
      })
      .map(flight => {
        const orig = airportMap.get(flight.origin);
        const dest = airportMap.get(flight.destination);
        if (!orig || !dest) return null;

        const depMins = timeToMinutes(flight.actualDeparture);
        const arrMins = timeToMinutes(flight.actualArrival);
        const duration = Math.max(1, arrMins - depMins);
        const progress = Math.max(0, Math.min(1, (currentSimMinutes - depMins) / duration));

        const p1 = projectLatLng(orig.lat, orig.lng);
        const p2 = projectLatLng(dest.lat, dest.lng);
        const planePos = getArcPositionAt(p1, p2, progress, 0.16);

        return {
          flight,
          pos: planePos,
          progress,
          orig,
          dest,
        };
      })
      .filter(Boolean) as {
      flight: SimulatedFlight;
      pos: { x: number; y: number; angle: number };
      progress: number;
      orig: Airport;
      dest: Airport;
    }[];
  }, [flights, airportMap, currentSimMinutes]);

  // Selected flight object
  const selectedFlightObj = useMemo(() => {
    if (!selectedFlightNumber) return null;
    return flights.find(f => f.flightNumber === selectedFlightNumber) || null;
  }, [selectedFlightNumber, flights]);

  // Airport status
  const airportStatusMap = useMemo(() => {
    const stats = new Map<string, { delayedDeps: number; totalDeps: number; isClosed: boolean }>();
    for (const a of airports) {
      const isClosed =
        disruption &&
        disruption.airport === a.iata &&
        currentSimMinutes >= timeToMinutes(disruption.startTime) &&
        currentSimMinutes < timeToMinutes(disruption.startTime) + disruption.durationMinutes;

      stats.set(a.iata, { delayedDeps: 0, totalDeps: 0, isClosed: !!isClosed });
    }

    for (const f of flights) {
      const s = stats.get(f.origin);
      if (s) {
        s.totalDeps += 1;
        if (f.departureDelayMinutes >= 15) {
          s.delayedDeps += 1;
        }
      }
    }
    return stats;
  }, [airports, flights, disruption, currentSimMinutes]);

  // Filter flights for route display
  const displayedRouteFlights = useMemo(() => {
    if (selectedFlightNumber) {
      // Highlight selected flight route + its tail's full rotation
      const f = flights.find(x => x.flightNumber === selectedFlightNumber);
      if (f) {
        return flights.filter(x => x.aircraftTail === f.aircraftTail);
      }
    }

    if (!showAllRoutes) {
      // Only show airborne routes
      const airborneNumbers = new Set(airborneFlightsWithPos.map(a => a.flight.flightNumber));
      return flights.filter(f => airborneNumbers.has(f.flightNumber));
    }

    if (filterMode === 'DELAYED') {
      return flights.filter(f => f.departureDelayMinutes >= 15);
    }
    if (filterMode === 'CANCELLED') {
      return flights.filter(f => f.status === 'CANCELLED');
    }
    if (filterMode === 'RECOVERED') {
      return flights.filter(f => f.originalAssignedTail !== f.aircraftTail);
    }
    if (filterMode === 'AIRBORNE') {
      const airborneNumbers = new Set(airborneFlightsWithPos.map(a => a.flight.flightNumber));
      return flights.filter(f => airborneNumbers.has(f.flightNumber));
    }

    return flights;
  }, [flights, selectedFlightNumber, showAllRoutes, filterMode, airborneFlightsWithPos]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`w-full h-full relative overflow-hidden bg-[#070B14] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Flightradar24 Dark Ambient Radar Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* SVG Radar Canvas */}
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-full transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Pulsing radar glow filter */}
          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Airplane Yellow Glow */}
          <filter id="plane-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#F1C40F" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. GEOGRAPHIC COASTLINE & STATE BOUNDARIES */}
        <IndiaSvgCoastline />

        {/* 2. FLIGHT ROUTES LAYER */}
        <g className="routes-layer">
          {displayedRouteFlights.map(flight => {
            const orig = airportMap.get(flight.origin);
            const dest = airportMap.get(flight.destination);
            if (!orig || !dest) return null;

            const p1 = projectLatLng(orig.lat, orig.lng);
            const p2 = projectLatLng(dest.lat, dest.lng);
            const pathD = calculateArcCurve(p1, p2, 0.16);

            const isSelected = selectedFlightNumber === flight.flightNumber;
            const isHovered = hoveredFlight?.flightNumber === flight.flightNumber;
            const isCancelled = flight.status === 'CANCELLED';
            const isDelayed = flight.departureDelayMinutes >= 15;
            const isRecovered = flight.originalAssignedTail !== flight.aircraftTail;

            // Flightradar24 Route Styling
            let strokeColor = 'rgba(71, 85, 105, 0.35)'; // Nominal faint grey route
            let strokeWidth = 1.0;
            let strokeDash = 'none';

            if (isCancelled) {
              strokeColor = 'rgba(239, 68, 68, 0.6)';
              strokeWidth = 1.5;
              strokeDash = '4 4';
            } else if (isRecovered) {
              strokeColor = 'rgba(46, 204, 113, 0.7)';
              strokeWidth = 1.8;
            } else if (isDelayed) {
              strokeColor = flight.departureDelayMinutes >= 45 ? 'rgba(239, 68, 68, 0.75)' : 'rgba(243, 156, 18, 0.65)';
              strokeWidth = 1.6;
            }

            if (isHovered) {
              strokeColor = '#F1C40F';
              strokeWidth = 2.5;
            }

            if (isSelected) {
              strokeColor = '#FFFFFF';
              strokeWidth = 3.5;
            }

            return (
              <g
                key={`route-${flight.flightNumber}`}
                className="cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  onSelectFlight(flight.flightNumber);
                }}
                onMouseEnter={() => setHoveredFlight(flight)}
                onMouseLeave={() => setHoveredFlight(null)}
              >
                {/* Wide invisible hit area */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />

                {/* Visible curved route */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  className="transition-colors duration-200"
                />

                {/* Animated Dash Tracer for Selected Flight */}
                {isSelected && !isCancelled && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="3"
                    strokeDasharray="6 12"
                    className="animate-[dash_1.5s_linear_infinite]"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* 3. AIRPORT NODES LAYER */}
        <g className="airports-layer">
          {airports.map(airport => {
            const pt = projectLatLng(airport.lat, airport.lng);
            const status = airportStatusMap.get(airport.iata);
            const isClosed = status?.isClosed;
            const isSelected = selectedAirportIata === airport.iata;
            const hasDelays = (status?.delayedDeps || 0) > 0;

            return (
              <g
                key={`airport-${airport.iata}`}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={e => {
                  e.stopPropagation();
                  onSelectAirport(isSelected ? null : airport.iata);
                }}
              >
                {/* Radar Closure Zone Wave */}
                {isClosed && (
                  <>
                    <circle cx="0" cy="0" r="32" fill="rgba(239, 68, 68, 0.15)">
                      <animate attributeName="r" values="8;36;8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="20" fill="rgba(239, 68, 68, 0.25)" />
                  </>
                )}

                {/* Airport Base Marker */}
                <circle
                  cx="0"
                  cy="0"
                  r={airport.isHub ? 6 : 4.5}
                  fill={isClosed ? '#EF4444' : isSelected ? '#00F0FF' : '#1E293B'}
                  stroke={isClosed ? '#FFFFFF' : isSelected ? '#FFFFFF' : '#64748B'}
                  strokeWidth={airport.isHub ? 2 : 1.5}
                  className="group-hover:scale-125 transition-transform"
                />

                {/* Hub Core Beacon */}
                <circle
                  cx="0"
                  cy="0"
                  r={2}
                  fill={isClosed ? '#FFFFFF' : isSelected ? '#00F0FF' : '#94A3B8'}
                />

                {/* Airport IATA Label */}
                <text
                  x={8}
                  y={4}
                  fill={isClosed ? '#EF4444' : isSelected ? '#00F0FF' : '#CBD5E1'}
                  fontSize={airport.isHub ? 11 : 9.5}
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                >
                  {airport.iata}
                </text>

                {/* Delay Count Badge if delayed departures exist */}
                {hasDelays && !isClosed && (
                  <g transform="translate(0, -9)">
                    <rect
                      x="-10"
                      y="-7"
                      width="20"
                      height="9"
                      rx="3"
                      fill="#F59E0B"
                    />
                    <text
                      x="0"
                      y="0"
                      fill="#080D18"
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {status?.delayedDeps} late
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 4. ACTIVE AIRBORNE AIRCRAFT LAYER (FLIGHTRADAR24 ROTATED JET SILHOUETTES) */}
        <g className="aircraft-layer">
          {airborneFlightsWithPos.map(({ flight, pos }) => {
            const isSelected = selectedFlightNumber === flight.flightNumber;
            const isHovered = hoveredFlight?.flightNumber === flight.flightNumber;
            const isDelayed = flight.departureDelayMinutes >= 15;
            const isRecovered = flight.originalAssignedTail !== flight.aircraftTail;

            // Flightradar24 Airplane Colors:
            // Nominal/On-Time: Iconic yellow/gold (#F1C40F)
            // Delayed: Orange/Amber (#E67E22 / #F39C12)
            // Recovered / Spare: Emerald Green (#2ECC71)
            let planeFill = '#F1C40F';
            if (isRecovered) {
              planeFill = '#2ECC71';
            } else if (isDelayed) {
              planeFill = flight.departureDelayMinutes >= 45 ? '#E74C3C' : '#E67E22';
            }

            if (isSelected) {
              planeFill = '#00F0FF';
            }

            return (
              <g
                key={`plane-${flight.flightNumber}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={e => {
                  e.stopPropagation();
                  onSelectFlight(flight.flightNumber);
                }}
                onMouseEnter={() => setHoveredFlight(flight)}
                onMouseLeave={() => setHoveredFlight(null)}
              >
                {/* Broad Click Hitbox */}
                <circle cx="0" cy="0" r="18" fill="transparent" />

                {/* Rotated Aircraft Jet Silhouette Icon */}
                <g transform={`rotate(${pos.angle})`}>
                  {/* Subtle Wing Shadow */}
                  <path
                    d="M 0,-11 L 3,-3 L 12,2 L 12,4.5 L 3,3 L 1.8,9 L 4.5,12 L 4.5,13.5 L 0,12.5 L -4.5,13.5 L -4.5,12 L -1.8,9 L -3,3 L -12,4.5 L -12,2 L -3,-3 Z"
                    fill="rgba(0,0,0,0.4)"
                    transform="translate(1, 1)"
                  />

                  {/* Main Jet Silhouette */}
                  <path
                    d="M 0,-11 L 3,-3 L 12,2 L 12,4.5 L 3,3 L 1.8,9 L 4.5,12 L 4.5,13.5 L 0,12.5 L -4.5,13.5 L -4.5,12 L -1.8,9 L -3,3 L -12,4.5 L -12,2 L -3,-3 Z"
                    fill={planeFill}
                    stroke="#020617"
                    strokeWidth="0.9"
                    className="transition-transform group-hover:scale-125"
                  />

                  {/* Cockpit / Center Core */}
                  <circle cx="0" cy="-2" r="1.2" fill="#FFFFFF" />
                </g>

                {/* Flightradar24 Floating Callsign Tag */}
                <g transform="translate(14, -6)" className="pointer-events-none">
                  <rect
                    x="0"
                    y="-8"
                    width={flight.flightNumber.length * 6.5 + 8}
                    height="12"
                    rx="3"
                    fill="rgba(8, 13, 24, 0.85)"
                    stroke={isSelected ? '#00F0FF' : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth="0.8"
                  />
                  <text
                    x="4"
                    y="0.5"
                    fill={isSelected ? '#00F0FF' : planeFill}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {flight.flightNumber}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Map Controls (Flightradar24 Style Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-[#0D1524]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#1E2D44] shadow-xl">
        <button
          type="button"
          onClick={() => setZoomLevel(prev => Math.min(3.5, prev * 1.25))}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#1E2D44] rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel(prev => Math.max(0.8, prev * 0.8))}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#1E2D44] rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="p-2 text-slate-300 hover:text-white hover:bg-[#1E2D44] rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Airborne Flights Count Badge (Flightradar24 Style Top Left) */}
      <div className="absolute top-4 left-16 z-20 flex items-center gap-2.5 bg-[#0D1524]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#1E2D44] shadow-xl text-xs font-mono text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F1C40F] animate-pulse"></span>
          <span className="font-bold text-white">{airborneFlightsWithPos.length}</span>
          <span className="text-slate-400">Airborne Now</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Network:</span>
          <span className="text-white font-bold">{flights.length} Flights</span>
        </div>
      </div>

      {/* Flightradar24 Interactive Flight Hover Card Tooltip */}
      {hoveredFlight && (
        <div className="absolute bottom-20 left-16 z-30 bg-[#0D1524]/95 backdrop-blur-xl border border-[#1E2D44] rounded-xl p-3 shadow-2xl text-xs font-mono w-72 pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#1E2D44]">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#F1C40F] text-sm">{hoveredFlight.flightNumber}</span>
              <span className="text-slate-400 text-[10px]">{hoveredFlight.aircraftTail}</span>
            </div>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                hoveredFlight.departureDelayMinutes >= 15
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {hoveredFlight.departureDelayMinutes >= 15
                ? `+${hoveredFlight.departureDelayMinutes}m LATE`
                : 'ON TIME'}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block">ORIGIN</span>
              <strong className="text-white text-xs">{hoveredFlight.origin}</strong>
              <span className="text-[10px] text-slate-400 block">{hoveredFlight.scheduledDeparture}</span>
            </div>
            <div className="text-center text-slate-500 text-[10px]">
              <div>✈</div>
              <span>{hoveredFlight.scheduledDurationMinutes}m</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">DESTINATION</span>
              <strong className="text-white text-xs">{hoveredFlight.destination}</strong>
              <span className="text-[10px] text-slate-400 block">{hoveredFlight.scheduledArrival}</span>
            </div>
          </div>

          {hoveredFlight.delayCauses.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#1E2D44] text-[10.5px] text-amber-300">
              ⚠️ {hoveredFlight.delayCauses[0].title}
            </div>
          )}
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-3 bg-[#0D1524]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#1E2D44] text-[10.5px] font-mono text-slate-300 shadow-xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F1C40F]"></span>
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#E67E22]"></span>
          <span>Delayed (≥15m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#2ECC71]"></span>
          <span>Recovered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>Closed Hub</span>
        </div>
      </div>
    </div>
  );
};
