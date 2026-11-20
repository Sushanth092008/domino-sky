'use client';

import React from 'react';
import { SimulationResult, DisruptionInput } from '../../types/aviation';
import {
  Plane,
  LayoutDashboard,
  Compass,
  CloudLightning,
  Clock,
  GitCommit,
  Users,
  Bot,
  BarChart3,
  Database,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type ActiveNavTab =
  | 'OVERVIEW'
  | 'NETWORK'
  | 'SIMULATOR'
  | 'ROTATIONS'
  | 'CASCADE'
  | 'PASSENGERS'
  | 'DISPATCHER'
  | 'ANALYTICS';

interface TopNavbarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  result: SimulationResult;
  simulationTime: string;
  onResetSimulation: () => void;
  onOpenDatasetModal: () => void;
  onSelectScenarioPreset: (scenario: DisruptionInput) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onSelectTab,
  result,
  simulationTime,
  onResetSimulation,
  onOpenDatasetModal,
  onSelectScenarioPreset,
}) => {
  const isDisrupted = !!result.disruption;
  const isRecovered = result.recoveryActionsApplied.length > 0;

  const navItems: { id: ActiveNavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
    { id: 'NETWORK', label: 'Live Network', icon: Compass },
    { id: 'SIMULATOR', label: 'Disruption Simulator', icon: CloudLightning },
    { id: 'ROTATIONS', label: 'Aircraft Rotations', icon: Clock },
    { id: 'CASCADE', label: 'Cascade DAG', icon: GitCommit },
    { id: 'PASSENGERS', label: 'Passenger Impact', icon: Users },
    { id: 'DISPATCHER', label: 'AI Dispatcher', icon: Bot },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="w-full bg-[#080D18] border-b border-[#1E2D44] text-xs select-none flex-shrink-0 z-40">
      <div className="h-14 px-5 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('OVERVIEW')}>
            <div className="w-8 h-8 rounded-lg bg-[#141F30] border border-[#1E2D44] flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <Plane className="w-4 h-4 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-widest text-white">DOMINO SKY</span>
                <span className="text-[9px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] px-1.5 py-0.5 rounded border border-[#00F0FF]/30">
                  NOC 2.0
                </span>
              </div>
              <div className="text-[9.5px] font-mono text-slate-400 tracking-wider uppercase">
                Aviation Disruption Intelligence
              </div>
            </div>
          </div>
        </div>

        {/* Center: Primary Navigation Tabs (Linear / Modern SaaS style) */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#101827] p-1 rounded-xl border border-[#1E2D44]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#141F30] text-[#00F0FF] font-semibold border border-[#00F0FF]/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141F30]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00F0FF]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'DISPATCHER' && isRecovered && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                )}
                {item.id === 'SIMULATOR' && isDisrupted && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Operational Status & Controls */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-semibold border bg-[#101827] border-[#1E2D44]">
            {isRecovered ? (
              <span className="flex items-center gap-1.5 text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                RECOVERY MITIGATIONS ACTIVE
              </span>
            ) : isDisrupted ? (
              <span className="flex items-center gap-1.5 text-[#F59E0B]">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span>
                DISRUPTION ACTIVE ({result.disruption?.airport})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#00F0FF]">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                FLEET SCHEDULE NOMINAL
              </span>
            )}
          </div>

          {/* Quick Scenario Selector */}
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
              } else if (val === 'CCU-HEAVY_RAIN') {
                onSelectScenarioPreset({
                  airport: 'CCU',
                  type: 'HEAVY_RAIN',
                  startTime: '11:00',
                  durationMinutes: 80,
                  severity: 'HIGH',
                });
              } else {
                onResetSimulation();
              }
            }}
            className="hidden sm:inline-block bg-[#101827] border border-[#1E2D44] hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#00F0FF] transition-colors"
          >
            <option value="NONE">Scenario: Clear Weather</option>
            <option value="BOM-THUNDERSTORM">Scenario: Mumbai 90m Supercell</option>
            <option value="DEL-AIRPORT_CLOSURE">Scenario: Delhi Dense Fog Halt</option>
            <option value="BLR-ATC_RESTRICTION">Scenario: Bengaluru ATC Restriction</option>
            <option value="CCU-HEAVY_RAIN">Scenario: Kolkata Monsoon Downpour</option>
          </select>

          {/* Data I/O Button */}
          <button
            onClick={onOpenDatasetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101827] hover:bg-[#141F30] text-slate-200 border border-[#1E2D44] hover:border-slate-600 rounded-lg font-mono text-xs transition-colors shadow-sm"
            title="Import or Export Dataset (JSON / CSV)"
          >
            <Database className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="hidden sm:inline">Data I/O</span>
          </button>

          {/* Reset Simulation Control */}
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#101827] hover:bg-[#141F30] text-slate-400 hover:text-white border border-[#1E2D44] rounded-lg font-mono text-xs transition-colors"
            title="Reset All Disruption and Recovery"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation Scrollbar */}
      <div className="flex xl:hidden overflow-x-auto px-4 py-2 bg-[#101827] border-t border-[#1E2D44] gap-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#141F30] text-[#00F0FF] border border-[#00F0FF]/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
