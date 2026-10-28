import React from 'react';
import { MissionSettingsView } from '../components/settings/MissionSettingsView';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-5 max-w-[1600px] mx-auto select-none">
      <MissionSettingsView />
    </div>
  );
};
