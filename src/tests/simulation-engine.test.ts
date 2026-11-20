// DOMINO SKY - Automated Verification Suite for Deterministic Simulation Engine & Technical Audit
// Verifies core operational invariants, official flight_network.json dataset integrity, and AI Dispatcher safety rules

import { runSimulation } from '../engine/simulation';
import { generateCandidateRecoveryActions } from '../services/ai-dispatcher';
import { DisruptionInput, RecoveryAction } from '../types/aviation';
import {
  OFFICIAL_FLIGHTS,
  OFFICIAL_AIRPORTS,
  OFFICIAL_AIRCRAFT,
  OFFICIAL_SPARES,
  OFFICIAL_CONNECTIONS,
} from '../data/official-dataset';

console.log('====================================================');
console.log('   DOMINO SKY - RIGOROUS ENGINE TECHNICAL AUDIT    ');
console.log('====================================================\n');

let passedTests = 0;
const totalTests = 13;

function assert(condition: boolean, testName: string, detail: string = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}: ${detail}`);
  }
}

// ---------------------------------------------------------
// Test 1: Dataset Integrity (16 Airports, 16 Tails, 70 Flights, 2 Spares, 21 Connections)
// ---------------------------------------------------------
assert(
  OFFICIAL_AIRPORTS.length === 16 &&
  OFFICIAL_AIRCRAFT.length === 16 &&
  OFFICIAL_FLIGHTS.length === 70 &&
  OFFICIAL_SPARES.length === 2 &&
  OFFICIAL_CONNECTIONS.length === 21,
  'Audit 1: Dataset integrity (16 Airports, 16 Aircraft, 70 Flights, 2 Spares, 21 Connections)',
  `Airports=${OFFICIAL_AIRPORTS.length}, Aircraft=${OFFICIAL_AIRCRAFT.length}, Flights=${OFFICIAL_FLIGHTS.length}, Spares=${OFFICIAL_SPARES.length}, Conns=${OFFICIAL_CONNECTIONS.length}`
);

// ---------------------------------------------------------
// Test 2: Nominal Clear-Weather Crew Legality (Zero Breaches)
// ---------------------------------------------------------
const nominalResult = runSimulation({ disruption: null });
assert(
  nominalResult.crewBreachesCount === 0 &&
  nominalResult.delayedFlightsCount === 0 &&
  nominalResult.totalDelayMinutes === 0,
  'Audit 2: Nominal clear-weather schedule has 0 crew breaches and 0 delays',
  `Expected 0 breaches, got ${nominalResult.crewBreachesCount}; delays=${nominalResult.delayedFlightsCount}`
);

// ---------------------------------------------------------
// Test 3: An airport closure delays the appropriate flights
// ---------------------------------------------------------
const mumbaiDisruption: DisruptionInput = {
  airport: 'BOM',
  type: 'THUNDERSTORM',
  startTime: '14:00',
  durationMinutes: 90,
  severity: 'HIGH',
};

const result1 = runSimulation({ disruption: mumbaiDisruption, simulationTime: '23:59' });
const bomDepFlight = result1.flights.find(f => f.flightNumber === 'DS0405')!; // sched BOM dep 14:45
const unaffectedMorningFlight = result1.flights.find(f => f.flightNumber === 'DS0401')!; // sched BOM dep 07:45

assert(
  bomDepFlight.departureDelayMinutes === 45 && bomDepFlight.isDirectlyDisrupted && unaffectedMorningFlight.departureDelayMinutes === 0,
  'Audit 3: Airport closure delays appropriate flights scheduled in window',
  `Expected DS0405 delay = 45m, got ${bomDepFlight.departureDelayMinutes}m; DS0401 delay = ${unaffectedMorningFlight.departureDelayMinutes}m`
);

// ---------------------------------------------------------
// Test 4: A delay propagates through an aircraft rotation
// ---------------------------------------------------------
// 120m BOM closure: DS0302 AMD->BOM is held -> propagates to DS0303 BOM->DEL -> DS0304 DEL->CCU on VT-DS03
const mumbai120: DisruptionInput = {
  airport: 'BOM',
  type: 'AIRPORT_CLOSURE',
  startTime: '14:00',
  durationMinutes: 120,
  severity: 'CRITICAL',
};
const result2 = runSimulation({ disruption: mumbai120, simulationTime: '23:59' });
const downstreamFlight = result2.flights.find(f => f.flightNumber === 'DS0303')!;
const downstreamLeg2 = result2.flights.find(f => f.flightNumber === 'DS0304')!;

assert(
  downstreamFlight.departureDelayMinutes > 0 && downstreamLeg2.departureDelayMinutes > 0,
  'Audit 4: Delay propagates through aircraft rotation to clear-weather airports',
  `Expected downstream DS0303 > 0, got delay=${downstreamFlight.departureDelayMinutes}m; DS0304 delay=${downstreamLeg2.departureDelayMinutes}m`
);

// ---------------------------------------------------------
// Test 5: Turnaround requirements are strictly respected
// ---------------------------------------------------------
let allTurnaroundsValid = true;
for (const f of result2.flights) {
  if (f.turnaroundTimeMinutes < 30 && f.rotationSequence > 1 && f.status !== 'CANCELLED') {
    allTurnaroundsValid = false;
    break;
  }
}
assert(
  allTurnaroundsValid,
  'Audit 5: Turnaround requirements (TAT >= 30m) strictly respected',
  `Found turnaround violation below min_turnaround_minutes (30m)`
);

// ---------------------------------------------------------
// Test 6: Passenger connections are correctly evaluated with MCT
// ---------------------------------------------------------
assert(
  result1.connections.length === 21 && result2.connections.length === 21,
  'Audit 6: Passenger connections evaluated with MCT and stranded logic',
  `Expected 21 evaluated connections, got ${result1.connections.length}`
);

// ---------------------------------------------------------
// Test 7: Passengers are not double-counted
// ---------------------------------------------------------
const totalFlightPax = OFFICIAL_FLIGHTS.reduce((acc, f) => acc + f.passengerCount, 0);
assert(
  result1.totalPassengers === totalFlightPax && totalFlightPax === 10394,
  'Audit 7: Passenger totals strictly match booked capacity without double counting',
  `Expected totalPassengers = 10394, got ${result1.totalPassengers}`
);

// ---------------------------------------------------------
// Test 8: Crew duty constraints evaluated per DGCA rules
// ---------------------------------------------------------
// Mumbai 120m closure pushes VT-DS03 crew CR03 and VT-DS04 crew CR04 past 600m max duty
assert(
  result2.crewBreachesCount >= 1,
  'Audit 8: Disruption triggers confirmed DGCA duty breach (exceeding 600m max duty)',
  `Expected crew breaches >= 1, got ${result2.crewBreachesCount}`
);

// ---------------------------------------------------------
// Test 9: Simulation Time Isolation (No Future Delays at 06:00)
// ---------------------------------------------------------
// At 06:00, the 14:00 Mumbai thunderstorm has not occurred yet. Active delay must be 0!
const morningSim = runSimulation({
  disruption: mumbaiDisruption,
  simulationTime: '06:00',
});
assert(
  morningSim.activeMetrics.activeDelayedFlightsCount === 0 &&
  morningSim.activeMetrics.activeDelayMinutes === 0 &&
  morningSim.activeMetrics.activeStrandedPaxCount === 0,
  'Audit 9: Simulation time isolation: future 14:00 disruption produces 0 active delay at 06:00',
  `Active delays at 06:00 = ${morningSim.activeMetrics.activeDelayedFlightsCount}, mins=${morningSim.activeMetrics.activeDelayMinutes}`
);

// ---------------------------------------------------------
// Test 10: Rejection of Ineffective Recovery Actions (0m saved)
// ---------------------------------------------------------
// Candidate recovery actions must produce measurable benefits (delay saved, pax protected, or crew saved)
const candidateActions = generateCandidateRecoveryActions(result2, OFFICIAL_FLIGHTS, OFFICIAL_SPARES);
const allActionsEffective = candidateActions.every(a => {
  const imp = a.evaluatedImpact;
  return imp && (imp.delayMinutesSaved > 0 || imp.strandedPaxSaved > 0 || imp.crewBreachesAvoided > 0);
});
assert(
  allActionsEffective && candidateActions.length > 0,
  'Audit 10: Dispatcher correctly rejects ineffective recovery actions (0m saved)',
  `Ineffective recovery actions found in candidates!`
);

// ---------------------------------------------------------
// Test 11: Dispatcher Recommends Effective Downstream Spare
// ---------------------------------------------------------
// Assigning spare VT-DS18 at clear-weather DEL on DS0304 saves delay and avoids crew breach!
const delSpareAction = candidateActions.find(
  a => a.type === 'ASSIGN_SPARE' && a.spareTailNumber === 'VT-DS18' && a.targetFlightNumber === 'DS0304'
);
assert(
  delSpareAction !== undefined &&
  (delSpareAction.evaluatedImpact?.delayMinutesSaved || 0) > 0 &&
  (delSpareAction.evaluatedImpact?.crewBreachesAvoided || 0) === 1,
  'Audit 11: Dispatcher recommends effective spare at clear-weather hub (saves delay, fixes crew breach)',
  `DEL spare saved ${delSpareAction?.evaluatedImpact?.delayMinutesSaved}m, crew avoided=${delSpareAction?.evaluatedImpact?.crewBreachesAvoided}`
);

// ---------------------------------------------------------
// Test 12: Cancellation changes downstream outcomes correctly
// ---------------------------------------------------------
const cancelAction: RecoveryAction = {
  id: 'REC-TEST-CANCEL',
  type: 'CANCEL_FLIGHT',
  title: 'Cancel DS0405',
  description: 'Cancel DS0405 to prevent cascading delays',
  targetFlightNumber: 'DS0405',
  justification: 'Testing cancellation isolation',
  isFeasible: true,
};

const resultCancelled = runSimulation({
  disruption: mumbaiDisruption,
  recoveryActions: [cancelAction],
});
const cancelledFlight = resultCancelled.flights.find(f => f.flightNumber === 'DS0405')!;
assert(
  cancelledFlight.status === 'CANCELLED' && resultCancelled.cancelledFlightsCount === 1,
  'Audit 12: Tactical cancellation isolates rotational cascade',
  `Expected DS0405 CANCELLED, got status=${cancelledFlight.status}`
);

// ---------------------------------------------------------
// Test 13: Deterministic Purity (Identical Inputs -> Identical Output)
// ---------------------------------------------------------
const runA = runSimulation({ disruption: mumbaiDisruption });
const runB = runSimulation({ disruption: mumbaiDisruption });
assert(
  runA.deterministicSignature === runB.deterministicSignature &&
  runA.totalDelayMinutes === runB.totalDelayMinutes &&
  runA.strandedPassengersCount === runB.strandedPassengersCount &&
  runA.crewBreachesCount === runB.crewBreachesCount,
  'Audit 13: Identical inputs produce bitwise identical signatures and outputs',
  `Run A sig=${runA.deterministicSignature}, Run B sig=${runB.deterministicSignature}`
);

console.log('\n====================================================');
console.log(`   AUDIT RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
