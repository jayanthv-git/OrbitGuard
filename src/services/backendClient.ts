import type { TelemetryPoint } from '../types/telemetry';
import type { ImpactEvent } from '../types/events';

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface BackendHealth {
  status: 'ONLINE' | string;
  service: string;
  telemetry_samples: number;
  diagnoses: number;
}

export interface BackendSettings {
  update_rate_hz: number;
  imu_threshold_z: number;
  solar_threshold_z: number;
  mag_threshold_z: number;
  temp_threshold_z: number;
  correlation_window_ms: number;
}

function asApiSample(point: TelemetryPoint) {
  return {
    timestamp: point.timestamp,
    time_string: point.timeString,
    met_string: point.metString,
    event_id: point.eventId ?? null,
    imu_w_mag: point.imu.wMagnitude,
    solar_current: point.solarCurrent.current,
    mag_b_mag: point.magnetometer.bMagnitude,
    panel_temp: point.temperature.panel,
    imu_z_score: point.imu.zScore,
    solar_z_score: point.solarCurrent.zScore,
    mag_z_score: point.magnetometer.zScore,
    temp_z_score: point.temperature.zScore,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`OrbitGuard API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export const backendClient = {
  getHealth: () => request<BackendHealth>('/health'),
  getSettings: () => request<BackendSettings>('/api/settings'),

  updateSettings: (config: {
    updateRateHz: number;
    imuThresholdZ: number;
    solarThresholdZ: number;
    magThresholdZ: number;
    tempThresholdZ: number;
    correlationWindowMs: number;
  }) => request<BackendSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      update_rate_hz: config.updateRateHz,
      imu_threshold_z: config.imuThresholdZ,
      solar_threshold_z: config.solarThresholdZ,
      mag_threshold_z: config.magThresholdZ,
      temp_threshold_z: config.tempThresholdZ,
      correlation_window_ms: config.correlationWindowMs,
    }),
  }),

  ingestTelemetry: (points: TelemetryPoint[]) => {
    if (points.length === 0) return Promise.resolve({ accepted: 0 });
    return request<{ accepted: number }>('/api/telemetry/batch', {
      method: 'POST',
      body: JSON.stringify({ samples: points.map(asApiSample) }),
    });
  },

  diagnoseEvent: (event: ImpactEvent) => request('/api/diagnose', {
    method: 'POST',
    body: JSON.stringify({
      event_id: event.id,
      event_start_index: event.eventStartIndex,
      correlation_window_ms: 1500,
      samples: event.telemetryWindow.map(asApiSample),
    }),
  }),
};
