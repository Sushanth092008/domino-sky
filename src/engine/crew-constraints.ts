// DOMINO SKY - Crew Duty Constraints & Legal Feasibility Engine
// Evaluates Flight Duty Period (FDP) and maximum block hours per DGCA CAR Section 7 Series J

import { CrewAssignment, SimulatedFlight } from '../types/aviation';
import { timeToMinutes } from './time-utils';

export interface CrewEvaluationResult {
  rosterId: string;
  flightNumber: string;
  dutyMinutes: number;
  maxDutyMinutes: number;
  maxDuty: number;
  isFeasible: boolean;
  reason?: string;
}

export function evaluateCrewConstraints(
  simulatedFlights: SimulatedFlight[],
  crewAssignments: CrewAssignment[]
): Record<string, CrewEvaluationResult> {
  const flightMap = new Map<string, SimulatedFlight>(simulatedFlights.map(f => [f.flightNumber, f]));
  const results: Record<string, CrewEvaluationResult> = {};

  for (const crew of crewAssignments) {
    const flight = flightMap.get(crew.flightNumber);
    if (!flight) continue;

    if (flight.status === 'CANCELLED') {
      results[crew.flightNumber] = {
        rosterId: crew.rosterId,
        flightNumber: crew.flightNumber,
        dutyMinutes: 0,
        maxDutyMinutes: crew.maxDutyMinutes,
        maxDuty: crew.maxDutyMinutes,
        isFeasible: true,
        reason: 'Flight cancelled; crew released from duty.',
      };
      flight.crewDutyFeasible = true;
      continue;
    }

    const dutyStartMins = timeToMinutes(crew.dutyStartTime);
    const flightActualArrMins = timeToMinutes(flight.actualArrival);
    // Crew duty runs from duty_start until arrival per official dataset
    const dutyEndMins = flightActualArrMins;

    let accumulatedDutyMins = dutyEndMins - dutyStartMins;
    if (accumulatedDutyMins < 0) {
      // Overnight wrap-around if any
      accumulatedDutyMins += 24 * 60;
    }

    const isFeasible = accumulatedDutyMins <= crew.maxDutyMinutes;
    let reason: string | undefined = undefined;

    if (!isFeasible) {
      const breachMins = accumulatedDutyMins - crew.maxDutyMinutes;
      reason = `Crew Duty Limit Exceeded: Accumulated duty time of ${Math.floor(accumulatedDutyMins / 60)}h ${accumulatedDutyMins % 60}m exceeds maximum permissible FDP of ${crew.maxDutyMinutes / 60}h 00m by ${breachMins} minutes (DGCA CAR Section 7 Series J). Operation illegal without standby crew relief.`;
      flight.crewDutyFeasible = false;
      flight.crewDutyReason = reason;
    } else {
      flight.crewDutyFeasible = true;
    }

    results[crew.flightNumber] = {
      rosterId: crew.rosterId,
      flightNumber: crew.flightNumber,
      dutyMinutes: accumulatedDutyMins,
      maxDutyMinutes: crew.maxDutyMinutes,
      maxDuty: crew.maxDutyMinutes,
      isFeasible,
      reason,
    };
  }

  return results;
}
