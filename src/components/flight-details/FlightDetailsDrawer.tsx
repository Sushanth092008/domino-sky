'use client';

import React from 'react';
import {
  SimulatedFlight,
  CrewAssignment,
  SimulatedPassengerConnection,
} from '../../types/aviation';
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
  Sparkles,
  RotateCcw,
  Info,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface FlightDetailsDrawerProps {
  flight: SimulatedFlight | null;
  crew: CrewAssignment | null;
  inboundConnections: SimulatedPassengerConnection[];
  outboundConnections: SimulatedPassengerConnection[];
  allTailFlights?: SimulatedFlight[];
  onClose: () => void;
  onSelectFlight?: (flightNumber: string) => void;
  onQuickRecoverSpare?: (flightNumber: string) => void;
  onQuickCancel?: (flightNumber: string) => void;
}

export const FlightDetailsDrawer: React.FC<FlightDetailsDrawerProps> = ({
  flight,
  crew,
  inboundConnections,
  outboundConnections,
  allTailFlights = [],
  onClose,
  onSelectFlight,
  onQuickRecoverSpare,
  onQuickCancel,
}) => {
  if (!flight) return null;

  const isDelayed = flight.departureDelayMinutes >= 15;
  const isCancelled = flight.status === 'CANCELLED';
  const isRecovered = flight.originalAssignedTail !== flight.aircraftTail;

  // Passenger counts
  const totalConnectingPax =
    inboundConnections.reduce((sum, c) => sum + c.passengerCount, 0) +
    outboundConnections.reduce((sum, c) => sum + c.passengerCount, 0);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0A0F1D]/95 backdrop-blur-2xl border-l border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* 1. FLIGHTRADAR24 STYLE TOP HEADER */}
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F1C40F]/15 border border-[#F1C40F]/30 flex items-center justify-center text-[#F1C40F] shadow-sm">
            <Plane className="w-5 h-5 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold font-mono text-white tracking-wider">
                {flight.flightNumber}
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#1E2D44] text-[#00F0FF] px-2 py-0.5 rounded border border-[#00F0FF]/30">
                {flight.aircraftTail}
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-slate-400">
              Airbus A320neo • Domino Sky Fleet
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2D44] rounded-lg transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. ROUTE & TIMING CARD */}
      <div className="p-5 border-b border-[#1E2D44] bg-[#0D1524]/60">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-black font-mono text-white">{flight.origin}</span>
            <span className="text-xs text-slate-400 block font-sans">Origin Station</span>
          </div>

          <div className="flex flex-col items-center flex-1 px-4">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#F1C40F] mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{flight.scheduledDurationMinutes}m Block</span>
            </div>
            <div className="w-full relative flex items-center">
              <div className="w-full h-0.5 bg-[#1E2D44]"></div>
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#141F30] border border-[#F1C40F] flex items-center justify-center text-[9px] text-[#F1C40F]">
                ✈
              </div>
            </div>
            <span
              className={`text-[10.5px] font-mono font-bold mt-1.5 px-2 py-0.5 rounded ${
                isCancelled
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : isDelayed
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : isRecovered
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {isCancelled
                ? 'CANCELLED'
                : isDelayed
                ? `+${flight.departureDelayMinutes}m DELAYED`
                : isRecovered
                ? 'RECOVERED BY SPARE'
                : 'ON TIME SCHEDULE'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black font-mono text-white">{flight.destination}</span>
            <span className="text-xs text-slate-400 block font-sans">Destination</span>
          </div>
        </div>

        {/* Timetable Comparison */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#1E2D44]/70 font-mono text-xs">
          <div className="bg-[#101827] p-2.5 rounded-xl border border-[#1E2D44]">
            <span className="text-[10px] text-slate-400 block">DEPARTURE (SCH / ACT)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-400">{flight.scheduledDeparture}</span>
              <span className={isDelayed ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {flight.actualDeparture}
              </span>
            </div>
          </div>

          <div className="bg-[#101827] p-2.5 rounded-xl border border-[#1E2D44]">
            <span className="text-[10px] text-slate-400 block">ARRIVAL (SCH / ACT)</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-400">{flight.scheduledArrival}</span>
              <span className={flight.arrivalDelayMinutes > 0 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                {flight.actualArrival}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SCROLLABLE DETAILS BODY */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* CRITICAL SECTION: "WHY IS THIS FLIGHT DELAYED?" */}
        <div className="bg-[#101827] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${isDelayed ? 'text-[#F59E0B]' : 'text-slate-500'}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
              Why is this flight delayed?
            </h4>
          </div>

          {flight.delayCauses && flight.delayCauses.length > 0 ? (
            <div className="space-y-2 mt-2">
              {flight.delayCauses.map((cause, idx) => (
                <div
                  key={idx}
                  className="bg-[#141F30] border border-amber-500/30 rounded-xl p-3 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] font-bold text-amber-400 mb-1">
                    <span>
                      Step {cause.step}: {cause.title}
                    </span>
                    <span>+{cause.impactMinutes}m</span>
                  </div>
                  <p className="text-slate-300 text-[11.5px] leading-relaxed">
                    {cause.explanation}
                  </p>
                </div>
              ))}
            </div>
          ) : isCancelled ? (
            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              Flight cancelled by operations control to isolate downstream rotational cascading delays.
            </div>
          ) : (
            <div className="bg-[#141F30] border border-[#10B981]/30 rounded-xl p-3 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Operating nominal on-time schedule. Full turnaround and crew duty buffers intact.
              </span>
            </div>
          )}
        </div>

        {/* PASSENGER CAPACITY & LOAD FACTOR */}
        <div className="bg-[#101827] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono mb-3">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
              Passenger Capacity
            </span>
            <span className="text-white font-bold">
              {flight.passengerCount} / 180 seats ({Math.round((flight.passengerCount / 180) * 100)}% Load)
            </span>
          </div>

          <div className="w-full bg-[#141F30] h-2 rounded-full overflow-hidden border border-[#1E2D44]">
            <div
              className="bg-[#00F0FF] h-full rounded-full"
              style={{ width: `${(flight.passengerCount / 180) * 100}%` }}
            ></div>
          </div>

          {/* Connecting passengers breakdown */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono">
            <div className="bg-[#141F30] p-2 rounded-lg border border-[#1E2D44]">
              <span className="text-slate-400 text-[10px] block">INBOUND TRANSFERS</span>
              <span className="text-white font-bold">{inboundConnections.length} connections</span>
            </div>
            <div className="bg-[#141F30] p-2 rounded-lg border border-[#1E2D44]">
              <span className="text-slate-400 text-[10px] block">OUTBOUND TRANSFERS</span>
              <span className="text-white font-bold">{outboundConnections.length} connections</span>
            </div>
          </div>
        </div>

        {/* CREW DUTY STATUS */}
        <div className="bg-[#101827] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#F1C40F]" />
              Crew Legal Duty Status
            </span>
            {flight.crewDutyFeasible ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                LEGAL (≤600m)
              </span>
            ) : (
              <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                FDTL BREACH
              </span>
            )}
          </div>

          {crew && (
            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Roster Assignment:</span>
                <span className="text-white">{crew.rosterId} (Base: {crew.captain.baseAirport})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duty Start Time:</span>
                <span className="text-white">{crew.dutyStartTime} IST</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Permissible FDP:</span>
                <span className="text-white">{crew.maxDutyMinutes} minutes (10h 00m)</span>
              </div>
            </div>
          )}

          {!flight.crewDutyFeasible && flight.crewDutyReason && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-[10.5px] text-red-300 font-mono leading-tight">
              ⚠️ {flight.crewDutyReason}
            </div>
          )}
        </div>

        {/* AIRCRAFT ROTATION CHAIN */}
        {allTailFlights.length > 0 && (
          <div className="bg-[#101827] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
              Aircraft Daily Rotation ({flight.aircraftTail})
            </div>

            <div className="space-y-1.5">
              {allTailFlights.map(leg => {
                const isCurrent = leg.flightNumber === flight.flightNumber;
                return (
                  <div
                    key={leg.flightNumber}
                    onClick={() => onSelectFlight?.(leg.flightNumber)}
                    className={`p-2 rounded-xl border text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white font-bold'
                        : 'bg-[#141F30] border-[#1E2D44] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Leg {leg.rotationSequence}:</span>
                      <span>{leg.flightNumber}</span>
                      <span className="text-slate-400">({leg.origin}→{leg.destination})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{leg.scheduledDeparture}</span>
                      <span
                        className={
                          leg.departureDelayMinutes >= 15 ? 'text-amber-400 font-bold' : 'text-emerald-400'
                        }
                      >
                        {leg.departureDelayMinutes >= 15 ? `+${leg.departureDelayMinutes}m` : 'OK'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. TACTICAL RECOVERY ACTIONS FOOTER */}
      <div className="p-4 border-t border-[#1E2D44] bg-[#0E1626]/90 flex items-center gap-2.5">
        {onQuickRecoverSpare && isDelayed && (
          <button
            type="button"
            onClick={() => onQuickRecoverSpare(flight.flightNumber)}
            className="flex-1 py-2 px-3 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] font-bold rounded-xl text-xs font-mono transition-colors flex items-center justify-center gap-1.5 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dispatch Standby Spare
          </button>
        )}

        {onQuickCancel && !isCancelled && isDelayed && (
          <button
            type="button"
            onClick={() => onQuickCancel(flight.flightNumber)}
            className="py-2 px-3 bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#EF4444] hover:text-white border border-[#EF4444]/40 font-bold rounded-xl text-xs font-mono transition-colors"
          >
            Tactical Cancel
          </button>
        )}
      </div>
    </div>
  );
};
