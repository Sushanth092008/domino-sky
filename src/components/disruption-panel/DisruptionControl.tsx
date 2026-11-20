'use client';

import React, { useState } from 'react';
import { Airport, DisruptionInput, DisruptionType, DisruptionSeverity } from '../../types/aviation';
import { AlertTriangle, Play, RotateCcw, CloudLightning, ShieldAlert, Sparkles } from 'lucide-react';

interface DisruptionControlProps {
  airports: Airport[];
  currentDisruption: DisruptionInput | null;
  onApplyDisruption: (disruption: DisruptionInput) => void;
  onResetDisruption: () => void;
}

const PRESET_SCENARIOS: {
  title: string;
  airport: string;
  type: DisruptionType;
  startTime: string;
  durationMinutes: number;
  severity: DisruptionSeverity;
  description: string;
}[] = [
  {
    title: 'Mumbai 90m Supercell',
    airport: 'BOM',
    type: 'THUNDERSTORM',
    startTime: '14:00',
    durationMinutes: 90,
    severity: 'HIGH',
    description: 'Severe thunderstorm closes Mumbai airport for 90m, cascading across BLR and CCU.',
  },
  {
    title: 'Delhi Dense Winter Fog',
    airport: 'DEL',
    type: 'AIRPORT_CLOSURE',
    startTime: '06:30',
    durationMinutes: 120,
    severity: 'CRITICAL',
    description: 'Zero-visibility CAT-III closure halts morning trunk departures at capital hub.',
  },
  {
    title: 'Bengaluru ATC Ground Stop',
    airport: 'BLR',
    type: 'ATC_RESTRICTION',
    startTime: '16:00',
    durationMinutes: 75,
    severity: 'MEDIUM',
    description: 'Radar system failure forces sequential holding on southern tech corridor.',
  },
  {
    title: 'Kolkata Monsoon Downpour',
    airport: 'CCU',
    type: 'HEAVY_RAIN',
    startTime: '11:00',
    durationMinutes: 80,
    severity: 'HIGH',
    description: 'Flooded taxiways throttle eastern hub movements into Patna & Guwahati.',
  },
];

export const DisruptionControl: React.FC<DisruptionControlProps> = ({
  airports,
  currentDisruption,
  onApplyDisruption,
  onResetDisruption,
}) => {
  const [selectedAirport, setSelectedAirport] = useState<string>(currentDisruption?.airport || 'BOM');
  const [disruptionType, setDisruptionType] = useState<DisruptionType>(currentDisruption?.type || 'THUNDERSTORM');
  const [startTime, setStartTime] = useState<string>(currentDisruption?.startTime || '14:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(currentDisruption?.durationMinutes || 90);
  const [severity, setSeverity] = useState<DisruptionSeverity>(currentDisruption?.severity || 'HIGH');

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyDisruption({
      airport: selectedAirport,
      type: disruptionType,
      startTime,
      durationMinutes,
      severity,
      description: `${disruptionType.replace('_', ' ')} at ${selectedAirport} starting ${startTime} for ${durationMinutes}m`,
    });
  };

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedAirport(preset.airport);
    setDisruptionType(preset.type);
    setStartTime(preset.startTime);
    setDurationMinutes(preset.durationMinutes);
    setSeverity(preset.severity);
    onApplyDisruption(preset);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl text-xs">
      {/* Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <CloudLightning className="w-4 h-4 text-amber-400" />
          <span>Airport Disruption Simulator</span>
        </div>
        {currentDisruption && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            ACTIVE
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Preset Quick Chips */}
        <div>
          <span className="text-[10px] font-mono text-slate-400 block mb-1.5 uppercase font-semibold">
            Quick Operational Scenarios
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {PRESET_SCENARIOS.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-left p-2 rounded-lg border transition-all text-[11px] flex items-center justify-between ${
                  currentDisruption?.airport === preset.airport && currentDisruption?.startTime === preset.startTime
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold">{preset.title}</div>
                  <div className="text-[9.5px] text-slate-400">{preset.airport} • {preset.startTime} • {preset.durationMinutes}m</div>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Disruption Form */}
        <form onSubmit={handleSimulate} className="space-y-3 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">
            Custom Disruption Parameters
          </span>

          {/* Airport Dropdown */}
          <div>
            <label className="text-[10.5px] text-slate-300 block mb-1">Target Airport (16 Hubs & Spokes)</label>
            <select
              value={selectedAirport}
              onChange={e => setSelectedAirport(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              {airports.map(a => (
                <option key={a.iata} value={a.iata}>
                  {a.iata} — {a.city} ({a.isHub ? 'Hub' : 'Spoke'})
                </option>
              ))}
            </select>
          </div>

          {/* Disruption Type */}
          <div>
            <label className="text-[10.5px] text-slate-300 block mb-1">Disruption Classification</label>
            <select
              value={disruptionType}
              onChange={e => setDisruptionType(e.target.value as DisruptionType)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="THUNDERSTORM">Thunderstorm (Severe Convective)</option>
              <option value="AIRPORT_CLOSURE">Full Airport Closure (Zero Movements)</option>
              <option value="RUNWAY_CLOSURE">Runway Closure / Maintenance</option>
              <option value="ATC_RESTRICTION">Air Traffic Control Flow Restriction</option>
              <option value="HEAVY_RAIN">Heavy Monsoon Rainfall</option>
            </select>
          </div>

          {/* Start Time & Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10.5px] text-slate-300 block mb-1">Start Time (IST)</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] text-slate-300 block mb-1">Duration (Mins)</label>
              <input
                type="number"
                min={15}
                max={360}
                step={15}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Duration Quick Selector Slider */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Duration slider:</span>
              <span className="text-amber-400 font-bold">{durationMinutes} minutes</span>
            </div>
            <input
              type="range"
              min="30"
              max="240"
              step="15"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="text-[10.5px] text-slate-300 block mb-1">Operational Severity</label>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as DisruptionSeverity[]).map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-1 rounded border text-center transition-all ${
                    severity === sev
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              SIMULATE DISRUPTION
            </button>

            {currentDisruption && (
              <button
                type="button"
                onClick={onResetDisruption}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Reset Disruption
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
