'use client';

import React, { useMemo } from 'react';
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
import {
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

interface AnalyticsViewProps {
  result: SimulationResult;
  airports: Airport[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ result, airports }) => {
  // Chart 1: Delays by Airport
  const airportChartData = useMemo(() => {
    return result.mostDisruptedAirports.map(a => ({
      iata: a.iata,
      delayMinutes: a.totalDelayMinutes,
      delayedDepartures: a.delayedDepartures,
    }));
  }, [result.mostDisruptedAirports]);

  // Chart 2: Delays by Aircraft Tail
  const tailChartData = useMemo(() => {
    return result.mostDisruptedAircraft.map(t => ({
      tail: t.tail,
      delayMinutes: t.totalDelayMinutes,
      legsDelayed: t.legsDelayed,
    }));
  }, [result.mostDisruptedAircraft]);

  // Chart 3: Status Distribution
  const statusPieData = useMemo(() => {
    return [
      { name: 'On-Time', value: result.onTimeFlightsCount, color: '#00F0FF' },
      { name: 'Delayed (≥15m)', value: result.delayedFlightsCount, color: '#F59E0B' },
      { name: 'Cancelled', value: result.cancelledFlightsCount, color: '#EF4444' },
      { name: 'Recovered', value: result.recoveredFlightsCount, color: '#10B981' },
    ].filter(d => d.value > 0);
  }, [result]);

  const totalPax = result.totalPassengers;
  const normalPax = totalPax - result.affectedPassengersCount;
  const otpPercent = Math.round((result.onTimeFlightsCount / result.totalFlights) * 100);

  // Network Multiplier: ratio of total delayed legs to root delayed legs
  const rootDelayedCount = result.flights.filter(f => f.isDirectlyDisrupted).length;
  const totalDelayedCount = result.delayedFlightsCount;
  const dominoMultiplier = rootDelayedCount > 0 ? (totalDelayedCount / rootDelayedCount).toFixed(1) : '1.0';

  return (
    <div className="w-full h-full overflow-y-auto bg-[#080D18] p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2D44] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-[#00F0FF]" />
              <span>Operational Telemetry & Performance Intelligence</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Network Analytics & Insights
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time statistical evaluation of the 70-flight network across on-time performance (OTP), cumulative delay hours, rotational propagation factors, and passenger flow integrity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1.5 rounded-xl bg-[#141F30] border border-[#1E2D44] text-xs font-mono text-slate-300">
              Total Flights: <strong className="text-white">{result.totalFlights}</strong> (16 Hubs)
            </span>
          </div>
        </div>

        {/* 1. Spacious KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono">On-Time Performance (OTP)</span>
              <Activity className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">{otpPercent}%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {result.onTimeFlightsCount} of {result.totalFlights} flights on schedule
            </div>
          </div>

          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono">Total Delay Incurred</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {result.totalDelayMinutes.toLocaleString()}{' '}
              <span className="text-xs text-slate-400">mins</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {(result.totalDelayMinutes / 60).toFixed(1)} cumulative flight hours
            </div>
          </div>

          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono">Domino Multiplier</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-400 font-mono">
              {dominoMultiplier}x
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Downstream delays per root ground-held sector
            </div>
          </div>

          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold uppercase font-mono">Passenger Protection</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {Math.round((normalPax / totalPax) * 100)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {normalPax.toLocaleString()} passengers unaffected
            </div>
          </div>
        </div>

        {/* 2. Primary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Airport Delay Bar Chart */}
          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
                Cumulative Delay Minutes by Airport Hub
              </span>
              <span className="text-[10px] font-mono text-slate-500">IATA Station Code</span>
            </div>

            <div className="h-64 w-full">
              {airportChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={airportChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" />
                    <XAxis dataKey="iata" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101827',
                        borderColor: '#1E2D44',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      formatter={val => [`${val} mins`, 'Delay']}
                    />
                    <Bar dataKey="delayMinutes" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  All 16 airports operating on schedule
                </div>
              )}
            </div>
          </div>

          {/* Aircraft Tail Delay Bar Chart */}
          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
                Rotational Delay Accumulation by Aircraft Tail
              </span>
              <span className="text-[10px] font-mono text-slate-500">Top Incurring Tails</span>
            </div>

            <div className="h-64 w-full">
              {tailChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tailChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D44" />
                    <XAxis dataKey="tail" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101827',
                        borderColor: '#1E2D44',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      formatter={val => [`${val} mins`, 'Delay']}
                    />
                    <Bar dataKey="delayMinutes" fill="#00F0FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Zero aircraft rotation delays
                </div>
              )}
            </div>
          </div>

          {/* Fleet Status Pie Chart */}
          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm flex flex-col">
            <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono mb-4">
              Fleet Operational Status Distribution
            </span>

            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101827',
                      borderColor: '#1E2D44',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={val => <span className="text-slate-300">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Passenger Flow Integrity Progress Bar */}
          <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono block mb-1">
                Passenger Flow Integrity & Rebooking Health
              </span>
              <p className="text-[11px] text-slate-400 mb-6">
                Total Monitored Passengers: {totalPax.toLocaleString()}
              </p>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">On-Time Journeys</span>
                    <span className="text-[#00F0FF] font-bold">
                      {normalPax.toLocaleString()} pax ({Math.round((normalPax / totalPax) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#101827] h-2.5 rounded-full overflow-hidden border border-[#1E2D44]">
                    <div
                      className="bg-[#00F0FF] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(normalPax / totalPax) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Disrupted by Delays or Cancellations</span>
                    <span className="text-amber-400 font-bold">
                      {result.affectedPassengersCount.toLocaleString()} pax ({Math.round((result.affectedPassengersCount / totalPax) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#101827] h-2.5 rounded-full overflow-hidden border border-[#1E2D44]">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(result.affectedPassengersCount / totalPax) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Stranded (Overnight Hotel Required)</span>
                    <span className="text-red-400 font-bold">
                      {result.strandedPassengersCount.toLocaleString()} pax ({((result.strandedPassengersCount / totalPax) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#101827] h-2.5 rounded-full overflow-hidden border border-[#1E2D44]">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(1, (result.strandedPassengersCount / totalPax) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1E2D44] text-[11px] text-slate-400 font-mono">
              Deterministic evaluation: 100% of network disruptions traced with strict single-seat accounting.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
