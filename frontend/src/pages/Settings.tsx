import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon, Save, CheckCircle2, XCircle,
  Eye, EyeOff, Cpu, AlertCircle,
} from 'lucide-react';
import { getSettings, updateSettings, testLLMConnection } from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    llm_provider: 'none',
    openai_api_key: '',
    gemini_api_key: '',
    llm_model: 'gpt-4o-mini',
    max_ioc_results: '500',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then((s) => setSettings((prev) => ({ ...prev, ...s })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved successfully');
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
      await updateSettings(settings);
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

  const change = (key: string, value: string) =>
    setSettings((s) => ({ ...s, [key]: value }));

  if (loading) return null;

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
            <p className="text-xs text-gray-500">Optional — the platform works fully without an API key</p>
          </div>
        </div>

        {/* Provider */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            LLM Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'none', label: 'None (Offline)', desc: 'Fully deterministic' },
              { value: 'openai', label: 'OpenAI', desc: 'GPT-4o / GPT-4o-mini' },
              { value: 'gemini', label: 'Google Gemini', desc: 'Gemini 1.5 Flash' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => change('llm_provider', value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.llm_provider === value
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

        {/* OpenAI settings */}
        {settings.llm_provider === 'openai' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenAI ? 'text' : 'password'}
                  value={settings.openai_api_key}
                  onChange={(e) => change('openai_api_key', e.target.value)}
                  placeholder="sk-…"
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

        {/* Gemini settings */}
        {settings.llm_provider === 'gemini' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Google AI API Key
            </label>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={settings.gemini_api_key}
                onChange={(e) => change('gemini_api_key', e.target.value)}
                placeholder="AIza…"
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
        )}

        {settings.llm_provider !== 'none' && (
          <button onClick={handleTest} disabled={testing} className="btn-secondary">
            {testing ? (
              <><SettingsIcon size={14} className="animate-spin" /> Testing connection…</>
            ) : 'Test Connection'}
          </button>
        )}

        {testResult && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${
            testResult.success
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {testResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {testResult.message}
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

      {/* Info callout */}
      <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-5 py-4 text-sm text-blue-300">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-400" />
        <div>
          <p className="font-medium text-blue-300">Offline Mode</p>
          <p className="text-xs text-blue-400/70 mt-1">
            All core features — IOC extraction, ATT&CK mapping, rule generation, and risk scoring —
            work completely offline without any API keys. LLM integration only enhances the executive
            summary text.
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
