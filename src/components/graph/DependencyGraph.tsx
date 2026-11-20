'use client';

import React from 'react';
import { SimulatedFlight, SimulatedPassengerConnection, DisruptionInput } from '../../types/aviation';
import { AlertTriangle, ArrowRight, Plane, Users, Clock, ShieldAlert, GitCommit } from 'lucide-react';

interface DependencyGraphProps {
  disruption: DisruptionInput | null;
  flights: SimulatedFlight[];
  connections: SimulatedPassengerConnection[];
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
}

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  disruption,
  flights,
  connections,
  selectedFlightNumber,
  onSelectFlight,
}) => {
  if (!disruption) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400">
        <GitCommit className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Active Disruption to Trace</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Trigger an airport disruption (e.g. Mumbai 90m Thunderstorm) to visualize the multi-sector cascading dependency DAG.
        </p>
      </div>
    );
  }

  // Find root flights directly impacted by closure
  const directlyDisruptedFlights = flights
    .filter(f => f.isDirectlyDisrupted)
    .sort((a, b) => b.departureDelayMinutes - a.departureDelayMinutes);

  // Group downstream flights by tail
  const infectedTails = Array.from(new Set(directlyDisruptedFlights.map(f => f.aircraftTail)));

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <GitCommit className="w-4 h-4 text-amber-400" />
          <span>Disruption Propagation & Cascade DAG</span>
        </div>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          Root Event: {disruption.airport} {disruption.type.replace('_', ' ')} (+{disruption.durationMinutes}m)
        </span>
      </div>

      {/* DAG Cascade Tree View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {infectedTails.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No flights were operating during the specified disruption window at {disruption.airport}.
          </div>
        ) : (
          infectedTails.map(tail => {
            const tailFlights = flights
              .filter(f => f.aircraftTail === tail)
              .sort((a, b) => a.rotationSequence - b.rotationSequence);

            return (
              <div key={tail} className="bg-slate-900/40 rounded-xl border border-slate-800/80 p-4 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                      TAIL: {tail}
                    </span>
                    <span className="text-xs text-slate-400">
                      Multi-Sector Rotation ({tailFlights.length} Sectors)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Cumulative Delay:{' '}
                    <span className="text-amber-400 font-bold">
                      +{tailFlights.reduce((acc, f) => acc + f.departureDelayMinutes, 0)}m
                    </span>
                  </span>
                </div>

                {/* Horizontal Domino Chain */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 overflow-x-auto pb-2">
                  {tailFlights.map((flight, idx) => {
                    const isSelected = selectedFlightNumber === flight.flightNumber;
                    const isRoot = flight.isDirectlyDisrupted;
                    const hasDelay = flight.departureDelayMinutes > 0;
                    const isCancelled = flight.status === 'CANCELLED';

                    // Check if any connections broke from this flight
                    const brokenConns = connections.filter(
                      c => c.inboundFlightNumber === flight.flightNumber && c.isMissed
                    );
                    const brokenPax = brokenConns.reduce((acc, c) => acc + c.passengerCount, 0);

                    return (
                      <React.Fragment key={flight.flightNumber}>
                        {/* Flight Step Card */}
                        <div
                          onClick={() => onSelectFlight(flight.flightNumber)}
                          className={`relative flex-1 min-w-[220px] rounded-lg p-3 border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-white ring-2 ring-white/50 shadow-xl'
                              : isCancelled
                              ? 'bg-red-950/40 border-red-800/60 hover:border-red-600'
                              : hasDelay
                              ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-500'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top step badge */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                              LEG {flight.rotationSequence}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isCancelled
                                  ? 'bg-red-500/20 text-red-400'
                                  : hasDelay
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {isCancelled ? 'CANCELLED' : hasDelay ? `+${flight.departureDelayMinutes}m LATE` : 'ON TIME'}
                            </span>
                          </div>

                          {/* Flight details */}
                          <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                            <span className="flex items-center gap-1">
                              <Plane className="w-3 h-3 text-cyan-400" />
                              {flight.flightNumber}
                            </span>
                            <span className="font-mono text-cyan-300">
                              {flight.origin} → {flight.destination}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] font-mono text-slate-400">
                            <div>
                              SCH: {flight.scheduledDeparture}-{flight.scheduledArrival}
                            </div>
                            <div>
                              ACT: {flight.actualDeparture}-{flight.actualArrival}
                            </div>
                          </div>

                          {/* Cascade Cause Callout */}
                          {flight.delayCauses.length > 0 && (
                            <div className="mt-2 text-[9.5px] p-1.5 rounded bg-black/40 border border-slate-800 text-amber-300 leading-snug">
                              {isRoot ? '⚡ Directly held by closure' : '🔗 Turnaround buffer overrun'}
                            </div>
                          )}

                          {/* Broken Connections Badge */}
                          {brokenPax > 0 && (
                            <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                              <Users className="w-3 h-3 text-red-400 flex-shrink-0" />
                              <span>{brokenPax} pax missed connection</span>
                            </div>
                          )}

                          {/* Crew Duty Breach Badge */}
                          {!flight.crewDutyFeasible && (
                            <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">
                              <ShieldAlert className="w-3 h-3 text-red-400 flex-shrink-0" />
                              <span>Crew FDP Breach (&gt;11h)</span>
                            </div>
                          )}
                        </div>

                        {/* Arrow separator to next domino leg */}
                        {idx < tailFlights.length - 1 && (
                          <div className="flex lg:flex-col items-center justify-center text-slate-600 px-1 py-1">
                            <ArrowRight className="w-4 h-4 text-amber-500/80" />
                            <span className="text-[8px] font-mono text-slate-500 hidden lg:inline mt-0.5">
                              TAT 45m
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
