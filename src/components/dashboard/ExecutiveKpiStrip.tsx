'use client';

import React from 'react';
import { SimulationResult } from '../../types/aviation';
import {
  Plane,
  AlertTriangle,
  Clock,
  Users,
  ShieldCheck,
  ShieldAlert,
  Ban,
  TrendingDown,
} from 'lucide-react';

interface ExecutiveKpiStripProps {
  result: SimulationResult;
  simulationTime: string;
}

export const ExecutiveKpiStrip: React.FC<ExecutiveKpiStripProps> = ({ result, simulationTime }) => {
  const activeDelayed = result.activeMetrics?.activeDelayedFlightsCount ?? 0;
  const activeHeld = result.activeMetrics?.activeHeldFlightsCount ?? 0;
  const activeDelayMins = result.activeMetrics?.activeDelayMinutes ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 w-full">
      {/* 1. Total Flights */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Total Flights</span>
          <Plane className="w-4 h-4 text-[#00F0FF]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-white tracking-tight">
            {result.totalFlights}
          </span>
          <span className="text-xs font-mono text-slate-400">sectors</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-[#1E2D44]/80 pt-2">
          <span>Active schedule</span>
          <span className="text-[#00F0FF] font-mono">16 Aircraft</span>
        </div>
      </div>

      {/* 2. Delayed Flights */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Delayed Flights</span>
          <AlertTriangle className={`w-4 h-4 ${result.delayedFlightsCount > 0 ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${result.delayedFlightsCount > 0 ? 'text-[#F59E0B]' : 'text-white'}`}>
            {result.delayedFlightsCount}
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({Math.round((result.delayedFlightsCount / result.totalFlights) * 100)}%)
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-[#1E2D44]/80 pt-2">
          <span>Active at {simulationTime}:</span>
          <span className={`font-mono font-semibold ${activeDelayed + activeHeld > 0 ? 'text-[#F59E0B]' : 'text-slate-400'}`}>
            {activeDelayed + activeHeld} flights
          </span>
        </div>
      </div>

      {/* 3. Total Delay Minutes */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Total Delay</span>
          <Clock className={`w-4 h-4 ${result.totalDelayMinutes > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${result.totalDelayMinutes > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
            +{result.totalDelayMinutes}
          </span>
          <span className="text-xs font-mono text-slate-400">mins</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-[#1E2D44]/80 pt-2">
          <span>Network average:</span>
          <span className="text-white font-mono font-medium">+{result.averageDelayMinutes}m / leg</span>
        </div>
      </div>

      {/* 4. Cancelled Flights */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Cancellations</span>
          <Ban className={`w-4 h-4 ${result.cancelledFlightsCount > 0 ? 'text-[#EF4444]' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${result.cancelledFlightsCount > 0 ? 'text-[#EF4444]' : 'text-white'}`}>
            {result.cancelledFlightsCount}
          </span>
          <span className="text-xs font-mono text-slate-400">flights</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-[#1E2D44]/80 pt-2">
          <span>Tactical resets</span>
          <span className="text-slate-300 font-mono">
            {result.cancelledFlightsCount > 0 ? 'Cascades halted' : 'Zero cancelled'}
          </span>
        </div>
      </div>

      {/* 5. Stranded Passengers */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Stranded Pax</span>
          <Users className={`w-4 h-4 ${result.strandedPassengersCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${result.strandedPassengersCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {result.strandedPassengersCount}
          </span>
          <span className="text-xs font-mono text-slate-400">pax</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-[#1E2D44]/80 pt-2">
          <span>Missed connections:</span>
          <span className="text-white font-mono font-medium">{result.missedConnectionPassengersCount} total</span>
        </div>
      </div>

      {/* 6. Crew Duty Feasibility */}
      <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium tracking-wide uppercase">Crew Legality</span>
          {result.crewBreachesCount > 0 ? (
            <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-mono tracking-tight ${result.crewBreachesCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {result.crewBreachesCount > 0 ? `${result.crewBreachesCount}` : '0'}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {result.crewBreachesCount > 0 ? 'breaches' : 'legal'}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-[#1E2D44]/80 pt-2">
          <span>DGCA CAR Sec 7:</span>
          <span className={`font-mono font-medium ${result.crewBreachesCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {result.crewBreachesCount > 0 ? 'Requires relief' : 'All compliant'}
          </span>
        </div>
      </div>
    </div>
  );
};
