'use client';

import React from 'react';
import { SimulatedPassengerConnection, SimulationResult } from '../../types/aviation';
import { X, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface PassengerImpactDrawerProps {
  connections: SimulatedPassengerConnection[];
  result: SimulationResult;
  onSelectFlight: (flightNumber: string) => void;
  onClose: () => void;
}

export const PassengerImpactDrawer: React.FC<PassengerImpactDrawerProps> = ({
  connections,
  result,
  onSelectFlight,
  onClose,
}) => {
  const missedConns = connections.filter(c => c.isMissed);
  const strandedConns = connections.filter(c => c.isStranded);
  const maintainedConns = connections.filter(c => !c.isMissed);

  return (
    <div className="fixed inset-y-0 left-0 w-full max-w-xl bg-[#0A0F1D]/98 backdrop-blur-2xl border-r border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-left duration-200">
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#00F0FF]" />
          <div>
            <h3 className="text-sm font-extrabold font-mono text-white tracking-wider">
              PASSENGER CONNECTIONS & STRANDING AUDIT
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              21 Booked Multi-Leg Itineraries (Minimum Connect Time: 45m)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2D44] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-[#1E2D44] bg-[#101827] grid grid-cols-3 gap-2 text-center font-mono text-xs">
        <div className="p-2 rounded-xl bg-[#141F30] border border-emerald-500/30">
          <span className="text-[10px] text-slate-400 block">PROTECTED</span>
          <span className="text-sm font-bold text-emerald-400">{maintainedConns.length} Conns</span>
        </div>
        <div className="p-2 rounded-xl bg-[#141F30] border border-amber-500/30">
          <span className="text-[10px] text-slate-400 block">MISSED MCT</span>
          <span className="text-sm font-bold text-amber-400">{missedConns.length} Conns</span>
        </div>
        <div className="p-2 rounded-xl bg-[#141F30] border border-red-500/30">
          <span className="text-[10px] text-slate-400 block">STRANDED</span>
          <span className="text-sm font-bold text-red-400">{strandedConns.length} Conns</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs font-mono">
        {connections.map(c => {
          const isMissed = c.isMissed;
          const isStranded = c.isStranded;

          return (
            <div
              key={c.connectionId}
              className={`p-3 rounded-xl border transition-colors ${
                isStranded
                  ? 'bg-red-950/20 border-red-500/40'
                  : isMissed
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-[#101827] border-[#1E2D44]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-xs">{c.connectionId}</span>
                  <span className="px-1.5 py-0.2 rounded bg-[#141F30] text-[#00F0FF] text-[10px] font-bold">
                    Hub: {c.hubAirport}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isStranded
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : isMissed
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isStranded ? 'STRANDED OVERNIGHT' : isMissed ? 'MISSED MCT' : 'CONNECTED'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    onSelectFlight(c.inboundFlightNumber);
                    onClose();
                  }}
                  className="hover:text-[#00F0FF] underline"
                >
                  Inbound: {c.inboundFlightNumber}
                </button>
                <span className="text-slate-500">→</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectFlight(c.connectingFlightNumber);
                    onClose();
                  }}
                  className="hover:text-[#00F0FF] underline"
                >
                  Outbound: {c.connectingFlightNumber}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1E2D44]/60 text-[10.5px]">
                <span className="text-slate-400">
                  Layover: <strong className={c.actualLayoverMinutes < c.minimumConnectionTimeMinutes ? 'text-amber-400' : 'text-slate-200'}>{c.actualLayoverMinutes}m</strong> (MCT: {c.minimumConnectionTimeMinutes}m)
                </span>
                <span className="text-[#00F0FF] font-bold">{c.passengerCount} Passengers</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
