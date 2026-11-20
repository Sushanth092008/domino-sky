'use client';

import React, { useState } from 'react';
import {
  Airport,
  DisruptionInput,
  DisruptionType,
  DisruptionSeverity,
  SimulatedFlight,
} from '../../types/aviation';
import { timeToMinutes, minutesToTime } from '../../engine/time-utils';
import {
  X,
  CloudLightning,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Plane,
  Clock,
  ShieldAlert,
  Flame,
  Wind,
} from 'lucide-react';

interface DisruptionDrawerProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  currentDisruption: DisruptionInput | null;
  onApplyDisruption: (disruption: DisruptionInput) => void;
  onResetDisruption: () => void;
  onClose: () => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'BOM-90M',
    title: 'Mumbai 90m Supercell',
    airport: 'BOM',
    type: 'THUNDERSTORM' as DisruptionType,
    startTime: '14:00',
    durationMinutes: 90,
    severity: 'HIGH' as DisruptionSeverity,
    description: 'Severe thunderstorm closes Mumbai for 90m, holding departures and propagating delays.',
  },
  {
    id: 'BOM-120M',
    title: 'Mumbai 120m Severe Closure',
    airport: 'BOM',
    type: 'AIRPORT_CLOSURE' as DisruptionType,
    startTime: '14:00',
    durationMinutes: 120,
    severity: 'CRITICAL' as DisruptionSeverity,
    description: 'Severe closure halts departures & arrivals, cascading across DEL, BLR, and CCU with crew breaches.',
  },
  {
    id: 'DEL-120M',
    title: 'Delhi Dense Fog (CAT-III)',
    airport: 'DEL',
    type: 'AIRPORT_CLOSURE' as DisruptionType,
    startTime: '06:30',
    durationMinutes: 120,
    severity: 'CRITICAL' as DisruptionSeverity,
    description: 'Zero-visibility morning closure halts trunk departures at capital mega-hub.',
  },
  {
    id: 'BLR-75M',
    title: 'Bengaluru ATC Ground Stop',
    airport: 'BLR',
    type: 'ATC_RESTRICTION' as DisruptionType,
    startTime: '16:00',
    durationMinutes: 75,
    severity: 'MEDIUM' as DisruptionSeverity,
    description: 'Radar outage delays evening turnarounds on the southern corridor.',
  },
];

export const DisruptionDrawer: React.FC<DisruptionDrawerProps> = ({
  airports,
  flights,
  currentDisruption,
  onApplyDisruption,
  onResetDisruption,
  onClose,
}) => {
  const [selectedAirport, setSelectedAirport] = useState<string>(currentDisruption?.airport || 'BOM');
  const [disruptionType, setDisruptionType] = useState<DisruptionType>(
    currentDisruption?.type || 'THUNDERSTORM'
  );
  const [startTime, setStartTime] = useState<string>(currentDisruption?.startTime || '14:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(currentDisruption?.durationMinutes || 90);
  const [severity, setSeverity] = useState<DisruptionSeverity>(currentDisruption?.severity || 'HIGH');

  const handleApply = () => {
    onApplyDisruption({
      airport: selectedAirport,
      type: disruptionType,
      startTime,
      durationMinutes,
      severity,
      description: `Disruption event at ${selectedAirport} (${disruptionType.replace('_', ' ')}), lasting ${durationMinutes}m.`,
    });
  };

  return (
    <div className="fixed inset-y-0 left-0 w-full max-w-md bg-[#0A0F1D]/95 backdrop-blur-2xl border-r border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold font-mono text-white tracking-wider">
              DISRUPTION SIMULATOR
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Deterministic Airport & Airspace Stress Testing
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Presets */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F1C40F]" />
            Canonical Scenario Presets
          </label>
          <div className="space-y-2">
            {PRESET_SCENARIOS.map(p => {
              const isSelected =
                currentDisruption?.airport === p.airport &&
                currentDisruption?.durationMinutes === p.durationMinutes;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedAirport(p.airport);
                    setDisruptionType(p.type);
                    setStartTime(p.startTime);
                    setDurationMinutes(p.durationMinutes);
                    setSeverity(p.severity);
                    onApplyDisruption(p);
                  }}
                  className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{p.title}</span>
                    <span className="text-[10px] bg-[#141F30] px-1.5 py-0.5 rounded text-amber-400">
                      {p.airport} • {p.durationMinutes}m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1. Target Airport Grid */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-2">
            Target Airport Hub (16 Official Hubs)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {airports.map(a => (
              <button
                key={a.iata}
                type="button"
                onClick={() => setSelectedAirport(a.iata)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  selectedAirport === a.iata
                    ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] font-bold'
                    : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:text-white'
                }`}
              >
                <div className="text-xs font-mono font-bold">{a.iata}</div>
                <div className="text-[9px] truncate text-slate-400">{a.city}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Disruption Type */}
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-2">
            Disruption Classification
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { type: 'THUNDERSTORM', label: 'Thunderstorm' },
              { type: 'AIRPORT_CLOSURE', label: 'Airport Closure' },
              { type: 'ATC_RESTRICTION', label: 'ATC Ground Stop' },
              { type: 'RUNWAY_CLOSURE', label: 'Runway Closure' },
            ].map(item => (
              <button
                key={item.type}
                type="button"
                onClick={() => setDisruptionType(item.type as DisruptionType)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  disruptionType === item.type
                    ? 'bg-[#F1C40F]/15 border-[#F1C40F] text-[#F1C40F] font-bold'
                    : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Start Time & Duration */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Start Time (IST):</span>
            <span className="text-[#00F0FF] font-bold text-sm">{startTime}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {['06:30', '11:00', '14:00', '16:30'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setStartTime(t)}
                className={`py-1 rounded-lg border text-xs transition-colors ${
                  startTime === t
                    ? 'bg-[#00F0FF] text-slate-950 font-bold border-[#00F0FF]'
                    : 'bg-[#101827] border-[#1E2D44] text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400">Duration:</span>
              <span className="text-amber-400 font-bold text-sm">{durationMinutes} minutes</span>
            </div>
            <input
              type="range"
              min={15}
              max={240}
              step={15}
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>15m</span>
              <span>60m</span>
              <span>90m (Std)</span>
              <span>120m</span>
              <span>240m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-[#1E2D44] bg-[#0E1626]/90 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onResetDisruption}
          className="py-2.5 px-3 bg-[#101827] hover:bg-[#141F30] border border-[#1E2D44] text-slate-300 rounded-xl text-xs font-mono font-bold transition-colors"
        >
          Reset Skies
        </button>
        <button
          type="button"
          onClick={() => {
            handleApply();
            onClose();
          }}
          className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs font-mono transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Play className="w-4 h-4 fill-current" />
          Simulate Disruption
        </button>
      </div>
    </div>
  );
};
