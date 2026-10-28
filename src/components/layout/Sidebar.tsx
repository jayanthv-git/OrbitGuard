import React from 'react';
import { useMission } from '../../context/MissionContext';
import { 
  LayoutDashboard, 
  Activity, 
  ShieldAlert, 
  History, 
  Sliders
} from 'lucide-react';

export type NavTab = 'overview' | 'telemetry' | 'diagnosis' | 'history' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { events, isRunning, config } = useMission();

  const impactCount = events.filter((e) => e.classification === 'POSSIBLE_IMPACT').length;

  const navItems = [
    { id: 'overview' as NavTab, label: 'Mission Overview', icon: LayoutDashboard },
    { id: 'telemetry' as NavTab, label: 'Live Telemetry', icon: Activity },
    { 
      id: 'diagnosis' as NavTab, 
      label: 'Impact Diagnosis', 
      icon: ShieldAlert,
      badge: impactCount > 0 ? `${impactCount}` : undefined,
      badgeColor: 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
    },
    { id: 'history' as NavTab, label: 'Event History', icon: History, count: events.length },
    { id: 'settings' as NavTab, label: 'Mission Settings', icon: Sliders }
  ];

  return (
    <aside className="app-sidebar select-none">
      {/* Top Branding Section */}
      <div>
        <div className="brand-block">
          <div className="flex items-center space-x-3.5">
            {/* Custom Aerospace Copper/Oxide Brand Mark */}
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#d97742] fill-none stroke-current stroke-2">
                {/* Orbital ellipse */}
                <ellipse cx="12" cy="12" rx="9" ry="4" strokeDasharray="3 2" transform="rotate(-25 12 12)" />
                {/* CubeSat Center Chassis */}
                <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#d97742" stroke="none" />
                {/* Solar array wings */}
                <line x1="6" y1="12" x2="9.5" y2="12" stroke="#d97742" strokeWidth="2" />
                <line x1="14.5" y1="12" x2="18" y2="12" stroke="#d97742" strokeWidth="2" />
                {/* Detection focal pulse point */}
                <circle cx="17" cy="8" r="1.5" fill="#f43f5e" />
              </svg>
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="brand-name">
                  ORBITGUARD
                </span>
                <span className="text-[9px] font-mono-tech px-1.5 py-0.2 rounded bg-[#1c222e] text-[#e68d5c] border border-[rgba(217,119,66,0.3)]">
                  v2.4
                </span>
              </div>
              <div className="text-[11px] text-[#8c939f] font-editorial tracking-wide">
                Satellite Impact Intelligence
              </div>
            </div>
          </div>

          <div className="brand-tagline">
            "Detect the event. Understand the evidence."
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="sidebar-nav space-y-1">
          <div className="nav-kicker">
            FLIGHT OPERATIONS
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`nav-item ${isActive ? 'nav-active' : ''}`}
              >
                <div className="nav-item-label font-editorial">
                  <Icon className={`w-4 h-4 nav-icon ${isActive ? 'text-[#d97742]' : 'text-[#8c939f]'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </div>

                {item.badge ? (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                ) : item.count !== undefined && item.count > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech bg-[#171c26] text-[#8c939f]">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status & Operator Profile */}
      <div className="sidebar-footer p-4 border-t border-[rgba(240,230,215,0.08)] space-y-3.5 bg-[#090b0e]">
        {/* Downlink Telemetry Status Card */}
        <div className="bg-[#12161f] border border-[rgba(240,230,215,0.08)] p-3 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8c939f] uppercase font-semibold font-editorial">DOWNLINK STATUS</span>
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-mono-tech text-[#ede8df]">
                {isRunning ? 'SIM ACTIVE' : 'PAUSED'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8c939f] font-mono-tech">
            <span>Stream Rate:</span>
            <span className="text-[#d97742] font-semibold">{config.updateRateHz} Hz Telemetry</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8c939f] font-mono-tech">
            <span>Orbital Track:</span>
            <span className="text-[#d5dedb]">LEO Pass #1402</span>
          </div>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center space-x-3 px-1">
          <div className="w-8 h-8 rounded-full bg-[#161b24] border border-[rgba(217,119,66,0.3)] flex items-center justify-center text-[#d97742] text-xs font-mono-tech font-bold shadow-sm">
            FD
          </div>
          <div className="text-[11px] leading-tight">
            <div className="font-semibold text-[#f4f0e8] font-editorial">OPERATOR: FLIGHT_DIR_01</div>
            <div className="text-[10px] text-[#717a87] font-mono-tech">Level 3 Flight Clearance</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
