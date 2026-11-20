// DOMINO SKY - Aviation Data Types & Operational Schemas

export interface Airport {
  iata: string; // 3-letter IATA code, e.g. BOM
  icao: string; // 4-letter ICAO code, e.g. VABB
  name: string;
  city: string;
  lat: number;
  lng: number;
  isHub: boolean;
  minTurnaroundMinutes: number; // typically 40-45 mins
  minConnectionMinutes: number; // MCT (Minimum Connection Time), 40-45 mins
  timezone: string; // 'Asia/Kolkata'
  elevationFt?: number;
}

export type AircraftType = 'A320neo' | 'A321neo';

export interface Aircraft {
  tailNumber: string; // e.g. VT-IND01
  model: AircraftType;
  capacity: number; // 186 for A320neo, 222 or 232 for A321neo
  baseAirport: string;
  isSpare: boolean;
  status: 'ACTIVE' | 'MAINTENANCE' | 'SPARE_STANDBY';
  currentAirport?: string;
  availableFromTime?: string; // e.g. '06:00'
}

export interface CrewMember {
  id: string;
  name: string;
  role: 'CAPTAIN' | 'FIRST_OFFICER' | 'CABIN_LEAD' | 'CABIN_CREW';
  baseAirport: string;
}

export interface CrewAssignment {
  rosterId: string;
  flightNumber: string;
  captain: CrewMember;
  firstOfficer: CrewMember;
  cabinLead: CrewMember;
  dutyStartTime: string; // HH:mm when duty commenced (usually 60m before 1st departure)
  maxDutyMinutes: number; // DGCA limit: usually 660 mins (11 hours) for domestic multi-sector
  accumulatedDutyMinutes?: number;
  isDutyFeasible?: boolean;
  dutyViolationReason?: string;
}

export interface Flight {
  flightNumber: string; // e.g. 6E-201
  aircraftTail: string; // e.g. VT-IND01
  origin: string; // IATA code
  destination: string; // IATA code
  scheduledDeparture: string; // 'HH:mm', e.g. '06:00'
  scheduledArrival: string; // 'HH:mm', e.g. '08:15'
  scheduledDurationMinutes: number;
  rotationSequence: number; // 1 to 5 for the aircraft's daily rotation
  passengerCount: number; // actual passengers booked
  connectingPassengersCount: number; // passengers on onward connections
}

export interface PassengerConnection {
  connectionId: string;
  inboundFlightNumber: string;
  connectingFlightNumber: string;
  hubAirport: string;
  passengerCount: number;
  scheduledLayoverMinutes: number;
  minimumConnectionTimeMinutes: number;
  isLastDailyConnectingLeg: boolean; // if missed, passengers become STRANDED
}

export type DisruptionType =
  | 'THUNDERSTORM'
  | 'HEAVY_RAIN'
  | 'AIRPORT_CLOSURE'
  | 'RUNWAY_CLOSURE'
  | 'ATC_RESTRICTION';

export type DisruptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DisruptionInput {
  id?: string;
  airport: string; // IATA code, e.g. BOM
  type: DisruptionType;
  startTime: string; // 'HH:mm', e.g. '14:00'
  durationMinutes: number; // e.g. 90
  severity: DisruptionSeverity;
  description?: string;
}

export type FlightStatus =
  | 'ON_TIME'
  | 'DELAYED'
  | 'HELD_AT_GATE'
  | 'AIRBORNE'
  | 'DIVERTED'
  | 'CANCELLED'
  | 'RECOVERED';

export interface DelayStepReason {
  step: number;
  flightNumber: string;
  title: string;
  explanation: string;
  location: string;
  impactMinutes: number;
}

export interface SimulatedFlight {
  flightNumber: string;
  aircraftTail: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  scheduledDurationMinutes: number;
  actualDeparture: string;
  actualArrival: string;
  departureDelayMinutes: number;
  arrivalDelayMinutes: number;
  status: FlightStatus;
  rotationSequence: number;
  passengerCount: number;
  connectingPassengersCount: number;
  crewDutyFeasible: boolean;
  crewDutyReason?: string;
  delayCauses: DelayStepReason[];
  isDirectlyDisrupted: boolean;
  inheritedDelayFromTail?: string;
  previousFlightNumber?: string;
  turnaroundTimeMinutes: number;
  minimumTurnaroundRequired: number;
  originalAssignedTail: string;
}

export interface SimulatedPassengerConnection {
  connectionId: string;
  inboundFlightNumber: string;
  connectingFlightNumber: string;
  hubAirport: string;
  passengerCount: number;
  actualLayoverMinutes: number;
  minimumConnectionTimeMinutes: number;
  isMissed: boolean;
  isStranded: boolean;
  reason?: string;
}

export interface ActiveOperationalMetrics {
  activeDelayedFlightsCount: number;
  activeHeldFlightsCount: number;
  activeAirborneFlightsCount: number;
  activeDelayMinutes: number;
  activeStrandedPaxCount: number;
  activeCrewBreachesCount: number;
}

export interface SimulationResult {
  simulationTime: string; // current scrub time or end of day '23:59'
  disruption: DisruptionInput | null;
  recoveryActionsApplied: RecoveryAction[];
  
  // Flights & State
  flights: SimulatedFlight[];
  connections: SimulatedPassengerConnection[];
  crewFeasibility: Record<string, { isFeasible: boolean; dutyMinutes: number; maxDuty: number; maxDutyMinutes?: number; reason?: string }>;
  
  // Active real-time snapshot at simulationTime
  activeMetrics: ActiveOperationalMetrics;

  // Full-day Projected Forecast KPIs
  totalFlights: number; // 70
  delayedFlightsCount: number;
  cancelledFlightsCount: number;
  recoveredFlightsCount: number;
  onTimeFlightsCount: number;
  totalDelayMinutes: number;
  averageDelayMinutes: number;
  
  // Passenger KPIs
  totalPassengers: number;
  affectedPassengersCount: number;
  missedConnectionPassengersCount: number;
  strandedPassengersCount: number;
  
  // Crew KPIs
  crewBreachesCount: number;
  
  // Propagation Metrics
  maxPropagationDepth: number; // how many downstream legs were infected
  mostDisruptedAircraft: { tail: string; totalDelayMinutes: number; legsDelayed: number }[];
  mostDisruptedAirports: { iata: string; delayedDepartures: number; totalDelayMinutes: number }[];
  
  // Audit & Deterministic Hash
  timestamp: string;
  deterministicSignature: string;
}

export type RecoveryActionType =
  | 'ASSIGN_SPARE'
  | 'CANCEL_FLIGHT'
  | 'AIRCRAFT_SWAP'
  | 'CONNECTION_PROTECT_HOLD';

export interface RecoveryAction {
  id: string;
  type: RecoveryActionType;
  title: string;
  description: string;
  targetFlightNumber: string;
  spareTailNumber?: string;
  swapWithFlightNumber?: string;
  holdMinutes?: number;
  justification: string;
  
  // Feasibility check
  isFeasible: boolean;
  infeasibilityReason?: string;
  
  // Deterministic impact evaluated by engine
  evaluatedImpact?: {
    delayMinutesSaved: number;
    strandedPaxSaved: number;
    missedConnectionsSaved: number;
    crewBreachesAvoided: number;
    netDelayedFlightsChange: number;
  };
}

export interface ComparisonMetrics {
  metric: string;
  baseline: number | string;
  recovered: number | string;
  delta: number | string;
  improved: boolean;
}

export interface TimelineEvent {
  time: string; // 'HH:mm'
  type: 'DISRUPTION_START' | 'CLOSURE_START' | 'CLOSURE_END' | 'FLIGHT_DELAYED' | 'ROTATION_SPILL' | 'CONNECTION_MISSED' | 'CREW_BREACH' | 'SPARE_DISPATCH' | 'RECOVERY_APPLIED';
  title: string;
  description: string;
  flightNumber?: string;
  airport?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface SimulationAuditEntry {
  timestamp: string;
  simulationTime: string;
  event: string;
  details: string;
  deltaSummary?: string;
}
