'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Airport,
  Flight,
  Aircraft,
  PassengerConnection,
  CrewAssignment,
  DisruptionInput,
  RecoveryAction,
  SimulationResult,
} from '@/types/aviation';
import {
  OFFICIAL_AIRPORTS,
  OFFICIAL_FLIGHTS,
  OFFICIAL_AIRCRAFT,
  OFFICIAL_CONNECTIONS,
  OFFICIAL_CREW_ASSIGNMENTS,
  OFFICIAL_SPARES,
} from '@/data/official-dataset';
import { runSimulation } from '@/engine/simulation';
import {
  generateCandidateRecoveryActions,
  synthesizeOperationsBriefing,
  DispatcherBriefing,
} from '@/services/ai-dispatcher';
import { CompleteDatasetPackage } from '@/services/dataset-loader';
import { timeToMinutes } from '@/engine/time-utils';

import dynamic from 'next/dynamic';

// Flightradar24-Inspired Components
import { FlightradarNavbar } from '@/components/navigation/FlightradarNavbar';
import { FloatingToolbar, ActiveDrawerType } from '@/components/navigation/FloatingToolbar';
import { FlightPlaybackBar } from '@/components/timeline/FlightPlaybackBar';

// Full-screen MapLibre GL WebGL Aviation Basemap (SSR disabled for WebGL canvas)
const FlightradarGeoMap = dynamic(
  () => import('@/components/network-map/FlightradarGeoMap').then(mod => mod.FlightradarGeoMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#070B14] text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
          <span>LOADING FLIGHTRADAR24 GEOSPATIAL RADAR...</span>
        </div>
      </div>
    ),
  }
);

// Drawers & Overlays
import { FlightDetailsDrawer } from '@/components/flight-details/FlightDetailsDrawer';
import { AirportDetailsDrawer } from '@/components/airport-details/AirportDetailsDrawer';
import { DisruptionDrawer } from '@/components/disruption-panel/DisruptionDrawer';
import { AiDispatcherDrawer } from '@/components/recovery-panel/AiDispatcherDrawer';
import { FlightFiltersDrawer } from '@/components/navigation/FlightFiltersDrawer';
import { AirportsListDrawer } from '@/components/navigation/AirportsListDrawer';
import { RotationsDrawer } from '@/components/gantt/RotationsDrawer';
import { AnalyticsDrawer } from '@/components/analytics/AnalyticsDrawer';
import { PassengerImpactDrawer } from '@/components/views/PassengerImpactDrawer';

// Modals
import { BeforeAfterModal } from '@/components/recovery-panel/BeforeAfterModal';
import { DatasetManagerModal } from '@/components/dataset/DatasetManagerModal';

export default function DominoSkyFlightradarPage() {
  // Master Dataset State (From official flight_network.json)
  const [airports, setAirports] = useState<Airport[]>(OFFICIAL_AIRPORTS);
  const [flights, setFlights] = useState<Flight[]>(OFFICIAL_FLIGHTS);
  const [aircraft, setAircraft] = useState<Aircraft[]>(OFFICIAL_AIRCRAFT);
  const [connections, setConnections] = useState<PassengerConnection[]>(OFFICIAL_CONNECTIONS);
  const [crew, setCrew] = useState<CrewAssignment[]>(OFFICIAL_CREW_ASSIGNMENTS);
  const [spares, setSpares] = useState<Aircraft[]>(OFFICIAL_SPARES);

  // Operational Simulation State
  // Default to the canonical Mumbai 90m disruption scenario (14:00 - 15:30)
  const [disruption, setDisruption] = useState<DisruptionInput | null>({
    airport: 'BOM',
    type: 'THUNDERSTORM',
    startTime: '14:00',
    durationMinutes: 90,
    severity: 'HIGH',
    description: 'Severe thunderstorm closes Mumbai airport for 90m, holding departures and inducing rotational delays.',
  });

  const [appliedRecoveryActions, setAppliedRecoveryActions] = useState<RecoveryAction[]>([]);
  const [simulationTime, setSimulationTime] = useState<string>('14:35'); // Active flight window

  // Selection & Inspector State
  const [selectedFlightNumber, setSelectedFlightNumber] = useState<string | null>(null);
  const [selectedAirportIata, setSelectedAirportIata] = useState<string | null>(null);
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawerType>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'AIRBORNE' | 'DELAYED' | 'CANCELLED' | 'RECOVERED'>('ALL');
  const [showAllRoutes, setShowAllRoutes] = useState<boolean>(true);

  // Modals
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);

  // 1. Calculate Baseline Simulation (without recovery actions)
  const baselineResult = useMemo<SimulationResult>(() => {
    return runSimulation({
      airports,
      flights,
      connections,
      crew,
      spares,
      disruption,
      recoveryActions: [],
      simulationTime,
    });
  }, [airports, flights, connections, crew, spares, disruption, simulationTime]);

  // 2. Calculate Current Active Simulation (with applied recovery actions)
  const currentResult = useMemo<SimulationResult>(() => {
    return runSimulation({
      airports,
      flights,
      connections,
      crew,
      spares,
      disruption,
      recoveryActions: appliedRecoveryActions,
      simulationTime,
    });
  }, [airports, flights, connections, crew, spares, disruption, appliedRecoveryActions, simulationTime]);

  // 3. Generate candidate recovery actions & AI operations briefing
  const evaluatedCandidateActions = useMemo(() => {
    return generateCandidateRecoveryActions(baselineResult, flights, spares);
  }, [baselineResult, flights, spares]);

  const dispatcherBriefing = useMemo<DispatcherBriefing>(() => {
    return synthesizeOperationsBriefing(currentResult, evaluatedCandidateActions);
  }, [currentResult, evaluatedCandidateActions]);

  // Handlers
  const handleApplyDisruption = useCallback((newDisruption: DisruptionInput) => {
    setDisruption(newDisruption);
    setAppliedRecoveryActions([]);
    setSimulationTime(newDisruption.startTime);
  }, []);

  const handleResetDisruption = useCallback(() => {
    setDisruption(null);
    setAppliedRecoveryActions([]);
    setSimulationTime('14:00');
    setSelectedFlightNumber(null);
    setSelectedAirportIata(null);
  }, []);

  const handleApplyAction = useCallback((action: RecoveryAction) => {
    setAppliedRecoveryActions(prev => [...prev.filter(a => a.id !== action.id), action]);
  }, []);

  const handleUndoAction = useCallback((actionId: string) => {
    setAppliedRecoveryActions(prev => prev.filter(a => a.id !== actionId));
  }, []);

  const handleResetToBaseline = useCallback(() => {
    setAppliedRecoveryActions([]);
    setIsCompareModalOpen(false);
  }, []);

  // Quick Action from Flight Drawer
  const handleQuickRecoverSpare = useCallback((flightNum: string) => {
    const flight = flights.find(f => f.flightNumber === flightNum);
    if (!flight) return;
    const compatibleSpare = spares.find(s => s.currentAirport === flight.origin);
    if (compatibleSpare) {
      handleApplyAction({
        id: `QUICK-SPARE-${flightNum}`,
        type: 'ASSIGN_SPARE',
        title: `Dispatch Standby Spare ${compatibleSpare.tailNumber} to ${flightNum}`,
        description: `Deploy standby aircraft ${compatibleSpare.tailNumber} at ${flight.origin} to absorb rotational delay.`,
        targetFlightNumber: flightNum,
        spareTailNumber: compatibleSpare.tailNumber,
        justification: `Direct operations control intervention from flight intelligence inspector.`,
        isFeasible: true,
      });
    }
  }, [flights, spares, handleApplyAction]);

  const handleQuickCancel = useCallback((flightNum: string) => {
    const flight = flights.find(f => f.flightNumber === flightNum);
    if (!flight) return;
    handleApplyAction({
      id: `QUICK-CANCEL-${flightNum}`,
      type: 'CANCEL_FLIGHT',
      title: `Tactical Cancellation of ${flightNum}`,
      description: `Cancel flight ${flightNum} to isolate rotational cascading delay.`,
      targetFlightNumber: flightNum,
      justification: `Direct operations control cancellation from inspector.`,
      isFeasible: true,
    });
  }, [flights, handleApplyAction]);

  // Custom Dataset Handlers
  const handleLoadCustomDataset = useCallback((pkg: CompleteDatasetPackage) => {
    if (pkg.airports) setAirports(pkg.airports);
    if (pkg.flights) setFlights(pkg.flights);
    if (pkg.aircraft) setAircraft(pkg.aircraft);
    if (pkg.connections) setConnections(pkg.connections);
    if (pkg.crew) setCrew(pkg.crew);
    if (pkg.spares) setSpares(pkg.spares);
    setAppliedRecoveryActions([]);
    setIsDatasetModalOpen(false);
  }, []);

  const handleResetOfficialDataset = useCallback(() => {
    setAirports(OFFICIAL_AIRPORTS);
    setFlights(OFFICIAL_FLIGHTS);
    setAircraft(OFFICIAL_AIRCRAFT);
    setConnections(OFFICIAL_CONNECTIONS);
    setCrew(OFFICIAL_CREW_ASSIGNMENTS);
    setSpares(OFFICIAL_SPARES);
    setAppliedRecoveryActions([]);
  }, []);

  // Global search select handler
  const handleSearchSelect = useCallback((query: string) => {
    // Check if flight number match
    const flightMatch = flights.find(f => f.flightNumber.toUpperCase() === query);
    if (flightMatch) {
      setSelectedFlightNumber(flightMatch.flightNumber);
      return;
    }
    // Check if airport IATA match
    const airportMatch = airports.find(a => a.iata.toUpperCase() === query);
    if (airportMatch) {
      setSelectedAirportIata(airportMatch.iata);
      return;
    }
    // Check if tail registration match
    const tailMatch = flights.find(f => f.aircraftTail.toUpperCase() === query);
    if (tailMatch) {
      setSelectedFlightNumber(tailMatch.flightNumber);
      return;
    }
  }, [flights, airports]);

  // Active Flight object for Drawer
  const activeFlight = useMemo(() => {
    if (!selectedFlightNumber) return null;
    return currentResult.flights.find(f => f.flightNumber === selectedFlightNumber) || null;
  }, [selectedFlightNumber, currentResult.flights]);

  const activeFlightCrew = useMemo(() => {
    if (!selectedFlightNumber) return null;
    return crew.find(c => c.flightNumber === selectedFlightNumber) || null;
  }, [selectedFlightNumber, crew]);

  const activeInboundConnections = useMemo(() => {
    if (!selectedFlightNumber) return [];
    return currentResult.connections.filter(c => c.connectingFlightNumber === selectedFlightNumber);
  }, [selectedFlightNumber, currentResult.connections]);

  const activeOutboundConnections = useMemo(() => {
    if (!selectedFlightNumber) return [];
    return currentResult.connections.filter(c => c.inboundFlightNumber === selectedFlightNumber);
  }, [selectedFlightNumber, currentResult.connections]);

  const activeTailFlights = useMemo(() => {
    if (!activeFlight) return [];
    return currentResult.flights
      .filter(f => f.aircraftTail === activeFlight.aircraftTail)
      .sort((a, b) => a.rotationSequence - b.rotationSequence);
  }, [activeFlight, currentResult.flights]);

  // Selected Airport object for Drawer
  const selectedAirportObj = useMemo(() => {
    if (!selectedAirportIata) return null;
    return airports.find(a => a.iata === selectedAirportIata) || null;
  }, [selectedAirportIata, airports]);

  const currentSimMinutes = timeToMinutes(simulationTime);
  const airborneCount = useMemo(() => {
    return currentResult.flights.filter(f => {
      if (f.status === 'CANCELLED') return false;
      const dep = timeToMinutes(f.actualDeparture);
      const arr = timeToMinutes(f.actualArrival);
      return currentSimMinutes >= dep && currentSimMinutes < arr;
    }).length;
  }, [currentResult.flights, currentSimMinutes]);

  const delayedCount = currentResult.delayedFlightsCount;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B14] text-slate-100 font-sans select-none relative">
      {/* 1. COMPACT TOP NAVIGATION BAR (FLIGHTRADAR24 STYLE) */}
      <FlightradarNavbar
        result={currentResult}
        simulationTime={simulationTime}
        onResetSimulation={handleResetDisruption}
        onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
        onSelectScenarioPreset={handleApplyDisruption}
        onSearchSelect={handleSearchSelect}
      />

      {/* 2. FULL-SCREEN INTERACTIVE RADAR MAP (OCCUPIES 85-90% OF VIEWPORT) */}
      <main className="flex-1 w-full h-full relative overflow-hidden">
        <FlightradarGeoMap
          airports={airports}
          flights={currentResult.flights}
          disruption={disruption}
          simulationTime={simulationTime}
          selectedFlightNumber={selectedFlightNumber}
          onSelectFlight={flightNum => {
            setSelectedAirportIata(null);
            setSelectedFlightNumber(flightNum);
          }}
          selectedAirportIata={selectedAirportIata}
          onSelectAirport={iata => {
            setSelectedFlightNumber(null);
            setSelectedAirportIata(iata);
          }}
          filterMode={filterMode}
          showAllRoutes={showAllRoutes}
        />

        {/* 3. SLIM FLOATING LEFT TOOLBAR (FLIGHTRADAR24 STYLE) */}
        <FloatingToolbar
          activeDrawer={activeDrawer}
          onToggleDrawer={drawer => setActiveDrawer(drawer)}
          isDisrupted={!!disruption}
          hasRecoveryActions={appliedRecoveryActions.length > 0}
          airborneCount={airborneCount}
          delayedCount={delayedCount}
        />

        {/* 4. FLOATING BOTTOM PLAYBACK BAR (FLIGHTRADAR24 STYLE) */}
        <FlightPlaybackBar
          simulationTime={simulationTime}
          onTimeChange={setSimulationTime}
          disruption={disruption}
        />

        {/* 5. SLIDE-OUT DRAWERS (OPEN OVER THE MAP WITHOUT SQUISHING IT) */}

        {/* Flight Details Inspector Drawer (Right) */}
        <FlightDetailsDrawer
          flight={activeFlight}
          crew={activeFlightCrew}
          inboundConnections={activeInboundConnections}
          outboundConnections={activeOutboundConnections}
          allTailFlights={activeTailFlights}
          onClose={() => setSelectedFlightNumber(null)}
          onSelectFlight={flightNum => setSelectedFlightNumber(flightNum)}
          onQuickRecoverSpare={handleQuickRecoverSpare}
          onQuickCancel={handleQuickCancel}
        />

        {/* Airport Details Drawer (Right) */}
        <AirportDetailsDrawer
          airport={selectedAirportObj}
          flights={currentResult.flights}
          disruption={disruption}
          simulationTime={simulationTime}
          onClose={() => setSelectedAirportIata(null)}
          onSelectFlight={flightNum => {
            setSelectedAirportIata(null);
            setSelectedFlightNumber(flightNum);
          }}
          onTriggerDisruptionAtAirport={iata => {
            handleApplyDisruption({
              airport: iata,
              type: 'AIRPORT_CLOSURE',
              startTime: simulationTime,
              durationMinutes: 90,
              severity: 'HIGH',
            });
            setSelectedAirportIata(null);
          }}
        />

        {/* Disruption Simulator Drawer (Left) */}
        {activeDrawer === 'DISRUPTION' && (
          <DisruptionDrawer
            airports={airports}
            flights={currentResult.flights}
            currentDisruption={disruption}
            onApplyDisruption={handleApplyDisruption}
            onResetDisruption={handleResetDisruption}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* AI Operations Dispatcher Drawer (Right) */}
        {activeDrawer === 'DISPATCHER' && (
          <AiDispatcherDrawer
            briefing={dispatcherBriefing}
            currentResult={currentResult}
            appliedActions={appliedRecoveryActions}
            onApplyAction={handleApplyAction}
            onUndoAction={handleUndoAction}
            onOpenCompareModal={() => setIsCompareModalOpen(true)}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* Flight Filters Drawer (Left) */}
        {activeDrawer === 'FILTERS' && (
          <FlightFiltersDrawer
            filterMode={filterMode}
            onSelectFilterMode={mode => setFilterMode(mode)}
            showAllRoutes={showAllRoutes}
            onToggleShowAllRoutes={() => setShowAllRoutes(!showAllRoutes)}
            flights={currentResult.flights}
            airborneCount={airborneCount}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* 16 Hub Airports List Drawer (Left) */}
        {activeDrawer === 'AIRPORTS' && (
          <AirportsListDrawer
            airports={airports}
            flights={currentResult.flights}
            disruption={disruption}
            simulationTime={simulationTime}
            onSelectAirport={iata => {
              setSelectedAirportIata(iata);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* Aircraft Rotations Gantt Drawer (Left) */}
        {activeDrawer === 'ROTATIONS' && (
          <RotationsDrawer
            flights={currentResult.flights}
            simulationTime={simulationTime}
            selectedFlightNumber={selectedFlightNumber}
            onSelectFlight={flightNum => {
              setSelectedFlightNumber(flightNum);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* Passenger Connections Audit Drawer (Left) */}
        {activeDrawer === 'PASSENGERS' && (
          <PassengerImpactDrawer
            connections={currentResult.connections}
            result={currentResult}
            onSelectFlight={flightNum => {
              setSelectedFlightNumber(flightNum);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* Operational Analytics Telemetry Drawer (Left) */}
        {activeDrawer === 'ANALYTICS' && (
          <AnalyticsDrawer
            result={currentResult}
            airports={airports}
            onClose={() => setActiveDrawer(null)}
          />
        )}

        {/* 6. MODALS */}
        {/* Before / After Audit Comparison Modal */}
        <BeforeAfterModal
          baselineResult={baselineResult}
          recoveredResult={currentResult}
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          onResetToBaseline={handleResetToBaseline}
        />

        {/* Dataset Manager Modal */}
        <DatasetManagerModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
          currentAirportsCount={airports.length}
          currentFlightsCount={flights.length}
          currentAircraftCount={aircraft.length}
          onLoadCustomDataset={handleLoadCustomDataset}
          onResetOfficialDataset={handleResetOfficialDataset}
        />
      </main>
    </div>
  );
}
