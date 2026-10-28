import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  Activity
} from 'lucide-react';

export const SimulationToolbar: React.FC = () => {
  const {
    isRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    injectImpact,
    injectGlitch,
    restoreNominal,
    hasImpactDisturbance,
    config
  } = useMission();

  const [lastInjectedId, setLastInjectedId] = useState<string | null>(null);
  const [showImpactMenu, setShowImpactMenu] = useState(false);
  const [showGlitchMenu, setShowGlitchMenu] = useState(false);

  const handleImpact = (severity: 'MEDIUM' | 'HIGH') => {
    const id = injectImpact(severity);
    setLastInjectedId(id);
    setShowImpactMenu(false);
    setTimeout(() => setLastInjectedId(null), 4000);
  };

  const handleGlitch = (sensor: 'imu' | 'solar' | 'mag') => {
    const id = injectGlitch(sensor);
    setLastInjectedId(id);
    setShowGlitchMenu(false);
    setTimeout(() => setLastInjectedId(null), 4000);
  };

  return (
    <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
      {/* Left: Engine Run State & Modes */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={isRunning ? pauseSimulation : startSimulation}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
              isRunning
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="font-editorial">PAUSE SIM</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span className="font-editorial">RESUME SIM</span>
              </>
            )}
          </button>

          <button
            onClick={resetSimulation}
            title="Reset telemetry baseline & clear state"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-[#a3abb8] border border-[rgba(240,230,215,0.08)] hover:bg-[#151a22] hover:text-[#f4f0e8] transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#8c939f]" />
            <span className="hidden sm:inline font-editorial">RESET</span>
          </button>
        </div>

        <div className="h-5 w-[1px] bg-[rgba(240,230,215,0.1)]" />

        {/* State Tag */}
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${hasImpactDisturbance ? 'bg-rose-500 animate-ping' : isRunning ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="text-[11px] font-mono-tech uppercase text-[#d5dedb]">
            {hasImpactDisturbance ? 'PERTURBATION ACTIVE' : isRunning ? 'STREAM NOMINAL' : 'SIMULATION HALTED'}
          </span>
          <span className="text-[10px] text-[#717a87] font-mono-tech">
            ({config.updateRateHz} Hz Downlink)
          </span>
        </div>
      </div>

      {/* Center: Last Injection Toast if active */}
      {lastInjectedId && (
        <div className="animate-fade-in bg-[#d97742]/15 border border-[#d97742]/40 text-[#f4f0e8] text-xs px-3 py-1 rounded-full flex items-center space-x-2 shadow-md">
          <Activity className="w-3.5 h-3.5 text-[#d97742] animate-spin" />
          <span className="font-mono-tech">INJECTED: {lastInjectedId}</span>
        </div>
      )}

      {/* Right: Functional Injections */}
      <div className="flex items-center space-x-2">
        {/* Restore Nominal */}
        <button
          onClick={restoreNominal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#a3abb8] border border-[rgba(240,230,215,0.08)] hover:bg-[#151a22] hover:text-emerald-300 transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-editorial">NOMINAL</span>
        </button>

        {/* Glitch Injection Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowGlitchMenu(!showGlitchMenu);
              setShowImpactMenu(false);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-editorial">INJECT GLITCH</span>
            <ChevronDown className="w-3 h-3 text-amber-400" />
          </button>

          {showGlitchMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#13171f] border border-[rgba(240,230,215,0.12)] rounded-xl shadow-2xl py-1.5 z-40 backdrop-blur-xl">
              <button
                onClick={() => handleGlitch('imu')}
                className="w-full text-left px-3.5 py-2.5 text-xs text-[#ede8df] hover:bg-[#1a202a] flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-[#f4f0e8] font-editorial">IMU Gyro Register Spike</div>
                  <div className="text-[10px] text-[#8c939f]">Single-axis bit-flip</div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono-tech">+3.8°/s</span>
              </button>
              <button
                onClick={() => handleGlitch('solar')}
                className="w-full text-left px-3.5 py-2.5 text-xs text-[#ede8df] hover:bg-[#1a202a] flex items-center justify-between border-t border-[rgba(240,230,215,0.06)]"
              >
                <div>
                  <div className="font-medium text-[#f4f0e8] font-editorial">Solar Current ADC Drop</div>
                  <div className="text-[10px] text-[#8c939f]">Isolated ADC channel fault</div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono-tech">0.08 A</span>
              </button>
              <button
                onClick={() => handleGlitch('mag')}
                className="w-full text-left px-3.5 py-2.5 text-xs text-[#ede8df] hover:bg-[#1a202a] flex items-center justify-between border-t border-[rgba(240,230,215,0.06)]"
              >
                <div>
                  <div className="font-medium text-[#f4f0e8] font-editorial">Magnetometer Step Spike</div>
                  <div className="text-[10px] text-[#8c939f]">Zero mechanical body motion</div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono-tech">+28 μT</span>
              </button>
            </div>
          )}
        </div>

        {/* Impact Injection Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowImpactMenu(!showImpactMenu);
              setShowGlitchMenu(false);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/50 hover:bg-[#d97742]/30 transition shadow-md"
          >
            <Zap className="w-3.5 h-3.5 text-[#e68d5c]" />
            <span className="font-editorial">INJECT IMPACT</span>
            <ChevronDown className="w-3 h-3 text-[#e68d5c]" />
          </button>

          {showImpactMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-[#13171f] border border-[rgba(240,230,215,0.12)] rounded-xl shadow-2xl py-1.5 z-40 backdrop-blur-xl">
              <button
                onClick={() => handleImpact('HIGH')}
                className="w-full text-left px-3.5 py-2.5 text-xs text-[#ede8df] hover:bg-[#1a202a] flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-rose-300 font-editorial">Severe Micrometeorite Strike</div>
                  <div className="text-[10px] text-[#8c939f]">High kinetic ΔV & solar current drop</div>
                </div>
                <span className="text-[10px] text-rose-400 font-mono-tech">84 mN·s</span>
              </button>
              <button
                onClick={() => handleImpact('MEDIUM')}
                className="w-full text-left px-3.5 py-2.5 text-xs text-[#ede8df] hover:bg-[#1a202a] flex items-center justify-between border-t border-[rgba(240,230,215,0.06)]"
              >
                <div>
                  <div className="font-semibold text-amber-300 font-editorial">Moderate Debris Strike</div>
                  <div className="text-[10px] text-[#8c939f]">Attitude wobble & panel flex</div>
                </div>
                <span className="text-[10px] text-amber-400 font-mono-tech">42 mN·s</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
