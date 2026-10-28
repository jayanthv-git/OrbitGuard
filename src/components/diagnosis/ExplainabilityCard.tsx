import React from 'react';
import { ImpactEvent } from '../../types/events';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Compass, 
  Sun, 
  Zap, 
  Thermometer,
  Layers,
  FileText
} from 'lucide-react';

interface ExplainabilityCardProps {
  event: ImpactEvent;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({ event }) => {
  const { classification, confidenceScore, evidence, sensorEvidence } = event;

  const isImpact = classification === 'POSSIBLE_IMPACT';
  const isGlitch = classification === 'SENSOR_GLITCH';

  const badgeColor = isImpact
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
    : isGlitch
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
    : 'bg-slate-500/15 text-slate-300 border-slate-500/35';

  return (
    <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-5 space-y-4 shadow-sm">
      {/* Header & Classification Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(240,230,215,0.08)] pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-semibold tracking-wider text-[#8c939f] uppercase font-editorial">
              AI DIAGNOSIS VERDICT
            </span>
            <span className="text-[#555d69]">•</span>
            <span className="text-xs font-mono-tech text-[#d97742] font-semibold">{event.id}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border font-editorial ${badgeColor}`}>
              {classification.replace('_', ' ')}
            </span>
            <span className="text-xs text-[#8c939f] font-mono-tech">
              MET: {event.metString} ({event.timeString})
            </span>
          </div>
        </div>

        {/* Evidence Confidence Meter */}
        <div className="bg-[#13171f] border border-[rgba(240,230,215,0.08)] px-4 py-2.5 rounded-xl text-right min-w-[150px]">
          <div className="text-[10px] uppercase tracking-wider text-[#8c939f] font-medium font-editorial">
            Evidence Confidence
          </div>
          <div className="text-2xl font-bold font-mono-tech text-[#d97742] flex items-center justify-end space-x-1.5">
            <span>{confidenceScore}%</span>
            <span className="text-[10px] text-[#717a87] font-normal">Score</span>
          </div>
          <div className="w-full bg-[#1e2430] h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                confidenceScore > 75 ? 'bg-[#d97742]' : confidenceScore > 50 ? 'bg-amber-400' : 'bg-slate-500'
              }`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Structured Evidence Summary */}
      <div className="bg-[#12161f] border border-[rgba(240,230,215,0.06)] rounded-xl p-3.5">
        <div className="flex items-start space-x-3">
          <FileText className="w-4 h-4 text-[#d97742] mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-[#f4f0e8] uppercase tracking-wide font-editorial">
              EXECUTIVE EVIDENCE SUMMARY
            </div>
            <p className="text-xs text-[#a3abb8] mt-1 leading-relaxed">
              {evidence.summary}
            </p>
          </div>
        </div>
      </div>

      {/* "Why was this event classified?" Explainable Reasoning Breakdown */}
      <div className="space-y-2.5">
        <div className="flex items-center space-x-2 text-xs font-semibold tracking-wider text-[#faf7f2] font-display">
          <Layers className="w-4 h-4 text-[#d97742]" />
          <span>WHY WAS THIS EVENT CLASSIFIED?</span>
        </div>

        <div className="space-y-2">
          {evidence.explanationPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 bg-[#12161f]/90 border border-[rgba(240,230,215,0.06)] rounded-xl p-3 text-xs text-[#d5dedb]"
            >
              <div className="mt-0.5 shrink-0">
                {isImpact ? (
                  <CheckCircle2 className="w-4 h-4 text-[#d97742]" />
                ) : isGlitch ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="leading-relaxed font-editorial">{point}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensor Channel Corroboration Grid */}
      <div className="space-y-2 pt-2 border-t border-[rgba(240,230,215,0.08)]">
        <div className="text-[10px] font-semibold tracking-wider text-[#8c939f] uppercase font-editorial">
          CROSS-SENSOR CORROBORATION MATRIX
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* IMU Card */}
          <div className="bg-[#12161f] border border-[rgba(240,230,215,0.08)] p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4 text-[#d97742]" />
              <div>
                <div className="text-xs font-medium text-[#f4f0e8] font-editorial">IMU Rate Gyro</div>
                <div className="text-[10px] text-[#8c939f]">{sensorEvidence.imu?.description}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-full border ${
                sensorEvidence.imu?.detected
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {sensorEvidence.imu?.detected ? `${sensorEvidence.imu.zScore}σ ANOMALY` : 'NOMINAL'}
              </span>
            </div>
          </div>

          {/* Solar Current Card */}
          <div className="bg-[#12161f] border border-[rgba(240,230,215,0.08)] p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-medium text-[#f4f0e8] font-editorial">Solar Array Current</div>
                <div className="text-[10px] text-[#8c939f]">{sensorEvidence.solarCurrent?.description}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-full border ${
                sensorEvidence.solarCurrent?.detected
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {sensorEvidence.solarCurrent?.detected ? `${sensorEvidence.solarCurrent.zScore}σ ANOMALY` : 'NOMINAL'}
              </span>
            </div>
          </div>

          {/* Magnetometer Card */}
          <div className="bg-[#12161f] border border-[rgba(240,230,215,0.08)] p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs font-medium text-[#f4f0e8] font-editorial">Magnetometer</div>
                <div className="text-[10px] text-[#8c939f]">{sensorEvidence.magnetometer?.description}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-full border ${
                sensorEvidence.magnetometer?.detected
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {sensorEvidence.magnetometer?.detected ? `${sensorEvidence.magnetometer.zScore}σ ANOMALY` : 'NOMINAL'}
              </span>
            </div>
          </div>

          {/* Thermal Subsystem Card */}
          <div className="bg-[#12161f] border border-[rgba(240,230,215,0.08)] p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Thermometer className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-[#f4f0e8] font-editorial">Thermal Subsystem</div>
                <div className="text-[10px] text-[#8c939f]">{sensorEvidence.temperature?.description}</div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-full border ${
                sensorEvidence.temperature?.detected
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {sensorEvidence.temperature?.detected ? `${sensorEvidence.temperature.zScore}σ ANOMALY` : 'NOMINAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Estimation Specs */}
      {isImpact && (
        <div className="bg-[#13171f] border border-[rgba(217,119,66,0.25)] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-md">
          <div>
            <div className="text-[10px] uppercase text-[#8c939f] font-semibold font-editorial">Estimated Impact Locus</div>
            <div className="font-mono-tech text-[#d97742] font-semibold mt-0.5">{evidence.estimatedImpactLocation}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#8c939f] font-semibold font-editorial">Kinetic Impulse Estimate</div>
            <div className="font-mono-tech text-[#f4f0e8] font-semibold mt-0.5">{evidence.estimatedKineticImpulseMns} mN·s</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#8c939f] font-semibold font-editorial">Temporal Coincidence</div>
            <div className="font-mono-tech text-[#f4f0e8] font-semibold mt-0.5">Δt = {evidence.temporalCorrelationMs} ms</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#8c939f] font-semibold font-editorial">Physics Score</div>
            <div className="font-mono-tech text-emerald-400 font-semibold mt-0.5">{evidence.physicsConsistencyScore}%</div>
          </div>
        </div>
      )}
    </div>
  );
};
