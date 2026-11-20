// DOMINO SKY - Operational Recovery Action Engine
// Validates, evaluates, and executes airline recovery strategies: Spare Injection, Cancellation, Aircraft Swap, Connection Hold

import { RecoveryAction, Flight, Aircraft } from '../types/aviation';
import { timeToMinutes } from './time-utils';

export interface RecoveryPlanState {
  cancelledFlightNumbers: Set<string>;
  tailOverrides: Map<string, string>; // flightNumber -> newTailNumber
  forcedDepDelays: Map<string, number>; // flightNumber -> extra hold minutes
}

export function validateRecoveryAction(
  action: RecoveryAction,
  flights: Flight[],
  spares: Aircraft[]
): { isFeasible: boolean; reason?: string } {
  const flight = flights.find(f => f.flightNumber === action.targetFlightNumber);
  if (!flight) {
    return { isFeasible: false, reason: `Flight ${action.targetFlightNumber} does not exist in the schedule.` };
  }

  switch (action.type) {
    case 'ASSIGN_SPARE': {
      if (!action.spareTailNumber) {
        return { isFeasible: false, reason: 'No spare aircraft tail specified.' };
      }
      const spare = spares.find(s => s.tailNumber === action.spareTailNumber);
      if (!spare) {
        return { isFeasible: false, reason: `Spare aircraft ${action.spareTailNumber} not registered in active spare fleet.` };
      }

      // Check spare physical location vs flight origin
      if (spare.currentAirport !== flight.origin) {
        return {
          isFeasible: false,
          reason: `Spare aircraft ${spare.tailNumber} is stationed at ${spare.currentAirport}, but flight ${flight.flightNumber} departs from ${flight.origin}. Ferrying not possible in time.`,
        };
      }

      // Check spare availability time
      if (spare.availableFromTime) {
        const spareReadyMins = timeToMinutes(spare.availableFromTime);
        const schedDepMins = timeToMinutes(flight.scheduledDeparture);
        if (spareReadyMins > schedDepMins + 60) {
          return {
            isFeasible: false,
            reason: `Spare ${spare.tailNumber} is only available after ${spare.availableFromTime}, too late for ${flight.flightNumber} (${flight.scheduledDeparture}).`,
          };
        }
      }

      return { isFeasible: true };
    }

    case 'CANCEL_FLIGHT': {
      // Cancellation is always operationally feasible, but checked for passenger impact
      return { isFeasible: true };
    }

    case 'AIRCRAFT_SWAP': {
      if (!action.swapWithFlightNumber) {
        return { isFeasible: false, reason: 'Swap flight not specified.' };
      }
      const swapFlight = flights.find(f => f.flightNumber === action.swapWithFlightNumber);
      if (!swapFlight) {
        return { isFeasible: false, reason: `Target swap flight ${action.swapWithFlightNumber} not found.` };
      }
      if (swapFlight.origin !== flight.origin) {
        return {
          isFeasible: false,
          reason: `Both flights must be present at the same airport (${flight.origin} vs ${swapFlight.origin}) for an aircraft tail swap.`,
        };
      }
      return { isFeasible: true };
    }

    case 'CONNECTION_PROTECT_HOLD': {
      const hold = action.holdMinutes || 15;
      if (hold > 30) {
        return { isFeasible: false, reason: 'Gate hold exceeding 30 minutes risks severe downstream crew duty breaches.' };
      }
      return { isFeasible: true };
    }

    default:
      return { isFeasible: false, reason: 'Unknown recovery action type.' };
  }
}

export function buildRecoveryPlanState(
  actions: RecoveryAction[],
  flights: Flight[]
): RecoveryPlanState {
  const cancelledFlightNumbers = new Set<string>();
  const tailOverrides = new Map<string, string>();
  const forcedDepDelays = new Map<string, number>();

  for (const action of actions) {
    if (!action.isFeasible) continue;

    if (action.type === 'CANCEL_FLIGHT') {
      cancelledFlightNumbers.add(action.targetFlightNumber);
    } else if (action.type === 'ASSIGN_SPARE' && action.spareTailNumber) {
      // When spare is assigned, target flight and all its downstream legs on that rotation are reassigned to spare tail
      const targetFlight = flights.find(f => f.flightNumber === action.targetFlightNumber);
      if (targetFlight) {
        const downstreamLegs = flights.filter(
          f => f.aircraftTail === targetFlight.aircraftTail && f.rotationSequence >= targetFlight.rotationSequence
        );
        for (const leg of downstreamLegs) {
          tailOverrides.set(leg.flightNumber, action.spareTailNumber);
        }
      }
    } else if (action.type === 'AIRCRAFT_SWAP' && action.swapWithFlightNumber) {
      const f1 = flights.find(f => f.flightNumber === action.targetFlightNumber);
      const f2 = flights.find(f => f.flightNumber === action.swapWithFlightNumber);
      if (f1 && f2) {
        tailOverrides.set(f1.flightNumber, f2.aircraftTail);
        tailOverrides.set(f2.flightNumber, f1.aircraftTail);
      }
    } else if (action.type === 'CONNECTION_PROTECT_HOLD' && action.holdMinutes) {
      forcedDepDelays.set(action.targetFlightNumber, action.holdMinutes);
    }
  }

  return {
    cancelledFlightNumbers,
    tailOverrides,
    forcedDepDelays,
  };
}
