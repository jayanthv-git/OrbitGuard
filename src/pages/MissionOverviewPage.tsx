import React from 'react';
import { useMission } from '../context/MissionContext';
import { CubeSatViewer } from '../components/satellite/CubeSatViewer';
import { SensorSparkline } from '../components/telemetry/SensorSparkline';
import { SimulationToolbar } from '../components/telemetry/SimulationToolbar';
import { Activity, ArrowUpRight, Compass, Sun, Zap, Radio, Thermometer } from 'lucide-react';

interface MissionOverviewPageProps {
  onNavigateToDiagnosis: () => void;
  onNavigateToTelemetry: () => void;
}

export const MissionOverviewPage: React.FC<MissionOverviewPageProps> = ({
  onNavigateToDiagnosis,
  onNavigateToTelemetry
}) => {
  const { latestTelemetry, telemetryHistory, events, setSelectedEvent, hasImpactDisturbance } = useMission();
  const impactCount = events.filter((event) => event.classification === 'POSSIBLE_IMPACT').length;
  const glitchCount = events.filter((event) => event.classification === 'SENSOR_GLITCH').length;
  const recentEvents = events.slice(0, 3);

  const sensors = [
    {
      label: 'Attitude rate',
      value: latestTelemetry?.imu.wMagnitude.toFixed(3) ?? '0.035',
      unit: '°/s',
      status: latestTelemetry?.imu.anomaly,
      icon: Compass,
      color: '#d97742',
      data: telemetryHistory.slice(-24).map((p) => p.imu.wMagnitude)
    },
    {
      label: 'Solar array current',
      value: latestTelemetry?.solarCurrent.current.toFixed(2) ?? '2.44',
      unit: 'A',
      status: latestTelemetry?.solarCurrent.anomaly,
      icon: Sun,
      color: '#fbbf24',
      data: telemetryHistory.slice(-24).map((p) => p.solarCurrent.current)
    },
    {
      label: 'Geomagnetic field',
      value: latestTelemetry?.magnetometer.bMagnitude.toFixed(1) ?? '41.5',
      unit: 'μT',
      status: latestTelemetry?.magnetometer.anomaly,
      icon: Radio,
      color: '#818cf8',
      data: telemetryHistory.slice(-24).map((p) => p.magnetometer.bMagnitude)
    },
    {
      label: 'Panel temperature',
      value: latestTelemetry?.temperature.panel.toFixed(1) ?? '46.8',
      unit: '°C',
      status: latestTelemetry?.temperature.anomaly,
      icon: Thermometer,
      color: '#10b981',
      data: telemetryHistory.slice(-24).map((p) => p.temperature.panel)
    },
  ];

  return (
    <div className="mission-page space-y-6">
      {/* Editorial Mission Heading */}
      <div className="mission-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-mark" />
            <span>FLIGHT OPERATIONS</span>
            <span className="eyebrow-sep">/</span>
            <span>LEO DEMO MISSION 01</span>
          </div>
          <h1>Read every signal.</h1>
          <p className="mission-subtitle">
            A live picture of spacecraft health and impact evidence for <span>OG-SAT-01</span>
          </p>
        </div>
      </div>

      {/* The spacecraft is the mission's visual anchor. */}
      <div className="spacecraft-hero-stage">
        <CubeSatViewer />
        <div className="hero-caption" aria-hidden="true">
          <span>OG—01</span><i /> LOW EARTH ORBIT <i /> DIGITAL TWIN
        </div>
      </div>

      {/* Simulation controls remain immediately below the live spacecraft view. */}
      <SimulationToolbar />

      {/* Quiet, single-line mission readout. */}
      <div className="mission-readout">
        {/* Status */}
        <div className="readout-item">
          <span className="text-[10px] text-[#8c939f] font-semibold tracking-wider uppercase font-editorial">
            SPACECRAFT STATUS
          </span>
          <div className="readout-value mt-1 flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                hasImpactDisturbance ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className={`text-base font-bold font-editorial ${
              hasImpactDisturbance ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {hasImpactDisturbance ? 'Perturbation' : 'Nominal'}
            </span>
          </div>
          <span className="text-[10px] text-[#717a87] font-mono-tech mt-0.5">520 km SSO Orbit</span>
        </div>

        {/* MET Clock */}
        <div className="readout-item">
          <span className="text-[10px] text-[#8c939f] font-semibold tracking-wider uppercase font-editorial">
            MISSION ELAPSED
          </span>
          <div className="readout-value mt-1 text-base font-bold font-mono-tech text-[#f4f0e8]">
            {latestTelemetry?.metString ?? 'T+04:18:23'}
          </div>
          <span className="text-[10px] text-[#717a87] font-mono-tech mt-0.5">MET Flight Time</span>
        </div>

        {/* Anomalies Evaluated */}
        <div className="readout-item">
          <span className="text-[10px] text-[#8c939f] font-semibold tracking-wider uppercase font-editorial">
            ANOMALIES
          </span>
          <div className="readout-value mt-1 text-base font-bold font-mono-tech text-[#f4f0e8]">
            {events.length} <small className="text-xs text-[#8c939f] font-normal">signals</small>
          </div>
          <span className="text-[10px] text-[#717a87] font-mono-tech mt-0.5">AI Engine Tracked</span>
        </div>

        {/* Possible Impacts */}
        <div className="readout-item">
          <span className="text-[10px] text-[#8c939f] font-semibold tracking-wider uppercase font-editorial">
            POSSIBLE IMPACTS
          </span>
          <div className="readout-value mt-1 text-base font-bold font-mono-tech text-rose-400 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-rose-400" />
            <span>{impactCount}</span>
          </div>
          <span className="text-[10px] text-[#717a87] font-mono-tech mt-0.5">Kinetic Multi-Sensor</span>
        </div>

        {/* Sensor Glitches */}
        <div className="readout-item">
          <span className="text-[10px] text-[#8c939f] font-semibold tracking-wider uppercase font-editorial">
            SENSOR GLITCHES
          </span>
          <div className="readout-value mt-1 text-base font-bold font-mono-tech text-amber-400">
            {glitchCount}
          </div>
          <span className="text-[10px] text-[#717a87] font-mono-tech mt-0.5">Isolated Circuit Flips</span>
        </div>

        {/* UTC Clock */}
        <div className="readout-item">
          <span className="text-[10px] text-[#8c939f] font-semibold tracking-wider uppercase font-editorial">
            DOWNLINK UTC
          </span>
          <div className="readout-value mt-1 text-base font-bold font-mono-tech text-[#d5dedb]">
            {latestTelemetry?.timeString ?? '00:00:00'}
          </div>
          <span className="text-[10px] text-[#717a87] font-mono-tech mt-0.5">Packet Realtime</span>
        </div>
      </div>

      {/* Lower Dual Columns: Subsystems Telemetry Horizon (Left) & Detection Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Subsystems Horizon (8 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#d97742] font-mono-tech">01</span>
              <h2 className="text-sm font-semibold text-[#faf7f2] font-display">Subsystem Telemetry</h2>
            </div>
            <button
              onClick={onNavigateToTelemetry}
              className="text-xs text-[#d97742] hover:text-[#e68d5c] flex items-center space-x-1 font-editorial transition"
            >
              <span>Waveform Analysis</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sensors.map(({ label, value, unit, status, icon: Icon, color, data }) => (
              <div
                key={label}
                className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] hover:border-[#d97742]/30 rounded-xl p-4 transition shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)]" style={{ color }}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono-tech border ${
                      status
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {status ? 'Anomaly' : 'Nominal'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[#8c939f] font-editorial uppercase tracking-wider">{label}</div>
                <div className="mt-1 text-2xl font-bold font-mono-tech text-[#f4f0e8] flex items-baseline justify-between">
                  <span>
                    {value} <small className="text-xs text-[#8c939f] font-normal">{unit}</small>
                  </span>
                  <div className="h-6 w-24">
                    <SensorSparkline data={data} color={color} width={96} height={24} isAnomaly={status} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#0e1218] border border-[rgba(240,230,215,0.08)] flex items-center justify-between text-xs text-[#8c939f]">
            <span className="font-editorial">All spacecraft telemetry is generated by the orbital dynamics simulator.</span>
            <span className="font-mono-tech text-[#d97742] text-[11px]">LEO PASS #1402</span>
          </div>
        </div>

        {/* Recent Detection Log (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#d97742] font-mono-tech">02</span>
              <h2 className="text-sm font-semibold text-[#faf7f2] font-display">Detection Signals</h2>
            </div>
            <button
              onClick={onNavigateToDiagnosis}
              className="text-xs text-[#d97742] hover:text-[#e68d5c] flex items-center space-x-1 font-editorial transition"
            >
              <span>Full Diagnosis</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="signals-panel">
            <div className="px-4 py-3 border-b border-[rgba(240,230,215,0.08)] flex items-center justify-between text-xs text-[#8c939f]">
              <div className="flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-[#d97742]" />
                <span className="font-semibold text-[#f4f0e8] font-editorial tracking-wide">RECENT CORRELATED EVENTS</span>
              </div>
              <span className="font-mono-tech text-[11px]">{events.length} Recorded</span>
            </div>

            <div className="divide-y divide-[rgba(240,230,215,0.06)]">
              {recentEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#717a87] font-editorial">
                  No anomalous events detected. Satellite telemetry is nominal.
                </div>
              ) : (
                recentEvents.map((event) => {
                  const impact = event.classification === 'POSSIBLE_IMPACT';
                  return (
                    <button
                      key={event.id}
                      className="signal-row"
                      onClick={() => {
                        setSelectedEvent(event);
                        onNavigateToDiagnosis();
                      }}
                    >
                      <span className={`signal-indicator ${impact ? 'indicator-impact' : 'indicator-glitch'}`} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-editorial text-[#faf7f2]">
                            {impact ? 'Possible Micrometeorite Impact' : 'Sensor Glitch / Bit-Flip'}
                          </span>
                          <span className="text-[10px] text-[#8c939f] font-mono-tech">{event.timeString}</span>
                        </div>
                        <p className="text-[11px] text-[#9aa2ac] line-clamp-2 leading-relaxed">
                          {event.evidence.summary}
                        </p>
                        <div className="text-[10px] text-[#717a87] font-mono-tech">
                          Channels: {event.affectedSensors.join(' · ')}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold font-mono-tech text-[#d97742]">
                          {event.confidenceScore}%
                        </div>
                        <div className="text-[9px] text-[#717a87]">Confidence</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 bg-[rgba(255,255,255,0.02)] flex items-center justify-between text-[11px] text-[#8c939f]">
              <span>SIMULATED IMPACT CLASSIFIER</span>
              <button
                onClick={onNavigateToDiagnosis}
                className="text-[#d97742] hover:text-[#e68d5c] font-medium flex items-center space-x-1"
              >
                <span>Inspect Evidence</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
