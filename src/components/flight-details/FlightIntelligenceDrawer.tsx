'use client';

import React from 'react';
import { SimulatedFlight, CrewAssignment, SimulatedPassengerConnection } from '../../types/aviation';
import {
  X,
  Plane,
  Clock,
  Users,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface FlightIntelligenceDrawerProps {
  flight: SimulatedFlight | null;
  crew: CrewAssignment | null;
  inboundConnections: SimulatedPassengerConnection[];
  outboundConnections: SimulatedPassengerConnection[];
  onClose: () => void;
  onQuickRecoverSpare?: (flightNumber: string) => void;
  onQuickCancel?: (flightNumber: string) => void;
}

export const FlightIntelligenceDrawer: React.FC<FlightIntelligenceDrawerProps> = ({
  flight,
  crew,
  inboundConnections,
  outboundConnections,
  onClose,
  onQuickRecoverSpare,
  onQuickCancel,
}) => {
  if (!flight) return null;

  const isDelayed = flight.departureDelayMinutes >= 15;
  const isCancelled = flight.status === 'CANCELLED';
  const isRecovered = flight.originalAssignedTail !== flight.aircraftTail;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col text-slate-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">{flight.flightNumber}</h2>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isCancelled
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isDelayed
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {flight.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Tail: <span className="text-cyan-300 font-semibold">{flight.aircraftTail}</span> | Leg #{flight.rotationSequence} of day
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Route & Times Card */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="text-center">
              <span className="text-xl font-bold font-mono text-white">{flight.origin}</span>
              <span className="text-[10px] text-slate-400 block">ORIGIN</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-500 mt-0.5">Non-stop</span>
            </div>
            <div className="text-center">
              <span className="text-xl font-bold font-mono text-white">{flight.destination}</span>
              <span className="text-[10px] text-slate-400 block">DESTINATION</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">SCHEDULED TIME</span>
              <span className="text-slate-200 font-semibold">
                {flight.scheduledDeparture} → {flight.scheduledArrival}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">ACTUAL / SIMULATED</span>
              <span className={`font-semibold ${isDelayed ? 'text-amber-400' : 'text-emerald-400'}`}>
                {flight.actualDeparture} → {flight.actualArrival}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between font-mono">
            <span className="text-slate-400">Departure Delay:</span>
            <span className={`font-bold ${isDelayed ? 'text-amber-400' : 'text-emerald-400'}`}>
              +{flight.departureDelayMinutes} mins
            </span>
          </div>
        </div>

        {/* DELAY EXPLANATION SECTION - HIGHEST VISUAL PRIORITY */}
        <div className="bg-gradient-to-b from-amber-950/20 to-slate-900/60 rounded-xl p-4 border border-amber-500/30 shadow-lg">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide text-xs uppercase">Why is this flight delayed?</span>
          </div>

          {flight.delayCauses.length === 0 ? (
            <p className="text-slate-400 text-xs">
              This flight operated without delays. Turnaround buffer and air traffic clearances met scheduled tolerances.
            </p>
          ) : (
            <div className="relative pl-4 space-y-3 mt-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-amber-500/30">
              {flight.delayCauses.map((cause, cIdx) => (
                <div key={cIdx} className="relative group">
                  <div className="absolute -left-[14.5px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-slate-950"></div>
                  <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                      <span>{cause.title}</span>
                      <span className="font-mono text-amber-400">+{cause.impactMinutes}m</span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                      {cause.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crew Duty Status Card */}
        {crew && (
          <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Crew Pairings & Legal Duty Hours
              </span>
              {flight.crewDutyFeasible ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> DGCA LEGAL
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30">
                  <ShieldAlert className="w-3 h-3" /> FDP BREACH
                </span>
              )}
            </div>

            <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Commander:</span>
                <span className="text-slate-200 font-semibold">{crew.captain.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">First Officer:</span>
                <span className="text-slate-200 font-semibold">{crew.firstOfficer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Purser:</span>
                <span className="text-slate-200 font-semibold">{crew.cabinLead.name}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                <span className="text-slate-500">Duty Started:</span>
                <span className="text-slate-400">{crew.dutyStartTime} IST (Max FDP: {crew.maxDutyMinutes / 60}h)</span>
              </div>
            </div>

            {!flight.crewDutyFeasible && flight.crewDutyReason && (
              <div className="mt-2.5 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] leading-tight">
                ⚠️ {flight.crewDutyReason}
              </div>
            )}
          </div>
        )}

        {/* Passenger Connections Breakdown */}
        <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              Connecting Passenger Itineraries
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Booked: {flight.passengerCount} pax
            </span>
          </div>

          <div className="mt-2.5 space-y-2">
            {outboundConnections.length === 0 && inboundConnections.length === 0 ? (
              <p className="text-slate-500 text-[11px]">No onward or incoming connections assigned.</p>
            ) : (
              <>
                {outboundConnections.map(c => (
                  <div
                    key={c.connectionId}
                    className={`p-2 rounded-lg border text-[10.5px] ${
                      c.isMissed
                        ? 'bg-red-950/20 border-red-800/40 text-red-200'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold">
                        → Connecting {c.connectingFlightNumber} @ {c.hubAirport}
                      </span>
                      <span className="text-slate-400">{c.passengerCount} pax</span>
                    </div>
                    {c.isMissed ? (
                      <p className="text-red-400 text-[10px] mt-1">
                        ⚠️ MISSED CONNECTION: Layover {c.actualLayoverMinutes}m &lt; MCT {c.minimumConnectionTimeMinutes}m
                        {c.isStranded ? ' (Stranded Overnight)' : ''}
                      </p>
                    ) : (
                      <p className="text-emerald-400 text-[10px] mt-0.5">
                        ✓ Feasible connection ({c.actualLayoverMinutes}m layover)
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
        {onQuickRecoverSpare && isDelayed && (
          <button
            onClick={() => onQuickRecoverSpare(flight.flightNumber)}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dispatch Spare Aircraft
          </button>
        )}
        {onQuickCancel && !isCancelled && (
          <button
            onClick={() => onQuickCancel(flight.flightNumber)}
            className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            Cancel Flight
          </button>
        )}
      </div>
    </div>
  );
};
