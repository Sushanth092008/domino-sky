'use client';

import React, { useState } from 'react';
import {
  SimulationResult,
  RecoveryAction,
  Flight,
  Aircraft,
} from '../../types/aviation';
import { DispatcherBriefing } from '../../services/ai-dispatcher';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Undo2,
  Layers,
  ArrowRight,
  TrendingDown,
  Users,
  Clock,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface AiDispatcherSidebarProps {
  briefing: DispatcherBriefing;
  currentResult: SimulationResult;
  appliedActions: RecoveryAction[];
  onApplyAction: (action: RecoveryAction) => void;
  onUndoAction: (actionId: string) => void;
  onPreviewDiff: (flightNumber: string | null) => void;
  previewFlightNumber: string | null;
  onOpenCompareModal: () => void;
}

export const AiDispatcherSidebar: React.FC<AiDispatcherSidebarProps> = ({
  briefing,
  currentResult,
  appliedActions,
  onApplyAction,
  onUndoAction,
  onPreviewDiff,
  previewFlightNumber,
  onOpenCompareModal,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl text-xs">
      {/* Dispatcher Header */}
      <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              DOMINO AI — DISPATCHER
            </div>
            <div className="text-[9.5px] font-mono text-indigo-300">
              Operations Control Specialist
            </div>
          </div>
        </div>

        {appliedActions.length > 0 && (
          <button
            onClick={onOpenCompareModal}
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] transition-colors"
          >
            <Layers className="w-3 h-3" />
            Compare
          </button>
        )}
      </div>

      {/* Scrollable Briefing & Cards */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Ops Assessment Briefing Box */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 shadow-md">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Situational Intelligence Briefing
          </div>
          <h4 className="font-semibold text-slate-200 text-xs mb-1.5 leading-snug">
            {briefing.headline}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {briefing.situationAssessment}
          </p>

          {briefing.operationalRisks.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
              <span className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
                Primary Operational Vulnerabilities:
              </span>
              {briefing.operationalRisks.map((risk, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                  <span className="text-amber-500">•</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applied Recovery Actions (if any) */}
        {appliedActions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                Active Tactical Mitigations ({appliedActions.length})
              </span>
            </div>
            <div className="space-y-2">
              {appliedActions.map(action => (
                <div
                  key={action.id}
                  className="bg-emerald-950/20 rounded-lg p-2.5 border border-emerald-500/30 text-[11px] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-emerald-300 block">{action.title}</span>
                    <span className="text-[9.5px] text-slate-400 font-mono">
                      Target: {action.targetFlightNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => onUndoAction(action.id)}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Undo Action"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Candidate Recovery Strategies */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              AI Recommended Interventions
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Verified by Pure Engine
            </span>
          </div>

          {briefing.recommendedActions.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-[11px] bg-slate-900/30 rounded-xl border border-slate-800/60 p-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
              Network is operating within nominal parameters. No recovery interventions required.
            </div>
          ) : (
            <div className="space-y-3">
              {briefing.recommendedActions.map(action => {
                const impact = action.evaluatedImpact;
                const isPreviewing = previewFlightNumber === action.targetFlightNumber;
                const isAlreadyApplied = appliedActions.some(a => a.id === action.id);

                return (
                  <div
                    key={action.id}
                    className={`rounded-xl p-3 border transition-all text-xs shadow-lg ${
                      isAlreadyApplied
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : isPreviewing
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Action Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                          {action.type.replace(/_/g, ' ')}
                        </span>
                        <h5 className="font-bold text-slate-100 text-xs mt-1 leading-snug">
                          {action.title}
                        </h5>
                      </div>
                    </div>

                    <p className="text-[10.5px] text-slate-400 mb-2 leading-relaxed">
                      {action.justification}
                    </p>

                    {/* High-Contrast Deterministic Split Comparison Metrics */}
                    {impact && (
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-black/50 border border-slate-800 font-mono text-[10px] mb-2.5">
                        <div className="text-center">
                          <span className="text-slate-500 block text-[8.5px]">DELAY SAVED</span>
                          <span className="text-emerald-400 font-bold">
                            -{impact.delayMinutesSaved}m
                          </span>
                        </div>
                        <div className="text-center border-x border-slate-800">
                          <span className="text-slate-500 block text-[8.5px]">PAX SAVED</span>
                          <span className="text-emerald-400 font-bold">
                            {impact.strandedPaxSaved > 0 ? `-${impact.strandedPaxSaved}` : '0'} pax
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-500 block text-[8.5px]">CREW RELIEF</span>
                          <span className="text-cyan-400 font-bold">
                            {impact.crewBreachesAvoided > 0 ? `+${impact.crewBreachesAvoided}` : 'OK'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Preview Diff & Apply Recovery */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewDiff(isPreviewing ? null : action.targetFlightNumber)
                        }
                        className={`flex-1 py-1.5 px-2 rounded-lg border font-mono text-[10px] transition-colors flex items-center justify-center gap-1 ${
                          isPreviewing
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        {isPreviewing ? 'Hide Preview' : 'Preview Diff'}
                      </button>

                      <button
                        type="button"
                        disabled={isAlreadyApplied}
                        onClick={() => onApplyAction(action)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition-all flex items-center justify-center gap-1 shadow-md ${
                          isAlreadyApplied
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {isAlreadyApplied ? 'Applied' : 'Apply Recovery'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
