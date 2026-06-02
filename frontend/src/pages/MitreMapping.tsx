import { useEffect, useState, useCallback } from 'react';
import { Search, Target, RefreshCw, ExternalLink } from 'lucide-react';
import { listTechniques, listTactics } from '../services/api';
import ConfidenceBadge from '../components/ui/ConfidenceBadge';

const TACTIC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Initial Access':      { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20' },
  'Execution':           { bg: 'bg-orange-500/10',  text: 'text-orange-400', border: 'border-orange-500/20' },
  'Persistence':         { bg: 'bg-yellow-500/10',  text: 'text-yellow-400', border: 'border-yellow-500/20' },
  'Privilege Escalation':{ bg: 'bg-amber-500/10',   text: 'text-amber-400',  border: 'border-amber-500/20' },
  'Defense Evasion':     { bg: 'bg-purple-500/10',  text: 'text-purple-400', border: 'border-purple-500/20' },
  'Credential Access':   { bg: 'bg-pink-500/10',    text: 'text-pink-400',   border: 'border-pink-500/20' },
  'Discovery':           { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',   border: 'border-cyan-500/20' },
  'Lateral Movement':    { bg: 'bg-blue-500/10',    text: 'text-blue-400',   border: 'border-blue-500/20' },
  'Collection':          { bg: 'bg-indigo-500/10',  text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'Command and Control': { bg: 'bg-violet-500/10',  text: 'text-violet-400', border: 'border-violet-500/20' },
  'Exfiltration':        { bg: 'bg-rose-500/10',    text: 'text-rose-400',   border: 'border-rose-500/20' },
  'Impact':              { bg: 'bg-red-600/10',     text: 'text-red-500',    border: 'border-red-600/20' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };

export default function MitreMapping() {
  const [techniques, setTechniques] = useState<any[]>([]);
  const [tactics, setTactics] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [tacticFilter, setTacticFilter] = useState('All');
  const [confFilter, setConfFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [techs, tacs] = await Promise.all([
        listTechniques({ tactic: tacticFilter !== 'All' ? tacticFilter : undefined,
                         confidence: confFilter !== 'All' ? confFilter : undefined,
                         search: search || undefined }),
        listTactics(),
      ]);
      setTechniques(techs);
      setTactics(tacs);
    } catch { setTechniques([]); }
    finally { setLoading(false); }
  }, [search, tacticFilter, confFilter]);

  useEffect(() => { load(); }, [load]);

  const groupedByTactic = techniques.reduce<Record<string, any[]>>((acc, t) => {
    const key = t.tactic || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-[1600px] space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">MITRE ATT&CK Mapping</h1>
        <p className="text-sm text-gray-400 mt-1">
          Adversarial techniques identified across all analyzed threat reports
        </p>
      </div>

      {/* Filters */}
      <div className="panel p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search techniques…"
            className="input-field pl-9"
          />
        </div>

        <select
          value={tacticFilter}
          onChange={(e) => setTacticFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="All">All Tactics</option>
          {tactics.map((t: any) => (
            <option key={t.tactic} value={t.tactic}>{t.tactic} ({t.count})</option>
          ))}
        </select>

        <select
          value={confFilter}
          onChange={(e) => setConfFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="All">All Confidence</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <div className="flex gap-1 bg-[#0B1220] p-1 rounded-lg">
          {(['cards', 'matrix'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all
                ${viewMode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {['High', 'Medium', 'Low'].map((c) => {
          const count = techniques.filter((t) => t.confidence === c).length;
          const colors = { High: 'text-green-400', Medium: 'text-yellow-400', Low: 'text-gray-400' };
          return (
            <div key={c} className="panel p-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">{c} Confidence</span>
              <span className={`text-2xl font-bold tabular-nums ${colors[c as keyof typeof colors]}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-3">
          <RefreshCw size={18} className="animate-spin" /> Loading techniques…
        </div>
      ) : techniques.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center py-16 text-gray-500">
          <Target size={36} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No techniques mapped yet</p>
          <p className="text-xs mt-1 text-gray-600">Run a threat analysis to see ATT&CK mappings here</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-6">
          {Object.entries(groupedByTactic).map(([tactic, techs]) => {
            const colors = TACTIC_COLORS[tactic] || DEFAULT_COLOR;
            return (
              <div key={tactic}>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold mb-3 ${colors.bg} ${colors.text} ${colors.border}`}>
                  <Target size={14} />
                  {tactic}
                  <span className="opacity-70 font-normal">({techs.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {techs.map((t) => (
                    <div key={`${t.technique_id}-${t.analysis_id}`} className="panel card-hover p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-mono text-blue-400">{t.technique_id}</p>
                          <p className="text-sm font-semibold text-gray-100 mt-0.5">{t.technique_name}</p>
                        </div>
                        <ConfidenceBadge level={t.confidence} />
                      </div>
                      {t.description && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {t.description}
                        </p>
                      )}
                      {t.matched_keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {t.matched_keywords.slice(0, 4).map((kw: string) => (
                            <span key={kw} className="text-xs bg-[#0B1220] text-gray-500 px-2 py-0.5 rounded border border-[#1F2937]">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      <a
                        href={`https://attack.mitre.org/techniques/${t.technique_id.replace('.', '/')}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={11} /> MITRE ATT&CK
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix view */
        <div className="panel overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1F2937]">
                {['ID', 'Technique Name', 'Tactic', 'Confidence', 'Matched Keywords'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {techniques.map((t, idx) => (
                <tr key={idx} className="border-t border-[#1F2937] hover:bg-[#1a2235] transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-blue-400">{t.technique_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{t.technique_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t.tactic}</td>
                  <td className="px-4 py-3"><ConfidenceBadge level={t.confidence} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(t.matched_keywords || []).slice(0, 3).map((kw: string) => (
                        <span key={kw} className="text-xs bg-[#0B1220] text-gray-500 px-1.5 py-0.5 rounded border border-[#1F2937]">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
