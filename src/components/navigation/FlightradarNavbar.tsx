'use client';

import React, { useState } from 'react';
import { SimulationResult, DisruptionInput } from '../../types/aviation';
import {
  Plane,
  Search,
  RotateCcw,
  Database,
  CloudLightning,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface FlightradarNavbarProps {
  result: SimulationResult;
  simulationTime: string;
  onResetSimulation: () => void;
  onOpenDatasetModal: () => void;
  onSelectScenarioPreset: (scenario: DisruptionInput) => void;
  onSearchSelect: (query: string) => void;
}

export const FlightradarNavbar: React.FC<FlightradarNavbarProps> = ({
  result,
  simulationTime,
  onResetSimulation,
  onOpenDatasetModal,
  onSelectScenarioPreset,
  onSearchSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const isDisrupted = !!result.disruption;
  const isRecovered = result.recoveryActionsApplied.length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchSelect(searchQuery.trim().toUpperCase());
    }
  };

  return (
    <header className="w-full h-12 bg-[#0A0F1D] border-b border-[#1E2D44] px-4 flex items-center justify-between gap-4 z-40 select-none flex-shrink-0">
      {/* Left: Flightradar24-Style Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded-lg bg-[#141F30] border border-[#1E2D44] flex items-center justify-center text-[#F1C40F] shadow-sm">
            <Plane className="w-4 h-4 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white font-mono">
                DOMINO SKY
              </span>
              <span className="text-[9px] font-mono font-bold bg-[#F1C40F]/15 text-[#F1C40F] px-1.5 py-0.2 rounded border border-[#F1C40F]/30">
                RADAR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Global Search & Simulation Clock */}
      <div className="flex items-center gap-4 flex-1 max-w-xl justify-center">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search flight (DS0101), airport (BOM), tail..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#101827] border border-[#1E2D44] focus:border-[#F1C40F]/60 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />
        </form>

        {/* Digital Clock */}
        <div className="hidden md:flex items-center gap-2 bg-[#101827] border border-[#1E2D44] px-3 py-1 rounded-lg text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></span>
          <span className="text-slate-400 text-[10.5px]">SIM TIME:</span>
          <strong className="text-white font-bold">{simulationTime} IST</strong>
        </div>
      </div>

      {/* Right: Operational Status, Scenario Selector & Tools */}
      <div className="flex items-center gap-2.5">
        {/* Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border bg-[#101827] border-[#1E2D44]">
          {isRecovered ? (
            <span className="flex items-center gap-1 text-[#10B981]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              RECOVERY ACTIVE
            </span>
          ) : isDisrupted ? (
            <span className="flex items-center gap-1 text-[#F59E0B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse"></span>
              DISRUPTED ({result.disruption?.airport})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#00F0FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span>
              FLEET NOMINAL
            </span>
          )}
        </div>

        {/* Scenario Selector Dropdown */}
        <select
          value={
            result.disruption
              ? `${result.disruption.airport}-${result.disruption.type}-${result.disruption.durationMinutes}`
              : 'NONE'
          }
          onChange={e => {
            const val = e.target.value;
            if (val === 'BOM-THUNDERSTORM-90') {
              onSelectScenarioPreset({
                airport: 'BOM',
                type: 'THUNDERSTORM',
                startTime: '14:00',
                durationMinutes: 90,
                severity: 'HIGH',
                description: 'Severe thunderstorm closes Mumbai airport for 90m, holding departures and inducing rotational delays.',
              });
            } else if (val === 'BOM-AIRPORT_CLOSURE-120') {
              onSelectScenarioPreset({
                airport: 'BOM',
                type: 'AIRPORT_CLOSURE',
                startTime: '14:00',
                durationMinutes: 120,
                severity: 'CRITICAL',
                description: 'Severe supercell halts departures and arrivals for 120m, cascading across BLR and CCU.',
              });
            } else if (val === 'DEL-AIRPORT_CLOSURE-120') {
              onSelectScenarioPreset({
                airport: 'DEL',
                type: 'AIRPORT_CLOSURE',
                startTime: '06:30',
                durationMinutes: 120,
                severity: 'CRITICAL',
                description: 'Zero-visibility CAT-III closure halts morning trunk departures at capital hub.',
              });
            } else if (val === 'BLR-ATC_RESTRICTION-75') {
              onSelectScenarioPreset({
                airport: 'BLR',
                type: 'ATC_RESTRICTION',
                startTime: '16:00',
                durationMinutes: 75,
                severity: 'MEDIUM',
                description: 'Radar system failure forces sequential holding on southern tech corridor.',
              });
            } else {
              onResetSimulation();
            }
          }}
          className="bg-[#101827] border border-[#1E2D44] hover:border-slate-500 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#F1C40F] transition-colors"
        >
          <option value="NONE">Scenario: Clear Weather</option>
          <option value="BOM-THUNDERSTORM-90">Mumbai 90m Supercell (14:00)</option>
          <option value="BOM-AIRPORT_CLOSURE-120">Mumbai 120m Severe Closure (14:00)</option>
          <option value="DEL-AIRPORT_CLOSURE-120">Delhi Winter Fog (06:30)</option>
          <option value="BLR-ATC_RESTRICTION-75">Bengaluru ATC Ground Stop (16:00)</option>
        </select>

        {/* Data I/O Button */}
        <button
          type="button"
          onClick={onOpenDatasetModal}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#101827] hover:bg-[#141F30] text-slate-300 hover:text-white border border-[#1E2D44] rounded-lg text-xs font-mono transition-colors"
          title="Import or Export Dataset (JSON / CSV)"
        >
          <Database className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="hidden sm:inline">Data</span>
        </button>

        {/* Reset Simulation Button */}
        <button
          type="button"
          onClick={onResetSimulation}
          className="p-1.5 bg-[#101827] hover:bg-[#141F30] text-slate-400 hover:text-white border border-[#1E2D44] rounded-lg text-xs font-mono transition-colors"
          title="Reset All Simulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
