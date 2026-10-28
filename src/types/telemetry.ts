export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface TelemetryPoint {
  timestamp: number; // Unix ms
  timeString: string; // HH:MM:ss.SSS
  metString: string; // T+HH:MM:SS
  
  // 1. IMU / Angular Rate (deg/s)
  imu: {
    wx: number;
    wy: number;
    wz: number;
    wMagnitude: number;
    anomaly: boolean;
    zScore: number;
  };
  
  // 2. 3-Axis Magnetometer (microTesla, uT)
  magnetometer: {
    bx: number;
    by: number;
    bz: number;
    bMagnitude: number;
    anomaly: boolean;
    zScore: number;
  };
  
  // 3. Solar Panel Current (Amperes, A)
  solarCurrent: {
    current: number; // A
    anomaly: boolean;
    zScore: number;
  };
  
  // 4. Bus & Panel Temperature (°C)
  temperature: {
    bus: number;
    panel: number;
    anomaly: boolean;
    zScore: number;
  };
  
  // State flags
  activeAnomaly: boolean;
  activeImpact: boolean;
  eventId?: string;
}

export interface SensorBaseline {
  mean: number;
  stdDev: number;
}

export interface SimulatorConfig {
  updateRateHz: number; // e.g. 5Hz or 10Hz
  imuBaseNoise: number;
  solarBaseNoise: number;
  magBaseNoise: number;
  tempBaseNoise: number;
  
  // Detection thresholds
  imuThresholdZ: number;
  solarThresholdZ: number;
  magThresholdZ: number;
  tempThresholdZ: number;
  correlationWindowMs: number;
}
