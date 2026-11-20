'use client';

import React, { useEffect } from 'react';
import { Airport, SimulatedFlight, DisruptionInput } from '../../types/aviation';
import { timeToMinutes } from '../../engine/time-utils';
import { X, MapPin } from 'lucide-react';

interface AirportsListDrawerProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  disruption: DisruptionInput | null;
  simulationTime: string;
  onSelectAirport: (iata: string) => void;
  onClose: () => void;
}

export const AirportsListDrawer: React.FC<AirportsListDrawerProps> = ({
  airports,
  flights,
  disruption,
  simulationTime,
  onSelectAirport,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentSimMinutes = timeToMinutes(simulationTime);

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="airports-list-title"
      className="fixed inset-y-0 left-0 w-full max-w-sm bg-[#0A0F1D]/95 backdrop-blur-2xl border-r border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-left duration-200"
    >
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="w-4 h-4 text-[#00F0FF]" />
          <h3 id="airports-list-title" className="text-sm font-bold font-mono text-white tracking-wider">
            16 AIRPORT HUBS
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close airport hubs drawer"
          className="p-1 text-slate-400 hover:text-white hover:bg-[#1E2D44] focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded-lg transition-colors"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs font-mono">
        {airports.map(airport => {
          const isClosed =
            disruption &&
            disruption.airport === airport.iata &&
            currentSimMinutes >= timeToMinutes(disruption.startTime) &&
            currentSimMinutes < timeToMinutes(disruption.startTime) + disruption.durationMinutes;

          const deps = flights.filter(f => f.origin === airport.iata);
          const delayed = deps.filter(f => f.departureDelayMinutes >= 15);

          return (
            <button
              type="button"
              key={airport.iata}
              onClick={() => {
                onSelectAirport(airport.iata);
                onClose();
              }}
              aria-label={`Select airport ${airport.iata} in ${airport.city}, ${deps.length} departures, ${isClosed ? 'closed' : delayed.length > 0 ? `${delayed.length} delayed` : 'nominal'}`}
              className={`w-full text-left p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none ${
                isClosed
                  ? 'bg-red-950/30 border-red-500/50 hover:border-red-400'
                  : delayed.length > 0
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                  : 'bg-[#101827] border-[#1E2D44] hover:border-slate-500'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">{airport.iata}</span>
                  <span className="text-[10px] text-slate-400">({airport.icao})</span>
                  {airport.isHub && (
                    <span className="text-[9px] bg-[#141F30] text-[#00F0FF] px-1 rounded">
                      HUB
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{airport.city}</div>
              </div>

              <div className="text-right">
                {isClosed ? (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                    CLOSED
                  </span>
                ) : delayed.length > 0 ? (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                    {delayed.length} DELAYS
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400">NOMINAL</span>
                )}
                <div className="text-[10px] text-slate-500 mt-1">{deps.length} Departures</div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
