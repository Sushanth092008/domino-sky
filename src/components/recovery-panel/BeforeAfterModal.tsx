'use client';

import React from 'react';
import { SimulationResult, RecoveryAction } from '../../types/aviation';
import {
  X,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Plane,
  AlertTriangle,
} from 'lucide-react';

interface BeforeAfterModalProps {
  baselineResult: SimulationResult;
  recoveredResult: SimulationResult;
  isOpen: boolean;
  onClose: () => void;
  onResetToBaseline: () => void;
}

export const BeforeAfterModal: React.FC<BeforeAfterModalProps> = ({
  baselineResult,
  recoveredResult,
  isOpen,
  onClose,
  onResetToBaseline,
}) => {
  if (!isOpen) return null;

  const delayDelta = recoveredResult.totalDelayMinutes - baselineResult.totalDelayMinutes;
  const delayedFlightsDelta = recoveredResult.delayedFlightsCount - baselineResult.delayedFlightsCount;
  const strandedDelta = recoveredResult.strandedPassengersCount - baselineResult.strandedPassengersCount;
  const missedConnectionsDelta = recoveredResult.missedConnectionPassengersCount - baselineResult.missedConnectionPassengersCount;
  const crewBreachDelta = recoveredResult.crewBreachesCount - baselineResult.crewBreachesCount;

  // Comparison metrics rows
  const comparisonRows = [
    {
      metric: 'Delayed Flights (≥15m)',
      before: baselineResult.delayedFlightsCount,
      after: recoveredResult.delayedFlightsCount,
      delta: `${delayedFlightsDelta > 0 ? '+' : ''}${delayedFlightsDelta}`,
      improved: delayedFlightsDelta <= 0,
      unit: 'flights',
    },
    {
      metric: 'Cancelled Flights',
      before: baselineResult.cancelledFlightsCount,
      after: recoveredResult.cancelledFlightsCount,
      delta: `${recoveredResult.cancelledFlightsCount - baselineResult.cancelledFlightsCount > 0 ? '+' : ''}${recoveredResult.cancelledFlightsCount - baselineResult.cancelledFlightsCount}`,
      improved: recoveredResult.cancelledFlightsCount <= baselineResult.cancelledFlightsCount,
      unit: 'flights',
    },
    {
      metric: 'Total Delay Minutes',
      before: `${baselineResult.totalDelayMinutes}m`,
      after: `${recoveredResult.totalDelayMinutes}m`,
      delta: `${delayDelta > 0 ? '+' : ''}${delayDelta}m`,
      improved: delayDelta <= 0,
      unit: '',
    },
    {
      metric: 'Average Flight Delay',
      before: `+${baselineResult.averageDelayMinutes}m`,
      after: `+${recoveredResult.averageDelayMinutes}m`,
      delta: `${recoveredResult.averageDelayMinutes - baselineResult.averageDelayMinutes > 0 ? '+' : ''}${recoveredResult.averageDelayMinutes - baselineResult.averageDelayMinutes}m`,
      improved: recoveredResult.averageDelayMinutes <= baselineResult.averageDelayMinutes,
      unit: '',
    },
    {
      metric: 'Stranded Passengers',
      before: baselineResult.strandedPassengersCount,
      after: recoveredResult.strandedPassengersCount,
      delta: `${strandedDelta > 0 ? '+' : ''}${strandedDelta}`,
      improved: strandedDelta <= 0,
      unit: 'pax',
    },
    {
      metric: 'Missed Connections',
      before: baselineResult.missedConnectionPassengersCount,
      after: recoveredResult.missedConnectionPassengersCount,
      delta: `${missedConnectionsDelta > 0 ? '+' : ''}${missedConnectionsDelta}`,
      improved: missedConnectionsDelta <= 0,
      unit: 'pax',
    },
    {
      metric: 'Crew FDP Duty Breaches',
      before: baselineResult.crewBreachesCount,
      after: recoveredResult.crewBreachesCount,
      delta: `${crewBreachDelta > 0 ? '+' : ''}${crewBreachDelta}`,
      improved: crewBreachDelta <= 0,
      unit: 'sectors',
    },
  ];

  // Flight-level diffs
  const flightChanges = baselineResult.flights
    .map(baseF => {
      const recF = recoveredResult.flights.find(f => f.flightNumber === baseF.flightNumber)!;
      const delayDiff = recF.departureDelayMinutes - baseF.departureDelayMinutes;
      const statusChanged = recF.status !== baseF.status;
      const tailChanged = recF.aircraftTail !== baseF.aircraftTail;

      return {
        flightNumber: baseF.flightNumber,
        route: `${baseF.origin} → ${baseF.destination}`,
        scheduledDeparture: baseF.scheduledDeparture,
        baseTail: baseF.aircraftTail,
        recTail: recF.aircraftTail,
        baseDelay: baseF.departureDelayMinutes,
        recDelay: recF.departureDelayMinutes,
        delayDiff,
        baseStatus: baseF.status,
        recStatus: recF.status,
        isRecovered: delayDiff < 0 || (baseF.departureDelayMinutes >= 15 && recF.departureDelayMinutes < 15),
        isWorse: delayDiff > 0,
      };
    })
    .filter(fc => fc.delayDiff !== 0 || fc.baseStatus !== fc.recStatus || fc.baseTail !== fc.recTail)
    .sort((a, b) => a.delayDiff - b.delayDiff);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-xs">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              Operational Recovery Audit & Impact Verification
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              BASELINE DISRUPTION vs AFTER RECOVERY (Deterministic Engine Output)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Summary Comparison Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">NET DELAY SAVINGS</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {Math.abs(delayDelta)} mins
              </span>
              <span className="text-[10px] text-slate-500 block">
                {baselineResult.totalDelayMinutes}m → {recoveredResult.totalDelayMinutes}m
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">PAX SAVED FROM STRANDING</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {Math.abs(strandedDelta)} pax
              </span>
              <span className="text-[10px] text-slate-500 block">
                {baselineResult.strandedPassengersCount} → {recoveredResult.strandedPassengersCount}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">CREW BREACHES AVOIDED</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {Math.abs(crewBreachDelta)} sectors
              </span>
              <span className="text-[10px] text-slate-500 block">
                {baselineResult.crewBreachesCount} → {recoveredResult.crewBreachesCount}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block">FLIGHTS RECOVERED</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {flightChanges.filter(f => f.isRecovered).length}
              </span>
              <span className="text-[10px] text-slate-500 block">Schedule normalized</span>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider font-mono">
              Network Metric Delta Comparison
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left font-mono">
                <thead className="bg-slate-900 text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">METRIC</th>
                    <th className="py-2.5 px-4 font-semibold text-right">BASELINE DISRUPTION</th>
                    <th className="py-2.5 px-4 font-semibold text-right">AFTER RECOVERY</th>
                    <th className="py-2.5 px-4 font-semibold text-right">NET DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-200 font-sans font-medium">{row.metric}</td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{row.before}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-200">{row.after}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-bold ${
                          row.improved ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {row.delta} {row.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Flight-Level Status Change Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider font-mono">
              Flight-Level Variance Log ({flightChanges.length} Flights Changed)
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40 max-h-56 overflow-y-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-900 text-[10px] text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">FLIGHT</th>
                    <th className="py-2 px-3">ROUTE</th>
                    <th className="py-2 px-3">TAIL ASSIGNMENT</th>
                    <th className="py-2 px-3 text-right">BEFORE</th>
                    <th className="py-2 px-3 text-right">AFTER</th>
                    <th className="py-2 px-3 text-right">IMPACT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {flightChanges.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500">
                        No flight-level changes recorded.
                      </td>
                    </tr>
                  ) : (
                    flightChanges.map(fc => (
                      <tr key={fc.flightNumber} className="hover:bg-slate-850/40">
                        <td className="py-2 px-3 font-bold text-slate-200">{fc.flightNumber}</td>
                        <td className="py-2 px-3 text-slate-400">{fc.route}</td>
                        <td className="py-2 px-3 text-cyan-300">
                          {fc.baseTail !== fc.recTail ? `${fc.baseTail} → ${fc.recTail}` : fc.baseTail}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">+{fc.baseDelay}m</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-200">+{fc.recDelay}m</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {fc.isRecovered ? (
                            <span className="text-emerald-400">-{Math.abs(fc.delayDiff)}m</span>
                          ) : fc.isWorse ? (
                            <span className="text-red-400">+{fc.delayDiff}m</span>
                          ) : (
                            <span className="text-slate-400">0m</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetToBaseline}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-xs transition-colors"
          >
            Revert to Original Baseline
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-colors shadow-lg"
          >
            Confirm & Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
