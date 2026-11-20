'use client';

import React, { useState, useMemo } from 'react';
import { Airport, SimulatedFlight, DisruptionInput } from '../../types/aviation';
import { NetworkMap } from '../network-map/NetworkMap';
import { timeToMinutes } from '../../engine/time-utils';
import {
  Compass,
  Plane,
  AlertTriangle,
  ShieldCheck,
  Filter,
  Search,
  Activity,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';

interface LiveNetworkViewProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  disruption: DisruptionInput | null;
  simulationTime: string;
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
  selectedAirportIata: string | null;
  onSelectAirport: (iata: string | null) => void;
  onTriggerDisruptionAtAirport?: (iata: string) => void;
}

export const LiveNetworkView: React.FC<LiveNetworkViewProps> = ({
  airports,
  flights,
  disruption,
  simulationTime,
  selectedFlightNumber,
  onSelectFlight,
  selectedAirportIata,
  onSelectAirport,
  onTriggerDisruptionAtAirport,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'DELAYED' | 'CANCELLED' | 'RECOVERED' | 'AIRBORNE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const currentSimMinutes = timeToMinutes(simulationTime);

  // Filter flights based on filterMode & search query
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = f.flightNumber.toLowerCase().includes(q);
        const matchOrigin = f.origin.toLowerCase().includes(q);
        const matchDest = f.destination.toLowerCase().includes(q);
        const matchTail = f.aircraftTail.toLowerCase().includes(q);
        if (!matchNumber && !matchOrigin && !matchDest && !matchTail) {
          return false;
        }
      }

      // Status filter
      if (filterMode === 'DELAYED') {
        return f.departureDelayMinutes >= 15;
      }
      if (filterMode === 'CANCELLED') {
        return f.status === 'CANCELLED';
      }
      if (filterMode === 'RECOVERED') {
        return f.originalAssignedTail !== f.aircraftTail;
      }
      if (filterMode === 'AIRBORNE') {
        const dep = timeToMinutes(f.actualDeparture);
        const arr = timeToMinutes(f.actualArrival);
        return f.status !== 'CANCELLED' && currentSimMinutes >= dep && currentSimMinutes < arr;
      }

      return true;
    });
  }, [flights, filterMode, searchQuery, currentSimMinutes]);

  // Quick Network Stats
  const delayedCount = useMemo(() => flights.filter(f => f.departureDelayMinutes >= 15).length, [flights]);
  const cancelledCount = useMemo(() => flights.filter(f => f.status === 'CANCELLED').length, [flights]);
  const recoveredCount = useMemo(() => flights.filter(f => f.originalAssignedTail !== f.aircraftTail).length, [flights]);
  const airborneCount = useMemo(() => {
    return flights.filter(f => {
      const dep = timeToMinutes(f.actualDeparture);
      const arr = timeToMinutes(f.actualArrival);
      return f.status !== 'CANCELLED' && currentSimMinutes >= dep && currentSimMinutes < arr;
    }).length;
  }, [flights, currentSimMinutes]);

  return (
    <div className="w-full h-full flex flex-col bg-[#080D18] overflow-hidden relative">
      {/* Top Filter and Command Toolbar */}
      <div className="h-13 bg-[#101827] border-b border-[#1E2D44] px-5 py-2.5 flex items-center justify-between gap-4 flex-shrink-0 z-20">
        {/* Left: View Identity & Quick Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse"></div>
            <span className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              Live Airspace Radar
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Total Routes:</span>
            <span className="text-white font-bold">{flights.length}</span>
            <span className="text-slate-500 text-[10px]">({airports.length} Hubs)</span>
          </div>
        </div>

        {/* Center: Filter Pills */}
        <div className="flex items-center gap-1 bg-[#141F30] p-1 rounded-xl border border-[#1E2D44] text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterMode === 'ALL'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Flights ({flights.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('DELAYED')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterMode === 'DELAYED'
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold border border-[#F59E0B]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Delayed ≥15m</span>
            <span className="px-1.5 py-0.2 bg-[#F59E0B]/30 text-[#F59E0B] rounded text-[10px] font-mono">
              {delayedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('AIRBORNE')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterMode === 'AIRBORNE'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Airborne Now</span>
            <span className="px-1.5 py-0.2 bg-[#00F0FF]/30 text-[#00F0FF] rounded text-[10px] font-mono">
              {airborneCount}
            </span>
          </button>

          {cancelledCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('CANCELLED')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'CANCELLED'
                  ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Cancelled</span>
              <span className="px-1.5 py-0.2 bg-[#EF4444]/30 text-[#EF4444] rounded text-[10px] font-mono">
                {cancelledCount}
              </span>
            </button>
          )}

          {recoveredCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterMode('RECOVERED')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'RECOVERED'
                  ? 'bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Recovered</span>
              <span className="px-1.5 py-0.2 bg-[#10B981]/30 text-[#10B981] rounded text-[10px] font-mono">
                {recoveredCount}
              </span>
            </button>
          )}
        </div>

        {/* Right: Search Input */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search flight, tail, airport..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#141F30] border border-[#1E2D44] focus:border-[#00F0FF]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Full-Size Map Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <NetworkMap
          airports={airports}
          flights={filteredFlights}
          disruption={disruption}
          simulationTime={simulationTime}
          selectedFlightNumber={selectedFlightNumber}
          onSelectFlight={onSelectFlight}
          selectedAirportIata={selectedAirportIata}
          onSelectAirport={onSelectAirport}
          highlightTail={null}
        />

        {/* Floating Quick Action Overlay: Airport Disruption Indicator */}
        {disruption && (
          <div className="absolute top-4 left-4 z-30 bg-[#101827]/90 backdrop-blur-md border border-[#F59E0B]/50 rounded-xl p-3 shadow-xl max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping"></span>
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase">
                Active Weather Disruption
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {disruption.airport} — {disruption.type.replace('_', ' ')}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Window: {disruption.startTime} ({disruption.durationMinutes}m) • {disruption.severity} severity
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
