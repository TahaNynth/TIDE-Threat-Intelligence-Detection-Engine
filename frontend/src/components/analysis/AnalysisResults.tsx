import { useState } from 'react';
import {
  Activity, Target, FileCode2, BookOpen, ShieldAlert,
  Download, ChevronDown, ChevronUp, CheckCircle2, Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { AnalysisResult } from '../../types';
import RiskBadge from '../ui/RiskBadge';
import ConfidenceBadge from '../ui/ConfidenceBadge';
import CopyButton from '../ui/CopyButton';
import RiskGauge from '../dashboard/RiskGauge';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { exportIOCsCSVUrl, exportJSONUrl } from '../../services/api';

interface Props {
  result: AnalysisResult;
}

type Tab = 'summary' | 'iocs' | 'mitre' | 'rules';

const TACTIC_COLORS: Record<string, string> = {
  'Initial Access': 'text-red-400',
  'Execution': 'text-orange-400',
  'Persistence': 'text-yellow-400',
  'Privilege Escalation': 'text-amber-400',
  'Defense Evasion': 'text-purple-400',
  'Credential Access': 'text-pink-400',
  'Discovery': 'text-cyan-400',
  'Lateral Movement': 'text-blue-400',
  'Collection': 'text-indigo-400',
  'Command and Control': 'text-violet-400',
  'Exfiltration': 'text-rose-400',
  'Impact': 'text-red-500',
};

export default function AnalysisResults({ result }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [ruleTab, setRuleTab] = useState<'sigma' | 'yara' | 'snort'>('sigma');
  const [iocCategory, setIocCategory] = useState<'all' | 'network' | 'file'>('all');
  const [expandedRuleIdx, setExpandedRuleIdx] = useState<number>(0);

  const allIOCs = [
    ...result.iocs.network.map((i) => ({ ...i, category: 'network' })),
    ...result.iocs.file.map((i) => ({ ...i, category: 'file' })),
  ];

  const filteredIOCs = iocCategory === 'all'
    ? allIOCs
    : allIOCs.filter((i) => i.category === iocCategory);

  const TABS: Array<{ id: Tab; label: string; icon: any; count?: number }> = [
    { id: 'summary', label: 'Summary', icon: BookOpen },
    { id: 'iocs', label: 'IOCs', icon: Activity, count: result.ioc_stats?.total },
    { id: 'mitre', label: 'ATT&CK', icon: Target, count: result.techniques.length },
    { id: 'rules', label: 'Detection Rules', icon: FileCode2 },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header bar */}
      <div className="panel p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            <h2 className="text-base font-semibold text-white truncate">{result.title}</h2>
          </div>
          <p className="text-xs text-gray-500">
            {new Date(result.created_at).toLocaleString()} · ID: {result.analysis_id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={result.risk.level} score={result.risk.score} size="md" />
          <a
            href={exportJSONUrl(result.analysis_id)}
            download
            className="btn-secondary text-xs py-1.5"
          >
            <Download size={13} /> Export JSON
          </a>
        </div>
      </div>

      {/* Risk flags */}
      {result.risk.flags.length > 0 && (
        <div className="panel p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Risk Indicators
          </p>
          <div className="flex flex-wrap gap-2">
            {result.risk.flags.map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 text-xs bg-red-500/10 text-red-300
                           border border-red-500/20 px-2.5 py-1 rounded-full"
              >
                <ShieldAlert size={11} />
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-[#1F2937] overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap',
              'border-b-2 transition-all -mb-px',
              tab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            )}
          >
            <Icon size={15} />
            {label}
            {count !== undefined && (
              <span className="bg-[#1a2235] text-gray-400 text-xs px-1.5 py-0.5 rounded-md">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ---- SUMMARY ---- */}
      {tab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
          {/* Gauge */}
          <div className="panel p-5 flex flex-col items-center gap-4">
            <p className="text-sm font-semibold text-gray-300">Risk Score</p>
            <RiskGauge score={result.risk.score} level={result.risk.level} />
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">IOCs</span>
                <span className="text-gray-300 font-medium">{result.risk.ioc_count}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Techniques</span>
                <span className="text-gray-300 font-medium">{result.risk.technique_count}</span>
              </div>
            </div>
          </div>

          {/* Executive summary */}
          <div className="panel p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">Executive Summary</h3>
              {result.summary.llm_enhanced ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold
                                 bg-purple-500/20 text-purple-300 border border-purple-500/40
                                 px-3 py-1 rounded-full shadow shadow-purple-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  ✦ AI Enhanced · {result.summary.llm_provider || 'LLM'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs
                                 bg-[#1a2235] text-gray-500 border border-[#1F2937]
                                 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  Deterministic
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {result.summary.executive_summary}
            </p>

            {/* Show LLM error if enhancement failed */}
            {result.summary.llm_error && (
              <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10
                              border border-amber-500/20 rounded-lg px-3 py-2">
                <span className="shrink-0">⚠</span>
                <span>LLM enhancement failed: {result.summary.llm_error}</span>
              </div>
            )}

            {/* Threat overview */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1F2937]">
              <div>
                <p className="text-xs text-gray-500 mb-1">Threat Type</p>
                <p className="text-sm text-gray-200 font-medium">
                  {result.summary.threat_overview?.main_threat}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Threat Actor</p>
                <p className="text-sm text-gray-200 font-medium">
                  {result.summary.threat_overview?.threat_actor || 'Unknown'}
                </p>
              </div>
              {result.summary.threat_overview?.targeted_assets?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Targeted Sectors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.summary.threat_overview.targeted_assets.map((s) => (
                      <span key={s} className="text-xs bg-[#1a2235] text-gray-300 px-2 py-0.5 rounded-md border border-[#1F2937]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="panel p-5 lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">
              Recommended Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.summary.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-gray-300 bg-[#0B1220] px-3 py-2.5 rounded-lg border border-[#1F2937]"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                    {idx + 1}
                  </span>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- IOCs ---- */}
      {tab === 'iocs' && (
        <div className="panel animate-fade-in">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[#1F2937]">
            <div className="flex gap-1 bg-[#0B1220] p-1 rounded-lg">
              {(['all', 'network', 'file'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setIocCategory(c)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all',
                    iocCategory === c
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {c} ({c === 'all' ? allIOCs.length : result.iocs[c as 'network' | 'file'].length})
                </button>
              ))}
            </div>
            <a
              href={exportIOCsCSVUrl(result.analysis_id)}
              download
              className="btn-secondary text-xs py-1.5 ml-auto"
            >
              <Download size={13} /> Export CSV
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Type', 'Indicator', 'Category', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIOCs.map((ioc, idx) => (
                  <tr key={idx} className="border-t border-[#1F2937] hover:bg-[#1a2235] transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {ioc.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm text-gray-200 max-w-sm">
                      <span className="break-all">{ioc.value}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 capitalize">{ioc.category}</td>
                    <td className="px-4 py-2.5">
                      <CopyButton text={ioc.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIOCs.length === 0 && (
              <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
                No indicators found in this category
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- MITRE ---- */}
      {tab === 'mitre' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-fade-in">
          {result.techniques.length === 0 ? (
            <div className="col-span-3 flex items-center justify-center py-12 text-gray-500">
              No ATT&CK techniques identified
            </div>
          ) : (
            result.techniques.map((tech) => (
              <div
                key={tech.technique_id}
                className="panel card-hover p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-blue-400">{tech.technique_id}</p>
                    <p className="text-sm font-semibold text-gray-200 mt-0.5 leading-snug">
                      {tech.technique_name}
                    </p>
                  </div>
                  <ConfidenceBadge level={tech.confidence} />
                </div>
                <p className={clsx(
                  'text-xs font-medium',
                  TACTIC_COLORS[tech.tactic] || 'text-gray-400'
                )}>
                  {tech.tactic}
                </p>
                {tech.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {tech.description}
                  </p>
                )}
                {tech.matched_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tech.matched_keywords.slice(0, 5).map((kw) => (
                      <span
                        key={kw}
                        className="text-xs bg-[#0B1220] text-gray-500 px-2 py-0.5 rounded border border-[#1F2937]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- DETECTION RULES ---- */}
      {tab === 'rules' && (
        <div className="space-y-4 animate-fade-in">
          {/* Rule type tabs */}
          <div className="flex gap-1 bg-[#111827] border border-[#1F2937] p-1 rounded-lg w-fit">
            {(['sigma', 'yara', 'snort'] as const).map((rt) => (
              <button
                key={rt}
                onClick={() => { setRuleTab(rt); setExpandedRuleIdx(0); }}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium uppercase tracking-wide transition-all',
                  ruleTab === rt
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {rt}
                <span className="ml-2 text-xs opacity-70">
                  ({result.rules[rt].length})
                </span>
              </button>
            ))}
          </div>

          {result.rules[ruleTab].length === 0 ? (
            <div className="panel flex items-center gap-3 p-6 text-gray-500">
              <Info size={16} />
              No {ruleTab.toUpperCase()} rules generated. Add more IOCs or ATT&CK techniques.
            </div>
          ) : (
            result.rules[ruleTab].map((rule, idx) => (
              <div key={idx} className="panel overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1a2235] transition-colors"
                  onClick={() => setExpandedRuleIdx(expandedRuleIdx === idx ? -1 : idx)}
                >
                  <div className="flex items-center gap-3">
                    <FileCode2 size={15} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-medium text-gray-200">{rule.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={rule.content} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const blob = new Blob([rule.content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${rule.name.replace(/[^a-z0-9]/gi, '_')}.${ruleTab === 'sigma' ? 'yml' : ruleTab === 'yara' ? 'yar' : 'rules'}`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="btn-ghost text-xs"
                    >
                      <Download size={13} />
                    </button>
                    {expandedRuleIdx === idx
                      ? <ChevronUp size={15} className="text-gray-500" />
                      : <ChevronDown size={15} className="text-gray-500" />
                    }
                  </div>
                </div>
                {expandedRuleIdx === idx && (
                  <div className="border-t border-[#1F2937]">
                    <SyntaxHighlighter
                      language={ruleTab === 'sigma' ? 'yaml' : ruleTab === 'yara' ? 'python' : 'bash'}
                      style={atomOneDark}
                      customStyle={{
                        margin: 0,
                        background: '#0B1220',
                        fontSize: '0.78rem',
                        padding: '1.25rem',
                        maxHeight: '480px',
                        overflowY: 'auto',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      }}
                      showLineNumbers
                      lineNumberStyle={{ color: '#374151', paddingRight: '1rem' }}
                    >
                      {rule.content}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
