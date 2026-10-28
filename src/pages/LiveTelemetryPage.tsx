import React from 'react';
import { SimulationToolbar } from '../components/telemetry/SimulationToolbar';
import { TelemetryCharts } from '../components/telemetry/TelemetryCharts';
import { useMission } from '../context/MissionContext';
import { Radio, Info } from 'lucide-react';

export const LiveTelemetryPage: React.FC = () => {
  const { latestTelemetry, isRunning } = useMission();

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto select-none">
      {/* Simulation Controls Toolbar */}
      <SimulationToolbar />

      {/* Header Info Banner */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center space-x-2.5">
          <Radio className={`w-4 h-4 ${isRunning ? 'text-[#d97742] animate-pulse' : 'text-slate-500'}`} />
          <span className="font-semibold text-[#faf7f2] uppercase tracking-wide font-display">
            SYNCHRONIZED MULTI-SENSOR DOWNLINK STREAM
          </span>
        </div>

        <div className="flex items-center space-x-4 font-mono-tech text-[#8c939f]">
          <span>Active Packet: <span className="text-[#f4f0e8]">{latestTelemetry?.metString ?? 'T+00:00:00'}</span></span>
          <span>Sampling Interval: <span className="text-[#f4f0e8]">200 ms</span></span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-semibold font-editorial">100% Signal Quality</span>
          </span>
        </div>
      </div>

      {/* 4 Multi-Channel Synchronized Charts */}
      <TelemetryCharts />

      {/* Real-time Subsystem Status Bar */}
      <div className="bg-[#0e1218] border border-[rgba(217,119,66,0.2)] rounded-xl p-4 flex items-start space-x-3.5 text-xs shadow-sm">
        <Info className="w-4 h-4 text-[#d97742] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="font-semibold text-[#f4f0e8] uppercase tracking-wide font-display">
            DATA PIPELINE & SENSOR CROSS-CORRELATION
          </div>
          <p className="text-[#a3abb8] leading-relaxed font-editorial">
            Telemetry is continuously streamed into an onboard sliding-window buffer. An adaptive Exponentially Weighted Moving Average (EWMA) tracks dynamic rolling baselines to detect micro-vibrations and impulses without prior calibration. If an anomaly is flagged, the temporal correlator verifies physical momentum conservation across orthogonal axes.
          </p>
        </div>
      </div>
    </div>
  );
};
