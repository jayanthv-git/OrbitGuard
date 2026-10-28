import React, { useState } from 'react';
import { useMission } from '../../context/MissionContext';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Sun, 
  Zap
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

export const EventReplayModal: React.FC = () => {
  const { replayEvent, isReplaying, replayIndex, startReplay, stopReplay, setReplayIndex } = useMission();

  if (!replayEvent) return null;

  const currentPoint = replayEvent.telemetryWindow[replayIndex] || replayEvent.telemetryWindow[0];
  const totalFrames = replayEvent.telemetryWindow.length;

  // Has the anomaly onset been reached in replay scrubber?
  const isPastOnset = replayIndex >= replayEvent.eventStartIndex;
  const isPastPeak = replayIndex >= replayEvent.eventPeakIndex;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-[#0b0e14] border border-[rgba(240,230,215,0.12)] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-[rgba(240,230,215,0.08)] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#d97742]/15 border border-[#d97742]/40 text-[#d97742]">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-base font-bold text-[#faf7f2] tracking-wide font-display">
                  HIGH-RESOLUTION EVENT REPLAY
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech uppercase bg-[#d97742]/15 text-[#f4f0e8] border border-[#d97742]/40">
                  {replayEvent.id}
                </span>
              </div>
              <div className="text-xs text-[#8c939f] font-editorial mt-0.5">
                Classification: <span className="text-[#f4f0e8] font-semibold">{replayEvent.classification.replace('_', ' ')}</span> • Confidence: {replayEvent.confidenceScore}%
              </div>
            </div>
          </div>

          <button
            onClick={stopReplay}
            className="p-2 rounded-xl text-[#8c939f] hover:text-[#f4f0e8] hover:bg-[#151922] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Replay Status Banner */}
        <div className="bg-[#0e1218] px-5 py-2.5 border-b border-[rgba(240,230,215,0.08)] flex items-center justify-between text-xs font-editorial">
          <div className="flex items-center space-x-2">
            <span className="text-[#8c939f]">Replay Progression:</span>
            {!isPastOnset ? (
              <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Phase 1: Pre-Event Nominal Baseline</span>
              </span>
            ) : !isPastPeak ? (
              <span className="text-amber-400 font-semibold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Phase 2: Kinetic Shock Impulse Onset</span>
              </span>
            ) : (
              <span className="text-[#d97742] font-semibold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d97742]" />
                <span>Phase 3: Multi-Sensor Analysis & ADCS Damping</span>
              </span>
            )}
          </div>

          <div className="font-mono-tech text-[#ede8df]">
            MET: {currentPoint?.metString} ({currentPoint?.timeString})
          </div>
        </div>

        {/* Center Live Telemetry Gauges at this frame */}
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#080a0e]">
          {/* IMU */}
          <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#8c939f] mb-1 font-editorial">
              <span>IMU Angular Rate</span>
              <Compass className="w-3.5 h-3.5 text-[#d97742]" />
            </div>
            <div className="text-xl font-bold font-mono-tech text-[#f4f0e8]">
              {currentPoint?.imu.wMagnitude.toFixed(3)} <span className="text-xs font-normal text-[#8c939f]">deg/s</span>
            </div>
            <div className="text-[10px] text-[#717a87] font-mono-tech">
              Z-score: {currentPoint?.imu.zScore}σ
            </div>
          </div>

          {/* Solar Current */}
          <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#8c939f] mb-1 font-editorial">
              <span>Solar Array Current</span>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono-tech text-amber-300">
              {currentPoint?.solarCurrent.current.toFixed(3)} <span className="text-xs font-normal text-[#8c939f]">A</span>
            </div>
            <div className="text-[10px] text-[#717a87] font-mono-tech">
              Z-score: {currentPoint?.solarCurrent.zScore}σ
            </div>
          </div>

          {/* Magnetometer */}
          <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#8c939f] mb-1 font-editorial">
              <span>Geomagnetic Field</span>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono-tech text-indigo-300">
              {currentPoint?.magnetometer.bMagnitude.toFixed(1)} <span className="text-xs font-normal text-[#8c939f]">μT</span>
            </div>
            <div className="text-[10px] text-[#717a87] font-mono-tech">
              Z-score: {currentPoint?.magnetometer.zScore}σ
            </div>
          </div>

          {/* Panel Temp */}
          <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-xs text-[#8c939f] mb-1 font-editorial">
              <span>Panel Temperature</span>
              <span className="text-emerald-400 text-xs">°C</span>
            </div>
            <div className="text-xl font-bold font-mono-tech text-emerald-300">
              {currentPoint?.temperature.panel.toFixed(1)} <span className="text-xs font-normal text-[#8c939f]">°C</span>
            </div>
            <div className="text-[10px] text-[#717a87] font-mono-tech">
              Bus: {currentPoint?.temperature.bus.toFixed(1)}°C
            </div>
          </div>
        </div>

        {/* Telemetry Scrubbing Chart */}
        <div className="p-5 space-y-2.5">
          <div className="text-xs font-semibold text-[#faf7f2] uppercase tracking-wide font-display">
            SYNCHRONIZED TELEMETRY PLAYHEAD TRACE
          </div>
          <div className="h-44 w-full bg-[#080a0e] rounded-xl p-2 border border-[rgba(240,230,215,0.06)]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={replayEvent.telemetryWindow.map((p, idx) => ({
                  idx,
                  time: p.timeString.substring(6, 12),
                  wMag: p.imu.wMagnitude,
                  solar: p.solarCurrent.current,
                  bMag: p.magnetometer.bMagnitude
                }))}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="time" stroke="#525d6d" fontSize={9} />
                <YAxis stroke="#525d6d" fontSize={9} />
                <Tooltip />
                <ReferenceLine
                  x={replayEvent.telemetryWindow[replayIndex]?.timeString.substring(6, 12)}
                  stroke="#d97742"
                  strokeWidth={2}
                  label={{ value: 'PLAYHEAD', fill: '#d97742', fontSize: 9, position: 'top' }}
                />
                <Line type="monotone" dataKey="wMag" name="IMU (deg/s)" stroke="#d97742" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="solar" name="Solar (A)" stroke="#fbbf24" strokeWidth={1.6} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Scrubber & Playback Controls */}
        <div className="p-5 bg-[#0e1218] border-t border-[rgba(240,230,215,0.08)] space-y-4">
          {/* Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono-tech text-[#8c939f]">
              <span>Frame {replayIndex + 1} / {totalFrames}</span>
              <span>{(replayIndex * 0.2).toFixed(1)}s / {(totalFrames * 0.2).toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={totalFrames - 1}
              value={replayIndex}
              onChange={(e) => setReplayIndex(Number(e.target.value))}
              className="w-full accent-[#d97742] cursor-pointer h-2 bg-[#1b222d] rounded-lg"
            />
          </div>

          {/* Buttons Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setReplayIndex(0)}
                title="Restart Replay"
                className="p-2 rounded-lg text-[#8c939f] hover:text-[#f4f0e8] hover:bg-[#151922] transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setReplayIndex(Math.max(0, replayIndex - 1))}
                title="Step Back"
                className="p-2 rounded-lg text-[#8c939f] hover:text-[#f4f0e8] hover:bg-[#151922] transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (isReplaying) {
                    stopReplay();
                  } else {
                    startReplay(replayEvent);
                  }
                }}
                className="px-5 py-2 rounded-lg bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/50 hover:bg-[#d97742]/30 transition text-xs font-bold flex items-center space-x-2 shadow-md font-editorial"
              >
                {isReplaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>PLAY REPLAY</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setReplayIndex(Math.min(totalFrames - 1, replayIndex + 1))}
                title="Step Forward"
                className="p-2 rounded-lg text-[#8c939f] hover:text-[#f4f0e8] hover:bg-[#151922] transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={stopReplay}
                className="px-4 py-2 rounded-lg bg-[#151922] text-[#d5dedb] hover:bg-[#1e2430] hover:text-white transition font-editorial"
              >
                Close Replay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
