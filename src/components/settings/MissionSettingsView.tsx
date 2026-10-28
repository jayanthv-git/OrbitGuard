import React from 'react';
import { useMission } from '../../context/MissionContext';
import { Settings, Sliders, Shield, RotateCcw, Info } from 'lucide-react';

export const MissionSettingsView: React.FC = () => {
  const { config, updateConfig, resetConfig } = useMission();

  return (
    <div className="max-w-4xl space-y-6 select-none">
      {/* Header */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#d97742]/15 border border-[#d97742]/40 text-[#d97742]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#faf7f2] tracking-wide uppercase font-display">
              MISSION CONTROL & DIAGNOSTIC ENGINE CONFIGURATION
            </h2>
            <p className="text-xs text-[#8c939f] font-editorial mt-0.5">
              Tune rolling baseline statistical thresholds, temporal correlation bounds, and simulated noise filters.
            </p>
          </div>
        </div>

        <button
          onClick={resetConfig}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs text-[#a3abb8] border border-[rgba(240,230,215,0.08)] hover:bg-[#151a22] hover:text-[#f4f0e8] transition font-editorial"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#8c939f]" />
          <span>RESET TO DEFAULTS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Anomaly Detection Sensitivity */}
        <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#faf7f2] uppercase tracking-wide border-b border-[rgba(240,230,215,0.08)] pb-2.5 font-display">
            <Sliders className="w-4 h-4 text-[#d97742]" />
            <span>STATISTICAL ANOMALY THRESHOLDS (Z-SCORE σ)</span>
          </div>

          {/* IMU Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-editorial">
              <span className="text-[#d5dedb]">IMU Rate Gyro Threshold (τ_imu)</span>
              <span className="font-mono-tech font-semibold text-[#d97742]">{config.imuThresholdZ} σ</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.1"
              value={config.imuThresholdZ}
              onChange={(e) => updateConfig({ imuThresholdZ: parseFloat(e.target.value) })}
              className="w-full accent-[#d97742] h-1.5 bg-[#1a212c] rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-[#717a87]">
              Minimum sigma deviation required to trigger angular rate impulse candidate.
            </div>
          </div>

          {/* Solar Current Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-editorial">
              <span className="text-[#d5dedb]">Solar Array Dip Threshold (τ_solar)</span>
              <span className="font-mono-tech font-semibold text-amber-300">{config.solarThresholdZ} σ</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="4.5"
              step="0.1"
              value={config.solarThresholdZ}
              onChange={(e) => updateConfig({ solarThresholdZ: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 h-1.5 bg-[#1a212c] rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-[#717a87]">
              Sensitivity to attitude off-pointing current loss and array micro-shadowing.
            </div>
          </div>

          {/* Magnetometer Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-editorial">
              <span className="text-[#d5dedb]">Magnetometer Deviation Threshold (τ_mag)</span>
              <span className="font-mono-tech font-semibold text-indigo-300">{config.magThresholdZ} σ</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.1"
              value={config.magThresholdZ}
              onChange={(e) => updateConfig({ magThresholdZ: parseFloat(e.target.value) })}
              className="w-full accent-indigo-400 h-1.5 bg-[#1a212c] rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-[#717a87]">
              Verifies body co-rotation against Earth geomagnetic background reference vector.
            </div>
          </div>
        </div>

        {/* Card 2: Temporal Correlation & Telemetry Stream */}
        <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#faf7f2] uppercase tracking-wide border-b border-[rgba(240,230,215,0.08)] pb-2.5 font-display">
            <Shield className="w-4 h-4 text-[#d97742]" />
            <span>CROSS-SENSOR CORRELATION WINDOW</span>
          </div>

          {/* Window size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-editorial">
              <span className="text-[#d5dedb]">Max Coincidence Window (Δt_window)</span>
              <span className="font-mono-tech font-semibold text-[#d97742]">{config.correlationWindowMs} ms</span>
            </div>
            <input
              type="range"
              min="500"
              max="4000"
              step="100"
              value={config.correlationWindowMs}
              onChange={(e) => updateConfig({ correlationWindowMs: parseInt(e.target.value, 10) })}
              className="w-full accent-[#d97742] h-1.5 bg-[#1a212c] rounded-lg cursor-pointer"
            />
            <div className="text-[10px] text-[#717a87]">
              Anomalies on multiple channels must onset within this window to correlate as an impact.
            </div>
          </div>

          {/* Telemetry Stream Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-editorial">
              <span className="text-[#d5dedb]">Downlink Stream Frequency</span>
              <span className="font-mono-tech font-semibold text-emerald-400">{config.updateRateHz} Hz</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {[5, 10].map((hz) => (
                <button
                  key={hz}
                  onClick={() => updateConfig({ updateRateHz: hz })}
                  className={`py-2 rounded-lg text-xs font-mono-tech border transition ${
                    config.updateRateHz === hz
                      ? 'bg-[#d97742]/20 border-[#d97742]/50 text-[#f4f0e8] font-bold shadow-sm'
                      : 'bg-[#12161f] border-[rgba(240,230,215,0.08)] text-[#8c939f] hover:text-[#f4f0e8]'
                  }`}
                >
                  {hz} Hz ({1000 / hz}ms period)
                </button>
              ))}
            </div>
            <div className="text-[10px] text-[#717a87]">
              5 Hz provides smooth real-time telemetry rendering with ultra-low CPU overhead.
            </div>
          </div>
        </div>
      </div>

      {/* Physics Model Guidance */}
      <div className="bg-[#0e1218] border border-[rgba(217,119,66,0.2)] rounded-xl p-4 flex items-start space-x-3.5 text-xs shadow-sm">
        <Info className="w-4 h-4 text-[#d97742] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="font-semibold text-[#f4f0e8] uppercase tracking-wide font-display">
            AEROSPACE DIAGNOSIS LOGIC PRINCIPLES
          </div>
          <p className="text-[#a3abb8] leading-relaxed font-editorial">
            A small satellite in orbit has no dedicated acoustic or piezoelectric impact grid. When struck by orbital debris or a micrometeorite, the kinetic impulse creates an abrupt angular acceleration (measured by the rate gyros), immediate body off-pointing that dips solar array photovoltaic current, and dynamic deflection of the magnetic field vector. Isolated electrical noise or radiation bit-flips perturb single registers without cross-sensor dynamic coupling.
          </p>
        </div>
      </div>
    </div>
  );
};
