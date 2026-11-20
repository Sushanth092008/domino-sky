// DOMINO SKY - Passenger Connection Evaluation Engine
// Evaluates connecting itineraries, minimum connection times (MCT), and stranded passenger outcomes

import { PassengerConnection, SimulatedFlight, SimulatedPassengerConnection } from '../types/aviation';
import { timeToMinutes } from './time-utils';

export function evaluatePassengerConnections(
  simulatedFlights: SimulatedFlight[],
  connections: PassengerConnection[]
): SimulatedPassengerConnection[] {
  const flightMap = new Map<string, SimulatedFlight>(simulatedFlights.map(f => [f.flightNumber, f]));

  return connections.map(conn => {
    const inbound = flightMap.get(conn.inboundFlightNumber);
    const outbound = flightMap.get(conn.connectingFlightNumber);

    if (!inbound || !outbound) {
      return {
        connectionId: conn.connectionId,
        inboundFlightNumber: conn.inboundFlightNumber,
        connectingFlightNumber: conn.connectingFlightNumber,
        hubAirport: conn.hubAirport,
        passengerCount: conn.passengerCount,
        actualLayoverMinutes: conn.scheduledLayoverMinutes,
        minimumConnectionTimeMinutes: conn.minimumConnectionTimeMinutes,
        isMissed: false,
        isStranded: false,
        reason: 'Flight data not found',
      };
    }

    // If either flight is cancelled
    if (inbound.status === 'CANCELLED' || outbound.status === 'CANCELLED') {
      return {
        connectionId: conn.connectionId,
        inboundFlightNumber: conn.inboundFlightNumber,
        connectingFlightNumber: conn.connectingFlightNumber,
        hubAirport: conn.hubAirport,
        passengerCount: conn.passengerCount,
        actualLayoverMinutes: 0,
        minimumConnectionTimeMinutes: conn.minimumConnectionTimeMinutes,
        isMissed: true,
        isStranded: conn.isLastDailyConnectingLeg,
        reason: inbound.status === 'CANCELLED' ? `Inbound ${inbound.flightNumber} was cancelled` : `Connecting flight ${outbound.flightNumber} was cancelled`,
      };
    }

    const inboundArrMins = timeToMinutes(inbound.actualArrival);
    const outboundDepMins = timeToMinutes(outbound.actualDeparture);

    const actualLayover = outboundDepMins - inboundArrMins;
    const isMissed = actualLayover < conn.minimumConnectionTimeMinutes;
    const isStranded = isMissed && conn.isLastDailyConnectingLeg;

    let reason: string | undefined = undefined;
    if (isMissed) {
      reason = `Inbound ${inbound.flightNumber} arrived at ${inbound.actualArrival} (${inbound.arrivalDelayMinutes}m delay). Actual layover window is ${actualLayover}m, which is below the minimum required connection time of ${conn.minimumConnectionTimeMinutes}m at ${conn.hubAirport}.`;
      if (isStranded) {
        reason += ` No subsequent departures available today; ${conn.passengerCount} passengers stranded overnight.`;
      }
    }

    return {
      connectionId: conn.connectionId,
      inboundFlightNumber: conn.inboundFlightNumber,
      connectingFlightNumber: conn.connectingFlightNumber,
      hubAirport: conn.hubAirport,
      passengerCount: conn.passengerCount,
      actualLayoverMinutes: actualLayover,
      minimumConnectionTimeMinutes: conn.minimumConnectionTimeMinutes,
      isMissed,
      isStranded,
      reason,
    };
  });
}
