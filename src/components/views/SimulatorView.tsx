'use client';

import React, { useState, useMemo } from 'react';
import {
  Airport,
  DisruptionInput,
  DisruptionType,
  DisruptionSeverity,
  SimulatedFlight,
} from '../../types/aviation';
import { timeToMinutes, minutesToTime } from '../../engine/time-utils';
import {
  CloudLightning,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Plane,
  Clock,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Wind,
  Layers,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface SimulatorViewProps {
  airports: Airport[];
  flights: SimulatedFlight[];
  currentDisruption: DisruptionInput | null;
  onApplyDisruption: (disruption: DisruptionInput) => void;
  onResetDisruption: () => void;
  onNavigateToMap: () => void;
}

const PRESET_SCENARIOS: {
  id: string;
  title: string;
  airport: string;
  type: DisruptionType;
  startTime: string;
  durationMinutes: number;
  severity: DisruptionSeverity;
  description: string;
  cascadingHubs: string[];
}[] = [
  {
    id: 'BOM-90M-SUPERCELL',
    title: 'Mumbai 90m Supercell',
    airport: 'BOM',
    type: 'THUNDERSTORM',
    startTime: '14:00',
    durationMinutes: 90,
    severity: 'HIGH',
    description: 'Severe thunderstorm closes Mumbai airport for 90m, holding departures and propagating delays across Bengaluru, Kolkata, and Delhi.',
    cascadingHubs: ['BLR', 'CCU', 'DEL'],
  },
  {
    id: 'DEL-120M-FOG',
    title: 'Delhi Dense Winter Fog',
    airport: 'DEL',
    type: 'AIRPORT_CLOSURE',
    startTime: '06:30',
    durationMinutes: 120,
    severity: 'CRITICAL',
    description: 'Zero-visibility CAT-III closure halts morning trunk departures at capital hub, backing up entire northern and western corridors.',
    cascadingHubs: ['BOM', 'BLR', 'AMD'],
  },
  {
    id: 'BLR-75M-ATC',
    title: 'Bengaluru ATC Ground Stop',
    airport: 'BLR',
    type: 'ATC_RESTRICTION',
    startTime: '16:00',
    durationMinutes: 75,
    severity: 'MEDIUM',
    description: 'Radar system failure forces sequential holding on southern tech corridor, delaying evening turnarounds.',
    cascadingHubs: ['HYD', 'MAA', 'GOI'],
  },
  {
    id: 'HYD-60M-RUNWAY',
    title: 'Hyderabad Runway Maintenance',
    airport: 'HYD',
    type: 'RUNWAY_CLOSURE',
    startTime: '11:00',
    durationMinutes: 60,
    severity: 'HIGH',
    description: 'Emergency pavement inspection stops all departures, impacting fleet rotations back to Mumbai and Delhi.',
    cascadingHubs: ['BOM', 'DEL'],
  },
];

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  airports,
  flights,
  currentDisruption,
  onApplyDisruption,
  onResetDisruption,
  onNavigateToMap,
}) => {
  // Simulator Configuration State
  const [selectedAirport, setSelectedAirport] = useState<string>(currentDisruption?.airport || 'BOM');
  const [disruptionType, setDisruptionType] = useState<DisruptionType>(
    currentDisruption?.type || 'THUNDERSTORM'
  );
  const [startTime, setStartTime] = useState<string>(currentDisruption?.startTime || '14:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(currentDisruption?.durationMinutes || 90);
  const [severity, setSeverity] = useState<DisruptionSeverity>(currentDisruption?.severity || 'HIGH');
  const [customDescription, setCustomDescription] = useState<string>(
    currentDisruption?.description || 'Severe thunderstorm closes airport, holding departures and inducing rotational delay.'
  );

  // Calculate live preview of flights directly caught in this disruption window
  const impactedDeparturesPreview = useMemo(() => {
    const startMins = timeToMinutes(startTime);
    const endMins = startMins + durationMinutes;

    return flights.filter(f => {
      if (f.origin !== selectedAirport) return false;
      const depMins = timeToMinutes(f.scheduledDeparture);
      return depMins >= startMins && depMins < endMins;
    });
  }, [flights, selectedAirport, startTime, durationMinutes]);

  const impactedArrivalsPreview = useMemo(() => {
    const startMins = timeToMinutes(startTime);
    const endMins = startMins + durationMinutes;

    return flights.filter(f => {
      if (f.destination !== selectedAirport) return false;
      const arrMins = timeToMinutes(f.scheduledArrival);
      return arrMins >= startMins && arrMins < endMins;
    });
  }, [flights, selectedAirport, startTime, durationMinutes]);

  const handleApplyCustom = () => {
    onApplyDisruption({
      airport: selectedAirport,
      type: disruptionType,
      startTime,
      durationMinutes,
      severity,
      description: customDescription,
    });
  };

  const handleApplyPreset = (preset: (typeof PRESET_SCENARIOS)[0]) => {
    setSelectedAirport(preset.airport);
    setDisruptionType(preset.type);
    setStartTime(preset.startTime);
    setDurationMinutes(preset.durationMinutes);
    setSeverity(preset.severity);
    setCustomDescription(preset.description);

    onApplyDisruption({
      airport: preset.airport,
      type: preset.type,
      startTime: preset.startTime,
      durationMinutes: preset.durationMinutes,
      severity: preset.severity,
      description: preset.description,
    });
  };

  const airportObj = airports.find(a => a.iata === selectedAirport);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#080D18] p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2D44] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              <CloudLightning className="w-4 h-4" />
              <span>Network Disruption Laboratory</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              Disruption & Weather Simulator
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Configure deterministic airport closures, severe convective weather, or ATC rate restrictions to observe the cascading domino effect across the 16-hub Indian airspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onResetDisruption}
              className="px-4 py-2 bg-[#101827] hover:bg-[#1E2D44] border border-[#1E2D44] text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Clear Skies
            </button>
            <button
              type="button"
              onClick={() => {
                handleApplyCustom();
                onNavigateToMap();
              }}
              className="px-5 py-2 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Run Simulation & View Map
            </button>
          </div>
        </div>

        {/* 2-Column Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Disruption Parameters (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Airport Selector */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                  1. Target Hub Airport ({airports.length} Official Hubs)
                </label>
                <span className="text-xs font-mono text-[#00F0FF]">
                  Selected: {selectedAirport} ({airportObj?.city})
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {airports.map(a => {
                  const isSelected = selectedAirport === a.iata;
                  const isDisruptedNow = currentDisruption?.airport === a.iata;
                  return (
                    <button
                      key={a.iata}
                      type="button"
                      onClick={() => setSelectedAirport(a.iata)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-sm font-bold'
                          : isDisruptedNow
                          ? 'bg-[#F59E0B]/10 border-[#F59E0B]/50 text-[#F59E0B]'
                          : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      <div className="text-sm font-extrabold font-mono">{a.iata}</div>
                      <div className="text-[9.5px] truncate text-slate-400 mt-0.5">{a.city}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Disruption Type */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
              <label className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                2. Disruption Classification
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    type: 'THUNDERSTORM' as DisruptionType,
                    label: 'Convective Thunderstorm',
                    desc: 'Severe cell directly over runways; full departure hold.',
                    icon: CloudLightning,
                  },
                  {
                    type: 'AIRPORT_CLOSURE' as DisruptionType,
                    label: 'Full Airport Closure',
                    desc: 'Zero-visibility CAT-III or civil defense closure.',
                    icon: ShieldAlert,
                  },
                  {
                    type: 'ATC_RESTRICTION' as DisruptionType,
                    label: 'ATC Ground Stop / Radar Outage',
                    desc: 'En-route slot metering and flow control delays.',
                    icon: AlertTriangle,
                  },
                  {
                    type: 'RUNWAY_CLOSURE' as DisruptionType,
                    label: 'Runway Maintenance / Incursion',
                    desc: 'Active runway temporarily closed for emergency repairs.',
                    icon: Flame,
                  },
                  {
                    type: 'TECHNICAL_FAILURE' as DisruptionType,
                    label: 'Airport System Technical Outage',
                    desc: 'Baggage sorting or check-in network failure.',
                    icon: Wind,
                  },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = disruptionType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setDisruptionType(item.type)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] shadow-sm'
                          : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-[#141F30] text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Timing, Duration & Severity */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm space-y-4">
              <label className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                3. Operational Timing & Duration
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                    <span>Closure Start Time (IST)</span>
                    <span className="font-mono text-[#00F0FF] font-bold">{startTime}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['06:30', '10:00', '14:00', '16:30', '19:00'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setStartTime(t)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          startTime === t
                            ? 'bg-[#00F0FF] text-[#080D18] border-[#00F0FF]'
                            : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                    <span>Severity Level</span>
                    <span className="font-mono text-amber-400 font-bold">{severity}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as DisruptionSeverity[]).map(sev => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          severity === sev
                            ? 'bg-[#F59E0B] text-[#080D18] border-[#F59E0B]'
                            : 'bg-[#101827] border-[#1E2D44] text-slate-300 hover:text-white'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duration Slider */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span>Closure Duration</span>
                  <span className="font-mono text-xl font-extrabold text-[#00F0FF]">
                    {durationMinutes} <span className="text-xs text-slate-400">minutes</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full accent-[#00F0FF] h-2 bg-[#101827] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>15m</span>
                  <span>45m</span>
                  <span>90m (Standard)</span>
                  <span>120m</span>
                  <span>180m</span>
                  <span>240m</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1E2D44] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onResetDisruption}
                  className="px-4 py-2 bg-[#101827] hover:bg-[#1E2D44] border border-[#1E2D44] text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Clear Disruption
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-6 py-2.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Apply & Run Deterministic Engine
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Presets & Live Impact Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Impact Scope Preview */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                  <Plane className="w-4 h-4 text-[#00F0FF]" />
                  Direct Window Impact Preview
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {startTime} to {minutesToTime(timeToMinutes(startTime) + durationMinutes)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#101827] border border-[#1E2D44] rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Held Departures</div>
                  <div className="text-2xl font-extrabold text-[#F59E0B] font-mono mt-0.5">
                    {impactedDeparturesPreview.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Scheduled out of {selectedAirport}
                  </div>
                </div>

                <div className="bg-[#101827] border border-[#1E2D44] rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Affected Inbounds</div>
                  <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-0.5">
                    {impactedArrivalsPreview.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Scheduled into {selectedAirport}
                  </div>
                </div>
              </div>

              {/* List of Held Departures */}
              {impactedDeparturesPreview.length > 0 ? (
                <div>
                  <div className="text-[11px] font-mono text-slate-400 mb-2 font-bold uppercase">
                    Root Delayed Flights ({selectedAirport})
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {impactedDeparturesPreview.map(f => (
                      <div
                        key={f.flightNumber}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#101827] border border-[#1E2D44] text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{f.flightNumber}</span>
                          <span className="text-slate-400 text-[11px]">
                            {f.origin} → {f.destination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{f.scheduledDeparture}</span>
                          <span className="text-amber-400 font-bold">+{durationMinutes}m hold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#101827] border border-[#1E2D44] rounded-xl text-center text-xs text-slate-400">
                  No scheduled departures directly inside this time window.
                </div>
              )}
            </div>

            {/* One-Click Canonical Presets */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 tracking-wider uppercase font-mono mb-3">
                <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                One-Click Canonical Scenarios
              </div>

              <div className="space-y-2.5">
                {PRESET_SCENARIOS.map(preset => {
                  const isCurrent =
                    currentDisruption &&
                    currentDisruption.airport === preset.airport &&
                    currentDisruption.durationMinutes === preset.durationMinutes;

                  return (
                    <div
                      key={preset.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-[#F59E0B]/10 border-[#F59E0B]/50'
                          : 'bg-[#101827] border-[#1E2D44] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{preset.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold">
                            {preset.airport} • {preset.durationMinutes}m
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-2.5 py-1 bg-[#00F0FF]/20 hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#080D18] rounded-lg text-xs font-mono font-bold transition-all"
                        >
                          Simulate
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {preset.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-slate-500">
                        <span>Downstream Impact:</span>
                        {preset.cascadingHubs.map(hub => (
                          <span key={hub} className="px-1 bg-[#141F30] text-slate-300 rounded border border-[#1E2D44]">
                            {hub}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
