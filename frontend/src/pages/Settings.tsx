import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon, Save, CheckCircle2, XCircle,
  Eye, EyeOff, Cpu, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { getSettings, updateSettings, testLLMConnection } from '../services/api';
import toast from 'react-hot-toast';

interface SettingsState {
  llm_provider: string;
  openai_api_key: string;
  gemini_api_key: string;
  llm_model: string;
  max_ioc_results: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    llm_provider: 'none',
    openai_api_key: '',
    gemini_api_key: '',
    llm_model: 'gpt-4o-mini',
    max_ioc_results: '500',
  });

  // Track which API keys are already saved in the DB (returned as boolean flags by the backend)
  const [configured, setConfigured] = useState({ openai: false, gemini: false });

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshFromServer = async () => {
    const s: any = await getSettings();
    setConfigured({ openai: !!s.openai_configured, gemini: !!s.gemini_configured });
    setSettings((prev) => ({
      ...prev,
      llm_provider: s.llm_provider || 'none',
      llm_model: s.llm_model || 'gpt-4o-mini',
      max_ioc_results: s.max_ioc_results || '500',
      openai_api_key: '',   // never populate input with the raw key
      gemini_api_key: '',
    }));
  };

  useEffect(() => {
    refreshFromServer().catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Only send API keys if the user actually typed something new in the field
  const buildPayload = () => {
    const payload: Record<string, string> = {
      llm_provider: settings.llm_provider,
      llm_model: settings.llm_model,
      max_ioc_results: settings.max_ioc_results,
    };
    if (settings.openai_api_key.trim()) payload.openai_api_key = settings.openai_api_key.trim();
    if (settings.gemini_api_key.trim()) payload.gemini_api_key = settings.gemini_api_key.trim();
    return payload;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(buildPayload());
      await refreshFromServer();
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Save first so the backend has the latest key before testing
      await updateSettings(buildPayload());
      await refreshFromServer();
      const result = await testLLMConnection();
      setTestResult(result);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const change = (key: keyof SettingsState, value: string) =>
    setSettings((s) => ({ ...s, [key]: value }));

  if (loading) return null;

  const provider = settings.llm_provider;
  const geminiConfigured = configured.gemini;
  const openaiConfigured = configured.openai;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure AI enhancement and analysis preferences
        </p>
      </div>

      {/* LLM Configuration */}
      <div className="panel p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-[#1F2937] pb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Cpu size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-200">AI / LLM Enhancement</h2>
            <p className="text-xs text-gray-500">
              Optional — the platform works fully without an API key
            </p>
          </div>
        </div>

        {/* Provider selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            LLM Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'none',   label: 'None (Offline)',  desc: 'Fully deterministic' },
              { value: 'openai', label: 'OpenAI',          desc: 'GPT-4o / GPT-4o-mini' },
              { value: 'gemini', label: 'Google Gemini',   desc: 'Gemini 1.5 Flash' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => { change('llm_provider', value); setTestResult(null); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  provider === value
                    ? 'border-blue-500/40 bg-blue-600/15 text-white'
                    : 'border-[#1F2937] bg-[#0B1220] text-gray-400 hover:border-[#374151]'
                }`}
              >
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs opacity-60 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* OpenAI key input */}
        {provider === 'openai' && (
          <div className="space-y-3">
            {openaiConfigured && (
              <div className="flex items-center gap-2 text-xs text-green-400
                              bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <ShieldCheck size={14} />
                API key is saved. Leave blank to keep it, or paste a new one to replace it.
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenAI ? 'text' : 'password'}
                  value={settings.openai_api_key}
                  onChange={(e) => change('openai_api_key', e.target.value)}
                  placeholder={openaiConfigured ? 'Leave blank to keep existing key…' : 'sk-…'}
                  className="input-field pr-10 font-mono text-sm"
                />
                <button
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showOpenAI ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Model
              </label>
              <select
                value={settings.llm_model}
                onChange={(e) => change('llm_model', e.target.value)}
                className="input-field"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (faster, cheaper)</option>
                <option value="gpt-4o">gpt-4o (most capable)</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
              </select>
            </div>
          </div>
        )}

        {/* Gemini key input */}
        {provider === 'gemini' && (
          <div className="space-y-3">
            {geminiConfigured && (
              <div className="flex items-center gap-2 text-xs text-green-400
                              bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <ShieldCheck size={14} />
                API key is saved. Leave blank to keep it, or paste a new one to replace it.
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Google AI API Key
              </label>
              <div className="relative">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={settings.gemini_api_key}
                  onChange={(e) => change('gemini_api_key', e.target.value)}
                  placeholder={geminiConfigured ? 'Leave blank to keep existing key…' : 'AIza…'}
                  className="input-field pr-10 font-mono text-sm"
                />
                <button
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showGemini ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test button */}
        {provider !== 'none' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleTest} disabled={testing} className="btn-secondary">
              {testing
                ? <><SettingsIcon size={14} className="animate-spin" /> Testing…</>
                : 'Test Connection'}
            </button>
            <span className="text-xs text-gray-600">
              {(provider === 'gemini' ? geminiConfigured : openaiConfigured)
                ? 'Uses the saved key unless you typed a new one above'
                : 'Save your key first, then test'}
            </span>
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg border ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {testResult.success ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <XCircle size={15} className="shrink-0 mt-0.5" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Analysis settings */}
      <div className="panel p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-200">Analysis Settings</h2>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Max IOC Results Per Query
          </label>
          <input
            type="number"
            value={settings.max_ioc_results}
            onChange={(e) => change('max_ioc_results', e.target.value)}
            min={10}
            max={1000}
            className="input-field max-w-xs"
          />
        </div>
      </div>

      {/* Offline note */}
      <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-5 py-4">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-300">Offline Mode</p>
          <p className="text-xs text-blue-400/70 mt-1">
            All core features — IOC extraction, ATT&CK mapping, rule generation, and risk scoring —
            work completely offline. LLM integration only rewrites the executive summary paragraph.
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        <Save size={16} />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
