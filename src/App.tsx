import React from 'react';
import { MissionProvider } from './context/MissionContext';
import { AppLayout } from './components/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <MissionProvider>
      <AppLayout />
    </MissionProvider>
  );
};

export default App;
