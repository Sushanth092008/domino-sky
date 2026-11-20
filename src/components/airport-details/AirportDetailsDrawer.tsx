'use client';

import React, { useEffect } from 'react';
import { Airport, SimulatedFlight, DisruptionInput } from '../../types/aviation';
import { timeToMinutes } from '../../engine/time-utils';
import {
  X,
  Plane,
  AlertTriangle,
  CloudLightning,
  MapPin,
} from 'lucide-react';

interface AirportDetailsDrawerProps {
  airport: Airport | null;
  flights: SimulatedFlight[];
  disruption: DisruptionInput | null;
  simulationTime: string;
  onClose: () => void;
  onSelectFlight: (flightNumber: string) => void;
  onTriggerDisruptionAtAirport?: (iata: string) => void;
}

export const AirportDetailsDrawer: React.FC<AirportDetailsDrawerProps> = ({
  airport,
  flights,
  disruption,
  simulationTime,
  onClose,
  onSelectFlight,
  onTriggerDisruptionAtAirport,
}) => {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!airport) return null;

  const currentSimMins = timeToMinutes(simulationTime);

  // Check if airport is currently in an active closure window
  const isClosedNow =
    disruption &&
    disruption.airport === airport.iata &&
    currentSimMins >= timeToMinutes(disruption.startTime) &&
    currentSimMins < timeToMinutes(disruption.startTime) + disruption.durationMinutes;

  const departures = flights
    .filter(f => f.origin === airport.iata)
    .sort((a, b) => timeToMinutes(a.scheduledDeparture) - timeToMinutes(b.scheduledDeparture));

  const arrivals = flights
    .filter(f => f.destination === airport.iata)
    .sort((a, b) => timeToMinutes(a.scheduledArrival) - timeToMinutes(b.scheduledArrival));

  const delayedDeps = departures.filter(f => f.departureDelayMinutes >= 15);
  const totalDelayMins = departures.reduce((sum, f) => sum + f.departureDelayMinutes, 0);

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="airport-drawer-title"
      className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0D1524] border-l border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-200 animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1E2D44] bg-[#101827]">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 rounded-xl bg-[#141F30] border border-[#1E2D44] flex items-center justify-center text-[#00F0FF]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="airport-drawer-title" className="text-lg font-bold font-mono tracking-tight text-white">{airport.iata}</h2>
              <span className="text-xs font-mono text-slate-400">({airport.icao})</span>
              {airport.isHub && (
                <span className="text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] px-1.5 py-0.5 rounded border border-[#00F0FF]/30">
                  PRIMARY HUB
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium">{airport.name}</p>
            <p className="text-[11px] text-slate-400">{airport.city}, India</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${airport.iata} airport details drawer`}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#141F30] focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded-lg transition-colors"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Status Alert Banner */}
        {isClosedNow ? (
          <div className="p-3.5 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-xl text-red-200">
            <div className="flex items-center gap-2 font-bold text-red-300 text-xs mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              <span>AIRPORT CLOSURE IN EFFECT</span>
            </div>
            <p className="text-[11px] text-red-200/90 leading-relaxed">
              Runway and airspace closed due to {disruption?.type.replace('_', ' ')}. All departures and inflow arrivals are held.
            </p>
            <div className="mt-2 text-[10px] font-mono text-red-300">
              Closure Window: {disruption?.startTime} – {disruption && timeToMinutes(disruption.startTime) + disruption.durationMinutes}m
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#141F30] border border-[#1E2D44] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <span className="font-semibold text-slate-200">Operational Status: Open</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">All Runways Active</span>
          </div>
        )}

        {/* Airport Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 font-mono">
          <div className="bg-[#141F30] p-2.5 rounded-lg border border-[#1E2D44]">
            <span className="text-[9px] text-slate-400 block uppercase">DEPARTURES</span>
            <span className="text-base font-bold text-white">{departures.length}</span>
            <span className="text-[9.5px] text-[#F59E0B] block mt-0.5">{delayedDeps.length} delayed</span>
          </div>
          <div className="bg-[#141F30] p-2.5 rounded-lg border border-[#1E2D44]">
            <span className="text-[9px] text-slate-400 block uppercase">ARRIVALS</span>
            <span className="text-base font-bold text-white">{arrivals.length}</span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">scheduled</span>
          </div>
          <div className="bg-[#141F30] p-2.5 rounded-lg border border-[#1E2D44]">
            <span className="text-[9px] text-slate-400 block uppercase">DELAY ACCUM</span>
            <span className="text-base font-bold text-[#F59E0B]">+{totalDelayMins}m</span>
            <span className="text-[9.5px] text-slate-400 block mt-0.5">total delay</span>
          </div>
        </div>

        {/* Operational Constraints Card */}
        <div className="bg-[#141F30] p-3 rounded-xl border border-[#1E2D44] space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Minimum Turnaround Time (TAT):</span>
            <span className="font-bold text-white">{airport.minTurnaroundMinutes} mins</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Minimum Connection Time (MCT):</span>
            <span className="font-bold text-white">{airport.minConnectionMinutes} mins</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Field Elevation:</span>
            <span className="text-slate-200">{airport.elevationFt ?? 0} ft MSL</span>
          </div>
        </div>

        {/* Departures Schedule List */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Scheduled Departures ({departures.length})</span>
            <span className="text-[10px] text-slate-400">Click to Inspect</span>
          </h4>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {departures.map(flight => {
              const isDelayed = flight.departureDelayMinutes >= 15;
              const isCancelled = flight.status === 'CANCELLED';

              return (
                <button
                  type="button"
                  key={flight.flightNumber}
                  onClick={() => onSelectFlight(flight.flightNumber)}
                  aria-label={`Inspect flight ${flight.flightNumber} to ${flight.destination}, scheduled at ${flight.scheduledDeparture}`}
                  className={`w-full text-left p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none ${
                    isCancelled
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-red-200'
                      : isDelayed
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 hover:border-[#F59E0B]'
                      : 'bg-[#141F30] border-[#1E2D44] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plane aria-hidden="true" className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span className="font-mono font-bold text-white">{flight.flightNumber}</span>
                    <span className="text-slate-400 font-mono">→ {flight.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">{flight.scheduledDeparture}</span>
                    {isDelayed && (
                      <span className="text-[#F59E0B] font-bold">+{flight.departureDelayMinutes}m</span>
                    )}
                    {isCancelled && (
                      <span className="text-[#EF4444] font-bold">CAN</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      {onTriggerDisruptionAtAirport && (
        <div className="p-3 border-t border-[#1E2D44] bg-[#101827]">
          <button
            type="button"
            onClick={() => onTriggerDisruptionAtAirport(airport.iata)}
            className="w-full py-2.5 px-3 bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30 border border-[#F59E0B]/40 text-[#F59E0B] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CloudLightning className="w-4 h-4 text-[#F59E0B]" />
            Simulate Disruption at {airport.iata}
          </button>
        </div>
      )}
    </aside>
  );
};
