import { useEffect, useState } from 'react';
import { FileCode2, Download, RefreshCw, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { listRules } from '../services/api';
import CopyButton from '../components/ui/CopyButton';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

type RuleType = 'sigma' | 'yara' | 'snort';

const RULE_META: Record<RuleType, { label: string; lang: string; ext: string; color: string; desc: string }> = {
  sigma: { label: 'Sigma', lang: 'yaml', ext: 'yml', color: 'text-yellow-400', desc: 'SIEM-agnostic detection rules (YAML format)' },
  yara: { label: 'YARA', lang: 'python', ext: 'yar', color: 'text-purple-400', desc: 'Binary pattern matching rules' },
  snort: { label: 'Snort / Suricata', lang: 'bash', ext: 'rules', color: 'text-blue-400', desc: 'Network intrusion detection signatures' },
};

export default function DetectionRules() {
  const [rules, setRules] = useState<Record<RuleType, any[]>>({ sigma: [], yara: [], snort: [] });
  const [activeType, setActiveType] = useState<RuleType>('sigma');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [sigma, yara, snort] = await Promise.all([
          listRules({ rule_type: 'sigma' }),
          listRules({ rule_type: 'yara' }),
          listRules({ rule_type: 'snort' }),
        ]);
        setRules({ sigma, yara, snort });
      } catch { setRules({ sigma: [], yara: [], snort: [] }); }
      finally { setLoading(false); }
    };
    loadAll();
  }, []);

  const currentRules = rules[activeType];
  const selected = currentRules[selectedIdx];
  const meta = RULE_META[activeType];

  const downloadRule = (rule: any) => {
    const blob = new Blob([rule.rule_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rule.rule_name.replace(/[^a-z0-9]/gi, '_')}.${meta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    const content = currentRules.map((r) => r.rule_content).join('\n\n' + '#'.repeat(60) + '\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_${activeType}_rules.${meta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-[1600px] space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Detection Rules</h1>
          <p className="text-sm text-gray-400 mt-1">
            Auto-generated Sigma, YARA, and Snort rules from threat intelligence analyses
          </p>
        </div>
        {currentRules.length > 0 && (
          <button onClick={downloadAll} className="btn-secondary">
            <Download size={15} /> Download All {meta.label}
          </button>
        )}
      </div>

      {/* Rule type selector */}
      <div className="flex gap-2">
        {(Object.keys(RULE_META) as RuleType[]).map((rt) => {
          const m = RULE_META[rt];
          return (
            <button
              key={rt}
              onClick={() => { setActiveType(rt); setSelectedIdx(0); }}
              className={clsx(
                'flex-1 py-3 px-4 rounded-xl border transition-all font-medium text-sm',
                activeType === rt
                  ? 'bg-[#1a2235] border-blue-500/40 text-white'
                  : 'bg-[#111827] border-[#1F2937] text-gray-400 hover:border-[#374151] hover:text-gray-200'
              )}
            >
              <div className={`text-lg font-bold ${m.color} mb-0.5`}>{m.label}</div>
              <div className="text-xs text-gray-500">{rules[rt].length} rule{rules[rt].length !== 1 ? 's' : ''}</div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
          <RefreshCw size={18} className="animate-spin" /> Loading rules…
        </div>
      ) : currentRules.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center py-16 text-gray-500">
          <FileCode2 size={36} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No {meta.label} rules yet</p>
          <p className="text-xs mt-1 text-gray-600">Rules are auto-generated during threat analysis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-24rem)]">
          {/* Rule list */}
          <div className="panel overflow-y-auto">
            <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {meta.label} Rules
              </span>
              <span className="text-xs text-gray-600">{currentRules.length} total</span>
            </div>
            <div className="divide-y divide-[#1F2937]">
              {currentRules.map((rule, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={clsx(
                    'w-full text-left px-4 py-3 transition-colors',
                    selectedIdx === idx
                      ? 'bg-blue-600/15 border-l-2 border-blue-500'
                      : 'hover:bg-[#1a2235] border-l-2 border-transparent'
                  )}
                >
                  <p className="text-sm font-medium text-gray-200 truncate">{rule.rule_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {new Date(rule.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Rule viewer */}
          <div className="lg:col-span-2 panel overflow-hidden flex flex-col">
            {selected ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F2937] shrink-0">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{selected.rule_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={selected.rule_content} />
                    <button onClick={() => downloadRule(selected)} className="btn-ghost text-xs">
                      <Download size={13} /> .{meta.ext}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <SyntaxHighlighter
                    language={meta.lang}
                    style={atomOneDark}
                    customStyle={{
                      margin: 0,
                      background: '#0B1220',
                      fontSize: '0.78rem',
                      padding: '1.25rem',
                      height: '100%',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                    showLineNumbers
                    lineNumberStyle={{ color: '#374151', paddingRight: '1rem', minWidth: '2.5rem' }}
                  >
                    {selected.rule_content}
                  </SyntaxHighlighter>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                <Info size={16} /> Select a rule from the list
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
