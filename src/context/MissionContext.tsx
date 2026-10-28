import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { TelemetryPoint, SimulatorConfig } from '../types/telemetry';
import { ImpactEvent } from '../types/events';
import { TelemetrySimulator } from '../services/telemetrySimulator';
import { DiagnosisEngine } from '../services/diagnosisEngine';
import { backendClient } from '../services/backendClient';

interface MissionContextType {
  // Telemetry Stream
  latestTelemetry: TelemetryPoint | null;
  telemetryHistory: TelemetryPoint[];
  maxHistoryLength: number;
  
  // Simulator Controls
  isRunning: boolean;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  injectImpact: (severity?: 'MEDIUM' | 'HIGH') => string;
  injectGlitch: (sensor?: 'imu' | 'solar' | 'mag') => string;
  restoreNominal: () => void;
  
  // Events & Diagnosis
  events: ImpactEvent[];
  selectedEvent: ImpactEvent | null;
  setSelectedEvent: (event: ImpactEvent | null) => void;
  clearEvents: () => void;
  
  // Replay
  replayEvent: ImpactEvent | null;
  isReplaying: boolean;
  replayIndex: number;
  startReplay: (event: ImpactEvent) => void;
  stopReplay: () => void;
  setReplayIndex: (index: number) => void;

  // Simulator Configuration
  config: SimulatorConfig;
  updateConfig: (newConfig: Partial<SimulatorConfig>) => void;
  resetConfig: () => void;

  // Satellite Attitude State (for 3D viewer)
  satelliteAttitude: {
    wx: number;
    wy: number;
    wz: number;
    roll: number;
    pitch: number;
    yaw: number;
  };
  hasImpactDisturbance: boolean;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

const DEFAULT_CONFIG: SimulatorConfig = {
  updateRateHz: 5,
  imuBaseNoise: 0.015,
  solarBaseNoise: 0.01,
  magBaseNoise: 0.15,
  tempBaseNoise: 0.05,
  imuThresholdZ: 3.2,
  solarThresholdZ: 2.8,
  magThresholdZ: 3.0,
  tempThresholdZ: 3.0,
  correlationWindowMs: 2000
};

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryPoint | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [events, setEvents] = useState<ImpactEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ImpactEvent | null>(null);
  const [config, setConfig] = useState<SimulatorConfig>(DEFAULT_CONFIG);

  // Satellite 3D attitude state
  const [satelliteAttitude, setSatelliteAttitude] = useState({
    wx: 0,
    wy: 0,
    wz: 0,
    roll: 0,
    pitch: 0,
    yaw: 0
  });
  const [hasImpactDisturbance, setHasImpactDisturbance] = useState(false);

  // Replay State
  const [replayEvent, setReplayEvent] = useState<ImpactEvent | null>(null);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for instances
  const simulatorRef = useRef<TelemetrySimulator | null>(null);
  const engineRef = useRef<DiagnosisEngine | null>(null);
  const backendPendingRef = useRef<TelemetryPoint[]>([]);
  const flushBackendBatch = useCallback((additional: TelemetryPoint[] = []) => {
    const samples = [...backendPendingRef.current, ...additional];
    backendPendingRef.current = [];
    if (samples.length > 0) void backendClient.ingestTelemetry(samples).catch(() => undefined);
  }, []);

  // Seed default demonstration events on initial load so the user immediately has data to inspect
  useEffect(() => {
    const simulator = new TelemetrySimulator(config);
    const engine = new DiagnosisEngine();

    simulatorRef.current = simulator;
    engineRef.current = engine;
    void backendClient.getSettings().then((settings) => {
      const restored: Partial<SimulatorConfig> = {
        updateRateHz: settings.update_rate_hz,
        imuThresholdZ: settings.imu_threshold_z,
        solarThresholdZ: settings.solar_threshold_z,
        magThresholdZ: settings.mag_threshold_z,
        tempThresholdZ: settings.temp_threshold_z,
        correlationWindowMs: settings.correlation_window_ms,
      };
      setConfig((current) => ({ ...current, ...restored }));
      simulator.updateConfig(restored);
    }).catch(() => undefined);

    // Pre-populate with baseline points
    const initialPoints: TelemetryPoint[] = [];
    for (let i = 0; i < 40; i++) {
      const p = simulator.step();
      engine.processPoint(p);
      initialPoints.push(p);
    }
    setTelemetryHistory(initialPoints);
    setLatestTelemetry(initialPoints[initialPoints.length - 1]);
    void backendClient.ingestTelemetry(initialPoints).catch(() => undefined);

    // Pre-seed a realistic historical impact and glitch for immediate inspection
    const seedGlitchId = simulator.injectGlitch('imu');
    for (let i = 0; i < 15; i++) {
      const p = simulator.step();
      const evt = engine.processPoint(p);
      if (evt) {
        setEvents(prev => [evt, ...prev]);
        void backendClient.diagnoseEvent(evt).catch(() => undefined);
      }
    }

    const seedImpactId = simulator.injectImpact('HIGH');
    for (let i = 0; i < 18; i++) {
      const p = simulator.step();
      const evt = engine.processPoint(p);
      if (evt) {
        setEvents(prev => [evt, ...prev]);
        setSelectedEvent(evt); // Select impact event by default for inspection
        void backendClient.diagnoseEvent(evt).catch(() => undefined);
      }
    }
    simulator.restoreNominal();
    // The demonstration events are historical samples. Start the live stream from
    // the nominal attitude and thermal baseline after seeding their replay windows.
    simulator.resetBaseline();

    // Setup live telemetry handler
    simulator.setCallback((point: TelemetryPoint) => {
      backendPendingRef.current.push(point);
      if (backendPendingRef.current.length >= 5) flushBackendBatch();

      setLatestTelemetry(point);
      setTelemetryHistory(prev => {
        const next = [...prev, point];
        if (next.length > 70) next.shift(); // Keep latest 70 points for smooth charts
        return next;
      });

      // Update 3D attitude state
      setSatelliteAttitude(simulator.getAttitudeState());
      setHasImpactDisturbance(point.activeImpact);

      // Process through Diagnosis Engine
      const diagnosedEvent = engine.processPoint(point);
      if (diagnosedEvent) {
        setEvents(prev => [diagnosedEvent, ...prev]);
        void backendClient.diagnoseEvent(diagnosedEvent).catch(() => undefined);
        // Auto-select latest event if user hasn't locked an event
        setSelectedEvent(diagnosedEvent);
      }
    });

    simulator.start();
    setIsRunning(true);

    return () => {
      simulator.pause();
      flushBackendBatch();
    };
  }, [flushBackendBatch]);

  const startSimulation = useCallback(() => {
    simulatorRef.current?.start();
    setIsRunning(true);
  }, []);

  const pauseSimulation = useCallback(() => {
    simulatorRef.current?.pause();
    flushBackendBatch();
    setIsRunning(false);
  }, [flushBackendBatch]);

  const resetSimulation = useCallback(() => {
    flushBackendBatch();
    simulatorRef.current?.resetBaseline();
    engineRef.current?.clearEvents();
    setEvents([]);
    setSelectedEvent(null);
  }, [flushBackendBatch]);

  const injectImpact = useCallback((severity: 'MEDIUM' | 'HIGH' = 'HIGH') => {
    if (!simulatorRef.current) return '';
    if (!isRunning) startSimulation();
    const id = simulatorRef.current.injectImpact(severity);
    setHasImpactDisturbance(true);
    return id;
  }, [isRunning, startSimulation]);

  const injectGlitch = useCallback((sensor: 'imu' | 'solar' | 'mag' = 'imu') => {
    if (!simulatorRef.current) return '';
    if (!isRunning) startSimulation();
    return simulatorRef.current.injectGlitch(sensor);
  }, [isRunning, startSimulation]);

  const restoreNominal = useCallback(() => {
    simulatorRef.current?.restoreNominal();
    setHasImpactDisturbance(false);
  }, []);

  const clearEvents = useCallback(() => {
    engineRef.current?.clearEvents();
    setEvents([]);
    setSelectedEvent(null);
  }, []);

  // Replay Control Logic
  const startReplay = useCallback((event: ImpactEvent) => {
    setReplayEvent(event);
    setIsReplaying(true);
    setReplayIndex(0);

    if (replayTimerRef.current) clearInterval(replayTimerRef.current);

    replayTimerRef.current = setInterval(() => {
      setReplayIndex(prev => {
        if (prev + 1 >= event.telemetryWindow.length) {
          if (replayTimerRef.current) clearInterval(replayTimerRef.current);
          setIsReplaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 250); // 250ms per replay frame
  }, []);

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
    setIsReplaying(false);
    setReplayEvent(null);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<SimulatorConfig>) => {
    setConfig(prev => {
      const merged = { ...prev, ...newConfig };
      simulatorRef.current?.updateConfig(merged);
      void backendClient.updateSettings(merged).catch(() => undefined);
      return merged;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    simulatorRef.current?.updateConfig(DEFAULT_CONFIG);
    void backendClient.updateSettings(DEFAULT_CONFIG).catch(() => undefined);
  }, []);

  return (
    <MissionContext.Provider
      value={{
        latestTelemetry,
        telemetryHistory,
        maxHistoryLength: 70,
        isRunning,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        injectImpact,
        injectGlitch,
        restoreNominal,
        events,
        selectedEvent,
        setSelectedEvent,
        clearEvents,
        replayEvent,
        isReplaying,
        replayIndex,
        startReplay,
        stopReplay,
        setReplayIndex,
        config,
        updateConfig,
        resetConfig,
        satelliteAttitude,
        hasImpactDisturbance
      }}
    >
      {children}
    </MissionContext.Provider>
  );
};

export const useMission = () => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error('useMission must be used within a MissionProvider');
  }
  return context;
};
