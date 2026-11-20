'use client';

import React, { useState, useMemo } from 'react';
import { SimulatedFlight, SimulatedPassengerConnection, DisruptionInput } from '../../types/aviation';
import { DependencyGraph } from '../graph/DependencyGraph';
import {
  GitCommit,
  AlertTriangle,
  ArrowRight,
  Plane,
  Users,
  Clock,
  ShieldAlert,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface CascadeGraphViewProps {
  disruption: DisruptionInput | null;
  flights: SimulatedFlight[];
  connections: SimulatedPassengerConnection[];
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
  onNavigateToSimulator: () => void;
}

export const CascadeGraphView: React.FC<CascadeGraphViewProps> = ({
  disruption,
  flights,
  connections,
  selectedFlightNumber,
  onSelectFlight,
  onNavigateToSimulator,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#080D18] overflow-hidden">
      {/* Top Header & Educational Domino Mechanics Strip */}
      <div className="bg-[#101827] border-b border-[#1E2D44] px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              <GitCommit className="w-4 h-4 text-[#F59E0B]" />
              <span>Multi-Sector Rotational Propagation</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
              Disruption Cascade Dependency Tree
            </h1>
          </div>

          {disruption ? (
            <div className="flex items-center gap-2.5 bg-[#141F30] border border-[#F59E0B]/40 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping"></span>
              <span className="text-[#F59E0B] font-bold">Root Source:</span>
              <span className="text-white">
                {disruption.airport} {disruption.type.replace('_', ' ')} (+{disruption.durationMinutes}m)
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNavigateToSimulator}
              className="px-3.5 py-1.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] font-bold rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Configure Disruption Scenario
            </button>
          )}
        </div>

        {/* 5-Step Domino Anatomy Explanation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-[#1E2D44]/70 text-[11px]">
          <div className="bg-[#141F30]/80 border border-[#1E2D44] rounded-lg p-2">
            <span className="text-[10px] font-mono text-[#F59E0B] font-bold block">1. ROOT CLOSURE</span>
            <span className="text-slate-300">Hub weather holds initial departures.</span>
          </div>

          <div className="bg-[#141F30]/80 border border-[#1E2D44] rounded-lg p-2">
            <span className="text-[10px] font-mono text-[#00F0FF] font-bold block">2. TAT COMPRESSION</span>
            <span className="text-slate-300">Late inbound aircraft eats into 45m buffer.</span>
          </div>

          <div className="bg-[#141F30]/80 border border-[#1E2D44] rounded-lg p-2">
            <span className="text-[10px] font-mono text-purple-400 font-bold block">3. ROTATIONAL SPILL</span>
            <span className="text-slate-300">Next sector delayed at clear-weather hub.</span>
          </div>

          <div className="bg-[#141F30]/80 border border-[#1E2D44] rounded-lg p-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold block">4. BROKEN CONNECTIONS</span>
            <span className="text-slate-300">Pax layover drops below 45m MCT threshold.</span>
          </div>

          <div className="bg-[#141F30]/80 border border-[#1E2D44] rounded-lg p-2">
            <span className="text-[10px] font-mono text-red-400 font-bold block">5. CREW DUTY BREACH</span>
            <span className="text-slate-300">Cumulative duty risks exceeding FDTL limits.</span>
          </div>
        </div>
      </div>

      {/* Main Cascade Tree Container */}
      <div className="flex-1 w-full h-full p-4 overflow-hidden">
        <DependencyGraph
          disruption={disruption}
          flights={flights}
          connections={connections}
          selectedFlightNumber={selectedFlightNumber}
          onSelectFlight={onSelectFlight}
        />
      </div>
    </div>
  );
};
