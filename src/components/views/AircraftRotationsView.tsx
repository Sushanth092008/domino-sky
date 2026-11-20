'use client';

import React, { useState, useMemo } from 'react';
import { SimulatedFlight, Aircraft } from '../../types/aviation';
import { AircraftGantt } from '../gantt/AircraftGantt';
import { timeToMinutes } from '../../engine/time-utils';
import {
  Clock,
  Plane,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AircraftRotationsViewProps {
  flights: SimulatedFlight[];
  simulationTime: string;
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
}

export const AircraftRotationsView: React.FC<AircraftRotationsViewProps> = ({
  flights,
  simulationTime,
  selectedFlightNumber,
  onSelectFlight,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'DELAYED_ONLY' | 'SPARES_ONLY'>('ALL');
  const [selectedTail, setSelectedTail] = useState<string | null>(null);

  // Group flights by tail
  const tailStats = useMemo(() => {
    const map = new Map<string, { totalDelay: number; legs: number; hasBreach: boolean; isSpare: boolean }>();

    for (const f of flights) {
      if (!map.has(f.aircraftTail)) {
        map.set(f.aircraftTail, {
          totalDelay: 0,
          legs: 0,
          hasBreach: false,
          isSpare: f.aircraftTail.startsWith('VT-SPA'),
        });
      }
      const item = map.get(f.aircraftTail)!;
      item.totalDelay += f.departureDelayMinutes;
      item.legs += 1;
      if (f.departureDelayMinutes >= 15) {
        item.hasBreach = true;
      }
    }

    return map;
  }, [flights]);

  // Filter flights if filterMode is set
  const filteredFlights = useMemo(() => {
    if (filterMode === 'DELAYED_ONLY') {
      const delayedTails = new Set(
        Array.from(tailStats.entries())
          .filter(([_, stats]) => stats.hasBreach)
          .map(([t]) => t)
      );
      return flights.filter(f => delayedTails.has(f.aircraftTail));
    }
    if (filterMode === 'SPARES_ONLY') {
      return flights.filter(f => f.aircraftTail.startsWith('VT-SPA'));
    }
    return flights;
  }, [flights, filterMode, tailStats]);

  // Total metrics
  const delayedTailsCount = useMemo(() => {
    return Array.from(tailStats.values()).filter(s => s.hasBreach).length;
  }, [tailStats]);

  const activeSparesCount = useMemo(() => {
    return flights.filter(f => f.originalAssignedTail !== f.aircraftTail).length;
  }, [flights]);

  return (
    <div className="w-full h-full flex flex-col bg-[#080D18] overflow-hidden">
      {/* Top Controls & Metrics Bar */}
      <div className="h-14 bg-[#101827] border-b border-[#1E2D44] px-5 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-xs font-bold text-white tracking-wider uppercase font-mono">
              Aircraft Rotations & TAT Timeline
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Active Tails:{' '}
              <strong className="text-white">16</strong>
            </span>
            <span className="text-slate-400">
              Spares Deployed:{' '}
              <strong className="text-emerald-400">{activeSparesCount}</strong>
            </span>
            <span className="text-slate-400">
              Delayed Tails:{' '}
              <strong className="text-amber-400">{delayedTailsCount}</strong>
            </span>
          </div>
        </div>

        {/* Center: Filters */}
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
            All 16 Aircraft
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('DELAYED_ONLY')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              filterMode === 'DELAYED_ONLY'
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold border border-[#F59E0B]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Delayed Tails</span>
            <span className="px-1.5 py-0.2 bg-[#F59E0B]/30 text-[#F59E0B] rounded text-[10px] font-mono">
              {delayedTailsCount}
            </span>
          </button>
        </div>

        {/* Right: Legend hint */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
            <span>On-Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>Recovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-500"></span>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="flex-1 w-full h-full p-3 overflow-hidden">
        <AircraftGantt
          flights={filteredFlights}
          simulationTime={simulationTime}
          selectedFlightNumber={selectedFlightNumber}
          onSelectFlight={onSelectFlight}
          onSelectTail={tail => setSelectedTail(tail)}
        />
      </div>
    </div>
  );
};
