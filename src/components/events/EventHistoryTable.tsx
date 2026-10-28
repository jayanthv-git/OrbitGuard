import React, { useState, useMemo } from 'react';
import { useMission } from '../../context/MissionContext';
import { ImpactEvent } from '../../types/events';
import { 
  History, 
  Search, 
  Play, 
  Eye, 
  Trash2, 
  AlertTriangle, 
  Zap, 
  HelpCircle,
  ArrowUpDown
} from 'lucide-react';

interface EventHistoryTableProps {
  onNavigateToDiagnosis?: () => void;
}

export const EventHistoryTable: React.FC<EventHistoryTableProps> = ({ onNavigateToDiagnosis }) => {
  const { events, setSelectedEvent, startReplay, clearEvents } = useMission();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'POSSIBLE_IMPACT' | 'SENSOR_GLITCH' | 'UNCERTAIN'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        if (filterType !== 'ALL' && evt.classification !== filterType) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          evt.id.toLowerCase().includes(q) ||
          evt.classification.toLowerCase().includes(q) ||
          evt.affectedSensors.some((s) => s.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        return sortOrder === 'NEWEST' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
      });
  }, [events, filterType, searchQuery, sortOrder]);

  const handleInspect = (event: ImpactEvent) => {
    setSelectedEvent(event);
    if (onNavigateToDiagnosis) {
      onNavigateToDiagnosis();
    }
  };

  return (
    <div className="bg-[#0e1218] border border-[rgba(240,230,215,0.08)] rounded-xl p-5 space-y-4 shadow-sm">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <History className="w-4 h-4 text-[#d97742]" />
          <h2 className="text-xs font-semibold text-[#faf7f2] tracking-wider uppercase font-display">
            SATELLITE ANOMALY LOG & FLIGHT ARCHIVE
          </h2>
          <span className="text-xs font-mono-tech px-2.5 py-0.5 rounded-full bg-[#181e28] text-[#a3abb8] border border-[rgba(240,230,215,0.08)]">
            {events.length} EVENTS RECORDED
          </span>
        </div>

        {/* Search & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#717a87]" />
            <input
              type="text"
              placeholder="Search ID or channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#12161f] border border-[rgba(240,230,215,0.08)] rounded-lg text-xs text-[#ede8df] placeholder-[#717a87] focus:outline-none focus:border-[#d97742]/60 w-48 font-mono-tech"
            />
          </div>

          {/* Filter Segment */}
          <div className="flex items-center space-x-1 bg-[#12161f] border border-[rgba(240,230,215,0.08)] p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-0.5 rounded-md text-[11px] font-medium transition ${
                filterType === 'ALL' ? 'bg-[#d97742]/20 text-[#f4f0e8] font-semibold border border-[#d97742]/40' : 'text-[#8c939f] hover:text-[#f4f0e8]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('POSSIBLE_IMPACT')}
              className={`px-3 py-0.5 rounded-md text-[11px] font-medium transition ${
                filterType === 'POSSIBLE_IMPACT' ? 'bg-rose-950/70 text-rose-300 font-semibold border border-rose-500/40' : 'text-[#8c939f] hover:text-[#f4f0e8]'
              }`}
            >
              Impacts
            </button>
            <button
              onClick={() => setFilterType('SENSOR_GLITCH')}
              className={`px-3 py-0.5 rounded-md text-[11px] font-medium transition ${
                filterType === 'SENSOR_GLITCH' ? 'bg-amber-950/70 text-amber-300 font-semibold border border-amber-500/40' : 'text-[#8c939f] hover:text-[#f4f0e8]'
              }`}
            >
              Glitches
            </button>
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortOrder(prev => prev === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs text-[#8c939f] hover:text-[#f4f0e8] bg-[#12161f] border border-[rgba(240,230,215,0.08)] font-editorial"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span className="text-[11px]">{sortOrder}</span>
          </button>

          {/* Clear Log */}
          {events.length > 0 && (
            <button
              onClick={clearEvents}
              title="Clear event log"
              className="p-1.5 rounded-lg text-[#717a87] hover:text-rose-400 hover:bg-rose-950/30 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto border border-[rgba(240,230,215,0.08)] rounded-xl">
        <table className="w-full text-left text-xs font-mono-tech">
          <thead>
            <tr className="bg-[#12161f] border-b border-[rgba(240,230,215,0.08)] text-[10px] uppercase text-[#8c939f] font-editorial">
              <th className="py-3 px-3.5">Event ID</th>
              <th className="py-3 px-3.5">Timestamp / MET</th>
              <th className="py-3 px-3.5">Classification</th>
              <th className="py-3 px-3.5">Affected Channels</th>
              <th className="py-3 px-3.5">Confidence</th>
              <th className="py-3 px-3.5">Severity</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(240,230,215,0.06)] bg-[#090c10]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#717a87] font-editorial text-xs">
                  No events match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isImpact = evt.classification === 'POSSIBLE_IMPACT';
                const isGlitch = evt.classification === 'SENSOR_GLITCH';

                return (
                  <tr key={evt.id} className="hover:bg-[#121620] transition">
                    <td className="py-3 px-3.5 font-semibold text-[#d97742]">
                      {evt.id}
                    </td>
                    <td className="py-3 px-3.5 text-[#d5dedb]">
                      <div>{evt.timeString}</div>
                      <div className="text-[10px] text-[#717a87]">{evt.metString}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border font-editorial ${
                          isImpact
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : isGlitch
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                        }`}
                      >
                        {isImpact ? (
                          <Zap className="w-3 h-3 text-rose-400" />
                        ) : isGlitch ? (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        ) : (
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        )}
                        <span>{evt.classification.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {evt.affectedSensors.map((s, i) => (
                          <span
                            key={i}
                            className="bg-[#151922] text-[#d5dedb] text-[10px] px-2 py-0.5 rounded-md border border-[rgba(240,230,215,0.06)]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-[#f4f0e8]">{evt.confidenceScore}%</span>
                        <div className="w-14 bg-[#1e2430] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isImpact ? 'bg-[#d97742]' : 'bg-amber-400'}`}
                            style={{ width: `${evt.confidenceScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-editorial ${
                          evt.severity === 'HIGH'
                            ? 'text-rose-400 bg-rose-950/60'
                            : evt.severity === 'MEDIUM'
                            ? 'text-amber-400 bg-amber-950/60'
                            : 'text-slate-400 bg-slate-900'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleInspect(evt)}
                          title="Inspect AI Evidence"
                          className="px-2.5 py-1 rounded-lg bg-[#141822] hover:bg-[#1d2330] text-[#d97742] border border-[rgba(240,230,215,0.08)] transition flex items-center space-x-1 font-editorial"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="text-[11px]">Inspect</span>
                        </button>
                        <button
                          onClick={() => startReplay(evt)}
                          title="High-Res Replay"
                          className="px-2.5 py-1 rounded-lg bg-[#d97742]/20 hover:bg-[#d97742]/30 text-[#f4f0e8] border border-[#d97742]/40 transition flex items-center space-x-1 font-editorial"
                        >
                          <Play className="w-3 h-3" />
                          <span className="text-[11px]">Replay</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
