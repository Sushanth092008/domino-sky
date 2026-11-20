'use client';

import React from 'react';
import {
  Search,
  Filter,
  MapPin,
  CloudLightning,
  Bot,
  Clock,
  Users,
  BarChart3,
  Layers,
  Sparkles,
  Plane,
} from 'lucide-react';

export type ActiveDrawerType =
  | 'SEARCH'
  | 'FILTERS'
  | 'AIRPORTS'
  | 'DISRUPTION'
  | 'DISPATCHER'
  | 'ROTATIONS'
  | 'PASSENGERS'
  | 'ANALYTICS'
  | null;

interface FloatingToolbarProps {
  activeDrawer: ActiveDrawerType;
  onToggleDrawer: (drawer: ActiveDrawerType) => void;
  isDisrupted: boolean;
  hasRecoveryActions: boolean;
  airborneCount: number;
  delayedCount: number;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  activeDrawer,
  onToggleDrawer,
  isDisrupted,
  hasRecoveryActions,
  airborneCount,
  delayedCount,
}) => {
  const tools: {
    id: ActiveDrawerType;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'FILTERS',
      label: 'Flight Filters',
      icon: Filter,
      badge: delayedCount > 0 ? delayedCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'AIRPORTS',
      label: '16 Hub Airports',
      icon: MapPin,
    },
    {
      id: 'DISRUPTION',
      label: 'Disruption Simulator',
      icon: CloudLightning,
      badge: isDisrupted ? '!' : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 animate-ping',
    },
    {
      id: 'DISPATCHER',
      label: 'AI Dispatcher',
      icon: Bot,
      badge: hasRecoveryActions ? '✓' : undefined,
      badgeColor: 'bg-emerald-400 text-slate-950 font-bold',
    },
    {
      id: 'ROTATIONS',
      label: 'Aircraft Rotations (Gantt)',
      icon: Clock,
    },
    {
      id: 'PASSENGERS',
      label: 'Passenger Connections',
      icon: Users,
    },
    {
      id: 'ANALYTICS',
      label: 'Network Analytics',
      icon: BarChart3,
    },
  ];

  return (
    <div className="absolute left-4 top-16 z-30 flex flex-col gap-1.5 bg-[#0A0F1D]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-[#1E2D44] shadow-2xl">
      {tools.map(tool => {
        const Icon = tool.icon;
        const isActive = activeDrawer === tool.id;

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onToggleDrawer(isActive ? null : tool.id)}
            className={`relative p-2.5 rounded-xl transition-all duration-150 group flex items-center justify-center ${
              isActive
                ? 'bg-[#141F30] text-[#00F0FF] border border-[#00F0FF]/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#141F30]'
            }`}
            title={tool.label}
          >
            <Icon className="w-4 h-4" />

            {/* Badge Indicator */}
            {tool.badge !== undefined && (
              <span
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow ${
                  tool.badgeColor || 'bg-cyan-400 text-slate-950'
                }`}
              >
                {tool.badge}
              </span>
            )}

            {/* Tooltip on Hover */}
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#101827] border border-[#1E2D44] text-white text-[11px] font-mono rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
              {tool.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
