import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { getAnalysis } from '../services/api';
import type { AnalysisResult } from '../types';
import ReportInput from '../components/analysis/ReportInput';
import AnalysisResults from '../components/analysis/AnalysisResults';

const STEPS = [
  { id: 1, label: 'Input Report' },
  { id: 2, label: 'Processing' },
  { id: 3, label: 'Results' },
];

export default function ThreatAnalysis() {
  const { result: freshResult, loading, error, progress, analyze, analyzeFile, clear } = useAnalysis();
  const [searchParams] = useSearchParams();
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingResult, setExistingResult] = useState<AnalysisResult | null>(null);
  const [existingError, setExistingError] = useState('');

  const result = freshResult || existingResult;

  const existingId = searchParams.get('id');
  useEffect(() => {
    if (!existingId) return;
    setLoadingExisting(true);
    setExistingError('');
    getAnalysis(existingId)
      .then((data) => setExistingResult(data as AnalysisResult))
      .catch((e) => setExistingError(e.message))
      .finally(() => setLoadingExisting(false));
  }, [existingId]);

  const clearAll = useCallback(() => {
    clear();
    setExistingResult(null);
  }, [clear]);

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
        <Loader2 size={20} className="animate-spin" /> Loading analysis…
      </div>
    );
  }

  const step = result ? 3 : loading ? 2 : 1;

  return (
    <div className="p-6 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Threat Analysis</h1>
          <p className="text-sm text-gray-400 mt-1">
            Paste or upload a threat intelligence report to extract IOCs, map ATT&CK techniques,
            and generate detection rules
          </p>
        </div>
        {result && (
          <button onClick={clearAll} className="btn-secondary">
            <RotateCcw size={15} /> New Analysis
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 panel-sm p-4 w-fit">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > s.id
                  ? 'bg-green-600 text-white'
                  : step === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a2235] text-gray-500'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              <span className={`text-sm ${step === s.id ? 'text-white font-medium' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-3 ${step > s.id ? 'bg-green-600' : 'bg-[#1F2937]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar when loading */}
      {loading && (
        <div className="panel p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-medium">Analyzing report…</span>
            <span className="text-gray-500 tabular-nums">{progress}%</span>
          </div>
          <div className="h-2 bg-[#1a2235] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {[
              { label: 'IOC Extraction', done: progress >= 40 },
              { label: 'ATT&CK Mapping', done: progress >= 60 },
              { label: 'Rule Generation', done: progress >= 80 },
              { label: 'Summary', done: progress >= 95 },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : 'bg-[#1F2937] animate-pulse'}`} />
                <span className={done ? 'text-green-400' : 'text-gray-500'}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Analysis Failed</p>
            <p className="text-sm mt-1 text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Input — only when no result */}
      {!result && (
        <ReportInput
          onAnalyze={analyze}
          onAnalyzeFile={analyzeFile}
          loading={loading}
        />
      )}

      {/* Results */}
      {result && !loading && (
        <AnalysisResults result={result} />
      )}
    </div>
  );
}
