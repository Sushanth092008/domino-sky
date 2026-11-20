'use client';

import React, { useState, useEffect } from 'react';
import { timeToMinutes, minutesToTime } from '../../engine/time-utils';
import { DisruptionInput } from '../../types/aviation';
import {
  Play,
  Pause,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface FlightPlaybackBarProps {
  simulationTime: string; // 'HH:mm'
  onTimeChange: (time: string) => void;
  disruption: DisruptionInput | null;
}

const START_MINS = 6 * 60; // 06:00
const END_MINS = 24 * 60; // 24:00
const TOTAL_MINS = END_MINS - START_MINS; // 1080 mins

export const FlightPlaybackBar: React.FC<FlightPlaybackBarProps> = ({
  simulationTime,
  onTimeChange,
  disruption,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2); // 1x, 2x, 5x, 10x

  const currentMinutes = timeToMinutes(simulationTime);

  // Playback loop
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

  const stepBackward = () => {
    onTimeChange(minutesToTime(Math.max(START_MINS, currentMinutes - 15)));
  };

  const stepForward = () => {
    onTimeChange(minutesToTime(Math.min(END_MINS, currentMinutes + 15)));
  };

  // Convert minutes to percentage on scrubber bar
  const getPercent = (mins: number) => {
    const clamped = Math.max(START_MINS, Math.min(END_MINS, mins));
    return ((clamped - START_MINS) / TOTAL_MINS) * 100;
  };

  // Disruption window markers
  const disruptionStartPct = disruption ? getPercent(timeToMinutes(disruption.startTime)) : null;
  const disruptionEndPct = disruption
    ? getPercent(timeToMinutes(disruption.startTime) + disruption.durationMinutes)
    : null;

  return (
    <section
      role="region"
      aria-label="Simulation Time & Playback Controls"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#0A0F1D]/90 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-[#1E2D44] shadow-2xl select-none max-w-2xl w-full mx-4"
    >
      {/* 1. Play / Pause & Step Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={stepBackward}
          aria-label="Step simulation backward 15 minutes"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#141F30] focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded-lg transition-colors"
          title="Step back 15m"
        >
          <ChevronLeft aria-hidden="true" className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause simulation playback' : 'Start simulation playback'}
          className={`p-2 rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none ${
            isPlaying
              ? 'bg-[#F1C40F] text-[#080D18]'
              : 'bg-[#141F30] text-[#00F0FF] hover:bg-[#1E2D44] border border-[#1E2D44]'
          }`}
          title={isPlaying ? 'Pause simulation' : 'Play simulation playback'}
        >
          {isPlaying ? <Pause aria-hidden="true" className="w-4 h-4 fill-current" /> : <Play aria-hidden="true" className="w-4 h-4 fill-current" />}
        </button>

        <button
          type="button"
          onClick={stepForward}
          aria-label="Step simulation forward 15 minutes"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-[#141F30] focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:outline-none rounded-lg transition-colors"
          title="Step forward 15m"
        >
          <ChevronRight aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Interactive Time Scrubber Track */}
      <div className="flex-1 relative flex flex-col justify-center">
        {/* Track Bar with Markers */}
        <div className="relative w-full h-2 bg-[#101827] rounded-full overflow-hidden border border-[#1E2D44]">
          {/* Active Disruption Shaded Zone */}
          {disruptionStartPct !== null && disruptionEndPct !== null && (
            <div
              className="absolute top-0 bottom-0 bg-[#F59E0B]/40"
              style={{
                left: `${disruptionStartPct}%`,
                width: `${disruptionEndPct - disruptionStartPct}%`,
              }}
            ></div>
          )}

          {/* Progress fill up to current time */}
          <div
            className="h-full bg-gradient-to-r from-[#00F0FF]/40 to-[#00F0FF] rounded-full"
            style={{ width: `${getPercent(currentMinutes)}%` }}
          ></div>
        </div>

        {/* Range Slider Overlay */}
        <input
          type="range"
          min={START_MINS}
          max={END_MINS}
          step={5}
          value={currentMinutes}
          aria-label="Simulation operational time scrubber"
          aria-valuemin={START_MINS}
          aria-valuemax={END_MINS}
          aria-valuenow={currentMinutes}
          aria-valuetext={`${simulationTime} Indian Standard Time`}
          onChange={e => onTimeChange(minutesToTime(Number(e.target.value)))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />

        {/* Hour Labels */}
        <div aria-hidden="true" className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* 3. Speed Multiplier Selector */}
      <div className="flex items-center gap-1 bg-[#101827] p-0.5 rounded-lg border border-[#1E2D44] text-[10px] font-mono flex-shrink-0" role="group" aria-label="Playback Speed">
        {[1, 2, 5, 10].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeedMultiplier(s)}
            aria-label={`Set speed to ${s} times`}
            aria-pressed={speedMultiplier === s}
            className={`px-1.5 py-0.5 rounded transition-colors focus-visible:ring-1 focus-visible:ring-[#00F0FF] focus-visible:outline-none ${
              speedMultiplier === s
                ? 'bg-[#141F30] text-[#00F0FF] font-bold border border-[#00F0FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* 4. Digital Time Display */}
      <div
        role="timer"
        aria-label={`Simulation clock: ${simulationTime} IST`}
        className="flex items-center gap-1.5 bg-[#101827] px-3 py-1.5 rounded-xl border border-[#1E2D44] font-mono text-xs flex-shrink-0"
      >
        <Clock aria-hidden="true" className="w-3.5 h-3.5 text-[#00F0FF]" />
        <span className="font-extrabold text-white">{simulationTime}</span>
        <span className="text-[10px] text-slate-400">IST</span>
      </div>
    </section>
  );
};
