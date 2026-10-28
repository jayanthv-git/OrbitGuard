import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { useMission } from '../../context/MissionContext';
import { Compass, Sun, Zap, Thermometer } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  unit: string;
}

const AerospaceTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12161f]/95 border border-[rgba(240,230,215,0.12)] p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono-tech">
        <div className="text-[10px] text-[#8c939f] border-b border-[rgba(240,230,215,0.08)] pb-1.5 mb-2 flex justify-between gap-4 font-editorial">
          <span>UTC: {label}</span>
          <span className="text-[#d97742] font-semibold">SIMULATED TELEMETRY</span>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span style={{ color: entry.color }} className="flex items-center space-x-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-editorial">{entry.name}:</span>
            </span>
            <span className="text-[#f4f0e8] font-semibold font-mono-tech">
              {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value} {unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const TelemetryCharts: React.FC = () => {
  const { telemetryHistory } = useMission();

  // Prepare chart datasets
  const chartData = useMemo(() => {
    return telemetryHistory.map((pt) => ({
      time: pt.timeString.substring(3, 11), // mm:ss.SS
      rawTime: pt.timeString,
      wx: pt.imu.wx,
      wy: pt.imu.wy,
      wz: pt.imu.wz,
      wMag: pt.imu.wMagnitude,
      imuAnomaly: pt.imu.anomaly,
      bx: pt.magnetometer.bx,
      by: pt.magnetometer.by,
      bz: pt.magnetometer.bz,
      bMag: pt.magnetometer.bMagnitude,
      magAnomaly: pt.magnetometer.anomaly,
      solar: pt.solarCurrent.current,
      solarAnomaly: pt.solarCurrent.anomaly,
      tBus: pt.temperature.bus,
      tPanel: pt.temperature.panel,
      tempAnomaly: pt.temperature.anomaly
    }));
  }, [telemetryHistory]);

  const latest = telemetryHistory[telemetryHistory.length - 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. IMU Angular Rate Chart */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-[#d97742]/10 border border-[#d97742]/30 text-[#d97742]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#f4f0e8] tracking-wide flex items-center space-x-2 font-display">
                <span>ANGULAR RATE (IMU)</span>
                {latest?.imu.anomaly && (
                  <span className="bg-rose-500/15 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-mono-tech border border-rose-500/30">
                    ANOMALY
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8c939f] font-editorial">Body rates [ωx, ωy, ωz] & magnitude</div>
            </div>
          </div>
          <div className="text-right font-mono-tech">
            <div className="text-base font-bold text-[#d97742]">
              {latest?.imu.wMagnitude.toFixed(3) ?? '0.000'} <span className="text-[10px] text-[#8c939f] font-normal">deg/s</span>
            </div>
            <div className="text-[10px] text-[#717a87]">
              Z-score: {latest?.imu.zScore ?? '0.0'}σ
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181f2a" vertical={false} />
              <XAxis dataKey="time" stroke="#525d6d" fontSize={10} tickLine={false} />
              <YAxis stroke="#525d6d" fontSize={10} domain={[-2.5, 4.5]} tickLine={false} />
              <Tooltip content={<AerospaceTooltip unit="deg/s" />} />
              <ReferenceLine y={0.5} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={-0.5} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="wMag" name="|ω| Total" stroke="#d97742" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="wx" name="ωx (Roll)" stroke="#f87171" strokeWidth={1} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
              <Line type="monotone" dataKey="wy" name="ωy (Pitch)" stroke="#4ade80" strokeWidth={1} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
              <Line type="monotone" dataKey="wz" name="ωz (Yaw)" stroke="#a78bfa" strokeWidth={1} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Solar Panel Current Chart */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/35 text-amber-400">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#f4f0e8] tracking-wide flex items-center space-x-2 font-display">
                <span>SOLAR ARRAY CURRENT</span>
                {latest?.solarCurrent.anomaly && (
                  <span className="bg-rose-500/15 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-mono-tech border border-rose-500/30">
                    DIP DETECTED
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8c939f] font-editorial">Photovoltaic bus current & attitude coupling</div>
            </div>
          </div>
          <div className="text-right font-mono-tech">
            <div className="text-base font-bold text-amber-300">
              {latest?.solarCurrent.current.toFixed(3) ?? '0.000'} <span className="text-[10px] text-[#8c939f] font-normal">A</span>
            </div>
            <div className="text-[10px] text-[#717a87]">
              Z-score: {latest?.solarCurrent.zScore ?? '0.0'}σ
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181f2a" vertical={false} />
              <XAxis dataKey="time" stroke="#525d6d" fontSize={10} tickLine={false} />
              <YAxis stroke="#525d6d" fontSize={10} domain={[0, 3.0]} tickLine={false} />
              <Tooltip content={<AerospaceTooltip unit="A" />} />
              <ReferenceLine y={2.44} stroke="#059669" strokeDasharray="3 3" strokeOpacity={0.6} label={{ value: 'Nominal', fill: '#059669', fontSize: 9 }} />
              <ReferenceLine y={2.1} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="solar" name="Current (A)" stroke="#fbbf24" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Magnetometer Chart */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/35 text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#f4f0e8] tracking-wide flex items-center space-x-2 font-display">
                <span>MAGNETOMETER (GEOMAGNETIC)</span>
                {latest?.magnetometer.anomaly && (
                  <span className="bg-rose-500/15 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-mono-tech border border-rose-500/30">
                    VECTOR SHIFT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8c939f] font-editorial">3-Axis Earth B-field body reference [Bx, By, Bz]</div>
            </div>
          </div>
          <div className="text-right font-mono-tech">
            <div className="text-base font-bold text-indigo-300">
              {latest?.magnetometer.bMagnitude.toFixed(2) ?? '0.00'} <span className="text-[10px] text-[#8c939f] font-normal">μT</span>
            </div>
            <div className="text-[10px] text-[#717a87]">
              Z-score: {latest?.magnetometer.zScore ?? '0.0'}σ
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181f2a" vertical={false} />
              <XAxis dataKey="time" stroke="#525d6d" fontSize={10} tickLine={false} />
              <YAxis stroke="#525d6d" fontSize={10} domain={[-45, 65]} tickLine={false} />
              <Tooltip content={<AerospaceTooltip unit="μT" />} />
              <Line type="monotone" dataKey="bMag" name="|B| Vector" stroke="#818cf8" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="bx" name="Bx" stroke="#f43f5e" strokeWidth={1} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
              <Line type="monotone" dataKey="by" name="By" stroke="#2dd4bf" strokeWidth={1} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
              <Line type="monotone" dataKey="bz" name="Bz" stroke="#fb923c" strokeWidth={1} dot={false} strokeDasharray="2 2" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Thermal Subsystem Chart */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/35 text-emerald-400">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#f4f0e8] tracking-wide flex items-center space-x-2 font-display">
                <span>THERMAL SUBSYSTEM</span>
                {latest?.temperature.anomaly && (
                  <span className="bg-rose-500/15 text-rose-300 text-[10px] px-2 py-0.5 rounded-full font-mono-tech border border-rose-500/30">
                    EXCURSION
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#8c939f] font-editorial">Bus electronics & solar panel surface temp</div>
            </div>
          </div>
          <div className="text-right font-mono-tech">
            <div className="text-base font-bold text-emerald-300">
              {latest?.temperature.panel.toFixed(1) ?? '46.8'} <span className="text-[10px] text-[#8c939f] font-normal">°C</span>
            </div>
            <div className="text-[10px] text-[#717a87]">
              Bus Internal: {latest?.temperature.bus.toFixed(1) ?? '22.4'}°C
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#181f2a" vertical={false} />
              <XAxis dataKey="time" stroke="#525d6d" fontSize={10} tickLine={false} />
              <YAxis stroke="#525d6d" fontSize={10} domain={[15, 55]} tickLine={false} />
              <Tooltip content={<AerospaceTooltip unit="°C" />} />
              <Line type="monotone" dataKey="tPanel" name="Panel Surface" stroke="#10b981" strokeWidth={2.2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="tBus" name="Bus Internal" stroke="#60a5fa" strokeWidth={1.4} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
