'use client';

import React, { useState, useEffect } from 'react';
import { timeToMinutes, minutesToTime } from '../../engine/time-utils';
import { DisruptionInput, TimelineEvent } from '../../types/aviation';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface SimulationTimelineProps {
  simulationTime: string; // 'HH:mm'
  onTimeChange: (time: string) => void;
  disruption: DisruptionInput | null;
  events?: TimelineEvent[];
}

const START_MINS = 6 * 60; // 06:00
const END_MINS = 24 * 60 - 1; // 23:59
const TOTAL_MINS = END_MINS - START_MINS;

export const SimulationTimeline: React.FC<SimulationTimelineProps> = ({
  simulationTime,
  onTimeChange,
  disruption,
  events = [],
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2); // 1x, 2x, 5x

  const currentMinutes = timeToMinutes(simulationTime);

  // Play / Pause timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onTimeChange(minutesToTime((currentMinutes + speedMultiplier * 5) % (24 * 60)));
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentMinutes, speedMultiplier, onTimeChange]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(minutesToTime(Number(e.target.value)));
  };

  const stepTime = (deltaMins: number) => {
    const nextMins = Math.max(START_MINS, Math.min(END_MINS, currentMinutes + deltaMins));
    onTimeChange(minutesToTime(nextMins));
  };

  // Disruption markers
  const disruptionStartMins = disruption ? timeToMinutes(disruption.startTime) : null;
  const disruptionEndMins = disruption && disruptionStartMins !== null
    ? disruptionStartMins + disruption.durationMinutes
    : null;

  const disruptionStartPct = disruptionStartMins !== null
    ? ((Math.max(START_MINS, Math.min(END_MINS, disruptionStartMins)) - START_MINS) / TOTAL_MINS) * 100
    : null;

  const disruptionEndPct = disruptionEndMins !== null
    ? ((Math.max(START_MINS, Math.min(END_MINS, disruptionEndMins)) - START_MINS) / TOTAL_MINS) * 100
    : null;

  return (
    <div className="w-full bg-slate-900/90 border-t border-slate-800 p-2.5 px-4 flex flex-col gap-1.5 text-xs select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg font-bold transition-all shadow-md flex items-center justify-center ${
              isPlaying
                ? 'bg-amber-500 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            onClick={() => stepTime(-15)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Step Back 15m"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => stepTime(15)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Step Forward 15m"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onTimeChange('06:00')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Reset to 06:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center gap-1 ml-2 text-[10px] font-mono">
            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  speedMultiplier === spd
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Time Readout */}
        <div className="flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 text-[11px]">SIM TIME:</span>
          <span className="text-base font-bold text-white tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {simulationTime} <span className="text-[10px] text-slate-500 font-normal">IST</span>
          </span>
        </div>

        {/* Disruption Status Indicator */}
        <div className="text-[11px] font-mono flex items-center gap-2">
          {disruption ? (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {disruption.airport} {disruption.startTime} - {minutesToTime(timeToMinutes(disruption.startTime) + disruption.durationMinutes)}
            </span>
          ) : (
            <span className="text-slate-500">Normal Operations</span>
          )}
        </div>
      </div>

      {/* Scrubber Track with Event Markers */}
      <div className="relative w-full pt-1">
        {/* Disruption Duration Highlight Shading on Slider */}
        {disruptionStartPct !== null && disruptionEndPct !== null && (
          <div
            className="absolute top-1 bottom-0 bg-red-500/25 border-x border-red-500/60 pointer-events-none rounded z-0"
            style={{
              left: `${disruptionStartPct}%`,
              width: `${Math.max(1, disruptionEndPct - disruptionStartPct)}%`,
            }}
            title={`${disruption?.airport} Closure Window`}
          >
            <div className="absolute -top-3 left-0 text-[8px] font-mono text-red-400 font-bold whitespace-nowrap">
              ⚡ {disruption?.airport} CLOSED
            </div>
          </div>
        )}

        <input
          type="range"
          min={START_MINS}
          max={END_MINS}
          step={5}
          value={currentMinutes}
          onChange={handleSliderChange}
          className="relative z-10 w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
        />

        {/* Time hour ticks under scrubber */}
        <div className="flex justify-between text-[8px] font-mono text-slate-500 pt-0.5">
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
          <span>23:59</span>
        </div>
      </div>
    </div>
  );
};
