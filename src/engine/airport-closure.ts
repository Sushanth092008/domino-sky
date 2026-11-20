// DOMINO SKY - Airport Closure & Direct Disruption Rules

import { DisruptionInput, Flight } from '../types/aviation';
import { timeToMinutes } from './time-utils';

export interface AirportClosureImpact {
  flightNumber: string;
  isOriginClosed: boolean;
  isDestinationClosed: boolean;
  departureHoldMinutes: number;
  arrivalHoldMinutes: number;
  closureReason: string;
}

export function evaluateAirportClosureImpact(
  flight: Flight,
  disruption: DisruptionInput | null
): AirportClosureImpact {
  const result: AirportClosureImpact = {
    flightNumber: flight.flightNumber,
    isOriginClosed: false,
    isDestinationClosed: false,
    departureHoldMinutes: 0,
    arrivalHoldMinutes: 0,
    closureReason: '',
  };

  if (!disruption) return result;

  const disruptionStart = timeToMinutes(disruption.startTime);
  const disruptionEnd = disruptionStart + disruption.durationMinutes;

  const schedDep = timeToMinutes(flight.scheduledDeparture);
  const schedArr = timeToMinutes(flight.scheduledArrival);

  // 1. Origin Airport Closure
  // If flight departs from the disrupted airport and scheduled departure falls during or right before closure
  if (flight.origin === disruption.airport) {
    if (schedDep >= disruptionStart && schedDep < disruptionEnd) {
      result.isOriginClosed = true;
      // Aircraft cannot depart until closure lifts
      result.departureHoldMinutes = disruptionEnd - schedDep;
      result.closureReason = `${disruption.airport} closed due to ${disruption.type.replace('_', ' ')} (${disruption.startTime} - ${disruption.durationMinutes}m). Gate held until closure lifted.`;
    }
  }

  // 2. Destination Airport Closure
  // If flight arrives at the disrupted airport while it is closed
  if (flight.destination === disruption.airport) {
    if (schedArr >= disruptionStart && schedArr < disruptionEnd) {
      result.isDestinationClosed = true;
      // Pre-flight ground delay program (GDP): held at origin so it does not divert/hold excessively
      const earliestPermittedArrival = disruptionEnd;
      const requiredDepDelay = earliestPermittedArrival - schedArr;
      result.arrivalHoldMinutes = requiredDepDelay;
      result.closureReason = `Air Traffic Control Ground Delay Program (GDP): ${disruption.airport} closed for arrivals until ${disruptionEnd}. Departure delayed at ${flight.origin} to absorb delay on the ground.`;
    }
  }

  return result;
}
