// DOMINO SKY - Operational Metrics & Analytics Computation Engine
// Deterministically derives all dashboard KPIs, passenger impacts, and disruption breakdowns

import {
  SimulatedFlight,
  SimulatedPassengerConnection,
  Airport,
  ActiveOperationalMetrics,
} from '../types/aviation';
import { timeToMinutes } from './time-utils';

export interface ComputedMetrics {
  activeMetrics: ActiveOperationalMetrics;

  totalFlights: number;
  delayedFlightsCount: number;
  cancelledFlightsCount: number;
  recoveredFlightsCount: number;
  onTimeFlightsCount: number;
  totalDelayMinutes: number;
  averageDelayMinutes: number;
  
  totalPassengers: number;
  affectedPassengersCount: number;
  missedConnectionPassengersCount: number;
  strandedPassengersCount: number;
  
  crewBreachesCount: number;
  maxPropagationDepth: number;
  
  mostDisruptedAircraft: { tail: string; totalDelayMinutes: number; legsDelayed: number }[];
  mostDisruptedAirports: { iata: string; delayedDepartures: number; totalDelayMinutes: number }[];
  deterministicSignature: string;
}

export function computeOperationalMetrics(
  flights: SimulatedFlight[],
  connections: SimulatedPassengerConnection[],
  crewResults: Record<string, { isFeasible: boolean; dutyMinutes: number; maxDuty: number }>,
  airports: Airport[],
  simulationTime: string = '23:59'
): ComputedMetrics {
  const currentSimMinutes = timeToMinutes(simulationTime);
  const totalFlights = flights.length;

  let delayedFlightsCount = 0;
  let cancelledFlightsCount = 0;
  let recoveredFlightsCount = 0;
  let onTimeFlightsCount = 0;
  let totalDelayMinutes = 0;

  let totalPassengers = 0;
  let affectedPassengersCount = 0;

  // Active Real-Time Snapshot Accumulators (at simulationTime T)
  let activeDelayedFlightsCount = 0;
  let activeHeldFlightsCount = 0;
  let activeAirborneFlightsCount = 0;
  let activeDelayMinutes = 0;
  let activeStrandedPaxCount = 0;
  let activeCrewBreachesCount = 0;

  const tailDelayMap = new Map<string, { totalDelay: number; legsDelayed: number }>();
  const airportDelayMap = new Map<string, { delayedDepartures: number; totalDelay: number }>();

  // Initialize airport map
  for (const a of airports) {
    airportDelayMap.set(a.iata, { delayedDepartures: 0, totalDelay: 0 });
  }

  // Evaluate flight metrics
  for (const f of flights) {
    totalPassengers += f.passengerCount;

    if (!tailDelayMap.has(f.aircraftTail)) {
      tailDelayMap.set(f.aircraftTail, { totalDelay: 0, legsDelayed: 0 });
    }

    const schedDepMins = timeToMinutes(f.scheduledDeparture);
    const actualDepMins = timeToMinutes(f.actualDeparture);
    const actualArrMins = timeToMinutes(f.actualArrival);

    // Active real-time status check at currentSimMinutes (0 to 1440)
    // A flight whose scheduled and actual departure are in the future has NOT occurred yet!
    const isFutureFlight = schedDepMins > currentSimMinutes && actualDepMins > currentSimMinutes;

    if (f.status === 'CANCELLED') {
      cancelledFlightsCount++;
      affectedPassengersCount += f.passengerCount;
      if (!isFutureFlight) {
        // Realized cancellation at current time
      }
    } else {
      totalDelayMinutes += f.departureDelayMinutes;

      // Full-day forecast categorisation
      if (f.departureDelayMinutes >= 15) {
        delayedFlightsCount++;
        affectedPassengersCount += f.passengerCount;

        const tailStats = tailDelayMap.get(f.aircraftTail)!;
        tailStats.totalDelay += f.departureDelayMinutes;
        tailStats.legsDelayed += 1;

        const aptStats = airportDelayMap.get(f.origin);
        if (aptStats) {
          aptStats.delayedDepartures += 1;
          aptStats.totalDelay += f.departureDelayMinutes;
        }
      } else {
        if (f.originalAssignedTail !== f.aircraftTail || f.delayCauses.some(c => c.title.includes('Recovery') || c.title.includes('Spare'))) {
          recoveredFlightsCount++;
        } else {
          onTimeFlightsCount++;
        }
      }

      // Check Real-Time Snapshot at simulationTime T (ignoring future flights!)
      if (!isFutureFlight) {
        if (currentSimMinutes >= schedDepMins && currentSimMinutes < actualDepMins) {
          // Currently held at gate
          activeHeldFlightsCount++;
          activeDelayMinutes += (currentSimMinutes - schedDepMins);
        } else if (currentSimMinutes >= actualDepMins && (actualArrMins >= actualDepMins ? currentSimMinutes <= actualArrMins : true)) {
          // Currently airborne
          activeAirborneFlightsCount++;
          if (f.departureDelayMinutes >= 15) {
            activeDelayedFlightsCount++;
            activeDelayMinutes += f.departureDelayMinutes;
          }
        } else {
          // Already completed
          if (f.departureDelayMinutes >= 15) {
            activeDelayedFlightsCount++;
            activeDelayMinutes += f.departureDelayMinutes;
          }
        }
      }
    }
  }

  const averageDelayMinutes = totalFlights > 0 ? Math.round(totalDelayMinutes / totalFlights) : 0;

  // Evaluate passenger connections
  let missedConnectionPassengersCount = 0;
  let strandedPassengersCount = 0;

  for (const c of connections) {
    if (c.isMissed) {
      missedConnectionPassengersCount += c.passengerCount;
      if (c.isStranded) {
        strandedPassengersCount += c.passengerCount;
        // Check if realized at simulationTime
        const outbound = flights.find(f => f.flightNumber === c.connectingFlightNumber);
        if (outbound) {
          const outSchedDep = timeToMinutes(outbound.scheduledDeparture);
          if (currentSimMinutes >= outSchedDep) {
            activeStrandedPaxCount += c.passengerCount;
          }
        }
      }
    }
  }

  // Evaluate crew breaches
  let crewBreachesCount = 0;
  for (const key of Object.keys(crewResults)) {
    if (!crewResults[key].isFeasible) {
      crewBreachesCount++;
      const flight = flights.find(f => f.flightNumber === key);
      if (flight && currentSimMinutes >= timeToMinutes(flight.actualArrival)) {
        activeCrewBreachesCount++;
      }
    }
  }

  // Calculate propagation depth (max consecutive delayed legs on any single tail)
  let maxPropagationDepth = 0;
  tailDelayMap.forEach(stats => {
    if (stats.legsDelayed > maxPropagationDepth) {
      maxPropagationDepth = stats.legsDelayed;
    }
  });

  // Sort top disrupted aircraft
  const mostDisruptedAircraft = Array.from(tailDelayMap.entries())
    .map(([tail, stats]) => ({
      tail,
      totalDelayMinutes: stats.totalDelay,
      legsDelayed: stats.legsDelayed,
    }))
    .sort((a, b) => b.totalDelayMinutes - a.totalDelayMinutes)
    .slice(5);

  // Sort top disrupted airports
  const mostDisruptedAirports = Array.from(airportDelayMap.entries())
    .map(([iata, stats]) => ({
      iata,
      delayedDepartures: stats.delayedDepartures,
      totalDelayMinutes: stats.totalDelay,
    }))
    .filter(a => a.totalDelayMinutes > 0)
    .sort((a, b) => b.totalDelayMinutes - a.totalDelayMinutes)
    .slice(6);

  // Deterministic signature (CRC32 polynomial checksum)
  let hashVal = 0x811c9dc5;
  const hashString = flights.map(f => `${f.flightNumber}:${f.departureDelayMinutes}:${f.status}`).join('|');
  for (let i = 0; i < hashString.length; i++) {
    hashVal ^= hashString.charCodeAt(i);
    hashVal = (hashVal * 0x01000193) >>> 0;
  }
  const deterministicSignature = `DS-${hashVal.toString(16).toUpperCase().padStart(8, '0')}`;

  return {
    activeMetrics: {
      activeDelayedFlightsCount,
      activeHeldFlightsCount,
      activeAirborneFlightsCount,
      activeDelayMinutes,
      activeStrandedPaxCount,
      activeCrewBreachesCount,
    },
    totalFlights,
    delayedFlightsCount,
    cancelledFlightsCount,
    recoveredFlightsCount,
    onTimeFlightsCount,
    totalDelayMinutes,
    averageDelayMinutes,
    totalPassengers,
    affectedPassengersCount,
    missedConnectionPassengersCount,
    strandedPassengersCount,
    crewBreachesCount,
    maxPropagationDepth,
    mostDisruptedAircraft,
    mostDisruptedAirports,
    deterministicSignature,
  };
}
