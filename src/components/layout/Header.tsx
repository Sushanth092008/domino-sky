'use client';

import React from 'react';
import { SimulationResult, DisruptionInput } from '../../types/aviation';
import {
  Plane,
  AlertTriangle,
  RotateCcw,
  Database,
  CloudLightning,
  Clock,
  Layers,
  Sparkles,
  Users,
  ShieldAlert,
} from 'lucide-react';

interface HeaderProps {
  result: SimulationResult;
  simulationTime: string;
  onResetSimulation: () => void;
  onOpenDatasetModal: () => void;
  onSelectScenarioPreset: (scenario: DisruptionInput) => void;
}

export const Header: React.FC<HeaderProps> = ({
  result,
  simulationTime,
  onResetSimulation,
  onOpenDatasetModal,
  onSelectScenarioPreset,
}) => {
  const isDisrupted = !!result.disruption;
  const isRecovered = result.recoveryActionsApplied.length > 0;

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 text-xs select-none flex-shrink-0 z-30">
      {/* Upper Navigation & Controls Strip */}
      <div className="h-12 px-4 flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Plane className="w-4 h-4 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wider text-white">DOMINO SKY</span>
                <span className="text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-500/30">
                  NOC v2.4
                </span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 tracking-tight">
                NETWORK OPERATIONS CENTRE
              </div>
            </div>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Operational Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border shadow-sm">
            {isRecovered ? (
              <span className="flex items-center gap-1.5 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                RECOVERY MITIGATION ACTIVE
              </span>
            ) : isDisrupted ? (
              <span className="flex items-center gap-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                DISRUPTION CASCADE IN PROGRESS
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-cyan-400 border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                NETWORK OPERATIONS NOMINAL
              </span>
            )}
          </div>
        </div>

        {/* Right: Sim Clock & Quick Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Scenario Selector */}
          <div className="hidden md:flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-mono text-[10px]">SCENARIO:</span>
            <select
              value={result.disruption ? `${result.disruption.airport}-${result.disruption.type}` : 'NONE'}
              onChange={e => {
                const val = e.target.value;
                if (val === 'BOM-THUNDERSTORM') {
                  onSelectScenarioPreset({
                    airport: 'BOM',
                    type: 'THUNDERSTORM',
                    startTime: '14:00',
                    durationMinutes: 90,
                    severity: 'HIGH',
                  });
                } else if (val === 'DEL-AIRPORT_CLOSURE') {
                  onSelectScenarioPreset({
                    airport: 'DEL',
                    type: 'AIRPORT_CLOSURE',
                    startTime: '06:30',
                    durationMinutes: 120,
                    severity: 'CRITICAL',
                  });
                } else if (val === 'BLR-ATC_RESTRICTION') {
                  onSelectScenarioPreset({
                    airport: 'BLR',
                    type: 'ATC_RESTRICTION',
                    startTime: '16:00',
                    durationMinutes: 75,
                    severity: 'MEDIUM',
                  });
                } else {
                  onResetSimulation();
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="NONE">Normal Schedule (All Clear)</option>
              <option value="BOM-THUNDERSTORM">Mumbai 90m Supercell (14:00)</option>
              <option value="DEL-AIRPORT_CLOSURE">Delhi Winter Fog Halt (06:30)</option>
              <option value="BLR-ATC_RESTRICTION">Bengaluru ATC Ground Stop (16:00)</option>
            </select>
          </div>

          {/* Dataset Modal Button */}
          <button
            onClick={onOpenDatasetModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-mono text-[11px] transition-colors shadow-sm"
            title="Import or Export Dataset"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Data I/O</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg font-mono text-[11px] transition-colors"
            title="Reset All Disruption and Recovery"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Compact Top KPI Cards Strip (High-Density Operations Banner) */}
      <div className="h-14 px-4 bg-slate-900/40 grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-800/80 font-mono">
        {/* KPI 1: Total Flights */}
        <div className="px-3 py-1.5 flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">
            TOTAL FLIGHTS
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white">{result.totalFlights}</span>
            <span className="text-[10px] text-slate-400">sectors</span>
          </div>
        </div>

        {/* KPI 2: Delayed Flights */}
        <div className="px-3 py-1.5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">
              DELAYED FLIGHTS
            </span>
            {result.activeMetrics && (
              <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">
                Active: {result.activeMetrics.activeDelayedFlightsCount + result.activeMetrics.activeHeldFlightsCount}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold ${
                result.delayedFlightsCount > 0 ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {result.delayedFlightsCount}
            </span>
            <span className="text-[10px] text-slate-500">
              ({Math.round((result.delayedFlightsCount / result.totalFlights) * 100)}% forecast)
            </span>
          </div>
        </div>

        {/* KPI 3: Total Delay Minutes */}
        <div className="px-3 py-1.5 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">
              TOTAL DELAY MINS
            </span>
            {result.activeMetrics && (
              <span className="text-[8px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">
                Active: +{result.activeMetrics.activeDelayMinutes}m
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold ${
                result.totalDelayMinutes > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              +{result.totalDelayMinutes}m
            </span>
            <span className="text-[10px] text-slate-500">
              (avg +{result.averageDelayMinutes}m)
            </span>
          </div>
        </div>

        {/* KPI 4: Cancelled Flights */}
        <div className="px-3 py-1.5 flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">
            CANCELLED
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold ${
                result.cancelledFlightsCount > 0 ? 'text-red-400' : 'text-slate-400'
              }`}
            >
              {result.cancelledFlightsCount}
            </span>
            <span className="text-[10px] text-slate-500">flights</span>
          </div>
        </div>

        {/* KPI 5: Stranded Passengers */}
        <div className="px-3 py-1.5 flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">
            STRANDED PAX
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold ${
                result.strandedPassengersCount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {result.strandedPassengersCount}
            </span>
            <span className="text-[10px] text-slate-500">
              ({result.missedConnectionPassengersCount} missed)
            </span>
          </div>
        </div>

        {/* KPI 6: Crew FDP Breaches */}
        <div className="px-3 py-1.5 flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">
            CREW DUTY STATUS
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold ${
                result.crewBreachesCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {result.crewBreachesCount > 0 ? `${result.crewBreachesCount} BREACHES` : 'ALL LEGAL'}
            </span>
            <span className="text-[10px] text-slate-500">DGCA</span>
          </div>
        </div>
      </div>
    </header>
  );
};
