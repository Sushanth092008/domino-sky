// DOMINO SKY - Aircraft Rotation Propagation Engine
// Models sequential turnarounds and cascading delay ripple through an aircraft's daily rotation

import { Flight, SimulatedFlight, Airport, DisruptionInput, DelayStepReason } from '../types/aviation';
import { timeToMinutes, minutesToTime } from './time-utils';
import { evaluateAirportClosureImpact } from './airport-closure';

export function propagateAircraftRotations(
  flights: Flight[],
  airports: Airport[],
  disruption: DisruptionInput | null,
  cancelledFlightNumbers: Set<string> = new Set(),
  tailOverrides: Map<string, string> = new Map(), // flightNumber -> newTailNumber
  forcedDepDelays: Map<string, number> = new Map() // flightNumber -> extra delay in mins (e.g. connection hold)
): SimulatedFlight[] {
  const airportMap = new Map<string, Airport>(airports.map(a => [a.iata, a]));
  
  // Group flights by aircraft tail (accounting for tail reassignments)
  const tailFlightMap = new Map<string, Flight[]>();
  for (const f of flights) {
    const tail = tailOverrides.get(f.flightNumber) || f.aircraftTail;
    if (!tailFlightMap.has(tail)) {
      tailFlightMap.set(tail, []);
    }
    tailFlightMap.get(tail)!.push(f);
  }

  const simulatedFlights: SimulatedFlight[] = [];

  // Process each aircraft rotation independently
  tailFlightMap.forEach((tailFlights, currentTail) => {
    // Sort chronologically by scheduled departure / rotation sequence
    tailFlights.sort((a, b) => timeToMinutes(a.scheduledDeparture) - timeToMinutes(b.scheduledDeparture));

    let previousLeg: SimulatedFlight | null = null;

    for (let i = 0; i < tailFlights.length; i++) {
      const flight = tailFlights[i];
      const isCancelled = cancelledFlightNumbers.has(flight.flightNumber);
      const originAirport = airportMap.get(flight.origin);
      const minTurnaround = originAirport?.minTurnaroundMinutes || 30;

      const schedDepMins = timeToMinutes(flight.scheduledDeparture);
      const schedArrMins = timeToMinutes(flight.scheduledArrival);
      const duration = flight.scheduledDurationMinutes;

      // Check direct airport closure impact
      const closureImpact = evaluateAirportClosureImpact(flight, disruption);
      const delayCauses: DelayStepReason[] = [];

      let directClosureDelay = 0;
      if (closureImpact.isOriginClosed) {
        directClosureDelay = Math.max(directClosureDelay, closureImpact.departureHoldMinutes);
        delayCauses.push({
          step: delayCauses.length + 1,
          flightNumber: flight.flightNumber,
          title: `Direct Airport Closure (${flight.origin})`,
          explanation: closureImpact.closureReason,
          location: flight.origin,
          impactMinutes: directClosureDelay,
        });
      }

      if (closureImpact.isDestinationClosed) {
        directClosureDelay = Math.max(directClosureDelay, closureImpact.arrivalHoldMinutes);
        delayCauses.push({
          step: delayCauses.length + 1,
          flightNumber: flight.flightNumber,
          title: `Destination Inflow Ground Halt (${flight.destination})`,
          explanation: closureImpact.closureReason,
          location: flight.origin,
          impactMinutes: directClosureDelay,
        });
      }

      // Check rotational delay from previous leg
      let rotationalDelay = 0;
      let prevFlightNum: string | undefined = undefined;

      if (previousLeg && previousLeg.status !== 'CANCELLED') {
        prevFlightNum = previousLeg.flightNumber;
        const prevActualArrMins = timeToMinutes(previousLeg.actualArrival);
        const earliestFeasibleDep = prevActualArrMins + minTurnaround;

        if (earliestFeasibleDep > schedDepMins) {
          rotationalDelay = earliestFeasibleDep - schedDepMins;
          delayCauses.push({
            step: delayCauses.length + 1,
            flightNumber: flight.flightNumber,
            title: `Rotational Turnaround Lag (Tail ${currentTail})`,
            explanation: `Inbound flight ${previousLeg.flightNumber} landed at ${previousLeg.actualArrival} (${previousLeg.arrivalDelayMinutes}m late). Required turnaround buffer of ${minTurnaround}m pushed earliest ready departure to ${minutesToTime(earliestFeasibleDep)}.`,
            location: flight.origin,
            impactMinutes: rotationalDelay,
          });
        }
      }

      // Check any intentional connection hold or recovery buffer
      const extraHold = forcedDepDelays.get(flight.flightNumber) || 0;
      if (extraHold > 0) {
        delayCauses.push({
          step: delayCauses.length + 1,
          flightNumber: flight.flightNumber,
          title: `Tactical Connection Protection Hold`,
          explanation: `Flight held at gate for ${extraHold}m to protect critical connecting passengers.`,
          location: flight.origin,
          impactMinutes: extraHold,
        });
      }

      // Net departure delay is the maximum constraint
      const totalDepDelay = Math.max(directClosureDelay, rotationalDelay) + extraHold;
      const actualDepMins = schedDepMins + totalDepDelay;
      const actualArrMins = actualDepMins + duration;
      const totalArrDelay = actualArrMins - schedArrMins;

      // Status determination
      let status: SimulatedFlight['status'] = 'ON_TIME';
      if (isCancelled) {
        status = 'CANCELLED';
      } else if (totalDepDelay >= 15) {
        status = 'DELAYED';
      }

      const simFlight: SimulatedFlight = {
        flightNumber: flight.flightNumber,
        aircraftTail: currentTail,
        originalAssignedTail: flight.aircraftTail,
        origin: flight.origin,
        destination: flight.destination,
        scheduledDeparture: flight.scheduledDeparture,
        scheduledArrival: flight.scheduledArrival,
        scheduledDurationMinutes: flight.scheduledDurationMinutes,
        actualDeparture: isCancelled ? flight.scheduledDeparture : minutesToTime(actualDepMins),
        actualArrival: isCancelled ? flight.scheduledArrival : minutesToTime(actualArrMins),
        departureDelayMinutes: isCancelled ? 0 : totalDepDelay,
        arrivalDelayMinutes: isCancelled ? 0 : totalArrDelay,
        status,
        rotationSequence: flight.rotationSequence,
        passengerCount: flight.passengerCount,
        connectingPassengersCount: flight.connectingPassengersCount,
        crewDutyFeasible: true, // evaluated next by crew-constraints
        delayCauses,
        isDirectlyDisrupted: closureImpact.isOriginClosed || closureImpact.isDestinationClosed,
        inheritedDelayFromTail: rotationalDelay > 0 ? currentTail : undefined,
        previousFlightNumber: prevFlightNum,
        turnaroundTimeMinutes: previousLeg ? timeToMinutes(isCancelled ? flight.scheduledDeparture : minutesToTime(actualDepMins)) - timeToMinutes(previousLeg.actualArrival) : minTurnaround,
        minimumTurnaroundRequired: minTurnaround,
      };

      simulatedFlights.push(simFlight);
      previousLeg = simFlight;
    }
  });

  return simulatedFlights;
}
