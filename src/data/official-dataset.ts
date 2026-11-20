// DOMINO SKY - Official Airline Dataset (Single Source of Truth)
// Loaded directly from flight_network.json provided by event organisers
// 16 Airports | 70 Flights | 16 Operating Aircraft | 2 Standby Spares | 21 Connections | 16 Crews

import rawNetworkData from './flight_network.json';
import { Airport, Aircraft, Flight, PassengerConnection, CrewAssignment } from '../types/aviation';
import { timeToMinutes } from '../engine/time-utils';

export const RAW_FLIGHT_NETWORK = rawNetworkData;

const ICAO_CODES: Record<string, string> = {
  DEL: 'VIDP',
  BOM: 'VABB',
  BLR: 'VOBL',
  HYD: 'VOHS',
  MAA: 'VOMM',
  CCU: 'VECC',
  AMD: 'VAAH',
  COK: 'VOCI',
  GOI: 'VAGO',
  PNQ: 'VAPO',
  JAI: 'VIJP',
  GAU: 'VEGT',
  LKO: 'VILK',
  IXC: 'VICG',
  BBI: 'VEBS',
  TRV: 'VOTV',
};

// 1. OFFICIAL AIRPORTS (16)
export const OFFICIAL_AIRPORTS: Airport[] = rawNetworkData.airports.map(a => ({
  iata: a.id,
  icao: ICAO_CODES[a.id] || `V${a.id}`,
  name: a.name,
  city: a.city,
  lat: a.lat,
  lng: a.lng,
  isHub: a.tier === 'mega_hub' || a.tier === 'regional_hub',
  minTurnaroundMinutes: rawNetworkData.meta.min_turnaround_minutes || 30,
  minConnectionMinutes: 45,
  timezone: 'Asia/Kolkata',
}));

// Pre-index flights by flight_id
const rawFlightMap = new Map(rawNetworkData.flights.map(f => [f.flight_id, f]));

// Compute connecting passengers per inbound flight
const connectingPaxMap = new Map<string, number>();
for (const conn of rawNetworkData.connections) {
  const current = connectingPaxMap.get(conn.from_flight) || 0;
  connectingPaxMap.set(conn.from_flight, current + conn.passengers);
}

// 2. OFFICIAL FLIGHTS (70)
export const OFFICIAL_FLIGHTS: Flight[] = rawNetworkData.flights.map(f => ({
  flightNumber: f.flight_id,
  aircraftTail: f.tail_id,
  origin: f.origin,
  destination: f.destination,
  scheduledDeparture: f.dep,
  scheduledArrival: f.arr,
  scheduledDurationMinutes: f.block_minutes,
  rotationSequence: f.leg_order,
  passengerCount: f.pax,
  connectingPassengersCount: connectingPaxMap.get(f.flight_id) || 0,
}));

// Group flights by tail to determine base airport & max leg sequence
const flightsByTail = new Map<string, typeof rawNetworkData.flights>();
for (const f of rawNetworkData.flights) {
  if (!flightsByTail.has(f.tail_id)) {
    flightsByTail.set(f.tail_id, []);
  }
  flightsByTail.get(f.tail_id)!.push(f);
}

// 3. OFFICIAL OPERATING AIRCRAFT (16)
export const OFFICIAL_AIRCRAFT: Aircraft[] = Array.from(flightsByTail.entries()).map(([tail, legs]) => {
  legs.sort((a, b) => a.leg_order - b.leg_order);
  const baseAirport = legs[0].origin;

  return {
    tailNumber: tail,
    model: 'A320neo',
    capacity: rawNetworkData.meta.seats_per_aircraft || 180,
    baseAirport,
    currentAirport: baseAirport,
    isSpare: false,
    status: 'ACTIVE',
  };
});

// 4. OFFICIAL SPARE AIRCRAFT (2: VT-DS17 at BLR, VT-DS18 at DEL)
export const OFFICIAL_SPARES: Aircraft[] = rawNetworkData.spare_aircraft.map(s => ({
  tailNumber: s.tail_id,
  model: 'A320neo',
  capacity: s.seats || 180,
  baseAirport: s.base,
  currentAirport: s.base,
  isSpare: true,
  status: 'SPARE_STANDBY',
  availableFromTime: s.available_from || '05:00',
}));

// 5. OFFICIAL PASSENGER CONNECTIONS (21)
export const OFFICIAL_CONNECTIONS: PassengerConnection[] = rawNetworkData.connections.map(c => {
  const inbound = rawFlightMap.get(c.from_flight);
  const outbound = rawFlightMap.get(c.to_flight);

  let scheduledLayoverMinutes = 60;
  if (inbound && outbound) {
    scheduledLayoverMinutes = timeToMinutes(outbound.dep) - timeToMinutes(inbound.arr);
  }

  // Determine if this is the last daily connecting leg
  let isLastDailyConnectingLeg = false;
  if (outbound) {
    const tailLegs = flightsByTail.get(outbound.tail_id) || [];
    isLastDailyConnectingLeg = outbound.leg_order === tailLegs.length;
  }

  return {
    connectionId: c.connection_id,
    inboundFlightNumber: c.from_flight,
    connectingFlightNumber: c.to_flight,
    hubAirport: c.airport,
    passengerCount: c.passengers,
    scheduledLayoverMinutes,
    minimumConnectionTimeMinutes: c.min_connect_minutes,
    isLastDailyConnectingLeg,
  };
});

// 6. OFFICIAL CREW ASSIGNMENTS (16)
// Map crew duty to each assigned flight in the rotation
export const OFFICIAL_CREW_ASSIGNMENTS: CrewAssignment[] = [];
for (const crew of rawNetworkData.crews) {
  for (const fId of crew.flight_ids) {
    OFFICIAL_CREW_ASSIGNMENTS.push({
      rosterId: `${crew.crew_id}-${fId}`,
      flightNumber: fId,
      captain: {
        id: `CAPT-${crew.crew_id}`,
        name: `Capt. ${crew.crew_id} Flight Ops`,
        role: 'CAPTAIN',
        baseAirport: crew.base,
      },
      firstOfficer: {
        id: `FO-${crew.crew_id}`,
        name: `FO ${crew.crew_id} First Officer`,
        role: 'FIRST_OFFICER',
        baseAirport: crew.base,
      },
      cabinLead: {
        id: `CC-${crew.crew_id}`,
        name: `Lead ${crew.crew_id} Purser`,
        role: 'CABIN_LEAD',
        baseAirport: crew.base,
      },
      dutyStartTime: crew.duty_start,
      maxDutyMinutes: crew.max_duty_mins || 600,
    });
  }
}
