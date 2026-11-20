'use client';

import React from 'react';
import { SimulationResult, Airport, DisruptionInput } from '../../types/aviation';
import { ExecutiveKpiStrip } from '../dashboard/ExecutiveKpiStrip';
import { ActiveNavTab } from '../navigation/TopNavbar';
import {
  CloudLightning,
  Compass,
  Clock,
  Bot,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Plane,
  Sparkles,
} from 'lucide-react';

interface OverviewViewProps {
  result: SimulationResult;
  airports: Airport[];
  disruption: DisruptionInput | null;
  simulationTime: string;
  onNavigateTab: (tab: ActiveNavTab) => void;
  onSelectAirport: (iata: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  result,
  airports,
  disruption,
  simulationTime,
  onNavigateTab,
  onSelectAirport,
}) => {
  const isDisrupted = !!disruption;

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Spacious Top KPI Cards Strip */}
      <ExecutiveKpiStrip result={result} simulationTime={simulationTime} />

      {/* 2. Primary Status / Situation Banner */}
      {isDisrupted ? (
        <div className="bg-[#141F30] border border-[#F59E0B]/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-xl text-[#F59E0B] flex-shrink-0">
                <CloudLightning className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider bg-[#F59E0B]/10 px-2 py-0.5 rounded">
                    Active Airport Disruption
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Window: {disruption.startTime} ({disruption.durationMinutes} mins)
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {disruption.airport} Airport Disruption: {disruption.type.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                  Severe weather event at {disruption.airport} has triggered rotational delays. Flights scheduled to depart {disruption.airport} are held, and downstream turnarounds across Bengaluru (BLR) and Kolkata (CCU) are propagating cascading delays.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => onNavigateTab('NETWORK')}
                className="flex-1 lg:flex-none py-2 px-3.5 bg-[#101827] hover:bg-[#1E2D44] border border-[#1E2D44] text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-[#00F0FF]" />
                Inspect Map
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('DISPATCHER')}
                className="flex-1 lg:flex-none py-2 px-4 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Bot className="w-4 h-4" />
                AI Recovery Dispatcher
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl text-[#10B981]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/10 px-2 py-0.5 rounded">
                  Fleet Schedule Nominal
                </span>
                <span className="text-xs font-mono text-slate-400">Zero Disruption Active</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                All 70 Sectors Operating on Master Flight Plan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Turnaround buffers nominal. Zero stranded passengers. All 70 crew pairings compliant with DGCA CAR Section 7 limits.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('SIMULATOR')}
            className="py-2.5 px-4 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-lg"
          >
            <CloudLightning className="w-4 h-4" />
            Simulate Disruption
          </button>
        </div>
      )}

      {/* 3. Four Action Navigation Modules (Palantir Foundry / Linear style cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('NETWORK')}
          className="bg-[#141F30] border border-[#1E2D44] hover:border-[#00F0FF]/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase text-[#00F0FF]">Live Geographical View</span>
              <Compass className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#00F0FF] transition-colors">
              India Network Radar Map
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Interactive vector map of all 16 Indian airports, curved Bezier flight routes, moving aircraft, and live radar closure rings.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#00F0FF] mt-4 pt-3 border-t border-[#1E2D44]">
            <span>Explore Map</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('SIMULATOR')}
          className="bg-[#141F30] border border-[#1E2D44] hover:border-[#F59E0B]/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase text-[#F59E0B]">Scenario Workbench</span>
              <CloudLightning className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#F59E0B] transition-colors">
              Disruption Simulator
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Configure convective storms, full airport closures, runway maintenance or ATC ground stops across 16 stations.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#F59E0B] mt-4 pt-3 border-t border-[#1E2D44]">
            <span>Open Simulator</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('ROTATIONS')}
          className="bg-[#141F30] border border-[#1E2D44] hover:border-[#00F0FF]/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase text-[#00F0FF]">Fleet Timeline</span>
              <Clock className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#00F0FF] transition-colors">
              Aircraft Rotation Gantt
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Visual Gantt chart for 16 aircraft tails. Inspect scheduled vs actual timings, 45m turnaround buffers, and delay spillovers.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#00F0FF] mt-4 pt-3 border-t border-[#1E2D44]">
            <span>View Rotations</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('DISPATCHER')}
          className="bg-[#141F30] border border-[#1E2D44] hover:border-[#10B981]/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase text-[#10B981]">Operations Control</span>
              <Bot className="w-4 h-4 text-[#10B981]" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-[#10B981] transition-colors">
              AI Dispatcher & Recovery
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tactical recovery mitigations verified by the deterministic engine. Deploy standby spares, cancel flights, and compare diffs.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#10B981] mt-4 pt-3 border-t border-[#1E2D44]">
            <span>Review Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4. Network Stations Health Matrix (All 16 Airports at a glance) */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Network Stations Operational Matrix (16 Airports)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any station to inspect departures, arrivals, and ground status
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Hubs: 6 | Regional: 10
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {airports.map(airport => {
            const isClosed = disruption?.airport === airport.iata;
            const deps = result.flights.filter(f => f.origin === airport.iata);
            const delayedDeps = deps.filter(f => f.departureDelayMinutes >= 15);

            return (
              <div
                key={airport.iata}
                onClick={() => onSelectAirport(airport.iata)}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.03] text-center ${
                  isClosed
                    ? 'bg-[#EF4444]/15 border-[#EF4444]/50 shadow-md ring-1 ring-[#EF4444]/50'
                    : delayedDeps.length > 0
                    ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 hover:border-[#F59E0B]'
                    : 'bg-[#101827] border-[#1E2D44] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${airport.isHub ? 'text-[#00F0FF]' : 'text-slate-400'}`}>
                    {airport.isHub ? 'HUB' : 'SPOKE'}
                  </span>
                  {isClosed ? (
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
                  ) : delayedDeps.length > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  )}
                </div>

                <div className="text-base font-bold font-mono text-white tracking-wider">
                  {airport.iata}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {airport.city}
                </div>

                <div className="mt-2 pt-2 border-t border-[#1E2D44]/80 text-[10px] font-mono flex items-center justify-between">
                  <span className="text-slate-500">{deps.length} dep</span>
                  <span className={delayedDeps.length > 0 ? 'text-[#F59E0B] font-bold' : 'text-slate-400'}>
                    {delayedDeps.length > 0 ? `+${delayedDeps.length} late` : 'OK'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
