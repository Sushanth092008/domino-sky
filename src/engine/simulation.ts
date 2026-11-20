// DOMINO SKY - Master Deterministic Simulation Engine
// Pure discrete-event operational simulation coordinating rotations, closures, connections, crew, and recovery

import {
  Flight,
  Airport,
  PassengerConnection,
  CrewAssignment,
  Aircraft,
  DisruptionInput,
  RecoveryAction,
  SimulationResult,
} from '../types/aviation';
import {
  OFFICIAL_FLIGHTS,
  OFFICIAL_AIRPORTS,
  OFFICIAL_CONNECTIONS,
  OFFICIAL_CREW_ASSIGNMENTS,
  OFFICIAL_SPARES,
} from '../data/official-dataset';
import { propagateAircraftRotations } from './aircraft-rotation';
import { evaluatePassengerConnections } from './passenger-connections';
import { evaluateCrewConstraints } from './crew-constraints';
import { buildRecoveryPlanState, validateRecoveryAction } from './recovery';
import { computeOperationalMetrics } from './metrics';

export interface RunSimulationOptions {
  flights?: Flight[];
  airports?: Airport[];
  connections?: PassengerConnection[];
  crew?: CrewAssignment[];
  spares?: Aircraft[];
  disruption: DisruptionInput | null;
  recoveryActions?: RecoveryAction[];
  simulationTime?: string;
  timestamp?: string;
}

export function runSimulation(options: RunSimulationOptions): SimulationResult {
  const flights = options.flights || OFFICIAL_FLIGHTS;
  const airports = options.airports || OFFICIAL_AIRPORTS;
  const connections = options.connections || OFFICIAL_CONNECTIONS;
  const crew = options.crew || OFFICIAL_CREW_ASSIGNMENTS;
  const spares = options.spares || OFFICIAL_SPARES;
  const disruption = options.disruption;
  const recoveryActions = options.recoveryActions || [];
  const simulationTime = options.simulationTime || '23:59';

  // 1. Validate recovery actions
  const validatedActions: RecoveryAction[] = recoveryActions.map(action => {
    const val = validateRecoveryAction(action, flights, spares, []);
    return {
      ...action,
      isFeasible: val.isFeasible,
      infeasibilityReason: val.reason,
    };
  });

  // 2. Build recovery plan active states
  const recoveryPlanState = buildRecoveryPlanState(validatedActions, flights);

  // 3. Propagate aircraft rotations through closures and turnarounds
  const simulatedFlights = propagateAircraftRotations(
    flights,
    airports,
    disruption,
    recoveryPlanState.cancelledFlightNumbers,
    recoveryPlanState.tailOverrides,
    recoveryPlanState.forcedDepDelays
  );

  // 4. Evaluate connecting passenger outcomes
  const simulatedConnections = evaluatePassengerConnections(simulatedFlights, connections);

  // 5. Evaluate crew legal duty hours
  const crewResults = evaluateCrewConstraints(simulatedFlights, crew);

  // 6. Compute top-level metrics and deterministic hash
  const metrics = computeOperationalMetrics(simulatedFlights, simulatedConnections, crewResults, airports, simulationTime);

  return {
    simulationTime,
    disruption,
    recoveryActionsApplied: validatedActions,
    flights: simulatedFlights,
    connections: simulatedConnections,
    crewFeasibility: crewResults,
    ...metrics,
    timestamp: options.timestamp || '2026-11-20T14:00:00.000Z',
  };
}

// Evaluates a candidate recovery action against a baseline simulation to get exact deterministic deltas
export function evaluateCandidateRecoveryAction(
  action: RecoveryAction,
  baselineResult: SimulationResult,
  options: RunSimulationOptions
): RecoveryAction {
  // Run simulation with candidate action appended
  const testActions = [...(options.recoveryActions || []), action];
  const recoveredResult = runSimulation({
    ...options,
    recoveryActions: testActions,
  });

  const delaySaved = Math.max(0, baselineResult.totalDelayMinutes - recoveredResult.totalDelayMinutes);
  const strandedSaved = Math.max(0, baselineResult.strandedPassengersCount - recoveredResult.strandedPassengersCount);
  const missedConnectionsSaved = Math.max(0, baselineResult.missedConnectionPassengersCount - recoveredResult.missedConnectionPassengersCount);
  const crewBreachesAvoided = Math.max(0, baselineResult.crewBreachesCount - recoveredResult.crewBreachesCount);
  const netDelayedChange = recoveredResult.delayedFlightsCount - baselineResult.delayedFlightsCount;

  return {
    ...action,
    evaluatedImpact: {
      delayMinutesSaved: delaySaved,
      strandedPaxSaved: strandedSaved,
      missedConnectionsSaved: missedConnectionsSaved,
      crewBreachesAvoided: crewBreachesAvoided,
      netDelayedFlightsChange: netDelayedChange,
    },
  };
}
