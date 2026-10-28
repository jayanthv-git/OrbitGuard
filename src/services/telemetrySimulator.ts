import { TelemetryPoint, SimulatorConfig } from '../types/telemetry';

export class TelemetrySimulator {
  private config: SimulatorConfig;
  private running: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private missionStartTime: number;
  private simulatedTime: number;
  private tickCount: number = 0;

  // Physical states for satellite attitude simulation
  private attitude: {
    wx: number;
    wy: number;
    wz: number;
    targetWx: number;
    targetWy: number;
    targetWz: number;
    roll: number;
    pitch: number;
    yaw: number;
  };

  // Thermal state with thermal inertia
  private thermal: {
    bus: number;
    panel: number;
  };

  // Injected disturbance states
  private activeDisturbance: 'NONE' | 'IMPACT' | 'GLITCH' = 'NONE';
  private disturbanceStartTick: number = 0;
  private disturbanceDurationTicks: number = 0;
  private glitchSensor: 'imu' | 'solar' | 'mag' = 'imu';
  private impactParams: {
    impulseMagnitude: number;
    direction: { x: number; y: number; z: number };
    solarCurrentDropFactor: number;
    eventId: string;
  } | null = null;

  private onTelemetryCallback: ((point: TelemetryPoint) => void) | null = null;

  constructor(customConfig?: Partial<SimulatorConfig>) {
    this.config = {
      updateRateHz: 5, // 5 updates per second (200ms per point)
      imuBaseNoise: 0.015,
      solarBaseNoise: 0.01,
      magBaseNoise: 0.15,
      tempBaseNoise: 0.05,
      imuThresholdZ: 3.2,
      solarThresholdZ: 2.8,
      magThresholdZ: 3.0,
      tempThresholdZ: 3.0,
      correlationWindowMs: 2000,
      ...customConfig
    };

    this.missionStartTime = Date.now() - 3600000 * 4 - 180000; // Simulated MET T+04:03:00
    this.simulatedTime = Date.now();

    this.attitude = {
      wx: 0.01,
      wy: -0.02,
      wz: 0.015,
      targetWx: 0.01,
      targetWy: -0.02,
      targetWz: 0.015,
      roll: 0,
      pitch: 0,
      yaw: 0
    };

    this.thermal = {
      bus: 22.4,
      panel: 46.8
    };
  }

  public setCallback(callback: (point: TelemetryPoint) => void) {
    this.onTelemetryCallback = callback;
  }

  public start() {
    if (this.running) return;
    this.running = true;
    const intervalMs = Math.round(1000 / this.config.updateRateHz);
    this.intervalId = setInterval(() => {
      this.step();
    }, intervalMs);
  }

  public pause() {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public resetBaseline() {
    this.activeDisturbance = 'NONE';
    this.impactParams = null;
    this.attitude.wx = 0.01;
    this.attitude.wy = -0.02;
    this.attitude.wz = 0.015;
    this.attitude.targetWx = 0.01;
    this.attitude.targetWy = -0.02;
    this.attitude.targetWz = 0.015;
    this.attitude.roll = 0;
    this.attitude.pitch = 0;
    this.attitude.yaw = 0;
    this.thermal.bus = 22.4;
    this.thermal.panel = 46.8;
  }

  public injectImpact(presetSeverity: 'MEDIUM' | 'HIGH' = 'HIGH'): string {
    const eventId = `EVT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.activeDisturbance = 'IMPACT';
    this.disturbanceStartTick = this.tickCount;
    this.disturbanceDurationTicks = Math.round(this.config.updateRateHz * 12); // ~12 seconds recovery

    const magMult = presetSeverity === 'HIGH' ? 3.4 : 1.9;
    
    // Direct angular rate impulse on body axes
    this.attitude.wx += (Math.random() > 0.5 ? 1 : -1) * (1.2 * magMult + (Math.random() * 0.4));
    this.attitude.wy += (Math.random() > 0.5 ? 1 : -1) * (1.6 * magMult + (Math.random() * 0.5));
    this.attitude.wz += (Math.random() > 0.5 ? 1 : -1) * (0.9 * magMult + (Math.random() * 0.3));

    this.impactParams = {
      impulseMagnitude: presetSeverity === 'HIGH' ? 84.5 : 42.0, // mN*s
      direction: {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1
      },
      solarCurrentDropFactor: presetSeverity === 'HIGH' ? 0.32 : 0.18, // drop by 32% or 18%
      eventId
    };

    return eventId;
  }

  public injectGlitch(sensor: 'imu' | 'solar' | 'mag' = 'imu'): string {
    const eventId = `GLT-${new Date().getFullYear()}-${sensor.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.activeDisturbance = 'GLITCH';
    this.glitchSensor = sensor;
    this.disturbanceStartTick = this.tickCount;
    this.disturbanceDurationTicks = Math.round(this.config.updateRateHz * 1.5); // 1.5 sec transient glitch
    this.impactParams = {
      impulseMagnitude: 0,
      direction: { x: 0, y: 0, z: 0 },
      solarCurrentDropFactor: 0,
      eventId
    };
    return eventId;
  }

  public restoreNominal() {
    this.activeDisturbance = 'NONE';
    this.impactParams = null;
  }

  public step(): TelemetryPoint {
    this.tickCount++;
    this.simulatedTime += 1000 / this.config.updateRateHz;
    const tSec = this.tickCount / this.config.updateRateHz;

    // Attitude Dynamics Simulation
    if (this.activeDisturbance === 'IMPACT') {
      const elapsedTicks = this.tickCount - this.disturbanceStartTick;
      // ADCS magnetic torquers + reaction wheel damping: exponential decay towards target
      const dampingFactor = 0.94;
      this.attitude.wx = this.attitude.targetWx + (this.attitude.wx - this.attitude.targetWx) * dampingFactor;
      this.attitude.wy = this.attitude.targetWy + (this.attitude.wy - this.attitude.targetWy) * dampingFactor;
      this.attitude.wz = this.attitude.targetWz + (this.attitude.wz - this.attitude.targetWz) * dampingFactor;

      if (elapsedTicks > this.disturbanceDurationTicks) {
        this.activeDisturbance = 'NONE';
        this.impactParams = null;
      }
    } else {
      // Nominal minor limit-cycle oscillation
      const oscillationX = 0.008 * Math.sin(tSec * 0.4);
      const oscillationY = 0.006 * Math.cos(tSec * 0.35);
      const oscillationZ = 0.005 * Math.sin(tSec * 0.5);
      this.attitude.wx = this.attitude.targetWx + oscillationX;
      this.attitude.wy = this.attitude.targetWy + oscillationY;
      this.attitude.wz = this.attitude.targetWz + oscillationZ;
    }

    // Update body orientation angles (Euler integration)
    const dt = 1 / this.config.updateRateHz;
    this.attitude.roll += this.attitude.wx * dt;
    this.attitude.pitch += this.attitude.wy * dt;
    this.attitude.yaw += this.attitude.wz * dt;

    // Gaussian noise generator
    const gaussianNoise = (std: number) => {
      const u = 1 - Math.random();
      const v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
    };

    // 1. Calculate IMU values
    let measuredWx = this.attitude.wx + gaussianNoise(this.config.imuBaseNoise);
    let measuredWy = this.attitude.wy + gaussianNoise(this.config.imuBaseNoise);
    let measuredWz = this.attitude.wz + gaussianNoise(this.config.imuBaseNoise);

    // Apply isolated glitch if active
    if (this.activeDisturbance === 'GLITCH' && this.glitchSensor === 'imu') {
      const elapsed = this.tickCount - this.disturbanceStartTick;
      if (elapsed <= this.disturbanceDurationTicks) {
        // High spike on single axis only (classic MEMS gyro register bit-flip / saturation)
        measuredWy += 3.85 + gaussianNoise(0.05);
      } else {
        this.activeDisturbance = 'NONE';
        this.impactParams = null;
      }
    }

    const wMagnitude = Math.sqrt(measuredWx * measuredWx + measuredWy * measuredWy + measuredWz * measuredWz);

    // 2. Calculate Magnetometer values (LEO orbital dipole field with satellite body rotation)
    // Base geomagnetic field vector in orbital reference frame (~42 uT total)
    const baseOrbitMag = {
      x: 18.2 * Math.sin(tSec * 0.05),
      y: -24.5 * Math.cos(tSec * 0.05),
      z: 30.1 * Math.cos(tSec * 0.02)
    };

    // Rotate field into body coordinates based on roll, pitch, yaw
    // (Physical coupling: when body rotates due to impact, B-field in body frame must rotate!)
    const cosR = Math.cos(this.attitude.roll * Math.PI / 180);
    const sinR = Math.sin(this.attitude.roll * Math.PI / 180);
    const cosP = Math.cos(this.attitude.pitch * Math.PI / 180);
    const sinP = Math.sin(this.attitude.pitch * Math.PI / 180);

    let bx = baseOrbitMag.x * cosP + baseOrbitMag.z * sinP + gaussianNoise(this.config.magBaseNoise);
    let by = baseOrbitMag.y * cosR - baseOrbitMag.z * sinR + gaussianNoise(this.config.magBaseNoise);
    let bz = -baseOrbitMag.x * sinP + baseOrbitMag.z * cosP + gaussianNoise(this.config.magBaseNoise);

    if (this.activeDisturbance === 'GLITCH' && this.glitchSensor === 'mag') {
      const elapsed = this.tickCount - this.disturbanceStartTick;
      if (elapsed <= this.disturbanceDurationTicks) {
        bx += 28.5; // isolated magnetometer ADC spike
      } else {
        this.activeDisturbance = 'NONE';
        this.impactParams = null;
      }
    }

    const bMagnitude = Math.sqrt(bx * bx + by * by + bz * bz);

    // 3. Solar Panel Current
    // Depends on Sun incidence angle (cosine law)
    const sunAngleDeg = Math.abs(this.attitude.pitch) % 90;
    const solarIncidenceFactor = Math.cos(sunAngleDeg * Math.PI / 180);
    const nominalCurrent = 2.45; // Amps in full sunlight
    let current = nominalCurrent * Math.max(0.2, solarIncidenceFactor) + gaussianNoise(this.config.solarBaseNoise);

    // Impact causes dynamic panel micro-vibration / off-pointing dip
    if (this.activeDisturbance === 'IMPACT' && this.impactParams) {
      const elapsed = this.tickCount - this.disturbanceStartTick;
      const decay = Math.exp(-elapsed / (this.config.updateRateHz * 3));
      const vibration = Math.sin(elapsed * 1.5) * 0.12 * decay;
      current -= (nominalCurrent * this.impactParams.solarCurrentDropFactor * decay) + vibration;
    }

    if (this.activeDisturbance === 'GLITCH' && this.glitchSensor === 'solar') {
      const elapsed = this.tickCount - this.disturbanceStartTick;
      if (elapsed <= this.disturbanceDurationTicks) {
        current = 0.08 + gaussianNoise(0.01); // isolated drop
      } else {
        this.activeDisturbance = 'NONE';
        this.impactParams = null;
      }
    }
    current = Math.max(0, current);

    // 4. Temperatures
    // Slow thermal time constant (seconds)
    this.thermal.bus += gaussianNoise(this.config.tempBaseNoise * 0.2);
    this.thermal.panel += gaussianNoise(this.config.tempBaseNoise * 0.3);

    // During impact, minor micro-shock dissipation
    let tempPanel = this.thermal.panel;
    if (this.activeDisturbance === 'IMPACT') {
      const elapsed = this.tickCount - this.disturbanceStartTick;
      if (elapsed < this.config.updateRateHz * 4) {
        tempPanel += 0.45 * Math.exp(-elapsed / 8);
      }
    }

    // Create formatted timestamps
    const date = new Date(this.simulatedTime);
    const timeString = date.toISOString().substring(11, 23); // HH:MM:ss.SSS
    const metElapsedSec = Math.floor((this.simulatedTime - this.missionStartTime) / 1000);
    const metHours = String(Math.floor(metElapsedSec / 3600)).padStart(2, '0');
    const metMins = String(Math.floor((metElapsedSec % 3600) / 60)).padStart(2, '0');
    const metSecs = String(metElapsedSec % 60).padStart(2, '0');
    const metString = `T+${metHours}:${metMins}:${metSecs}`;

    // Base Z-scores approximation for raw point (refined by DiagnosisEngine)
    const nominalMeanW = 0.035;
    const nominalStdW = 0.02;
    const imuZScore = Math.abs(wMagnitude - nominalMeanW) / nominalStdW;

    const nominalMeanI = 2.44;
    const nominalStdI = 0.02;
    const solarZScore = Math.abs(current - nominalMeanI) / nominalStdI;

    // Compare the measured body-frame vector with the expected orbital field vector.
    // Magnitude alone is a poor anomaly signal here: the modeled geomagnetic direction
    // changes along the orbit even when the spacecraft itself remains nominal.
    const magResidual = Math.sqrt(
      (bx - baseOrbitMag.x) ** 2 +
      (by - baseOrbitMag.y) ** 2 +
      (bz - baseOrbitMag.z) ** 2
    );
    const nominalStdB = 0.35;
    const magZScore = magResidual / nominalStdB;

    const nominalMeanT = 46.8;
    const nominalStdT = 0.15;
    const tempZScore = Math.abs(tempPanel - nominalMeanT) / nominalStdT;

    const point: TelemetryPoint = {
      timestamp: this.simulatedTime,
      timeString,
      metString,
      imu: {
        wx: Number(measuredWx.toFixed(4)),
        wy: Number(measuredWy.toFixed(4)),
        wz: Number(measuredWz.toFixed(4)),
        wMagnitude: Number(wMagnitude.toFixed(4)),
        anomaly: imuZScore > this.config.imuThresholdZ,
        zScore: Number(imuZScore.toFixed(2))
      },
      magnetometer: {
        bx: Number(bx.toFixed(2)),
        by: Number(by.toFixed(2)),
        bz: Number(bz.toFixed(2)),
        bMagnitude: Number(bMagnitude.toFixed(2)),
        anomaly: magZScore > this.config.magThresholdZ,
        zScore: Number(magZScore.toFixed(2))
      },
      solarCurrent: {
        current: Number(current.toFixed(4)),
        anomaly: solarZScore > this.config.solarThresholdZ,
        zScore: Number(solarZScore.toFixed(2))
      },
      temperature: {
        bus: Number(this.thermal.bus.toFixed(2)),
        panel: Number(tempPanel.toFixed(2)),
        anomaly: tempZScore > this.config.tempThresholdZ,
        zScore: Number(tempZScore.toFixed(2))
      },
      activeAnomaly: imuZScore > this.config.imuThresholdZ || solarZScore > this.config.solarThresholdZ || magZScore > this.config.magThresholdZ,
      activeImpact: this.activeDisturbance === 'IMPACT',
      eventId: this.impactParams?.eventId
    };

    if (this.onTelemetryCallback) {
      this.onTelemetryCallback(point);
    }

    return point;
  }

  public getConfig(): SimulatorConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SimulatorConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getAttitudeState() {
    return { ...this.attitude };
  }
}
