import React, { useEffect, useState } from 'react';
import { useMission } from '../../context/MissionContext';
import { NavTab } from './Sidebar';
import { backendClient } from '../../services/backendClient';
import { 
  Satellite, 
  Clock, 
  Zap,
  Globe,
  Settings
} from 'lucide-react';

interface HeaderProps {
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectTab }) => {
  const { latestTelemetry, hasImpactDisturbance } = useMission();
  const [currentUtc, setCurrentUtc] = useState(new Date().toUTCString().slice(17, 25));
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUtc(new Date().toUTCString().slice(17, 25));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const checkBackend = async () => {
      try {
        const health = await backendClient.getHealth();
        if (active) setApiOnline(health.status === 'ONLINE');
      } catch {
        if (active) setApiOnline(false);
      }
    };
    void checkBackend();
    const timer = setInterval(() => void checkBackend(), 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  return (
    <header className="app-header select-none">
      {/* Left: Mission & Spacecraft Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#141822] border border-[rgba(240,230,215,0.1)] text-[#d97742] flex items-center justify-center">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#faf7f2] tracking-wider font-display">
                LEO DEMO MISSION 01
              </span>
              <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-[#181e28] text-[#e68d5c] border border-[rgba(217,119,66,0.3)]">
                OG-SAT-01
              </span>
            </div>
            <div className="text-[10px] text-[#8c939f] flex items-center space-x-1.5 font-mono-tech">
              <span>Orbit: 520 km SSO</span>
              <span>•</span>
              <span>Inc: 97.4°</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[rgba(240,230,215,0.08)] hidden sm:block" />

        {/* Clear Simulation Environment Tag */}
        <div className="hidden sm:flex items-center space-x-2 bg-[#d97742]/10 border border-[#d97742]/25 text-[#f4f0e8] text-[10px] px-3 py-1 rounded-full font-editorial font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97742] animate-pulse" />
          <span>SIMULATION ENVIRONMENT</span>
        </div>
      </div>

      {/* Center: Real Perturbation Warning Alert */}
      {hasImpactDisturbance && (
        <div className="hidden md:flex items-center space-x-2 bg-rose-950/80 border border-rose-500/50 px-3.5 py-1 rounded-full text-xs text-rose-200 animate-pulse shadow-md">
          <Zap className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold tracking-wide text-[11px] font-editorial">ATTITUDE PERTURBATION IN PROGRESS</span>
        </div>
      )}

      {/* Right: Chrono & Setting controls */}
      <div className="flex items-center space-x-3 text-xs font-mono-tech">
        <div
          className="hidden md:flex items-center gap-1.5 rounded-full border border-[rgba(240,230,215,0.08)] bg-[#12161f] px-2.5 py-1.5 text-[9px] tracking-wide"
          title={apiOnline ? 'Telemetry API connected' : apiOnline === false ? 'Telemetry API is offline; browser simulation remains active' : 'Checking telemetry API'}
          aria-live="polite"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${apiOnline === true ? 'bg-emerald-400' : apiOnline === false ? 'bg-[#777d86]' : 'bg-amber-400 animate-pulse'}`} />
          <span className={apiOnline ? 'text-emerald-300' : 'text-[#8c939f]'}>
            {apiOnline === true ? 'API ONLINE' : apiOnline === false ? 'API OFFLINE' : 'API CHECK'}
          </span>
        </div>

        {/* MET Clock */}
        <div className="hidden lg:flex items-center space-x-2 bg-[#12161f] border border-[rgba(240,230,215,0.08)] px-3 py-1.5 rounded-lg text-[#ede8df]">
          <Clock className="w-3.5 h-3.5 text-[#d97742]" />
          <span className="text-[#8c939f]">MET:</span>
          <span className="font-bold text-[#f4f0e8]">{latestTelemetry?.metString ?? 'T+04:18:23'}</span>
        </div>

        {/* UTC Clock */}
        <div className="hidden sm:flex items-center space-x-2 bg-[#12161f] border border-[rgba(240,230,215,0.08)] px-3 py-1.5 rounded-lg text-[#ede8df]">
          <Globe className="w-3.5 h-3.5 text-[#8c939f]" />
          <span className="text-[#8c939f]">UTC:</span>
          <span className="text-[#ede8df]">{latestTelemetry?.timeString ?? currentUtc}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={() => onSelectTab('settings')}
          title="Mission Settings"
          className="p-2 rounded-lg text-[#8c939f] hover:text-[#d97742] hover:bg-[#151a22] transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
