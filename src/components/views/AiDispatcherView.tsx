'use client';

import React, { useState, useMemo } from 'react';
import {
  SimulationResult,
  RecoveryAction,
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
  RotateCcw,
  Plane,
  Scale,
} from 'lucide-react';

interface AiDispatcherViewProps {
  briefing: DispatcherBriefing;
  currentResult: SimulationResult;
  appliedActions: RecoveryAction[];
  onApplyAction: (action: RecoveryAction) => void;
  onUndoAction: (actionId: string) => void;
  onPreviewDiff: (flightNumber: string | null) => void;
  previewFlightNumber: string | null;
  onOpenCompareModal: () => void;
  onResetAllActions: () => void;
}

export const AiDispatcherView: React.FC<AiDispatcherViewProps> = ({
  briefing,
  currentResult,
  appliedActions,
  onApplyAction,
  onUndoAction,
  onPreviewDiff,
  previewFlightNumber,
  onOpenCompareModal,
  onResetAllActions,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'SPARE' | 'CANCEL' | 'SWAP'>('ALL');

  const filteredCandidates = useMemo(() => {
    return briefing.recommendedActions.filter((action: RecoveryAction) => {
      if (filterType === 'SPARE') return action.type === 'ASSIGN_SPARE';
      if (filterType === 'CANCEL') return action.type === 'CANCEL_FLIGHT';
      if (filterType === 'SWAP') return action.type === 'AIRCRAFT_SWAP';
      return true;
    });
  }, [briefing.recommendedActions, filterType]);

  const hasAppliedActions = appliedActions.length > 0;

  return (
    <div className="w-full h-full overflow-y-auto bg-[#080D18] p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2D44] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
              <Bot className="w-4 h-4 text-[#00F0FF]" />
              <span>Autonomous Tactical Operations Center</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              AI Dispatcher & Recovery Control Room
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Synthesizes real-time network states, evaluates spare aircraft rotations, and recommends provably effective interventions ranked by deterministic operational benefit score.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasAppliedActions && (
              <>
                <button
                  type="button"
                  onClick={onResetAllActions}
                  className="px-3.5 py-2 bg-[#101827] hover:bg-[#1E2D44] border border-[#1E2D44] text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Interventions
                </button>

                <button
                  type="button"
                  onClick={onOpenCompareModal}
                  className="px-4 py-2 bg-[#141F30] hover:bg-[#1E2D44] border border-[#00F0FF]/40 text-[#00F0FF] font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Scale className="w-3.5 h-3.5" />
                  Before vs After Comparison
                </button>
              </>
            )}
          </div>
        </div>

        {/* 1. Tactical Situational Briefing Banner */}
        <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-xl text-[#00F0FF] flex-shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider">
                  Operational Assessment
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Real-Time Engine Synthesis
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{briefing.headline}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
                {briefing.situationAssessment}
              </p>

              {/* Strategic Insights Tags */}
              {briefing.operationalRisks.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#1E2D44]/60">
                  <span className="text-[11px] font-mono text-slate-400">Operational Risks:</span>
                  {briefing.operationalRisks.map((risk: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[#101827] border border-[#1E2D44] text-[#F59E0B] font-mono text-[10.5px] font-bold"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Recovery Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ranked Candidate Recovery Actions (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00F0FF]" />
                Ranked Recovery Interventions ({filteredCandidates.length})
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-[#101827] p-1 rounded-xl border border-[#1E2D44] text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === 'ALL'
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('SPARE')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === 'SPARE'
                      ? 'bg-[#10B981]/20 text-[#10B981] font-bold border border-[#10B981]/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Spares
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('CANCEL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterType === 'CANCEL'
                      ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold border border-[#EF4444]/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cancellations
                </button>
              </div>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="p-8 bg-[#141F30] border border-[#1E2D44] rounded-2xl text-center text-slate-400 text-xs">
                No active recovery recommendations for this filter. The network is either fully recovered or running clear.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCandidates.map((action: RecoveryAction, idx: number) => {
                  const isApplied = appliedActions.some(a => a.id === action.id);
                  const delaySaved = action.evaluatedImpact?.delayMinutesSaved || 0;
                  const paxSaved = action.evaluatedImpact?.strandedPaxSaved || 0;
                  const crewSaved = action.evaluatedImpact?.crewBreachesAvoided || 0;
                  const benefitScore = delaySaved + paxSaved * 15 + crewSaved * 60;

                  return (
                    <div
                      key={action.id}
                      className={`bg-[#141F30] border rounded-2xl p-4 transition-all shadow-sm ${
                        isApplied
                          ? 'border-[#10B981]/60 bg-[#10B981]/5'
                          : 'border-[#1E2D44] hover:border-[#00F0FF]/50'
                      }`}
                    >
                      {/* Top Action Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#101827] border border-[#1E2D44] flex items-center justify-center font-mono text-[10px] font-bold text-[#00F0FF]">
                            #{idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              action.type === 'ASSIGN_SPARE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : action.type === 'CANCEL_FLIGHT'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}
                          >
                            {action.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Target: <strong className="text-white">{action.targetFlightNumber}</strong>
                          </span>
                        </div>

                        {/* Operational Benefit Score Pill */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101827] border border-[#00F0FF]/30 font-mono text-xs">
                          <span className="text-slate-400 text-[10px]">Score:</span>
                          <span className="font-extrabold text-[#00F0FF]">
                            +{benefitScore} pts
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{action.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {action.description}
                      </p>

                      {/* Technical Justification */}
                      <div className="p-2.5 rounded-xl bg-[#101827] border border-[#1E2D44] text-[11px] text-slate-400 font-mono mb-3 leading-tight">
                        <strong className="text-slate-300">Operational Rationale:</strong>{' '}
                        {action.justification}
                      </div>

                      {/* Impact Metrics & Execution Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1E2D44]/70">
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <div className="flex items-center gap-1 text-emerald-400 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>-{delaySaved}m delay</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#00F0FF] font-bold">
                            <Users className="w-3.5 h-3.5" />
                            <span>+{paxSaved} pax saved</span>
                          </div>
                          {crewSaved > 0 && (
                            <div className="flex items-center gap-1 text-purple-400 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>+{crewSaved} crew saved</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={() => onUndoAction(action.id)}
                              className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#EF4444] hover:text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                            >
                              <Undo2 className="w-3 h-3" />
                              Undo Action
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onApplyAction(action)}
                              className="px-4 py-1.5 bg-[#00F0FF] hover:bg-[#38BDF8] text-[#080D18] rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Apply Intervention
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Applied Interventions & Live Operational Telemetry (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Active Interventions Manifest */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  Active Applied Interventions ({appliedActions.length})
                </span>
                {hasAppliedActions && (
                  <button
                    type="button"
                    onClick={onResetAllActions}
                    className="text-[11px] font-mono text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {appliedActions.length === 0 ? (
                <div className="p-4 bg-[#101827] border border-[#1E2D44] rounded-xl text-center text-xs text-slate-400 leading-relaxed">
                  No recovery actions currently active. Select and apply any candidate action on the left to see deterministic network recovery in real time.
                </div>
              ) : (
                <div className="space-y-2">
                  {appliedActions.map(action => (
                    <div
                      key={action.id}
                      className="p-3 bg-[#101827] border border-[#10B981]/40 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="text-[#10B981]">✓</span>
                          <span>{action.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          -{action.evaluatedImpact?.delayMinutesSaved || 0}m delay • +{action.evaluatedImpact?.strandedPaxSaved || 0} pax protected
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onUndoAction(action.id)}
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Undo action"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategic Comparison CTA Card */}
            <div className="bg-[#141F30] border border-[#1E2D44] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 tracking-wider uppercase font-mono mb-2">
                <Scale className="w-4 h-4 text-[#00F0FF]" />
                Audit Verification & Side-by-Side Diff
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Verify that every recovery intervention is evaluated against the baseline disruption. Inspect delayed flights, saved minutes, and restored passenger connections before finalizing.
              </p>

              <button
                type="button"
                onClick={onOpenCompareModal}
                className="w-full py-2.5 bg-[#101827] hover:bg-[#1E2D44] border border-[#00F0FF]/40 text-[#00F0FF] hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Launch Full Operational Diff Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
