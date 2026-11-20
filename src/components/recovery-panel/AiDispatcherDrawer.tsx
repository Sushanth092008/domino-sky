'use client';

import React, { useState } from 'react';
import {
  SimulationResult,
  RecoveryAction,
} from '../../types/aviation';
import { DispatcherBriefing } from '../../services/ai-dispatcher';
import {
  X,
  Bot,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Undo2,
  Scale,
  Clock,
  Users,
  AlertTriangle,
  Plane,
} from 'lucide-react';

interface AiDispatcherDrawerProps {
  briefing: DispatcherBriefing;
  currentResult: SimulationResult;
  appliedActions: RecoveryAction[];
  onApplyAction: (action: RecoveryAction) => void;
  onUndoAction: (actionId: string) => void;
  onOpenCompareModal: () => void;
  onClose: () => void;
}

export const AiDispatcherDrawer: React.FC<AiDispatcherDrawerProps> = ({
  briefing,
  currentResult,
  appliedActions,
  onApplyAction,
  onUndoAction,
  onOpenCompareModal,
  onClose,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0A0F1D]/95 backdrop-blur-2xl border-l border-[#1E2D44] shadow-2xl z-50 flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#1E2D44] bg-[#0E1626]/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#00F0FF]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold font-mono text-white tracking-wider">
                DOMINO AI DISPATCHER
              </h3>
              <span className="text-[9px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] px-1.5 py-0.2 rounded border border-[#00F0FF]/30">
                TACTICAL OPS
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Deterministic Autonomous Recovery Engine
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
        {/* Situational Assessment Banner */}
        <div className="bg-[#101827] border border-[#1E2D44] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00F0FF] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operations Assessment</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">{briefing.headline}</h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {briefing.situationAssessment}
          </p>

          {briefing.operationalRisks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#1E2D44] space-y-1">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                Primary Operational Bottlenecks:
              </span>
              {briefing.operationalRisks.map((risk, i) => (
                <div key={i} className="text-[11px] font-mono text-amber-300 flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Applied Interventions */}
        {appliedActions.length > 0 && (
          <div className="bg-[#101827] border border-[#10B981]/40 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Active Interventions ({appliedActions.length})
              </span>
              <button
                type="button"
                onClick={onOpenCompareModal}
                className="text-[10px] text-[#00F0FF] underline hover:text-white"
              >
                Compare Diff
              </button>
            </div>

            <div className="space-y-1.5">
              {appliedActions.map(action => (
                <div
                  key={action.id}
                  className="p-2.5 rounded-xl bg-[#141F30] border border-[#1E2D44] text-xs font-mono flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-white block">{action.title}</span>
                    <span className="text-[10px] text-emerald-400">
                      -{action.evaluatedImpact?.delayMinutesSaved || 0}m delay • +{action.evaluatedImpact?.crewBreachesAvoided || 0} crew breach avoided
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUndoAction(action.id)}
                    className="p-1 text-slate-400 hover:text-red-400"
                    title="Undo intervention"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidate Recommended Actions */}
        <div>
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2.5 flex items-center justify-between">
            <span>Ranked Recommendations ({briefing.recommendedActions.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">Ranked by Operational Benefit</span>
          </div>

          {briefing.recommendedActions.length === 0 ? (
            <div className="p-6 bg-[#101827] border border-[#1E2D44] rounded-2xl text-center text-xs text-slate-400">
              No active recovery recommendations. Network is either running nominal or fully mitigated.
            </div>
          ) : (
            <div className="space-y-3">
              {briefing.recommendedActions.map((action, idx) => {
                const isApplied = appliedActions.some(a => a.id === action.id);
                const delaySaved = action.evaluatedImpact?.delayMinutesSaved || 0;
                const paxSaved = action.evaluatedImpact?.strandedPaxSaved || 0;
                const crewAvoided = action.evaluatedImpact?.crewBreachesAvoided || 0;
                const benefitScore = delaySaved + paxSaved * 15 + crewAvoided * 60;

                return (
                  <div
                    key={action.id}
                    className={`p-4 rounded-2xl border text-xs transition-all shadow-sm ${
                      isApplied
                        ? 'bg-emerald-950/20 border-emerald-500/50'
                        : 'bg-[#101827] border-[#1E2D44] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="w-4 h-4 rounded bg-[#141F30] text-[#00F0FF] font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#141F30] text-amber-400 font-bold uppercase">
                          {action.type.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400">Target: {action.targetFlightNumber}</span>
                      </div>

                      <span className="font-mono text-[10.5px] font-bold text-[#00F0FF] bg-[#141F30] px-2 py-0.5 rounded border border-[#00F0FF]/30">
                        +{benefitScore} pts
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-xs mb-1">{action.title}</h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2.5">
                      {action.description}
                    </p>

                    <div className="p-2 rounded-lg bg-[#141F30] border border-[#1E2D44] text-[10.5px] font-mono text-slate-400 mb-3">
                      <strong>Rationale:</strong> {action.justification}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#1E2D44]/80">
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">-{delaySaved}m</span>
                        {paxSaved > 0 && <span className="text-cyan-400 font-bold">+{paxSaved} pax</span>}
                        {crewAvoided > 0 && (
                          <span className="text-purple-400 font-bold">+{crewAvoided} crew</span>
                        )}
                      </div>

                      {isApplied ? (
                        <button
                          type="button"
                          onClick={() => onUndoAction(action.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-mono text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Undo2 className="w-3 h-3" />
                          Undo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onApplyAction(action)}
                          className="px-3.5 py-1.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] rounded-lg font-mono text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Apply Action
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1E2D44] bg-[#0E1626]/90 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenCompareModal}
          className="w-full py-2.5 px-4 bg-[#141F30] hover:bg-[#1E2D44] border border-[#00F0FF]/40 text-[#00F0FF] hover:text-white rounded-xl text-xs font-mono font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Scale className="w-4 h-4" />
          Full Before vs After Audit Modal
        </button>
      </div>
    </div>
  );
};
