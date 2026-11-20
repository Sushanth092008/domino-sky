'use client';

import React from 'react';
import { SimulationResult, Airport } from '../../types/aviation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface OperationsAnalyticsProps {
  result: SimulationResult;
  airports?: Airport[];
}

export const OperationsAnalytics: React.FC<OperationsAnalyticsProps> = ({ result }) => {
  // Chart 1: Delays by Airport
  const airportChartData = result.mostDisruptedAirports.map(a => ({
    iata: a.iata,
    delayMinutes: a.totalDelayMinutes,
    delayedDepartures: a.delayedDepartures,
  }));

  // Chart 2: Delays by Aircraft Tail
  const tailChartData = result.mostDisruptedAircraft.map(t => ({
    tail: t.tail,
    delayMinutes: t.totalDelayMinutes,
    legsDelayed: t.legsDelayed,
  }));

  // Chart 3: Flight Status Breakdown
  const statusPieData = [
    { name: 'On-Time', value: result.onTimeFlightsCount, color: '#06b6d4' },
    { name: 'Delayed (≥15m)', value: result.delayedFlightsCount, color: '#f59e0b' },
    { name: 'Cancelled', value: result.cancelledFlightsCount, color: '#ef4444' },
    { name: 'Recovered', value: result.recoveredFlightsCount, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Chart 4: Passenger Impact Breakdown
  const totalPax = result.totalPassengers;
  const normalPax = totalPax - result.affectedPassengersCount;
  const affectedPax = result.affectedPassengersCount;
  const missedPax = result.missedConnectionPassengersCount;
  const strandedPax = result.strandedPassengersCount;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <span>Operational Analytics & Network Impact Telemetry</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Signature: <span className="text-cyan-400 font-bold">{result.deterministicSignature}</span>
        </span>
      </div>

      {/* Analytics Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Top 4 KPI mini cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">AVG FLIGHT DELAY</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              +{result.averageDelayMinutes}m
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Across all 70 flights</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">PROPAGATION DEPTH</span>
            <span className="text-xl font-bold font-mono text-cyan-400">
              {result.maxPropagationDepth} <span className="text-xs text-slate-400">sectors</span>
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Max consecutive delayed legs</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">STRANDED PASSENGERS</span>
            <span className="text-xl font-bold font-mono text-red-400">
              {result.strandedPassengersCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Missed last daily connection</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono">CREW FDP BREACHES</span>
            <span className={`text-xl font-bold font-mono ${result.crewBreachesCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {result.crewBreachesCount}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">DGCA CAR Section 7 breaches</span>
          </div>
        </div>

        {/* Chart Row 1: Delays by Airport & Delays by Aircraft */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Airport Delay Bar Chart */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>Cumulative Delay Minutes by Airport</span>
              <span className="text-[10px] font-mono text-slate-500">IATA Hubs</span>
            </h4>
            <div className="h-52 w-full">
              {airportChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={airportChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="iata" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val) => [`${val} mins`, 'Delay']}
                    />
                    <Bar dataKey="delayMinutes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  All airports operating normal schedules
                </div>
              )}
            </div>
          </div>

          {/* Aircraft Tail Delay Bar Chart */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>Rotational Delay by Aircraft Tail</span>
              <span className="text-[10px] font-mono text-slate-500">Top Incurring Tails</span>
            </h4>
            <div className="h-52 w-full">
              {tailChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tailChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="tail" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val) => [`${val} mins`, 'Delay']}
                    />
                    <Bar dataKey="delayMinutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Zero aircraft rotation delays
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart Row 2: Status Breakdown Pie & Passenger Impact Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Breakdown Pie */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col">
            <h4 className="text-xs font-bold text-slate-200 mb-2">Fleet Operational Status</h4>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px' }}
                    formatter={(val) => <span className="text-slate-300">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Passenger Flow Integrity */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-1">Passenger Journey Continuity</h4>
              <p className="text-[10px] text-slate-400 mb-4">Total Network Bookings: {totalPax.toLocaleString()} passengers</p>

              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">On-Time Journeys</span>
                    <span className="text-cyan-400 font-bold">{normalPax.toLocaleString()} pax ({Math.round((normalPax / totalPax) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(normalPax / totalPax) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Affected by Delays / Cancellations</span>
                    <span className="text-amber-400 font-bold">{affectedPax.toLocaleString()} pax ({Math.round((affectedPax / totalPax) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(affectedPax / totalPax) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Missed Connections</span>
                    <span className="text-red-400 font-bold">{missedPax} pax</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (missedPax / 400) * 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">Stranded Overnight (No Reconnection)</span>
                    <span className="text-red-500 font-bold">{strandedPax} pax</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: `${Math.min(100, (strandedPax / 400) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
