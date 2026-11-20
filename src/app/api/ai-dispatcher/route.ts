// DOMINO SKY - AI Operations Dispatcher API Route
// Generates tactical natural language briefings while strictly consuming deterministic engine metrics

import { NextRequest, NextResponse } from 'next/server';
import { SimulationResult } from '@/types/aviation';
import { synthesizeOperationsBriefing, generateCandidateRecoveryActions } from '@/services/ai-dispatcher';
import { OFFICIAL_FLIGHTS, OFFICIAL_SPARES } from '@/data/official-dataset';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result: SimulationResult = body.simulationResult;

    if (!result) {
      return NextResponse.json({ error: 'Missing simulationResult in request body' }, { status: 400 });
    }

    // 1. Generate verified candidate recovery actions deterministically
    const candidateActions = generateCandidateRecoveryActions(
      result,
      OFFICIAL_FLIGHTS,
      OFFICIAL_SPARES
    );

    // 2. Synthesize baseline structured briefing
    const briefing = synthesizeOperationsBriefing(result, candidateActions);

    return NextResponse.json({
      success: true,
      briefing,
      candidateActions,
      signature: result.deterministicSignature,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error in AI Dispatcher';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
