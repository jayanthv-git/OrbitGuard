import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { MissionOverviewPage } from '../../pages/MissionOverviewPage';
import { LiveTelemetryPage } from '../../pages/LiveTelemetryPage';
import { ImpactDiagnosisPage } from '../../pages/ImpactDiagnosisPage';
import { EventHistoryPage } from '../../pages/EventHistoryPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { EventReplayModal } from '../events/EventReplayModal';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Header */}
        <Header onSelectTab={setCurrentTab} />

        {/* Scrollable Page Body */}
        <main className="app-content">
          {currentTab === 'overview' && (
            <MissionOverviewPage
              onNavigateToDiagnosis={() => setCurrentTab('diagnosis')}
              onNavigateToTelemetry={() => setCurrentTab('telemetry')}
            />
          )}
          {currentTab === 'telemetry' && <LiveTelemetryPage />}
          {currentTab === 'diagnosis' && <ImpactDiagnosisPage />}
          {currentTab === 'history' && (
            <EventHistoryPage
              onNavigateToDiagnosis={() => setCurrentTab('diagnosis')}
            />
          )}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Interactive Event Replay Modal */}
      <EventReplayModal />
    </div>
  );
};
