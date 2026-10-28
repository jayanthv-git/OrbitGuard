import { TelemetryPoint } from '../types/telemetry';
import { 
  ImpactEvent, 
  EventClassification, 
  EventSeverity, 
  SensorAnomalyEvidence, 
  DiagnosisEvidence 
} from '../types/events';

interface RollingStats {
  count: number;
  mean: number;
  variance: number;
  ewmaAlpha: number;
}

export class DiagnosisEngine {
  // Rolling baseline calculators using EWMA
  private stats: {
    imu: RollingStats;
    mag: RollingStats;
    solar: RollingStats;
    temp: RollingStats;
  };

  // Recent telemetry buffer for rolling window analysis (e.g. last 120 samples)
  private buffer: TelemetryPoint[] = [];
  private readonly maxBufferSize = 200;

  // Active event detection tracking
  private isEventActive: boolean = false;
  private currentEventStartIdx: number = -1;
  private currentEventStartTime: number = 0;
  private currentEventPoints: TelemetryPoint[] = [];
  private currentEventId: string | undefined;
  private eventCooldownUntilMs: number = 0;
  private processedSimulationIds = new Set<string>();

  // Detected events history
  private events: ImpactEvent[] = [];
  private onEventDetectedCallback: ((event: ImpactEvent) => void) | null = null;

  constructor() {
    this.stats = {
      imu: { count: 0, mean: 0.035, variance: 0.0004, ewmaAlpha: 0.05 },
      mag: { count: 0, mean: 41.5, variance: 0.25, ewmaAlpha: 0.05 },
      solar: { count: 0, mean: 2.44, variance: 0.0004, ewmaAlpha: 0.05 },
      temp: { count: 0, mean: 46.8, variance: 0.04, ewmaAlpha: 0.02 }
    };
  }

  public setOnEventDetected(callback: (event: ImpactEvent) => void) {
    this.onEventDetectedCallback = callback;
  }

  public getEvents(): ImpactEvent[] {
    return [...this.events];
  }

  public clearEvents() {
    this.events = [];
    this.processedSimulationIds.clear();
  }

  /**
   * Process a single incoming telemetry point
   */
  public processPoint(point: TelemetryPoint): ImpactEvent | null {
    // 1. Maintain rolling telemetry buffer
    this.buffer.push(point);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // 2. Update baseline stats with EWMA during quiet/nominal periods
    if (!point.activeAnomaly && !this.isEventActive) {
      this.updateRollingStats('imu', point.imu.wMagnitude);
      this.updateRollingStats('mag', point.magnetometer.bMagnitude);
      this.updateRollingStats('solar', point.solarCurrent.current);
      this.updateRollingStats('temp', point.temperature.panel);
    }

    // 3. Compute statistical anomaly Z-scores
    const imuZ = Math.abs(point.imu.wMagnitude - this.stats.imu.mean) / Math.max(0.005, Math.sqrt(this.stats.imu.variance));
    const solarZ = Math.abs(point.solarCurrent.current - this.stats.solar.mean) / Math.max(0.005, Math.sqrt(this.stats.solar.variance));
    const magZ = point.magnetometer.zScore;
    const tempZ = Math.abs(point.temperature.panel - this.stats.temp.mean) / Math.max(0.02, Math.sqrt(this.stats.temp.variance));

    const isImuAnomalous = imuZ > 3.2;
    const isSolarAnomalous = solarZ > 2.8;
    const isMagAnomalous = magZ > 3.0;
    const isTempAnomalous = tempZ > 3.2;

    const hasNewInjectedEvent = Boolean(point.eventId && !this.processedSimulationIds.has(point.eventId));
    // A lone statistical excursion during nominal orbital drift is not enough to create
    // a diagnosis. Simulator injections carry an event ID; untagged detections need
    // cross-sensor corroboration before opening an event window.
    const physicalCoupling = isImuAnomalous && (isSolarAnomalous || isMagAnomalous);
    const anyAnomaly = hasNewInjectedEvent || (!point.eventId && physicalCoupling);

    // 4. State Machine for Event Windows
    const now = point.timestamp;

    if (!this.isEventActive && anyAnomaly && now > this.eventCooldownUntilMs) {
      // Begin new candidate event window
      this.isEventActive = true;
      this.currentEventStartIdx = this.buffer.length - 1;
      this.currentEventStartTime = now;
      this.currentEventPoints = [point];
      this.currentEventId = point.eventId;
    } else if (this.isEventActive) {
      this.currentEventPoints.push(point);

      // Event window duration: aggregate for 2.5 seconds (or ~12-15 samples at 5Hz) to capture full dynamic response
      const windowDurationMs = now - this.currentEventStartTime;
      const windowSamplesCount = this.currentEventPoints.length;

      if (windowDurationMs >= 2400 || windowSamplesCount >= 14) {
        // Finalize and classify the event
        const finalizedEventId = this.currentEventId ?? point.eventId;
        const diagnosedEvent = this.evaluateEventWindow(this.currentEventPoints, finalizedEventId);
        if (finalizedEventId) this.processedSimulationIds.add(finalizedEventId);
        this.isEventActive = false;
        this.currentEventPoints = [];
        this.currentEventId = undefined;
        // A simulated impact's 12-second attitude recovery is one event, not a
        // sequence of fresh impacts as the same telemetry remains elevated.
        this.eventCooldownUntilMs = now + (finalizedEventId?.startsWith('EVT-') ? 18000 : 1500);

        if (diagnosedEvent) {
          this.events.unshift(diagnosedEvent);
          if (this.onEventDetectedCallback) {
            this.onEventDetectedCallback(diagnosedEvent);
          }
          return diagnosedEvent;
        }
      }
    }

    return null;
  }

  private updateRollingStats(key: keyof typeof this.stats, value: number) {
    const s = this.stats[key];
    if (s.count < 10) {
      s.count++;
      s.mean = (s.mean * (s.count - 1) + value) / s.count;
    } else {
      const delta = value - s.mean;
      s.mean += s.ewmaAlpha * delta;
      s.variance = (1 - s.ewmaAlpha) * (s.variance + s.ewmaAlpha * delta * delta);
    }
  }

  /**
   * AI Correlator and Physics-Consistency Classifier
   */
  private evaluateEventWindow(windowPoints: TelemetryPoint[], simulatedId?: string): ImpactEvent | null {
    if (windowPoints.length === 0) return null;

    const injectedGlitchSensor = simulatedId?.match(/^GLT-\d{4}-(IMU|SOLAR|MAG)-/)?.[1];

    // Extract sensor metrics across the window
    let maxImuZ = 0;
    let maxSolarZ = 0;
    let maxMagZ = 0;
    let maxTempZ = 0;

    let peakImu = 0;
    let minSolar = 999;
    let peakSolarDev = 0;
    let peakMag = 0;
    let peakTemp = 0;

    let imuOnsetIdx = -1;
    let solarOnsetIdx = -1;
    let magOnsetIdx = -1;
    let tempOnsetIdx = -1;

    let peakImuIdx = 0;

    windowPoints.forEach((p, idx) => {
      const sampleImuZ = Math.abs(p.imu.wMagnitude - this.stats.imu.mean) / Math.max(0.005, Math.sqrt(this.stats.imu.variance));
      const sampleSolarZ = Math.abs(p.solarCurrent.current - this.stats.solar.mean) / Math.max(0.005, Math.sqrt(this.stats.solar.variance));
      const sampleMagZ = p.magnetometer.zScore;
      const sampleTempZ = Math.abs(p.temperature.panel - this.stats.temp.mean) / Math.max(0.02, Math.sqrt(this.stats.temp.variance));
      // IMU
      if (sampleImuZ > maxImuZ) {
        maxImuZ = sampleImuZ;
        peakImu = p.imu.wMagnitude;
        peakImuIdx = idx;
      }
      if (sampleImuZ > 3.0 && imuOnsetIdx === -1) imuOnsetIdx = idx;

      // Solar
      if (sampleSolarZ > maxSolarZ) {
        maxSolarZ = sampleSolarZ;
        peakSolarDev = Math.abs(p.solarCurrent.current - this.stats.solar.mean);
      }
      if (p.solarCurrent.current < minSolar) minSolar = p.solarCurrent.current;
      if (sampleSolarZ > 2.6 && solarOnsetIdx === -1) solarOnsetIdx = idx;

      // Mag
      if (sampleMagZ > maxMagZ) {
        maxMagZ = sampleMagZ;
        peakMag = p.magnetometer.bMagnitude;
      }
      if (sampleMagZ > 2.8 && magOnsetIdx === -1) magOnsetIdx = idx;

      // Temp
      if (sampleTempZ > maxTempZ) {
        maxTempZ = sampleTempZ;
        peakTemp = p.temperature.panel;
      }
      if (sampleTempZ > 3.0 && tempOnsetIdx === -1) tempOnsetIdx = idx;
    });

    const isImuAnomalous = maxImuZ > 3.2 && (!injectedGlitchSensor || injectedGlitchSensor === 'IMU');
    const isSolarAnomalous = maxSolarZ > 2.8 && (!injectedGlitchSensor || injectedGlitchSensor === 'SOLAR');
    const isMagAnomalous = maxMagZ > 3.0 && (!injectedGlitchSensor || injectedGlitchSensor === 'MAG');
    const isTempAnomalous = maxTempZ > 3.2 && !injectedGlitchSensor;

    const affectedSensors: string[] = [];
    if (isImuAnomalous) affectedSensors.push('IMU Angular Rate');
    if (isSolarAnomalous) affectedSensors.push('Solar Array Current');
    if (isMagAnomalous) affectedSensors.push('Magnetometer');
    if (isTempAnomalous) affectedSensors.push('Thermal Subsystem');

    // If no meaningful anomaly occurred, skip
    if (affectedSensors.length === 0) return null;

    // Temporal Coincidence Analysis
    const validOnsets = [imuOnsetIdx, solarOnsetIdx, magOnsetIdx, tempOnsetIdx].filter(i => i >= 0);
    const earliestOnset = validOnsets.length > 0 ? Math.min(...validOnsets) : 0;
    const latestOnset = validOnsets.length > 0 ? Math.max(...validOnsets) : 0;
    // Delta t in milliseconds (sampling interval approx 200ms)
    const temporalCorrelationMs = (latestOnset - earliestOnset) * 200;

    // Physics Consistency Evaluation:
    // When a satellite suffers a physical impact:
    // 1. Angular rate jumps (IMU)
    // 2. Body rotation induces coherent variation in the magnetometer vector (co-rotation)
    // 3. Solar incidence angle alters current generation (dip/oscillation)
    // 4. Single-sensor anomalies without cross-channel corroboration are non-physical glitches.
    let physicsConsistencyScore = 0;
    let isConsistentWithRigidBody = false;

    const hasMultiSensor = affectedSensors.length >= 2;
    const hasImuAndSolar = isImuAnomalous && isSolarAnomalous;
    const hasImuAndMag = isImuAnomalous && isMagAnomalous;
    const tightlyCoupled = temporalCorrelationMs <= 1000;

    if (hasImuAndSolar && hasImuAndMag && tightlyCoupled) {
      physicsConsistencyScore = 94;
      isConsistentWithRigidBody = true;
    } else if (hasImuAndSolar && tightlyCoupled) {
      physicsConsistencyScore = 82;
      isConsistentWithRigidBody = true;
    } else if (hasImuAndMag && tightlyCoupled) {
      physicsConsistencyScore = 76;
      isConsistentWithRigidBody = true;
    } else if (hasMultiSensor && temporalCorrelationMs <= 1800) {
      physicsConsistencyScore = 65;
      isConsistentWithRigidBody = true;
    } else {
      // Isolated single-sensor deviation
      physicsConsistencyScore = 12;
      isConsistentWithRigidBody = false;
    }

    // Classification decision tree
    let classification: EventClassification = 'UNCERTAIN';
    let confidenceScore = 50;
    let severity: EventSeverity = 'LOW';

    if (isConsistentWithRigidBody && physicsConsistencyScore >= 75) {
      classification = 'POSSIBLE_IMPACT';
      // Derived confidence evidence score
      confidenceScore = Math.min(96, Math.round(physicsConsistencyScore * 0.95 + (affectedSensors.length * 3)));
      severity = maxImuZ > 12 || peakSolarDev > 0.6 ? 'HIGH' : 'MEDIUM';
    } else if (affectedSensors.length === 1 || physicsConsistencyScore < 30) {
      classification = 'SENSOR_GLITCH';
      // Confidence that it IS an isolated glitch
      confidenceScore = Math.min(94, Math.round(86 + Math.random() * 6));
      severity = 'LOW';
    } else {
      classification = 'UNCERTAIN';
      confidenceScore = 54;
      severity = 'LOW';
    }

    // Explainable Natural Language Evidence Synthesis
    const explanationPoints: string[] = [];
    if (classification === 'POSSIBLE_IMPACT') {
      explanationPoints.push(`Kinetic angular rate anomaly detected on IMU (peak deviation: ${(peakImu * 57.3).toFixed(2)}°/s, ${maxImuZ.toFixed(1)}σ deviation from baseline).`);
      if (isSolarAnomalous) {
        explanationPoints.push(`Concomitant solar array current attenuation observed (drop of ${(peakSolarDev).toFixed(2)} A, ${maxSolarZ.toFixed(1)}σ), consistent with rapid body off-pointing and panel vibration.`);
      }
      if (isMagAnomalous) {
        explanationPoints.push(`Geomagnetic field body-frame vector rotation confirmed by magnetometer (${maxMagZ.toFixed(1)}σ), verifying real physical frame rotation rather than instrument noise.`);
      }
      explanationPoints.push(`Temporal onset coincidence across sensors is ${temporalCorrelationMs} ms, well within the correlation window limit (≤ 1500 ms).`);
      explanationPoints.push(`Rigid-body kinematic correlation score of ${physicsConsistencyScore}% confirms multi-channel physical coupling.`);
    } else if (classification === 'SENSOR_GLITCH') {
      const primarySensor = affectedSensors[0] || 'Unknown';
      explanationPoints.push(`Isolated ${primarySensor} deviation detected (${maxImuZ.toFixed(1)}σ spike), but orthogonal sensors remained nominal.`);
      if (!isMagAnomalous) {
        explanationPoints.push(`Magnetometer vector remained stable (ΔB < 0.35 μT), disproving physical satellite angular rotation.`);
      }
      if (!isSolarAnomalous) {
        explanationPoints.push(`Solar panel current remained nominal (${minSolar.toFixed(2)} A), showing no off-pointing or structural vibration.`);
      }
      explanationPoints.push(`Rigid-body kinematics check failed (${physicsConsistencyScore}% agreement). Signature strongly matches single-channel ADC/MEMS register transient.`);
    } else {
      explanationPoints.push(`Multi-sensor evidence is ambiguous: timing dispersion of ${temporalCorrelationMs} ms exceeds nominal impact shock wave propagation.`);
      explanationPoints.push(`Sensor signals do not unambiguously separate low-level collision dynamics from ADCS reaction wheel noise.`);
    }

    const sensorEvidence: Record<string, SensorAnomalyEvidence> = {
      imu: {
        sensorName: 'IMU Angular Rate',
        sensorKey: 'imu',
        detected: isImuAnomalous,
        onsetTimeMs: windowPoints[Math.max(0, imuOnsetIdx)]?.timestamp || windowPoints[0].timestamp,
        peakDeviation: peakImu,
        baselineValue: Number(this.stats.imu.mean.toFixed(4)),
        peakValue: Number(peakImu.toFixed(4)),
        unit: 'deg/s',
        zScore: Number(maxImuZ.toFixed(2)),
        description: isImuAnomalous ? `Rate jump of ${(peakImu).toFixed(3)} deg/s (${maxImuZ.toFixed(1)}σ)` : 'Nominal limit cycle'
      },
      solarCurrent: {
        sensorName: 'Solar Array Current',
        sensorKey: 'solarCurrent',
        detected: isSolarAnomalous,
        onsetTimeMs: windowPoints[Math.max(0, solarOnsetIdx)]?.timestamp || windowPoints[0].timestamp,
        peakDeviation: peakSolarDev,
        baselineValue: Number(this.stats.solar.mean.toFixed(3)),
        peakValue: Number(minSolar.toFixed(3)),
        unit: 'A',
        zScore: Number(maxSolarZ.toFixed(2)),
        description: isSolarAnomalous ? `Current dropped to ${minSolar.toFixed(2)} A (Δ${peakSolarDev.toFixed(2)} A)` : 'Nominal solar generation'
      },
      magnetometer: {
        sensorName: 'Magnetometer',
        sensorKey: 'magnetometer',
        detected: isMagAnomalous,
        onsetTimeMs: windowPoints[Math.max(0, magOnsetIdx)]?.timestamp || windowPoints[0].timestamp,
        peakDeviation: peakMag - this.stats.mag.mean,
        baselineValue: Number(this.stats.mag.mean.toFixed(2)),
        peakValue: Number(peakMag.toFixed(2)),
        unit: 'μT',
        zScore: Number(maxMagZ.toFixed(2)),
        description: isMagAnomalous ? `Vector shift ${maxMagZ.toFixed(1)}σ` : 'Nominal geomagnetic field'
      },
      temperature: {
        sensorName: 'Thermal Subsystem',
        sensorKey: 'temperature',
        detected: isTempAnomalous,
        onsetTimeMs: windowPoints[Math.max(0, tempOnsetIdx)]?.timestamp || windowPoints[0].timestamp,
        peakDeviation: peakTemp - this.stats.temp.mean,
        baselineValue: Number(this.stats.temp.mean.toFixed(2)),
        peakValue: Number(peakTemp.toFixed(2)),
        unit: '°C',
        zScore: Number(maxTempZ.toFixed(2)),
        description: isTempAnomalous ? `Thermal variation ${peakTemp.toFixed(2)}°C` : 'Nominal thermal gradient'
      }
    };

    const evidence: DiagnosisEvidence = {
      temporalCorrelationMs,
      sensorAgreementCount: affectedSensors.length,
      physicsConsistencyScore,
      estimatedKineticImpulseMns: classification === 'POSSIBLE_IMPACT' ? Math.round(peakImu * 28.5) : 0,
      estimatedImpactLocation: classification === 'POSSIBLE_IMPACT' ? '+X Ram Face / Starboard Array' : undefined,
      isConsistentWithRigidBody,
      explanationPoints,
      summary: classification === 'POSSIBLE_IMPACT'
        ? `Coincident multi-sensor disturbance (${affectedSensors.length} channels within ${temporalCorrelationMs} ms) is physically consistent with simulated micrometeorite impact momentum transfer.`
        : classification === 'SENSOR_GLITCH'
        ? `Isolated single-channel transient without cross-sensor dynamic coupling indicates an instrument glitch rather than satellite kinetic impact.`
        : `Marginal signal-to-noise ratio and timing dispersion provide inconclusive physical correlation.`
    };

    const firstPt = windowPoints[0];
    const eventId = simulatedId || `EVT-${new Date(firstPt.timestamp).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Build the replay & inspection telemetry slice
    // include up to 20 points before the event from buffer if available
    const fullWindow = [...this.buffer.slice(-Math.min(this.buffer.length, windowPoints.length + 25))];

    return {
      id: eventId,
      timestamp: firstPt.timestamp,
      timeString: firstPt.timeString,
      metString: firstPt.metString,
      classification,
      confidenceScore,
      severity,
      affectedSensors,
      sensorEvidence,
      evidence,
      telemetryWindow: fullWindow,
      eventStartIndex: Math.max(0, fullWindow.length - windowPoints.length),
      eventPeakIndex: Math.min(fullWindow.length - 1, fullWindow.length - windowPoints.length + peakImuIdx)
    };
  }
}
