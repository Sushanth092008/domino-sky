'use client';

import React, { useState, useMemo } from 'react';
import { SimulatedPassengerConnection, SimulationResult } from '../../types/aviation';
import { OFFICIAL_CONNECTIONS } from '../../data/official-dataset';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  ShieldAlert,
  Info,
  MapPin,
  HelpCircle,
} from 'lucide-react';

interface PassengerImpactViewProps {
  result: SimulationResult;
  connections: SimulatedPassengerConnection[];
  onSelectFlight: (flightNumber: string) => void;
}

export const PassengerImpactView: React.FC<PassengerImpactViewProps> = ({
  result,
  connections,
  onSelectFlight,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'MISSED' | 'STRANDED' | 'MAINTAINED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Map of scheduled layover minutes from official baseline
  const scheduledLayoverMap = useMemo(() => {
    return new Map(OFFICIAL_CONNECTIONS.map(c => [c.connectionId, c.scheduledLayoverMinutes]));
  }, []);

  // 1. Calculate Itinerary Metrics
  const totalItineraries = connections.length;
  const totalPaxInConnections = useMemo(() => {
    return connections.reduce((acc, c) => acc + c.passengerCount, 0);
  }, [connections]);

  const missedConns = useMemo(() => connections.filter(c => c.isMissed), [connections]);
  const missedPax = useMemo(() => missedConns.reduce((acc, c) => acc + c.passengerCount, 0), [missedConns]);

  const strandedConns = useMemo(() => connections.filter(c => c.isStranded), [connections]);
  const strandedPax = useMemo(() => strandedConns.reduce((acc, c) => acc + c.passengerCount, 0), [strandedConns]);

  const maintainedConns = useMemo(() => connections.filter(c => !c.isMissed), [connections]);
  const maintainedPax = useMemo(() => maintainedConns.reduce((acc, c) => acc + c.passengerCount, 0), [maintainedConns]);

  // 2. Hub-by-hub breakdown
  const hubBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; missed: number; stranded: number; pax: number }>();

    for (const c of connections) {
      if (!map.has(c.hubAirport)) {
        map.set(c.hubAirport, { total: 0, missed: 0, stranded: 0, pax: 0 });
      }
      const item = map.get(c.hubAirport)!;
      item.total += 1;
      item.pax += c.passengerCount;
      if (c.isMissed) item.missed += c.passengerCount;
      if (c.isStranded) item.stranded += c.passengerCount;
    }

    return Array.from(map.entries())
      .map(([hub, data]) => ({ hub, ...data }))
      .sort((a, b) => b.missed - a.missed);
  }, [connections]);

  // 3. Filtered connection itineraries
  const filteredConnections = useMemo(() => {
    return connections.filter(c => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInbound = c.inboundFlightNumber.toLowerCase().includes(q);
        const matchOutbound = c.connectingFlightNumber.toLowerCase().includes(q);
        const matchHub = c.hubAirport.toLowerCase().includes(q);
        if (!matchInbound && !matchOutbound && !matchHub) return false;
      }

      // Status filter
      if (filterStatus === 'MISSED') return c.isMissed && !c.isStranded;
      if (filterStatus === 'STRANDED') return c.isStranded;
      if (filterStatus === 'MAINTAINED') return !c.isMissed;

      return true;
    });
  }, [connections, filterStatus, searchQuery]);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#080D18] p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2D44] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#00F0FF]" />
              <span>Passenger Journey Continuity & Hub Operations</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Passenger Connection & Stranding Audit
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Deterministic verification of all {totalItineraries} booked multi-leg passenger connections across official transfer hubs. Evaluates 45-minute Minimum Connect Time (MCT) buffers without double-counting.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-xl bg-[#141F30] border border-[#1E2D44] text-xs font-mono text-slate-300">
              Total Monitored Pax: <strong className="text-white">{result.totalPassengers.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* 1. Spacious KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Maintained / Protected */}
          <div className="bg-[#141F30] border border-[#10B981]/40 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono text-[#10B981]">Protected Transfers</span>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{maintainedPax.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {maintainedConns.length} itineraries with ≥45m MCT intact
            </div>
          </div>

          {/* Card 2: Total Affected */}
          <div className="bg-[#141F30] border border-[#F59E0B]/40 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono text-[#F59E0B]">Total Affected Pax</span>
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-extrabold text-[#F59E0B] font-mono">
              {result.affectedPassengersCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Experience delay, miss connection, or cancelled
            </div>
          </div>

          {/* Card 3: Missed Connections */}
          <div className="bg-[#141F30] border border-amber-500/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono text-amber-400">Missed Connections</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">{missedPax.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {missedConns.length} itineraries (&lt;45m buffer at hub)
            </div>
          </div>

          {/* Card 4: Stranded Passengers */}
          <div className="bg-[#141F30] border border-[#EF4444]/50 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono text-[#EF4444]">Stranded Passengers</span>
              <XCircle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <div className="text-2xl font-extrabold text-[#EF4444] font-mono">{strandedPax.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {strandedConns.length} itineraries (no same-day onward leg)
            </div>
          </div>
        </div>

        {/* 2. Clear Operational Methodology Callout */}
        <div className="bg-[#101827] border border-[#1E2D44] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Aviation Operations Audit: Missed vs. Stranded Passenger Invariants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-[#F59E0B] font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                1. Missed Connection (MCT Breach)
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Occurs when the inbound flight lands too late, causing the transfer buffer to fall below the mandatory <strong>45-minute Minimum Connect Time (MCT)</strong> at the connecting airport. Baggage transfer and transit gate boarding cannot be guaranteed.
              </p>
            </div>

            <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-[#EF4444] font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                2. Stranded Passenger Definition
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                A passenger who has missed their connection or had their flight cancelled, <strong>AND has no viable same-day rebooking alternative</strong> in the operational schedule. Requires airline-provided overnight hotel accommodation.
              </p>
            </div>

            <div className="bg-[#141F30] border border-[#1E2D44] rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-[#00F0FF] font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                3. Double-Counting Prevention
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Every passenger itinerary is evaluated as an atomic entity. Stranded passengers are classified as a <strong>strict subset</strong> of affected passengers. Network metrics guarantee that no passenger is counted more than once.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Connecting Hub Breakdown Matrix */}
        <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono mb-3">
            Transfer Hub Impact Distribution
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {hubBreakdown.map(h => (
              <div
                key={h.hub}
                className="bg-[#101827] border border-[#1E2D44] rounded-xl p-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-extrabold font-mono text-white">{h.hub}</span>
                  <span className="text-[10px] font-mono text-slate-400">{h.total} Conns</span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px]">Missed Pax:</span>
                    <span className={h.missed > 0 ? 'text-[#F59E0B] font-bold' : 'text-slate-500'}>
                      {h.missed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px]">Stranded Pax:</span>
                    <span className={h.stranded > 0 ? 'text-[#EF4444] font-bold' : 'text-slate-500'}>
                      {h.stranded}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Complete Passenger Itineraries Audit Table */}
        <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
              <span>All Monitored Itineraries ({filteredConnections.length} shown)</span>
            </div>

            {/* Filter buttons & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#101827] p-1 rounded-xl border border-[#1E2D44] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterStatus === 'ALL'
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({connections.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus('MISSED')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterStatus === 'MISSED'
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Missed ({missedConns.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus('STRANDED')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterStatus === 'STRANDED'
                      ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stranded ({strandedConns.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStatus('MAINTAINED')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterStatus === 'MAINTAINED'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Protected ({maintainedConns.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter flight or hub..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-[#101827] border border-[#1E2D44] focus:border-[#00F0FF]/50 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#1E2D44]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#101827] text-slate-400 text-[10.5px] uppercase border-b border-[#1E2D44]">
                <tr>
                  <th className="py-3 px-3.5">Inbound Sector</th>
                  <th className="py-3 px-3.5">Transfer Hub</th>
                  <th className="py-3 px-3.5">Connecting Sector</th>
                  <th className="py-3 px-3.5">Layover Buffer</th>
                  <th className="py-3 px-3.5 text-center">Pax Count</th>
                  <th className="py-3 px-3.5">Journey Status</th>
                  <th className="py-3 px-3.5">Operational Consequence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D44]/60 bg-[#141F30]">
                {filteredConnections.map(c => {
                  const isMissed = c.isMissed;
                  const isStranded = c.isStranded;
                  const scheduledLayover = scheduledLayoverMap.get(c.connectionId) ?? c.actualLayoverMinutes;

                  return (
                    <tr
                      key={c.connectionId}
                      className="hover:bg-[#101827]/70 transition-colors"
                    >
                      {/* Inbound Sector */}
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectFlight(c.inboundFlightNumber)}
                          className="font-bold text-white hover:text-[#00F0FF] underline decoration-slate-600 flex items-center gap-1.5"
                        >
                          {c.inboundFlightNumber}
                        </button>
                      </td>

                      {/* Transfer Hub */}
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded bg-[#101827] border border-[#1E2D44] font-bold text-[#00F0FF]">
                          {c.hubAirport}
                        </span>
                      </td>

                      {/* Connecting Sector */}
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectFlight(c.connectingFlightNumber)}
                          className="font-bold text-white hover:text-[#00F0FF] underline decoration-slate-600 flex items-center gap-1.5"
                        >
                          {c.connectingFlightNumber}
                        </button>
                      </td>

                      {/* Layover Buffer */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className={c.actualLayoverMinutes < 45 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {c.actualLayoverMinutes}m
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (Sch: {scheduledLayover}m)
                          </span>
                        </div>
                      </td>

                      {/* Pax Count */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#101827] border border-[#1E2D44] font-bold text-white">
                          {c.passengerCount}
                        </span>
                      </td>

                      {/* Journey Status */}
                      <td className="py-3 px-3.5">
                        {isStranded ? (
                          <span className="px-2 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[10px]">
                            STRANDED
                          </span>
                        ) : isMissed ? (
                          <span className="px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-bold text-[10px]">
                            MISSED MCT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-bold text-[10px]">
                            MAINTAINED
                          </span>
                        )}
                      </td>

                      {/* Operational Consequence */}
                      <td className="py-3 px-3.5 text-[11px] text-slate-300">
                        {isStranded
                          ? 'No onward flight available on same day; airline hotel required.'
                          : isMissed
                          ? 'Transfer layover <45m MCT; rebooked onto next available rotation.'
                          : 'Normal connection; baggage transferred seamlessly.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
