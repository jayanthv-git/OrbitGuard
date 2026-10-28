import React from 'react';
import { SimulationToolbar } from '../components/telemetry/SimulationToolbar';
import { DiagnosisView } from '../components/diagnosis/DiagnosisView';

export const ImpactDiagnosisPage: React.FC = () => {
  return (
    <div className="space-y-5 max-w-[1600px] mx-auto select-none">
      {/* Simulation Controls Toolbar */}
      <SimulationToolbar />

      {/* Flagship Diagnosis View */}
      <DiagnosisView />
    </div>
  );
};
