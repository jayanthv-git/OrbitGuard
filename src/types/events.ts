import { TelemetryPoint } from './telemetry';

export type EventClassification = 'POSSIBLE_IMPACT' | 'SENSOR_GLITCH' | 'UNCERTAIN';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SensorAnomalyEvidence {
  sensorName: 'IMU Angular Rate' | 'Solar Array Current' | 'Magnetometer' | 'Thermal Subsystem';
  sensorKey: 'imu' | 'solarCurrent' | 'magnetometer' | 'temperature';
  detected: boolean;
  onsetTimeMs: number;
  peakDeviation: number;
  baselineValue: number;
  peakValue: number;
  unit: string;
  zScore: number;
  description: string;
}

export interface DiagnosisEvidence {
  temporalCorrelationMs: number; // delta t between earliest and latest onset
  sensorAgreementCount: number; // e.g. 3 of 4
  physicsConsistencyScore: number; // 0 to 100
  estimatedKineticImpulseMns?: number; // millinewton-seconds
  estimatedImpactLocation?: string; // e.g., "+X Ram Face / Starboard Array"
  isConsistentWithRigidBody: boolean;
  explanationPoints: string[];
  summary: string;
}

export interface ImpactEvent {
  id: string; // e.g. EVT-2026-0842
  timestamp: number; // unix ms
  timeString: string;
  metString: string;
  classification: EventClassification;
  confidenceScore: number; // 0 to 100 percentage
  severity: EventSeverity;
  
  affectedSensors: string[]; // ['IMU', 'Solar Current', 'Magnetometer']
  sensorEvidence: Record<string, SensorAnomalyEvidence>;
  evidence: DiagnosisEvidence;
  
  // Stored telemetry buffer around the event window for replay & inspection
  telemetryWindow: TelemetryPoint[];
  eventStartIndex: number;
  eventPeakIndex: number;
}
