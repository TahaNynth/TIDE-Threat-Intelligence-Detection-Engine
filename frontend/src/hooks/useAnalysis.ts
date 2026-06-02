import { useState, useCallback } from 'react';
import { analyzeText, uploadFile } from '../services/api';
import type { AnalysisResult } from '../types';

interface AnalysisState {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  progress: number;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    result: null,
    loading: false,
    error: null,
    progress: 0,
  });

  const _setProgress = (progress: number) =>
    setState((s) => ({ ...s, progress }));

  const analyze = useCallback(async (text: string, title?: string) => {
    setState({ result: null, loading: true, error: null, progress: 10 });
    try {
      _setProgress(30);
      const result = await analyzeText(text, title);
      _setProgress(100);
      setState({ result, loading: false, error: null, progress: 100 });
      return result;
    } catch (err: any) {
      setState({ result: null, loading: false, error: err.message, progress: 0 });
      return null;
    }
  }, []);

  const analyzeFile = useCallback(async (file: File) => {
    setState({ result: null, loading: true, error: null, progress: 10 });
    try {
      _setProgress(20);
      const { text, filename } = await uploadFile(file);
      _setProgress(40);
      const result = await analyzeText(text, filename.replace(/\.[^.]+$/, ''));
      _setProgress(100);
      setState({ result, loading: false, error: null, progress: 100 });
      return result;
    } catch (err: any) {
      setState({ result: null, loading: false, error: err.message, progress: 0 });
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    setState({ result: null, loading: false, error: null, progress: 0 });
  }, []);

  return { ...state, analyze, analyzeFile, clear };
}
