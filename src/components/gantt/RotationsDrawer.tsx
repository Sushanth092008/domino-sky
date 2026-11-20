'use client';

import React, { useEffect } from 'react';
import { SimulatedFlight } from '../../types/aviation';
import { AircraftGantt } from './AircraftGantt';
import { X, Clock } from 'lucide-react';

interface RotationsDrawerProps {
  flights: SimulatedFlight[];
  simulationTime: string;
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
  onClose: () => void;
}

export const RotationsDrawer: React.FC<RotationsDrawerProps> = ({
  flights,
  simulationTime,
  selectedFlightNumber,
  onSelectFlight,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="rotations-drawer-title"
      className="fixed inset-y-0 left-0 w-full max-w-4xl bg-[#0A0F1D]/98 backdrop-blur-2xl border-r border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-left duration-200"
    >
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Clock aria-hidden="true" className="w-5 h-5 text-[#00F0FF]" />
          <div>
            <h3 id="rotations-drawer-title" className="text-sm font-extrabold font-mono text-white tracking-wider">
              AIRCRAFT ROTATIONS & TAT GANTT TIMELINE
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              16 Active Tails (VT-DS01 to VT-DS16) + Standby Spares (VT-DS17, VT-DS18)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close aircraft rotations drawer"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2D44] focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded-lg transition-colors"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 w-full p-4 overflow-hidden">
        <AircraftGantt
          flights={flights}
          simulationTime={simulationTime}
          selectedFlightNumber={selectedFlightNumber}
          onSelectFlight={flightNum => {
            onSelectFlight(flightNum);
          }}
        />
      </div>
    </aside>
  );
};
