// DOMINO SKY - Dataset Importer, Exporter & Schema Validator
// Handles structured import/export of Airports, Flights, Aircraft, Connections, Crew, and Spares in JSON & CSV formats

import {
  Airport,
  Flight,
  Aircraft,
  PassengerConnection,
  CrewAssignment,
} from '../types/aviation';
import {
  OFFICIAL_AIRPORTS,
  OFFICIAL_FLIGHTS,
  OFFICIAL_AIRCRAFT,
  OFFICIAL_CONNECTIONS,
  OFFICIAL_CREW_ASSIGNMENTS,
  OFFICIAL_SPARES,
} from '../data/official-dataset';

export interface CompleteDatasetPackage {
  version: string;
  metadata: {
    airline: string;
    description: string;
    totalAirports: number;
    totalFlights: number;
    totalAircraft: number;
    totalSpares: number;
    totalConnections: number;
    totalCrewAssignments: number;
  };
  airports: Airport[];
  aircraft: Aircraft[];
  spares: Aircraft[];
  flights: Flight[];
  connections: PassengerConnection[];
  crew: CrewAssignment[];
}

export function exportUnifiedDatasetJSON(): string {
  const pkg: CompleteDatasetPackage = {
    version: '1.0.0',
    metadata: {
      airline: 'DOMINO SKY (IndiGo Fleet Network Model)',
      description: '16 Airports, 70 Flights, 16 Aircraft Rotations, Spares, Connections & Crew',
      totalAirports: OFFICIAL_AIRPORTS.length,
      totalFlights: OFFICIAL_FLIGHTS.length,
      totalAircraft: OFFICIAL_AIRCRAFT.length,
      totalSpares: OFFICIAL_SPARES.length,
      totalConnections: OFFICIAL_CONNECTIONS.length,
      totalCrewAssignments: OFFICIAL_CREW_ASSIGNMENTS.length,
    },
    airports: OFFICIAL_AIRPORTS,
    aircraft: OFFICIAL_AIRCRAFT,
    spares: OFFICIAL_SPARES,
    flights: OFFICIAL_FLIGHTS,
    connections: OFFICIAL_CONNECTIONS,
    crew: OFFICIAL_CREW_ASSIGNMENTS,
  };

  return JSON.stringify(pkg, null, 2);
}

export function exportFlightsCSV(flights: Flight[] = OFFICIAL_FLIGHTS): string {
  const headers = [
    'flightNumber',
    'aircraftTail',
    'origin',
    'destination',
    'scheduledDeparture',
    'scheduledArrival',
    'scheduledDurationMinutes',
    'rotationSequence',
    'passengerCount',
    'connectingPassengersCount',
  ];

  const rows = flights.map(f => [
    f.flightNumber,
    f.aircraftTail,
    f.origin,
    f.destination,
    f.scheduledDeparture,
    f.scheduledArrival,
    f.scheduledDurationMinutes,
    f.rotationSequence,
    f.passengerCount,
    f.connectingPassengersCount,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function parseFlightsCSV(csvText: string): Flight[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const flights: Flight[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx];
    });

    flights.push({
      flightNumber: rowObj.flightNumber,
      aircraftTail: rowObj.aircraftTail,
      origin: rowObj.origin,
      destination: rowObj.destination,
      scheduledDeparture: rowObj.scheduledDeparture,
      scheduledArrival: rowObj.scheduledArrival,
      scheduledDurationMinutes: Number(rowObj.scheduledDurationMinutes) || 120,
      rotationSequence: Number(rowObj.rotationSequence) || 1,
      passengerCount: Number(rowObj.passengerCount) || 160,
      connectingPassengersCount: Number(rowObj.connectingPassengersCount) || 20,
    });
  }

  return flights;
}

export function parseUnifiedDatasetJSON(jsonText: string): {
  success: boolean;
  data?: CompleteDatasetPackage;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed.airports) || !Array.isArray(parsed.flights)) {
      return { success: false, error: 'JSON missing required "airports" or "flights" arrays.' };
    }
    return { success: true, data: parsed as CompleteDatasetPackage };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Invalid JSON syntax: ${msg}` };
  }
}
