'use client';

import React, { useMemo } from 'react';
import { SimulatedFlight } from '../../types/aviation';
import { timeToMinutes } from '../../engine/time-utils';
import { Plane, Clock, AlertTriangle } from 'lucide-react';

interface AircraftGanttProps {
  flights: SimulatedFlight[];
  simulationTime: string; // 'HH:mm'
  selectedFlightNumber: string | null;
  onSelectFlight: (flightNumber: string | null) => void;
  onSelectTail?: (tail: string | null) => void;
}

const GANTT_START_MINUTES = 6 * 60; // 06:00
const GANTT_END_MINUTES = 24 * 60; // 24:00
const TOTAL_GANTT_MINUTES = GANTT_END_MINUTES - GANTT_START_MINUTES; // 1080 mins

export const AircraftGantt: React.FC<AircraftGanttProps> = ({
  flights,
  simulationTime,
  selectedFlightNumber,
  onSelectFlight,
  onSelectTail,
}) => {
  const currentSimMinutes = timeToMinutes(simulationTime);

  // Group flights by aircraft tail
  const tailRotations = useMemo(() => {
    const map = new Map<string, SimulatedFlight[]>();
    for (const f of flights) {
      if (!map.has(f.aircraftTail)) {
        map.set(f.aircraftTail, []);
      }
      map.get(f.aircraftTail)!.push(f);
    }

    // Sort flights in each tail chronologically
    map.forEach(list => {
      list.sort((a, b) => timeToMinutes(a.scheduledDeparture) - timeToMinutes(b.scheduledDeparture));
    });

    // Return list of tails sorted naturally (VT-IND01 to VT-IND16, then spares)
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [flights]);

  // Convert minute offset to percentage (0% to 100%)
  const getPercent = (mins: number) => {
    const clamped = Math.max(GANTT_START_MINUTES, Math.min(GANTT_END_MINUTES, mins));
    return ((clamped - GANTT_START_MINUTES) / TOTAL_GANTT_MINUTES) * 100;
  };

  const simTimePercent = getPercent(currentSimMinutes);

  // Time markers every 2 hours from 06:00 to 24:00
  const timeMarkers = useMemo(() => {
    const markers: { hour: number; label: string; pct: number }[] = [];
    for (let h = 6; h <= 24; h += 2) {
      const mins = h * 60;
      markers.push({
        hour: h,
        label: `${String(h % 24).padStart(2, '0')}:00`,
        pct: getPercent(mins),
      });
    }
    return markers;
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header / Legend Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Aircraft Rotations & Turnaround Gantt
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[10px]">16 Active Tails (70 Flights)</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 bg-cyan-500/80 rounded-sm"></span>
            <span>On-Time</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 bg-amber-500/80 rounded-sm"></span>
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 bg-red-500/80 rounded-sm"></span>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 bg-emerald-500/80 rounded-sm"></span>
            <span>Recovered / Spare</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 bg-slate-800 border border-dashed border-slate-600 rounded-sm"></span>
            <span>TAT Buffer (45m)</span>
          </div>
        </div>
      </div>

      {/* Time Axis Ruler */}
      <div className="relative w-full h-7 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 select-none">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-slate-950 border-r border-slate-800 flex items-center px-2 font-mono text-[9px] text-slate-500">
          TAIL REG
        </div>
        <div className="absolute left-24 right-0 top-0 bottom-0">
          {timeMarkers.map(marker => (
            <div
              key={marker.hour}
              className="absolute top-0 bottom-0 flex flex-col items-center -translate-x-1/2"
              style={{ left: `${marker.pct}%` }}
            >
              <span className="pt-1 font-mono text-[9px]">{marker.label}</span>
              <div className="w-[1px] flex-1 bg-slate-800"></div>
            </div>
          ))}

          {/* Current Simulation Time Vertical Indicator */}
          <div
            className="absolute top-0 bottom-0 w-[1.5px] bg-red-500 z-30 pointer-events-none -translate-x-1/2"
            style={{ left: `${simTimePercent}%` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-2 bg-red-500 rounded-b text-[8px] text-white flex items-center justify-center font-bold">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Rows Container (Scrollable) */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
        {/* Background Vertical Grid Lines */}
        <div className="absolute left-24 right-0 top-0 bottom-0 pointer-events-none">
          {timeMarkers.map(marker => (
            <div
              key={`grid-${marker.hour}`}
              className="absolute top-0 bottom-0 w-[1px] bg-slate-900/80"
              style={{ left: `${marker.pct}%` }}
            ></div>
          ))}

          {/* Scrubber vertical line running down the entire Gantt */}
          <div
            className="absolute top-0 bottom-0 w-[1.5px] bg-red-500/70 z-30 pointer-events-none -translate-x-1/2"
            style={{ left: `${simTimePercent}%` }}
          ></div>
        </div>

        {/* Rows for Each Aircraft Tail */}
        {tailRotations.map(([tail, tailFlights], idx) => {
          const isSpare = tail.startsWith('VT-SPA');
          const hasDelays = tailFlights.some(f => f.departureDelayMinutes >= 15);

          return (
            <div
              key={tail}
              className={`relative flex items-center h-10 border-b border-slate-900 hover:bg-slate-900/40 transition-colors ${
                idx % 2 === 0 ? 'bg-slate-950/60' : 'bg-slate-950/20'
              }`}
            >
              {/* Left Tail Label */}
              <div
                onClick={() => onSelectTail?.(tail)}
                className="w-24 h-full flex-shrink-0 flex items-center justify-between px-2.5 bg-slate-950/95 border-r border-slate-800/80 font-mono text-[11px] cursor-pointer hover:bg-slate-900"
              >
                <span className={`font-bold ${isSpare ? 'text-emerald-400' : hasDelays ? 'text-amber-400' : 'text-slate-300'}`}>
                  {tail}
                </span>
                {hasDelays && <AlertTriangle className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
              </div>

              {/* Flight Blocks Area */}
              <div className="relative flex-1 h-full">
                {tailFlights.map((flight, fIdx) => {
                  const schedDepMins = timeToMinutes(flight.scheduledDeparture);
                  const schedArrMins = timeToMinutes(flight.scheduledArrival);
                  const actualDepMins = timeToMinutes(flight.actualDeparture);
                  const actualArrMins = timeToMinutes(flight.actualArrival);

                  const isCancelled = flight.status === 'CANCELLED';
                  const isDelayed = flight.departureDelayMinutes >= 15;
                  const isRecovered = flight.originalAssignedTail !== flight.aircraftTail;
                  const isSelected = selectedFlightNumber === flight.flightNumber;

                  // Visual left and width based on actual operational times
                  const leftPct = getPercent(actualDepMins);
                  const rightPct = getPercent(actualArrMins);
                  const widthPct = Math.max(2.5, rightPct - leftPct);

                  // Shaded Turnaround block after arrival
                  const tatLeftPct = rightPct;
                  const tatRightPct = getPercent(actualArrMins + flight.minimumTurnaroundRequired);
                  const tatWidthPct = Math.max(1.5, tatRightPct - tatLeftPct);

                  // Color styling
                  let blockBg = 'bg-cyan-600/70 border-cyan-400/80 text-cyan-50';
                  if (isCancelled) {
                    blockBg = 'bg-red-950/80 border-red-500/80 text-red-200 line-through';
                  } else if (isRecovered) {
                    blockBg = 'bg-emerald-600/80 border-emerald-400 text-emerald-50';
                  } else if (isDelayed) {
                    blockBg = flight.departureDelayMinutes >= 60
                      ? 'bg-red-600/80 border-red-400 text-white'
                      : 'bg-amber-600/80 border-amber-400 text-amber-50';
                  }

                  return (
                    <React.Fragment key={flight.flightNumber}>
                      {/* Optional: Scheduled Ghost Outline if delayed */}
                      {isDelayed && (
                        <div
                          className="absolute h-5 top-2.5 rounded-sm border border-slate-700/60 bg-slate-900/40 pointer-events-none"
                          style={{
                            left: `${getPercent(schedDepMins)}%`,
                            width: `${Math.max(2, getPercent(schedArrMins) - getPercent(schedDepMins))}%`,
                          }}
                        >
                          <span className="text-[7.5px] font-mono text-slate-500 pl-1 leading-4">
                            SCH {flight.scheduledDeparture}
                          </span>
                        </div>
                      )}

                      {/* Actual Flight Block */}
                      <div
                        onClick={() => onSelectFlight(isSelected ? null : flight.flightNumber)}
                        className={`absolute h-7 top-1.5 rounded flex items-center justify-between px-1.5 cursor-pointer border text-[10px] font-mono transition-all duration-200 shadow-md ${blockBg} ${
                          isSelected ? 'ring-2 ring-white scale-105 z-20' : 'hover:scale-[1.02] hover:z-10'
                        }`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${flight.flightNumber} (${flight.origin} → ${flight.destination}) | Sched: ${flight.scheduledDeparture}-${flight.scheduledArrival} | Act: ${flight.actualDeparture}-${flight.actualArrival} | Delay: +${flight.departureDelayMinutes}m`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <Plane className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="font-bold truncate">{flight.flightNumber}</span>
                          <span className="text-[8px] opacity-80 hidden md:inline">
                            {flight.origin}-{flight.destination}
                          </span>
                        </div>

                        {flight.departureDelayMinutes > 0 && (
                          <span className="text-[8px] font-bold bg-black/40 px-1 rounded ml-1 flex-shrink-0">
                            +{flight.departureDelayMinutes}m
                          </span>
                        )}
                      </div>

                      {/* Turnaround Buffer Block (shown if not cancelled) */}
                      {!isCancelled && fIdx < tailFlights.length - 1 && (
                        <div
                          className="absolute h-4 top-3 rounded-sm border border-slate-700/50 bg-slate-800/40 text-[7px] font-mono text-slate-400 flex items-center justify-center pointer-events-none"
                          style={{
                            left: `${tatLeftPct}%`,
                            width: `${tatWidthPct}%`,
                          }}
                          title={`Turnaround buffer: ${flight.minimumTurnaroundRequired}m`}
                        >
                          TAT
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
