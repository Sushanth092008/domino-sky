'use client';

import React, { useEffect } from 'react';
import { SimulatedFlight } from '../../types/aviation';
import { X, Filter } from 'lucide-react';

interface FlightFiltersDrawerProps {
  filterMode: 'ALL' | 'AIRBORNE' | 'DELAYED' | 'CANCELLED' | 'RECOVERED';
  onSelectFilterMode: (mode: 'ALL' | 'AIRBORNE' | 'DELAYED' | 'CANCELLED' | 'RECOVERED') => void;
  showAllRoutes: boolean;
  onToggleShowAllRoutes: () => void;
  flights: SimulatedFlight[];
  airborneCount: number;
  onClose: () => void;
}

export const FlightFiltersDrawer: React.FC<FlightFiltersDrawerProps> = ({
  filterMode,
  onSelectFilterMode,
  showAllRoutes,
  onToggleShowAllRoutes,
  flights,
  airborneCount,
  onClose,
}) => {
  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const delayedCount = flights.filter(f => f.departureDelayMinutes >= 15).length;
  const cancelledCount = flights.filter(f => f.status === 'CANCELLED').length;
  const recoveredCount = flights.filter(f => f.originalAssignedTail !== f.aircraftTail).length;

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-drawer-title"
      className="fixed inset-y-0 left-0 w-full max-w-sm bg-[#0A0F1D]/95 backdrop-blur-2xl border-r border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-left duration-200"
    >
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter aria-hidden="true" className="w-4 h-4 text-[#F1C40F]" />
          <h2 id="filters-drawer-title" className="text-sm font-bold font-mono text-white tracking-wider">FLIGHT RADAR FILTERS</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close flight radar filters drawer"
          className="p-1 text-slate-400 hover:text-white hover:bg-[#1E2D44] focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded-lg transition-colors"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4 text-xs font-mono">
        <div>
          <label className="text-slate-400 font-bold uppercase block mb-2 text-[11px]">
            Flight Filter Mode
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'ALL', label: 'All Scheduled Flights', count: flights.length, color: 'text-white' },
              { id: 'AIRBORNE', label: 'Airborne Now', count: airborneCount, color: 'text-[#F1C40F]' },
              { id: 'DELAYED', label: 'Delayed (≥15m)', count: delayedCount, color: 'text-amber-400' },
              { id: 'CANCELLED', label: 'Cancelled Flights', count: cancelledCount, color: 'text-red-400' },
              { id: 'RECOVERED', label: 'Recovered by Spares', count: recoveredCount, color: 'text-emerald-400' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectFilterMode(item.id as 'ALL' | 'AIRBORNE' | 'DELAYED' | 'CANCELLED' | 'RECOVERED')}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                  filterMode === item.id
                    ? 'bg-[#141F30] border-[#00F0FF] text-[#00F0FF] font-bold shadow'
                    : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>{item.label}</span>
                <span className={`px-2 py-0.5 rounded bg-[#0A0F1D] text-xs font-bold ${item.color}`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#1E2D44]">
          <label className="text-slate-400 font-bold uppercase block mb-2 text-[11px]">
            Map Route Display
          </label>
          <button
            type="button"
            onClick={onToggleShowAllRoutes}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
              showAllRoutes
                ? 'bg-[#141F30] border-[#F1C40F] text-[#F1C40F] font-bold'
                : 'bg-[#101827] border-[#1E2D44] text-slate-400 hover:text-white'
            }`}
          >
            <span>Show All 70 Network Routes</span>
            <span>{showAllRoutes ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
