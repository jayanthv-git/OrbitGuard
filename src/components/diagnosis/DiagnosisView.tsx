import React from 'react';
import { useMission } from '../../context/MissionContext';
import { ExplainabilityCard } from './ExplainabilityCard';
import { CorrelationTimeline } from './CorrelationTimeline';
import { 
  Play, 
  Download, 
  AlertCircle, 
  Search
} from 'lucide-react';

export const DiagnosisView: React.FC = () => {
  const { events, selectedEvent, setSelectedEvent, startReplay } = useMission();

  const handleExportJson = () => {
    if (!selectedEvent) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(selectedEvent, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedEvent.id}-diagnosis-report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!selectedEvent && events.length === 0) {
    return (
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-14 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#d97742]/15 border border-[#d97742]/35 text-[#d97742] flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-base font-semibold text-[#f4f0e8] font-display">No Anomaly Signals In Memory</h3>
          <p className="text-xs text-[#8c939f] font-editorial leading-relaxed">
            Use the simulation toolbar above to inject a simulated micrometeorite strike or sensor glitch to test the AI diagnosis pipeline.
          </p>
        </div>
      </div>
    );
  }

  const activeEvent = selectedEvent || events[0];

  return (
    <div className="space-y-5">
      {/* Event Selector Strip */}
      <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-3 flex items-center justify-between gap-3 overflow-x-auto shadow-sm">
        <div className="flex items-center space-x-2.5 text-xs font-semibold text-[#ede8df] shrink-0 font-display">
          <Search className="w-4 h-4 text-[#d97742]" />
          <span>INSPECTING SIGNAL:</span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          {events.map((evt) => {
            const isSelected = activeEvent?.id === evt.id;
            const isImpact = evt.classification === 'POSSIBLE_IMPACT';
            return (
              <button
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-tech whitespace-nowrap transition flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-[#d97742]/20 border-[#d97742]/50 text-[#f4f0e8] shadow-sm'
                    : 'bg-[#12161f] border-[rgba(240,230,215,0.08)] text-[#8c939f] hover:text-[#f4f0e8] hover:border-[rgba(240,230,215,0.18)]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isImpact ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                />
                <span className="font-semibold">{evt.id}</span>
                <span className="text-[10px] text-[#717a87]">({evt.timeString.substring(3, 8)})</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls for Selected Event */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => activeEvent && startReplay(activeEvent)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-[#d97742]/20 text-[#f4f0e8] border border-[#d97742]/45 hover:bg-[#d97742]/30 transition shadow-sm font-editorial"
          >
            <Play className="w-3.5 h-3.5 text-[#e68d5c]" />
            <span>REPLAY EVENT</span>
          </button>

          <button
            onClick={handleExportJson}
            title="Export Evidence JSON Report"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-[#a3abb8] border border-[rgba(240,230,215,0.08)] hover:bg-[#151a22] hover:text-[#f4f0e8] transition font-editorial"
          >
            <Download className="w-3.5 h-3.5 text-[#8c939f]" />
            <span className="hidden sm:inline">EXPORT REPORT</span>
          </button>
        </div>
      </div>

      {/* Main Diagnosis Content */}
      {activeEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Explainable AI Breakdown (7 cols) */}
          <div className="lg:col-span-7">
            <ExplainabilityCard event={activeEvent} />
          </div>

          {/* Right: Correlation Timeline & Detailed Sensor Readings (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <CorrelationTimeline event={activeEvent} />

            {/* Sensor Numerical Baseline vs Peak Comparison Table */}
            <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-4 space-y-2.5 shadow-sm">
              <div className="text-xs font-semibold text-[#faf7f2] uppercase tracking-wide font-display">
                NUMERICAL METRIC DEVIATION PROFILE
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono-tech">
                  <thead>
                    <tr className="border-b border-[rgba(240,230,215,0.08)] text-[10px] uppercase text-[#8c939f] font-editorial">
                      <th className="pb-2">Channel</th>
                      <th className="pb-2">Baseline</th>
                      <th className="pb-2">Peak / Min</th>
                      <th className="pb-2">Δ Dev</th>
                      <th className="pb-2 text-right">Z-Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(240,230,215,0.06)] text-[#d5dedb]">
                    <tr>
                      <td className="py-2 text-[#f4f0e8] font-editorial">IMU Angular Rate</td>
                      <td className="py-2">{activeEvent.sensorEvidence.imu?.baselineValue ?? '0.035'} °/s</td>
                      <td className="py-2 text-[#d97742] font-semibold">{activeEvent.sensorEvidence.imu?.peakValue ?? '0.00'} °/s</td>
                      <td className="py-2 text-rose-400">+{(activeEvent.sensorEvidence.imu?.peakDeviation ?? 0).toFixed(3)}</td>
                      <td className="py-2 text-right text-rose-400 font-semibold">{activeEvent.sensorEvidence.imu?.zScore}σ</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#f4f0e8] font-editorial">Solar Array Current</td>
                      <td className="py-2">{activeEvent.sensorEvidence.solarCurrent?.baselineValue ?? '2.44'} A</td>
                      <td className="py-2 text-amber-300 font-semibold">{activeEvent.sensorEvidence.solarCurrent?.peakValue ?? '0.00'} A</td>
                      <td className="py-2 text-amber-400">-{(activeEvent.sensorEvidence.solarCurrent?.peakDeviation ?? 0).toFixed(2)}</td>
                      <td className="py-2 text-right text-amber-400 font-semibold">{activeEvent.sensorEvidence.solarCurrent?.zScore}σ</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#f4f0e8] font-editorial">Magnetometer Vector</td>
                      <td className="py-2">{activeEvent.sensorEvidence.magnetometer?.baselineValue ?? '41.5'} μT</td>
                      <td className="py-2 text-indigo-300 font-semibold">{activeEvent.sensorEvidence.magnetometer?.peakValue ?? '0.00'} μT</td>
                      <td className="py-2 text-indigo-400">+{(activeEvent.sensorEvidence.magnetometer?.peakDeviation ?? 0).toFixed(1)}</td>
                      <td className="py-2 text-right text-indigo-400 font-semibold">{activeEvent.sensorEvidence.magnetometer?.zScore}σ</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[#f4f0e8] font-editorial">Panel Temperature</td>
                      <td className="py-2">{activeEvent.sensorEvidence.temperature?.baselineValue ?? '46.8'} °C</td>
                      <td className="py-2 text-emerald-300 font-semibold">{activeEvent.sensorEvidence.temperature?.peakValue ?? '0.00'} °C</td>
                      <td className="py-2 text-emerald-400">+{(activeEvent.sensorEvidence.temperature?.peakDeviation ?? 0).toFixed(2)}</td>
                      <td className="py-2 text-right text-emerald-400 font-semibold">{activeEvent.sensorEvidence.temperature?.zScore}σ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
