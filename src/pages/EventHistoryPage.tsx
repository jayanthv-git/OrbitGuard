import React from 'react';
import { EventHistoryTable } from '../components/events/EventHistoryTable';
import { SimulationToolbar } from '../components/telemetry/SimulationToolbar';

interface EventHistoryPageProps {
  onNavigateToDiagnosis: () => void;
}

export const EventHistoryPage: React.FC<EventHistoryPageProps> = ({ onNavigateToDiagnosis }) => {
  return (
    <div className="space-y-5 max-w-[1600px] mx-auto select-none">
      {/* Simulation Controls Toolbar */}
      <SimulationToolbar />

      {/* Main Events Table */}
      <EventHistoryTable onNavigateToDiagnosis={onNavigateToDiagnosis} />
    </div>
  );
};
