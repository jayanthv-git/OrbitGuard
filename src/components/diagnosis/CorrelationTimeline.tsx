import React, { useMemo } from 'react';
import { ImpactEvent } from '../../types/events';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Clock } from 'lucide-react';

interface CorrelationTimelineProps {
  event: ImpactEvent;
}

export const CorrelationTimeline: React.FC<CorrelationTimelineProps> = ({ event }) => {
  const { telemetryWindow, eventStartIndex, eventPeakIndex, classification, evidence } = event;

  // Format telemetry points for the event window
  const chartData = useMemo(() => {
    return telemetryWindow.map((p, idx) => ({
      index: idx,
      time: p.timeString.substring(6, 12), // ss.SSS
      wMag: p.imu.wMagnitude,
      solar: p.solarCurrent.current,
      bMag: p.magnetometer.bMagnitude,
      panelTemp: p.temperature.panel,
      isPeak: idx === eventPeakIndex,
      isStart: idx === eventStartIndex
    }));
  }, [telemetryWindow, eventPeakIndex, eventStartIndex]);

  const peakPoint = chartData[eventPeakIndex];
  const startPoint = chartData[eventStartIndex];

  return (
    <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-5 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(240,230,215,0.08)] pb-3">
        <div className="flex items-center space-x-2.5">
          <Clock className="w-4 h-4 text-[#d97742]" />
          <span className="text-xs font-semibold text-[#faf7f2] uppercase tracking-wide font-display">
            MULTI-SENSOR TEMPORAL CORRELATION WINDOW
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono-tech">
          <span className="text-[#8c939f] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#d97742]" />
            <span>Onset (t₀): {startPoint?.time ?? '00:00'}</span>
          </span>
          <span className="text-[#8c939f] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Peak Δ: {peakPoint?.time ?? '00:00'}</span>
          </span>
          <span className="bg-[#d97742]/15 text-[#f4f0e8] border border-[#d97742]/40 px-2.5 py-0.5 rounded-full text-[11px]">
            Δt = {evidence.temporalCorrelationMs} ms
          </span>
        </div>
      </div>

      {/* Synchronized Multi-Channel Window Chart */}
      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#181f2a" vertical={false} />
            <XAxis dataKey="time" stroke="#525d6d" fontSize={10} tickLine={false} />
            <YAxis stroke="#525d6d" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#12161f]/95 border border-[rgba(240,230,215,0.12)] p-2.5 rounded-xl shadow-xl text-xs font-mono-tech">
                      <div className="text-[10px] text-[#8c939f] border-b border-[rgba(240,230,215,0.08)] pb-1 mb-1.5 font-editorial">
                        Time: {label}
                      </div>
                      {payload.map((e: any, idx: number) => (
                        <div key={idx} className="flex justify-between gap-3" style={{ color: e.color }}>
                          <span className="font-editorial">{e.name}:</span>
                          <span className="font-semibold text-white">
                            {typeof e.value === 'number' ? e.value.toFixed(3) : e.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Shaded Correlation Region */}
            {startPoint && (
              <ReferenceArea
                x1={startPoint.time}
                x2={peakPoint?.time || chartData[Math.min(chartData.length - 1, eventStartIndex + 6)]?.time}
                fill={classification === 'POSSIBLE_IMPACT' ? '#f43f5e' : '#f59e0b'}
                fillOpacity={0.12}
              />
            )}

            {/* Vertical Marker Lines */}
            {startPoint && (
              <ReferenceLine
                x={startPoint.time}
                stroke="#d97742"
                strokeWidth={1.8}
                strokeDasharray="3 3"
                label={{ value: 'Onset t₀', fill: '#d97742', fontSize: 10, position: 'top' }}
              />
            )}
            {peakPoint && (
              <ReferenceLine
                x={peakPoint.time}
                stroke="#f43f5e"
                strokeWidth={1.8}
                label={{ value: 'Peak Δ', fill: '#f43f5e', fontSize: 10, position: 'top' }}
              />
            )}

            <Line type="monotone" dataKey="wMag" name="IMU Rate (|ω| deg/s)" stroke="#d97742" strokeWidth={2.2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="solar" name="Solar Array (A)" stroke="#fbbf24" strokeWidth={2.0} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="bMag" name="Magnetometer (|B| μT)" stroke="#818cf8" strokeWidth={1.6} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Channel Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5 text-[#d5dedb]">
            <span className="w-2.5 h-0.5 bg-[#d97742] inline-block" />
            <span className="font-editorial text-[11px]">IMU Angular Rate (deg/s)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[#d5dedb]">
            <span className="w-2.5 h-0.5 bg-[#fbbf24] inline-block" />
            <span className="font-editorial text-[11px]">Solar Current (A)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-[#d5dedb]">
            <span className="w-2.5 h-0.5 bg-[#818cf8] inline-block" />
            <span className="font-editorial text-[11px]">Magnetometer (|B| μT)</span>
          </span>
        </div>

        <div className="text-[#717a87] font-mono-tech text-[10px]">
          Window size: {telemetryWindow.length} frames ({(telemetryWindow.length * 0.2).toFixed(1)}s buffer)
        </div>
      </div>
    </div>
  );
};
